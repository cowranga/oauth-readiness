import { STAGE_IDS, type Evidence, type Guide, type StageId, type UseCase } from "./schema";
import { tierLabel } from "./tiers";

// Deterministic clean-up rules from docs/GUIDE_SCHEMA.md. Pure: same input, same output.

type Confidence = Guide["verdict"]["confidence"];
type WithEvidence = { evidenceIds: string[] };

export const NO_SOURCE_ID = "e_nosource";
const LOWER: Record<Confidence, Confidence> = { high: "medium", medium: "low", low: "low" };
const STAGE_NAMES: Record<StageId, string> = { prototype: "Prototype", limited: "Limited beta", production: "Production" };

export function postprocess(input: Guide): Guide {
  const guide = structuredClone(input);
  const date = guide.generatedAt.slice(0, 10);
  stripUnsafeUrls(guide);
  guide.evidence = dedupeById(guide.evidence).map((e) => fixEvidenceLevel(e, guide.origin));
  guide.steps = uniqueStepIds(guide.steps);
  inferScopeTierUseCases(guide, date);
  guide.stages = normalizeStages(guide);
  guide.steps = sortSteps(guide.steps);
  attachMissingEvidence(guide, date);
  guide.verdict.label = tierLabel(guide.verdict.tier);
  capConfidence(guide);
  applyNoOauth(guide);
  return guide;
}

/** Rules 2 and 3: no URL means inferred; live guides never claim tested. */
export function fixEvidenceLevel(evidence: Evidence, origin: Guide["origin"]): Evidence {
  const fixed = { ...evidence };
  if (!isHttpUrl(fixed.sourceUrl)) delete fixed.sourceUrl;
  if (origin === "live" && fixed.level === "tested") fixed.level = "sourced";
  if (fixed.level !== "inferred" && !isHttpUrl(fixed.sourceUrl)) {
    fixed.level = "inferred";
    fixed.note = [fixed.note, "Downgraded to inferred: no source URL."].filter(Boolean).join(" ");
  }
  return fixed;
}

// Model output comes from untrusted pages; only http(s) links may reach hrefs or Markdown.
function stripUnsafeUrls(guide: Guide): void {
  if (!isHttpUrl(guide.app.developerPortalUrl)) delete guide.app.developerPortalUrl;
  if (!isHttpUrl(guide.app.website)) guide.app.website = "";
  for (const step of guide.steps) if (!isHttpUrl(step.url)) delete step.url;
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => !seen.has(item.id) && seen.add(item.id));
}

// Step ids drive ?done= progress and React keys, so they must be unique.
function uniqueStepIds(steps: Guide["steps"]): Guide["steps"] {
  const seen = new Set<string>();
  return steps.map((step, index) => {
    const id = seen.has(step.id) ? `${step.id}-${index + 1}` : step.id;
    seen.add(id);
    return { ...step, id };
  });
}

export function isHttpUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Rule 4: sane ranges. */
export function clampHours(range: { min: number; max: number }): { min: number; max: number } {
  const a = clamp(range.min, 0, 200);
  const b = clamp(range.max, 0, 200);
  return { min: Math.min(a, b), max: Math.max(a, b) };
}

export function clampDays(range: { min: number; max: number | null }): { min: number; max: number | null } {
  const min = clamp(range.min, 0, 365);
  if (range.max === null) return { min, max: null };
  const max = clamp(range.max, 0, 365);
  return { min: Math.min(min, max), max: Math.max(min, max) };
}

function clamp(value: number, low: number, high: number): number {
  return Number.isFinite(value) ? Math.min(high, Math.max(low, value)) : low;
}

/** Rules 4 and 5: one stage per id, in order, prototype and production always present. */
function normalizeStages(guide: Guide): Guide["stages"] {
  const byId = new Map<StageId, Guide["stages"][number]>();
  for (const stage of guide.stages) if (!byId.has(stage.id)) byId.set(stage.id, stage);
  for (const required of ["prototype", "production"] as const) {
    if (!byId.has(required)) {
      byId.set(required, {
        id: required,
        name: STAGE_NAMES[required],
        whoCanConnect: "Not covered by the research.",
        handsOnHours: { min: 0, max: 0 },
        waitDays: { min: 0, max: null },
        reviewRequired: false,
        notes: "The research did not cover this stage. Treat the numbers as unknown.",
        evidenceIds: [],
      });
    }
  }
  return STAGE_IDS.flatMap((id) => {
    const stage = byId.get(id);
    if (!stage) return [];
    return [
      {
        ...stage,
        handsOnHours: clampHours(stage.handsOnHours),
        waitDays: clampDays(stage.waitDays),
        ...(stage.providerStatedWaitDays ? { providerStatedWaitDays: clampDays(stage.providerStatedWaitDays) } : {}),
      },
    ];
  });
}

