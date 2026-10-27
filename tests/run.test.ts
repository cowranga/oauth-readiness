import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import type { AgentEvent } from "@/lib/agent/events";
import { WRAP_UP_MESSAGE } from "@/lib/agent/prompts";
import { AgentError, runAgent } from "@/lib/agent/run";
import { guideContentSchema } from "@/lib/guide/schema";
import { normalizeInput } from "@/lib/input/normalize";
import { fixtureGuide } from "./helpers";

// A fake model: each call returns the next scripted turn and records what it was sent.
function fakeClient(turns: Anthropic.ContentBlock[][]): { client: Pick<Anthropic, "messages">; sent: Anthropic.MessageParam[][] } {
  const sent: Anthropic.MessageParam[][] = [];
  let index = 0;
  const messages = {
    stream: (params: { messages: Anthropic.MessageParam[] }) => {
      sent.push(structuredClone(params.messages));
      const content = turns[index++] ?? [{ type: "text", text: "nothing left", citations: null }];
      const toolUse = content.some((b) => b.type === "tool_use");
      return {
        on: () => undefined,
        finalMessage: async () => ({ content, stop_reason: toolUse ? "tool_use" : "end_turn", usage: { input_tokens: 10, output_tokens: 5 } }),
      };
    },
  };
  return { client: { messages } as unknown as Pick<Anthropic, "messages">, sent };
}

const toolUse = (id: string, name: string, input: unknown): Anthropic.ContentBlock => ({ type: "tool_use", id, name, input, caller: { type: "direct" } }) as Anthropic.ContentBlock;
const text = (value: string): Anthropic.ContentBlock => ({ type: "text", text: value, citations: null }) as Anthropic.ContentBlock;

function content(): unknown {
  return guideContentSchema.parse(fixtureGuide()); // drops the server-filled fields
}

async function run(turns: Anthropic.ContentBlock[][], researchDeadlineMs = 60_000): Promise<{ events: AgentEvent[]; sent: Anthropic.MessageParam[][]; result?: Awaited<ReturnType<typeof runAgent>>; error?: unknown }> {
  const { client, sent } = fakeClient(turns);
  const events: AgentEvent[] = [];
  try {
    const result = await runAgent(normalizeInput("Example Notes"), { apiKey: "test", model: "fake", emit: (e) => events.push(e), slug: "example-notes-test01", client, researchDeadlineMs });
    return { events, sent, result };
  } catch (error) {
    return { events, sent, error };
  }
}

describe("runAgent loop (fake model, no network)", () => {
  it("wraps up when the research deadline passes, then accepts submit_guide", async () => {
    const { result, sent, events } = await run([[toolUse("t1", "unknown_tool", {})], [toolUse("t2", "submit_guide", content())]], 0);
    const last = sent[1]!.at(-1)!;
    expect(JSON.stringify(last.content)).toContain(WRAP_UP_MESSAGE);
    expect(events.some((e) => e.type === "status" && /budget reached/.test(e.message))).toBe(true);
    expect(result?.guide.slug).toBe("example-notes-test01");
    expect(result?.guide.origin).toBe("live");
  });

  it("downgrades sourced claims the fake agent never opened", async () => {
    const { result } = await run([[toolUse("t1", "submit_guide", content())]]);
    expect(result?.guide.evidence.find((e) => e.id === "e1")?.level).toBe("inferred");
    expect(result?.downgraded).toBeGreaterThan(0);
  });

  it("sends schema errors back once and accepts the corrected guide", async () => {
    const { result, sent } = await run([[toolUse("t1", "submit_guide", { app: "wrong" })], [toolUse("t2", "submit_guide", content())]]);
    expect(JSON.stringify(sent[1]!.at(-1)!.content)).toContain("did not match the schema");
    expect(result?.guide).toBeDefined();
  });

  it("fails with a clear message after a second invalid guide", async () => {
    const { error } = await run([[toolUse("t1", "submit_guide", {})], [toolUse("t2", "submit_guide", {})]]);
    expect(error).toBeInstanceOf(AgentError);
    expect((error as AgentError).message).toMatch(/invalid guide twice/);
  });

  it("turns NOT_FOUND into a friendly, non-retryable error and no guide", async () => {
    const { error, result } = await run([[text("NOT_FOUND: no product called Example Notes exists. More detail here.")]]);
    expect(result).toBeUndefined();
    expect(error).toBeInstanceOf(AgentError);
    expect((error as AgentError).retryable).toBe(false);
    expect((error as AgentError).message).toMatch(/^We could not find an app called "Example Notes"\. no product called Example Notes exists\./);
  });

  it("nudges once when the model stops without submitting, then gives up", async () => {
    const { error } = await run([[text("I think I am done.")], [text("Still done.")]]);
    expect((error as AgentError).message).toMatch(/stopped without producing a guide/);
  });
});

