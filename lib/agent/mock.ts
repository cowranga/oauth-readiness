import { guideSchema, type Guide } from "../guide/schema";
import type { NormalizedInput } from "../input/normalize";
import type { AgentEvent, EmitEvent } from "./events";
import events from "./fixtures/events.json";
import fixture from "./fixtures/guide.json";

// MOCK_AGENT=1: replays fixture events with short delays and returns the fixture guide. No network, no model.
export async function runMockAgent(input: NormalizedInput, slug: string, emit: EmitEvent, delayMs = 150): Promise<Guide> {
  const started = Date.now();
  for (const event of events as AgentEvent[]) {
    emit(event);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  const guide = guideSchema.parse(structuredClone(fixture));
  return {
    ...guide,
    slug,
    input: { query: input.query, kind: input.kind },
    generatedAt: new Date(started).toISOString(),
    generator: { model: "mock", promptVersion: "mock", durationMs: Date.now() - started },
  };
}
