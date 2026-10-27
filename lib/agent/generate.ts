import type { Guide } from "../guide/schema";
import { normalizeInput, type NormalizedInput } from "../input/normalize";
import type { Env } from "../env";
import type { EmitEvent } from "./events";
import { runMockAgent } from "./mock";
import { AgentError, runAgent, type RunUsage } from "./run";

// One entry point for the CLI and the API route: normalize -> seed shortcut -> agent (or mock) -> save.

export type GenerateDeps = {
  env: Env;
  emit: EmitEvent;
  findSeed: (input: NormalizedInput) => Guide | undefined;
  save: (guide: Guide) => Promise<void>;
  randomId?: () => string;
};

export type GenerateOutcome =
  | { kind: "seed"; slug: string }
  | { kind: "generated"; guide: Guide; usage?: RunUsage; toolCalls?: number };

export function liveSlug(appSlug: string, random: () => string = randomId): string {
  return `${appSlug}-${random()}`;
}

function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => (b % 36).toString(36)).join("");
}

/** Throws InputError for bad input and AgentError for agent failures; the caller turns both into messages. */
export async function generateGuide(query: string, fresh: boolean, deps: GenerateDeps): Promise<GenerateOutcome> {
  const started = Date.now();
  const input = normalizeInput(query);
  const seed = fresh ? undefined : deps.findSeed(input);
  if (seed) {
    deps.emit({ type: "status", message: `${seed.app.name} has a verified guide. Opening it.` });
    deps.emit({ type: "done", slug: seed.slug, durationMs: Date.now() - started });
    return { kind: "seed", slug: seed.slug };
  }

  const slug = liveSlug(input.slug, deps.randomId);
  let outcome: GenerateOutcome;
  if (deps.env.mockAgent) {
    outcome = { kind: "generated", guide: await runMockAgent(input, slug, deps.emit) };
  } else {
    if (!deps.env.anthropicApiKey) throw new AgentError("Live generation is not configured on this server (no model API key).", false);
    const result = await runAgent(input, {
      apiKey: deps.env.anthropicApiKey,
      model: deps.env.guideModel,
      composioApiKey: deps.env.composioApiKey,
      emit: deps.emit,
      slug,
    });
    outcome = { kind: "generated", guide: result.guide, usage: result.usage, toolCalls: result.toolCalls };
  }
  await deps.save(outcome.guide);
  deps.emit({ type: "done", slug, durationMs: Date.now() - started });
  return outcome;
}
