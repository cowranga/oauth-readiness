import { guideSchema, type Guide } from "../guide/schema";
import { summarize, type GuideStore, type GuideSummary } from "./types";

// Upstash Redis over its REST API with plain fetch (no SDK). https://upstash.com/docs/redis/features/restapi
type Config = { url: string; token: string };

async function command<T>(config: Config, args: (string | number)[]): Promise<T> {
  const response = await fetch(config.url, {
    method: "POST",
    headers: { authorization: `Bearer ${config.token}`, "content-type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Upstash ${args[0]} failed with HTTP ${response.status}`);
  return ((await response.json()) as { result: T }).result;
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

// ponytail: put() is three requests that can half-succeed -> use the /multi-exec endpoint
export function createUpstashStore(config: Config): GuideStore {
  return {
    persistent: true,
    async get(slug) {
      const raw = await command<string | null>(config, ["GET", `guide:${slug}`]);
      if (!raw) return null;
      const parsed = guideSchema.safeParse(parseJson(raw));
      return parsed.success ? parsed.data : null;
    },
    async put(guide: Guide) {
      await command(config, ["SET", `guide:${guide.slug}`, JSON.stringify(guide)]);
      await command(config, ["SET", `summary:${guide.slug}`, JSON.stringify(summarize(guide))]);
      await command(config, ["ZADD", "recent", Date.parse(guide.generatedAt), guide.slug]);
      await command(config, ["ZREMRANGEBYRANK", "recent", 0, -201]);
    },
    async listRecent(limit) {
      const slugs = await command<string[]>(config, ["ZRANGE", "recent", 0, limit - 1, "REV"]);
      if (slugs.length === 0) return [];
      const raws = await command<(string | null)[]>(config, ["MGET", ...slugs.map((s) => `summary:${s}`)]);
      return raws.flatMap((raw) => {
        const summary = raw ? (parseJson(raw) as GuideSummary | undefined) : undefined;
        return summary?.slug && summary.app && summary.verdict ? [summary] : [];
      });
    },
    async countGeneration(day) {
      const count = await command<number>(config, ["INCR", `count:${day}`]);
      if (count === 1) await command(config, ["EXPIRE", `count:${day}`, 172_800]);
      return count;
    },
  };
}
