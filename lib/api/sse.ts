import type { AgentEvent } from "../agent/events";

export function sseChunk(event: AgentEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/** Reads `data: <json>` frames from an SSE body. Used by the browser and by tests. */
export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<AgentEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const data = frame.split("\n").find((line) => line.startsWith("data: "));
      if (data) yield JSON.parse(data.slice(6)) as AgentEvent;
      boundary = buffer.indexOf("\n\n");
    }
  }
}
