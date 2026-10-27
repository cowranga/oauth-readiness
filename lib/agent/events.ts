// What the live view shows while the agent works. Streamed to the browser as SSE.
export type AgentEvent =
  | { type: "status"; message: string }
  | { type: "search"; query: string }
  | { type: "read"; url: string; title?: string; ok: boolean }
  | { type: "probe"; target: string; result: string }
  | { type: "finding"; message: string }
  | { type: "done"; slug: string; durationMs: number }
  | { type: "error"; message: string; retryable: boolean };

export type EmitEvent = (event: AgentEvent) => void;
