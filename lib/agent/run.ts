import Anthropic from "@anthropic-ai/sdk";
import { guideContentSchema, type Guide, type GuideContent } from "../guide/schema";
import { postprocess } from "../guide/postprocess";
import type { NormalizedInput } from "../input/normalize";
import { MAX_PROBE_REQUESTS } from "../probe/oauth";
import { composioEvidence } from "../composio/managed";
import { addProbeEvidence, auditEvidence } from "./audit";
import type { EmitEvent } from "./events";
import { NOT_FOUND_PREFIX, PROMPT_VERSION, repairMessage, researchUserMessage, SYSTEM_PROMPT, WRAP_UP_MESSAGE } from "./prompts";
import { RESEARCH_TOOLS, runTool, submitGuideTool, WEB_SEARCH_TOOL, type ToolContext } from "./tools";

// Research loop -> submit_guide -> validate (one repair) -> evidence audit -> postprocess.
// Claude Sonnet 5.5 rejects forced tool_choice, so synthesis is steered by the prompt (DECISIONS.md).

export class AgentError extends Error {
  usage?: RunUsage;
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

export type RunOptions = {
  apiKey: string;
  model: string;
  composioApiKey?: string;
  emit: EmitEvent;
  slug: string;
  researchDeadlineMs?: number;
  hardDeadlineMs?: number;
  maxToolCalls?: number;
  /** Tests pass a fake client; production builds one from apiKey. */
  client?: Pick<Anthropic, "messages">;
};

export type RunUsage = { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number; webSearches: number };
export type RunResult = { guide: Guide; usage: RunUsage; toolCalls: number; downgraded: number };

const MAX_TURNS = 30;

export async function runAgent(input: NormalizedInput, options: RunOptions): Promise<RunResult> {
  const usage: RunUsage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, webSearches: 0 };
  try {
    return await researchAndSubmit(input, options, usage);
  } catch (error) {
    if (error instanceof AgentError) error.usage = usage;
    throw error;
  }
}

async function researchAndSubmit(input: NormalizedInput, options: RunOptions, usage: RunUsage): Promise<RunResult> {
  const started = Date.now();
  const { emit, researchDeadlineMs = 80_000, hardDeadlineMs = 250_000, maxToolCalls = 20 } = options;
  const client = options.client ?? new Anthropic({ apiKey: options.apiKey, maxRetries: 2 });
  const signal = AbortSignal.timeout(hardDeadlineMs);
  const ctx: ToolContext = { emit, composioApiKey: options.composioApiKey, fetchedUrls: new Set(), probes: [], probeRequestsLeft: MAX_PROBE_REQUESTS };
  const today = new Date(started).toISOString().slice(0, 10);
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: researchUserMessage({ ...input, today }) }];
  const tools: Anthropic.Messages.ToolUnion[] = [...RESEARCH_TOOLS, WEB_SEARCH_TOOL, submitGuideTool()];
  let toolCalls = 0;
  let wrappedUp = false;
  let repairs = 0;
  let nudges = 0;

  emit({ type: "status", message: `Researching ${input.kind === "url" ? input.domain : input.name}` });

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await callModel(client, options.model, tools, messages, signal, emit);
    addUsage(usage, response.usage);
    messages.push({ role: "assistant", content: response.content });
    toolCalls += response.content.filter((b) => b.type === "server_tool_use").length;

    if (response.stop_reason === "pause_turn") continue;
    if (response.stop_reason === "refusal") throw new AgentError("The model declined to research this input.", false);

    const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (toolUses.length === 0) {
      const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join(" ");
      const notFound = text.indexOf(NOT_FOUND_PREFIX);
      if (notFound >= 0) throw new AgentError(notFoundMessage(input, text.slice(notFound + NOT_FOUND_PREFIX.length)), false);
      if (nudges++ >= 1) throw new AgentError("The agent stopped without producing a guide. Try again.", true);
      messages.push({ role: "user", content: WRAP_UP_MESSAGE });
      wrappedUp = true;
      continue;
    }

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUses) {
      if (toolUse.name === "submit_guide") {
        const parsed = guideContentSchema.safeParse(toolUse.input);
        if (parsed.success) return finish(parsed.data, input, options, { started, usage, toolCalls, ctx });
        if (repairs++ >= 1) throw new AgentError("The agent produced an invalid guide twice. Try again.", true);
        emit({ type: "status", message: "Fixing the guide format" });
        results.push({ type: "tool_result", tool_use_id: toolUse.id, is_error: true, content: repairMessage(formatIssues(parsed.error)) });
        continue;
      }
      if (wrappedUp) {
        results.push({ type: "tool_result", tool_use_id: toolUse.id, is_error: true, content: "Research is over. Call submit_guide now." });
        continue;
      }
      toolCalls++;
      const result = await runTool(toolUse.name, toolUse.input, ctx);
      results.push({ type: "tool_result", tool_use_id: toolUse.id, content: result.content, is_error: result.isError });
    }

    const outOfBudget = Date.now() - started > researchDeadlineMs || toolCalls >= maxToolCalls;
    const content: Anthropic.ContentBlockParam[] = [...results];
    if (outOfBudget && !wrappedUp) {
      wrappedUp = true;
      emit({ type: "status", message: "Research budget reached. Writing the guide with what was found" });
      content.push({ type: "text", text: WRAP_UP_MESSAGE });
    }
    messages.push({ role: "user", content });
  }
  throw new AgentError("The agent ran out of turns before producing a guide. Try again.", true);
}

