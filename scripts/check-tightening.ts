// Usage: npx tsx scripts/check-tightening.ts <slug>
// Compares data/guides/<slug>.json with the committed version (git HEAD) after a wording pass.
// Fails if anything other than prose changed: structure, ids, numbers, enums, URLs, evidence, or changelog.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { guideSchema } from "../lib/guide/schema";

const slug = process.argv[2];
if (!slug) {
  console.error("usage: tsx scripts/check-tightening.ts <slug>");
  process.exit(2);
}
const path = `data/guides/${slug}.json`;
const before: unknown = JSON.parse(execFileSync("git", ["show", `HEAD:${path}`], { encoding: "utf8" }));
const after: unknown = JSON.parse(readFileSync(path, "utf8"));
guideSchema.parse(after);

// Free text that may be reworded. Everything else must be identical.
const PROSE = new Set([
  "summary", "nextStep", "customerSideGateNote", "note", "whoCanConnect", "notes", "effect", "item", "detail",
  "title", "symptom", "cause", "fix", "escalation", "body", "question", "why", "howToResolve", "alternatives",
  "whenToUse", "name", "estimate",
]);
const FROZEN_SECTIONS = new Set(["evidence", "changelog", "app", "input", "generator"]);

const problems: string[] = [];
let beforeWords = 0;
let afterWords = 0;
const words = (s: string): number => s.split(/\s+/).filter(Boolean).length;

function walk(a: unknown, b: unknown, path: string[]): void {
  const key = path.at(-1) ?? "";
  const frozen = path.some((p) => FROZEN_SECTIONS.has(p));
  if (typeof a === "string" && typeof b === "string") {
    if (!frozen && PROSE.has(key) && !/^\d+$/.test(key)) {
      beforeWords += words(a);
      afterWords += words(b);
      if (b.includes("—")) problems.push(`${path.join(".")}: em dash`);
      return;
    }
    // drafts[].body and list items in agentAssist are prose too
    if (!frozen && (path.includes("agentAssist") || path.includes("drafts"))) {
      beforeWords += words(a);
      afterWords += words(b);
      return;
    }
    if (a !== b) problems.push(`${path.join(".")}: changed (not prose)`);
    return;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) problems.push(`${path.join(".")}: length ${a.length} -> ${b.length}`);
    a.forEach((item, i) => walk(item, b[i], [...path, String(i)]));
    return;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a).sort().join(",");
    const kb = Object.keys(b).sort().join(",");
    if (ka !== kb) problems.push(`${path.join(".")}: keys ${ka} -> ${kb}`);
    for (const k of Object.keys(a)) walk((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], [...path, k]);
    return;
  }
  if (a !== b) problems.push(`${path.join(".")}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`);
}

walk(before, after, []);
for (const p of problems) console.error(`problem: ${p}`);
const change = beforeWords ? Math.round((100 * (afterWords - beforeWords)) / beforeWords) : 0;
console.log(`${slug}: prose ${beforeWords} -> ${afterWords} words (${change}%), ${problems.length} problems`);
process.exit(problems.length ? 1 : 0);
