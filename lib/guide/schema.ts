import { z } from "zod";

// Single source of truth for the guide data model (docs/GUIDE_SCHEMA.md).
// Types, the agent's submit_guide input schema, and seed validation all derive from here.

export const EVIDENCE_LEVELS = ["tested", "probed", "sourced", "inferred"] as const;
export const OWNERS = ["agent", "you", "provider"] as const;
export const STAGE_IDS = ["prototype", "limited", "production"] as const;
export const REVIEW_LEVELS = ["none", "light", "review", "review_plus_audit", "partner_only"] as const;
export const USE_CASES = ["read", "write", "offline", "admin"] as const;
export const SOURCE_KINDS = [
  "official_docs",
  "official_policy",
  "official_forum_or_blog",
  "composio_docs",
  "community",
  "probe",
] as const;
export const DRAFT_KINDS = [
  "scope_justification",
  "app_description",
  "demo_video_script",
  "privacy_policy_checklist",
  "support_email",
  "other",
] as const;

const evidenceIds = z.array(z.string()).describe("ids of items in `evidence` that support this");
const hours = z.object({ min: z.number(), max: z.number() });
const days = z.object({ min: z.number(), max: z.number().nullable().describe("null = unbounded or unknown") });

export const evidenceSchema = z.object({
  id: z.string().describe('"e1", "e2", ...'),
  level: z.enum(EVIDENCE_LEVELS),
  claim: z.string().describe("the specific fact this supports"),
  sourceUrl: z.string().optional().describe("required unless level is inferred"),
  sourceTitle: z.string().optional(),
  sourceKind: z.enum(SOURCE_KINDS).optional(),
  retrievedAt: z.string().describe("ISO date"),
  note: z.string().optional().describe("inferred: the reasoning; probe: status/result"),
});

export const stageSchema = z.object({
  id: z.enum(STAGE_IDS),
  name: z.string(),
  whoCanConnect: z.string(),
  handsOnHours: hours,
  waitDays: days.describe("realistic range, what developers report"),
  providerStatedWaitDays: days.optional().describe("only if the provider states a timeline that differs"),
  reviewRequired: z.boolean(),
  notes: z.string().optional(),
  evidenceIds,
});

export const scopeTierSchema = z.object({
  name: z.string(),
  exampleScopes: z.array(z.string()),
  reviewLevel: z.enum(REVIEW_LEVELS),
  useCases: z.array(z.enum(USE_CASES)),
  effect: z.string(),
  evidenceIds,
});

export const requirementSchema = z.object({
  id: z.string(),
  item: z.string(),
  stage: z.enum(STAGE_IDS),
  detail: z.string().optional(),
  agentCanHelp: z.boolean(),
  evidenceIds,
});

export const stepSchema = z.object({
  id: z.string(),
  stage: z.enum(STAGE_IDS),
  title: z.string(),
  detail: z.string(),
  owner: z.enum(OWNERS),
  estimate: z.string(),
  url: z.string().optional(),
  evidenceIds,
});

export const blockerSchema = z.object({
  symptom: z.string(),
  cause: z.string(),
  fix: z.string(),
  escalation: z.string().optional(),
  evidenceIds,
});

export const draftSchema = z.object({
  kind: z.enum(DRAFT_KINDS),
  title: z.string(),
  body: z.string(),
});

export const uncertaintySchema = z.object({
  question: z.string(),
  why: z.string(),
  howToResolve: z.string(),
});

export const changelogSchema = z.object({
  at: z.string(),
  change: z.string(),
  reason: z.string(),
  evidenceIds: z.array(z.string()).optional(),
});

// Everything the research agent writes. The server fills slug, input, origin, timestamps, generator, changelog.
export const guideContentSchema = z.object({
  app: z.object({
    name: z.string(),
    provider: z.string(),
    website: z.string(),
    category: z.string(),
    developerPortalUrl: z.string().optional(),
  }),
  oauth: z.object({
    support: z.enum(["oauth2", "oauth2_oidc", "oauth1", "none", "unknown"]),
    pkce: z.enum(["required", "supported", "not_supported", "unknown"]).optional(),
    alternatives: z.string().optional(),
    appTypes: z.array(z.object({ name: z.string(), whenToUse: z.string() })).optional(),
    evidenceIds,
  }),
  verdict: z.object({
    tier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    label: z.string(),
    summary: z.string().describe("max 2 sentences, names the single deciding factor"),
    nextStep: z.string().describe("one concrete action, imperative"),
    customerSideGate: z.boolean(),
    customerSideGateNote: z.string().optional(),
    confidence: z.enum(["high", "medium", "low"]),
    evidenceIds,
  }),
  composio: z.object({
    managedApp: z.enum(["available", "not_available", "unknown"]),
    note: z.string(),
    evidenceIds,
  }),
  stages: z.array(stageSchema),
  scopeTiers: z.array(scopeTierSchema),
  requirements: z.array(requirementSchema),
  steps: z.array(stepSchema),
  blockers: z.array(blockerSchema),
  agentAssist: z.object({
    didForYou: z.array(z.string()),
    canDoForYou: z.array(z.string()),
    youMustDo: z.array(z.string()),
  }),
  drafts: z.array(draftSchema),
  uncertainties: z.array(uncertaintySchema),
  evidence: z.array(evidenceSchema),
});

export const guideSchema = guideContentSchema.extend({
  schemaVersion: z.literal(1),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  input: z.object({ query: z.string(), kind: z.enum(["name", "url"]) }),
  origin: z.enum(["verified_seed", "live"]),
  generatedAt: z.string(),
  generator: z.object({ model: z.string(), promptVersion: z.string(), durationMs: z.number().optional() }),
  changelog: z.array(changelogSchema),
});

export type Guide = z.infer<typeof guideSchema>;
export type GuideContent = z.infer<typeof guideContentSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type EvidenceLevel = (typeof EVIDENCE_LEVELS)[number];
export type StageId = (typeof STAGE_IDS)[number];
export type ReviewLevel = (typeof REVIEW_LEVELS)[number];
export type UseCase = (typeof USE_CASES)[number];
export type Tier = Guide["verdict"]["tier"];
export type Stage = Guide["stages"][number];
export type Step = Guide["steps"][number];
export type ScopeTier = Guide["scopeTiers"][number];

/** JSON Schema for the agent's submit_guide tool input. */
export function guideContentJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(guideContentSchema, { target: "draft-2020-12" }) as Record<string, unknown>;
}