/** Rule 6: stage order, stable within a stage. */
export function sortSteps(steps: Guide["steps"]): Guide["steps"] {
  return steps
    .map((step, index) => ({ step, index }))
    .sort((a, b) => STAGE_IDS.indexOf(a.step.stage) - STAGE_IDS.indexOf(b.step.stage) || a.index - b.index)
    .map(({ step }) => step);
}

function itemsWithEvidence(guide: Guide): WithEvidence[] {
  return [
    guide.oauth,
    guide.verdict,
    guide.composio,
    ...guide.stages,
    ...guide.scopeTiers,
    ...guide.requirements,
    ...guide.steps,
    ...guide.blockers,
  ];
}

/** Rule 1: drop dangling references; unsupported items get an explicit inferred placeholder. */
function attachMissingEvidence(guide: Guide, date: string): void {
  const known = new Set(guide.evidence.map((e) => e.id));
  let added = false;
  for (const item of itemsWithEvidence(guide)) {
    item.evidenceIds = [...new Set(item.evidenceIds.filter((id) => known.has(id)))];
    if (item.evidenceIds.length === 0) {
      item.evidenceIds = [NO_SOURCE_ID];
      added = true;
    }
  }
  for (const entry of guide.changelog) {
    if (entry.evidenceIds) entry.evidenceIds = entry.evidenceIds.filter((id) => known.has(id));
  }
  if (added && !known.has(NO_SOURCE_ID)) {
    guide.evidence.push({
      id: NO_SOURCE_ID,
      level: "inferred",
      claim: "No supporting source was found for this item.",
      retrievedAt: date,
      note: "Added automatically. Check this item before relying on it.",
    });
    guide.verdict.confidence = LOWER[guide.verdict.confidence];
  }
}

const OFFICIAL_KINDS = new Set(["official_docs", "official_policy", "official_forum_or_blog", "probe"]);

/**
 * Rule 8 plus the confidence rules: high needs 2+ non-inferred items behind the verdict, one of them official;
 * medium needs at least one non-inferred item.
 */
function capConfidence(guide: Guide): void {
  const backing = guide.verdict.evidenceIds
    .map((id) => guide.evidence.find((e) => e.id === id))
    .filter((e): e is Evidence => e !== undefined && e.level !== "inferred");
  const official = backing.some((e) => e.level === "tested" || OFFICIAL_KINDS.has(e.sourceKind ?? ""));
  if (guide.verdict.confidence === "high" && !(backing.length >= 2 && official)) guide.verdict.confidence = "medium";
  if (guide.verdict.confidence === "medium" && backing.length === 0) guide.verdict.confidence = "low";
}

/** Rule 9: no OAuth means nothing to approve; say so plainly. */
function applyNoOauth(guide: Guide): void {
  if (guide.oauth.support !== "none") return;
  guide.verdict.tier = 1;
  guide.verdict.label = tierLabel(1);
  if (!/does not (offer|support) oauth|no oauth/i.test(guide.verdict.summary)) {
    guide.verdict.summary = `This app does not offer OAuth. ${guide.verdict.summary}`.trim();
  }
}

/** Rule 10: every scope tier serves at least one use case. */
function inferScopeTierUseCases(guide: Guide, date: string): void {
  guide.scopeTiers.forEach((scopeTier, index) => {
    if (scopeTier.useCases.length > 0) return;
    const text = `${scopeTier.name} ${scopeTier.exampleScopes.join(" ")}`;
    const useCase: UseCase = /read|view|history|list|get/i.test(text) ? "read" : "write";
    const id = `e_usecase_${index + 1}`;
    scopeTier.useCases = [useCase];
    scopeTier.evidenceIds = [...scopeTier.evidenceIds, id];
    guide.evidence.push({
      id,
      level: "inferred",
      claim: `"${scopeTier.name}" serves the ${useCase} use case.`,
      retrievedAt: date,
      note: "Use case tag inferred from the scope names because the research did not set one.",
    });
  });
}
