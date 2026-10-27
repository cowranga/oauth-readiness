import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { AgentEvent } from "@/lib/agent/events";
import { readSse } from "@/lib/api/sse";

// Mock guides land in the gitignored local file store (.data/guides).
beforeAll(() => {
  vi.stubEnv("MOCK_AGENT", "1");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
});
afterAll(() => vi.unstubAllEnvs());

async function collect(response: Response): Promise<AgentEvent[]> {
  const events: AgentEvent[] = [];
  for await (const event of readSse(response.body!)) events.push(event);
  return events;
}

describe("POST /api/generate (mock mode)", () => {
  it("streams events and ends with done, and the guide is then readable", async () => {
    const { POST } = await import("@/app/api/generate/route");
    const response = await POST(new Request("http://test/api/generate", { method: "POST", body: JSON.stringify({ query: "Example Notes" }) }));
    expect(response.headers.get("content-type")).toBe("text/event-stream");
    const events = await collect(response);
    const done = events.at(-1);
    expect(done?.type).toBe("done");
    expect(events.some((e) => e.type === "search")).toBe(true);

    const { GET } = await import("@/app/api/guides/[slug]/route");
    const slug = done?.type === "done" ? done.slug : "";
    const md = await GET(new Request(`http://test/api/guides/${slug}?format=md`), { params: Promise.resolve({ slug }) });
    expect(await md.text()).toContain("# Example Notes: OAuth app setup and approval");
  }, 20_000);

  it("returns an error event for empty input", async () => {
    const { POST } = await import("@/app/api/generate/route");
    const events = await collect(await POST(new Request("http://test/api/generate", { method: "POST", body: JSON.stringify({ query: "  " }) })));
    expect(events.at(-1)).toMatchObject({ type: "error", retryable: false });
  });

  it("rejects a malformed body", async () => {
    const { POST } = await import("@/app/api/generate/route");
    const response = await POST(new Request("http://test/api/generate", { method: "POST", body: "nope" }));
    expect(response.status).toBe(400);
  });
});

describe("GET /api/guides/[slug]", () => {
  it("404s for unknown slugs", async () => {
    const { GET } = await import("@/app/api/guides/[slug]/route");
    const response = await GET(new Request("http://test/api/guides/nope-000000"), { params: Promise.resolve({ slug: "nope-000000" }) });
    expect(response.status).toBe(404);
  });
});
