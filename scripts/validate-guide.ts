// Usage: npx tsx scripts/validate-guide.ts data/guides/<slug>.json
// Validates a guide file against the schema and reports writing-voice problems.
import { readFileSync } from "node:fs";
import { guideSchema } from "../lib/guide/schema";
import { postprocess } from "../lib/guide/postprocess";

const file = process.argv[2];
if (!file) {
  console.error("usage: tsx scripts/validate-guide.ts <file.json>");
  process.exit(2);
}
const raw = readFileSync(file, "utf8");
const result = guideSchema.safeParse(JSON.parse(raw));
if (!result.success) {
  for (const issue of result.error.issues) console.error(`schema: ${issue.path.join(".")}: ${issue.message}`);
  process.exit(1);
}
const guide = result.data;
const problems: string[] = [];
if (raw.includes("—")) problems.push("contains an em dash");
if (/\b(seamless|powerful|robust|leverage|unlock|effortless)\b/i.test(raw)) problems.push("contains a banned marketing word");
const ids = new Set(guide.evidence.map((e) => e.id));
const after = postprocess(guide);
if (after.evidence.some((e) => e.id === "e_nosource")) problems.push("some items have no valid evidenceIds");
for (const e of guide.evidence) {
  if (e.level !== "inferred" && !e.sourceUrl) problems.push(`${e.id} is ${e.level} without sourceUrl`);
  if (e.level === "tested") problems.push(`${e.id} is marked tested`);
}
if (ids.size !== guide.evidence.length) problems.push("duplicate evidence ids");
if (problems.length > 0) {
  for (const p of problems) console.error(`check: ${p}`);
  process.exit(1);
}
console.log(`ok: ${guide.slug}, tier ${guide.verdict.tier}, ${guide.evidence.length} evidence items, ${guide.steps.length} steps`);
