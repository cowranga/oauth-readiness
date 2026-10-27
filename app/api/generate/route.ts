import { z } from "zod";
import type { AgentEvent } from "@/lib/agent/events";
import { generateGuide } from "@/lib/agent/generate";
import { AgentError } from "@/lib/agent/run";
import { allowRequest, clientIdFrom } from "@/lib/api/rateLimit";
import { sseChunk } from "@/lib/api/sse";
import { getEnv } from "@/lib/env";
import { InputError, normalizeInput } from "@/lib/input/normalize";
import { getStore } from "@/lib/store";
import { findSeed } from "@/lib/store/seeds";

// Vercel Hobby allows up to 300s with Fluid compute; the agent's hard deadline is 250s.
export const maxDuration = 300;

const bodySchema = z.object({ query: z.string().max(500), fresh: z.boolean().optional() });

export async function POST(request: Request): Promise<Response> {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return eventResponse({ type: "error", message: "Send JSON like {\"query\": \"Gmail\"}.", retryable: false }, 400);

  const env = getEnv();
  const store = getStore();
  const { query, fresh = false } = parsed.data;
  let input: ReturnType<typeof normalizeInput>;
  try {
    input = normalizeInput(query);
  } catch (error) {
    return eventResponse(toErrorEvent(error), 400);
  }

  if (fresh || !findSeed(input)) {
    if (!allowRequest(clientIdFrom(request.headers))) {
      return eventResponse({ type: "error", message: "You have started 5 guides in the last hour. Try again later, or browse the library.", retryable: false }, 429);
    }
    try {
      if ((await store.countGeneration(new Date().toISOString().slice(0, 10))) > env.dailyCap) {
        return eventResponse({ type: "error", message: "This demo has reached its daily limit for live guides. Try again tomorrow, or browse the library.", retryable: false }, 429);
      }
    } catch {
      return eventResponse({ type: "error", message: "Guide storage is not reachable right now. Try again in a minute.", retryable: true }, 503);
    }
  }

  // If the browser disconnects we keep going, so the guide is still saved and shows up under "Recently generated".
  let open = true;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const write = (text: string): void => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          open = false;
        }
      };
      const send = (event: AgentEvent): void => write(sseChunk(event));
      // Comment frames keep proxies from closing an idle connection while the model writes.
      heartbeat = setInterval(() => write(": keep-alive\n\n"), 15_000);
      try {
        if (!store.persistent) send({ type: "status", message: "Note: this server has no persistent storage, so the share link may expire." });
        await generateGuide(query, fresh, { env, emit: send, findSeed, save: (guide) => store.put(guide) });
      } catch (error) {
        send(toErrorEvent(error));
      } finally {
        clearInterval(heartbeat);
        if (open) {
          open = false;
          try {
            controller.close();
          } catch {
            // already closed by the client
          }
        }
      }
    },
    cancel() {
      open = false;
      clearInterval(heartbeat);
    },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-store", "x-accel-buffering": "no" } });
}

function toErrorEvent(error: unknown): AgentEvent {
  if (error instanceof InputError) return { type: "error", message: error.message, retryable: false };
  if (error instanceof AgentError) return { type: "error", message: error.message, retryable: error.retryable };
  console.error("generate failed", error instanceof Error ? error.message : "unknown error");
  return { type: "error", message: "Something went wrong while building the guide. Try again.", retryable: true };
}

function eventResponse(event: AgentEvent, status: number): Response {
  return new Response(sseChunk(event), { status, headers: { "content-type": "text/event-stream", "cache-control": "no-store" } });
}
