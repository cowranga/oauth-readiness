import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { guideSchema, type Guide } from "../guide/schema";
import { summarize, type GuideStore, type GuideSummary } from "./types";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Local dev store: one JSON file per live guide under .data/guides.
export function createFileStore(dir = join(process.cwd(), ".data/guides")): GuideStore {
  // ponytail: in-memory daily counter in file mode -> fine for local dev, Upstash counts in production
  const counts = new Map<string, number>();
  return {
    persistent: true,
    async get(slug) {
      if (!SLUG.test(slug)) return null;
      try {
        return guideSchema.parse(JSON.parse(await readFile(join(dir, `${slug}.json`), "utf8")));
      } catch {
        return null;
      }
    },
    async put(guide) {
      if (!SLUG.test(guide.slug)) throw new Error("invalid slug");
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, `${guide.slug}.json`), JSON.stringify(guide, null, 2));
    },
    async listRecent(limit) {
      let files: string[];
      try {
        files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
      } catch {
        return [];
      }
      const guides = await Promise.all(files.map((f) => this.get(f.replace(/\.json$/, ""))));
      return guides
        .filter((g): g is Guide => g !== null)
        .map(summarize)
        .sort((a: GuideSummary, b: GuideSummary) => b.generatedAt.localeCompare(a.generatedAt))
        .slice(0, limit);
    },
    async countGeneration(day) {
      const next = (counts.get(day) ?? 0) + 1;
      counts.set(day, next);
      return next;
    },
  };
}
