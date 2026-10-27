import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { guideSchema, type Guide } from "../guide/schema";
import { slugify } from "../input/normalize";

// Verified seed guides ship in the repo and are read-only at runtime.
const SEED_DIR = join(process.cwd(), "data/guides");

// Extra names people type for a seed ("gmail" -> google-gmail). Keys are slugified.
const ALIASES: Record<string, string> = {
  gmail: "google-gmail",
  google: "google-gmail",
  "google-calendar": "google-gmail",
  "google-workspace": "google-gmail",
  "google-com": "google-gmail",
  outlook: "microsoft-outlook",
  microsoft: "microsoft-outlook",
  "microsoft-graph": "microsoft-outlook",
  "microsoft-365": "microsoft-outlook",
  "office-365": "microsoft-outlook",
  facebook: "meta",
  instagram: "meta",
  whatsapp: "meta",
};

let cache: Guide[] | undefined;

export function listSeeds(): Guide[] {
  if (cache) return cache;
  let files: string[] = [];
  try {
    files = readdirSync(SEED_DIR).filter((f) => f.endsWith(".json"));
  } catch {
    files = [];
  }
  cache = files.map((f) => guideSchema.parse(JSON.parse(readFileSync(join(SEED_DIR, f), "utf8")))).sort((a, b) => a.app.name.localeCompare(b.app.name));
  return cache;
}

export function getSeed(slug: string): Guide | undefined {
  return listSeeds().find((g) => g.slug === slug);
}

/** Seed for what the user typed: by slug, alias, app name, or website domain. */
export function findSeed(input: { name: string; slug: string; domain?: string }): Guide | undefined {
  const seeds = listSeeds();
  const wanted = ALIASES[input.slug] ?? input.slug;
  return (
    seeds.find((g) => g.slug === wanted) ??
    seeds.find((g) => slugify(g.app.name) === input.slug) ??
    (input.domain ? seeds.find((g) => sameSite(hostOf(g.app.website), input.domain ?? "")) : undefined)
  );
}

function sameSite(seedHost: string | undefined, domain: string): boolean {
  if (!seedHost) return false;
  return seedHost === domain || seedHost.endsWith(`.${domain}`) || domain.endsWith(`.${seedHost}`);
}

function hostOf(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}