async function callModel(
  client: Pick<Anthropic, "messages">,
  model: string,
  tools: Anthropic.Messages.ToolUnion[],
  messages: Anthropic.MessageParam[],
  signal: AbortSignal,
  emit: EmitEvent,
): Promise<Anthropic.Message> {
  const stream = client.messages.stream(
    {
      model,
      max_tokens: 32_000,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      tools,
      messages,
      output_config: { effort: "medium" },
    },
    { signal },
  );
  stream.on("streamEvent", (event) => {
    if (event.type === "content_block_start" && event.content_block.type === "tool_use" && event.content_block.name === "submit_guide") {
      emit({ type: "status", message: "Writing the guide" });
    }
  });
  stream.on("contentBlock", (block) => {
    if (block.type === "server_tool_use" && block.name === "web_search") {
      const query = (block.input as { query?: unknown }).query;
      if (typeof query === "string") emit({ type: "search", query });
    }
  });
  try {
    return await stream.finalMessage();
  } catch (error) {
    if (signal.aborted) throw new AgentError("The agent took too long. Try again, or try a more specific app name.", true);
    if (error instanceof Anthropic.RateLimitError) throw new AgentError("The model is rate limited right now. Try again in a minute.", true);
    if (error instanceof Anthropic.AuthenticationError) throw new AgentError("The server's model API key is not valid.", false);
    if (error instanceof Anthropic.BadRequestError) {
      // Billing problems arrive as a plain 400 with no dedicated error type, so the message is the only signal.
      const billing = /credit balance|billing/i.test(error.message);
      throw new AgentError(
        billing
          ? "Live generation is unavailable right now because the server's model API account is out of credits. The verified guides still work."
          : "The model API rejected the request. This is a server problem, not your input.",
        false,
      );
    }
    if (error instanceof Anthropic.APIError) throw new AgentError(`The model API returned an error (${error.status ?? "network"}). Try again.`, true);
    throw error;
  }
}

function finish(
  content: GuideContent,
  input: NormalizedInput,
  options: RunOptions,
  run: { started: number; usage: RunUsage; toolCalls: number; ctx: ToolContext },
): RunResult {
  const durationMs = Date.now() - run.started;
  // The Composio section rests on what the tool actually read, not on the model's citation of it
  // (BeReal live test: the model overwrote "unknown"; Linear: the switching rule was cited to a page that does not say it).
  const date = new Date(run.started).toISOString().slice(0, 10);
  const check = run.ctx.composio;
  const serverEvidence = check ? composioEvidence(check, date) : [];
  const composio = check
    ? { ...content.composio, managedApp: check.status, evidenceIds: serverEvidence.length ? serverEvidence.map((e) => e.id) : content.composio.evidenceIds }
    : content.composio;
  const assembled: Guide = {
    ...content,
    composio,
    evidence: [...content.evidence.filter((e) => !serverEvidence.some((s) => s.id === e.id)), ...serverEvidence],
    schemaVersion: 1,
    slug: options.slug,
    input: { query: input.query, kind: input.kind },
    origin: "live",
    generatedAt: new Date(run.started).toISOString(),
    generator: { model: options.model, promptVersion: PROMPT_VERSION, durationMs },
    changelog: [],
  };
  const audited = auditEvidence(assembled, run.ctx.fetchedUrls, run.ctx.probes.map((p) => p.url));
  audited.guide = addProbeEvidence(audited.guide, run.ctx.probes, assembled.generatedAt.slice(0, 10));
  if (audited.downgraded > 0) {
    options.emit({ type: "finding", message: `${audited.downgraded} claims cited pages the agent did not open, so they are marked inferred.` });
  }
  return { guide: postprocess(audited.guide), usage: run.usage, toolCalls: run.toolCalls, downgraded: audited.downgraded };
}

function addUsage(total: RunUsage, usage: Anthropic.Usage): void {
  total.inputTokens += usage.input_tokens;
  total.outputTokens += usage.output_tokens;
  total.cacheReadTokens += usage.cache_read_input_tokens ?? 0;
  total.cacheWriteTokens += usage.cache_creation_input_tokens ?? 0;
  total.webSearches += usage.server_tool_use?.web_search_requests ?? 0;
}

function formatIssues(error: { issues: { path: PropertyKey[]; message: string }[] }): string {
  return error.issues
    .slice(0, 25)
    .map((issue) => `- ${issue.path.map(String).join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

function notFoundMessage(input: NormalizedInput, detail: string): string {
  const what = input.kind === "url" ? input.domain : `"${input.query}"`;
  const firstSentence = detail.trim().match(/^[^\n]*?[.!?](\s|$)/)?.[0] ?? detail.trim().split("\n")[0] ?? "";
  const reason = firstSentence.length <= 220 ? firstSentence.trim() : "";
  return `We could not find an app called ${what}.${reason ? ` ${reason}` : ""} Check the spelling or paste the app's website.`;
}
