# Guide schema (v1)

Implement this in `lib/guide/schema.ts` with zod. It is the single source of truth: TypeScript types come from `z.infer`, the agent's `submit_guide` tool input schema comes from the zod schema (zod v4 `z.toJSONSchema`, or `zod-to-json-schema` if on v3), and seed JSON files are validated against it in tests.

Keep field names exactly as below unless you log a reason in DECISIONS.md.

```ts
type EvidenceLevel = "tested" | "probed" | "sourced" | "inferred";
type Owner = "agent" | "you" | "provider";          // provider = you are waiting on them
type StageId = "prototype" | "limited" | "production";
type ReviewLevel = "none" | "light" | "review" | "review_plus_audit" | "partner_only";

interface Guide {
  schemaVersion: 1;
  slug: string;                       // seeds: "slack"; live: "slack-k3x9qa" (immutable share link)
  app: {
    name: string;                     // "Slack"
    provider: string;                 // company, "Slack Technologies (Salesforce)"
    website: string;                  // https URL
    category: string;                 // "Communication", "Email", "CRM", ...
    developerPortalUrl?: string;      // where you register the OAuth app
  };
  input: { query: string; kind: "name" | "url" };
  origin: "verified_seed" | "live";
  generatedAt: string;                // ISO
  generator: { model: string; promptVersion: string; durationMs?: number };

  oauth: {
    support: "oauth2" | "oauth2_oidc" | "oauth1" | "none" | "unknown";
    pkce?: "required" | "supported" | "not_supported" | "unknown";
    alternatives?: string;            // "API keys or personal access tokens"
    appTypes?: { name: string; whenToUse: string }[];  // e.g. GitHub App vs OAuth App
    evidenceIds: string[];
  };

  verdict: {
    tier: 1 | 2 | 3 | 4 | 5;
    label: string;                    // from the tier table in PRODUCT.md
    summary: string;                  // max 2 sentences, names the single deciding factor
    nextStep: string;                 // one concrete action, imperative
    customerSideGate: boolean;
    customerSideGateNote?: string;
    confidence: "high" | "medium" | "low";
    evidenceIds: string[];
  };

  composio: {
    managedApp: "available" | "not_available" | "unknown";
    note: string;                     // what it means for this app, and what switching to your own app involves
    evidenceIds: string[];
  };

  stages: {
    id: StageId;
    name: string;                     // "Prototype", "Limited beta", "Production"
    whoCanConnect: string;            // "You and up to N test users you list"
    handsOnHours: { min: number; max: number };
    waitDays: { min: number; max: number | null };   // realistic range; null = unbounded/unknown
    providerStatedWaitDays?: { min: number; max: number | null };  // only if the provider states a timeline and it differs from waitDays
    reviewRequired: boolean;
    notes?: string;
    evidenceIds: string[];
  }[];

  scopeTiers: {
    name: string;                     // "Send only", "Read mailbox", ...
    exampleScopes: string[];
    reviewLevel: ReviewLevel;
    useCases: ("read" | "write" | "offline" | "admin")[];   // which use-case chips this tier serves (see PRODUCT.md)
    effect: string;                   // what choosing this does to time and work
    evidenceIds: string[];
  }[];

  requirements: {
    id: string;
    item: string;                     // "Verified domain you own"
    stage: StageId;
    detail?: string;
    agentCanHelp: boolean;
    evidenceIds: string[];
  }[];

  steps: {
    id: string;
    stage: StageId;
    title: string;                    // imperative, short
    detail: string;                   // enough to do it without guessing
    owner: Owner;
    estimate: string;                 // "10 min", "1 to 3 days"
    url?: string;
    evidenceIds: string[];
  }[];

  blockers: {
    symptom: string;                  // what the developer sees
    cause: string;
    fix: string;
    escalation?: string;              // support form, forum, email
    evidenceIds: string[];
  }[];

  agentAssist: {
    didForYou: string[];              // what our agent actually did (probes run, docs checked)
    canDoForYou: string[];            // what an agent could do next (fill forms in a browser, draft texts)
    youMustDo: string[];              // sign-ins, 2FA, DNS, legal, payment, video recording
  };

  drafts: {
    kind: "scope_justification" | "app_description" | "demo_video_script"
        | "privacy_policy_checklist" | "support_email" | "other";
    title: string;
    body: string;                     // ready to edit and paste; marked as a draft in the UI
  }[];

  uncertainties: {
    question: string;
    why: string;
    howToResolve: string;
  }[];

  evidence: {
    id: string;                       // "e1", "e2", ...
    level: EvidenceLevel;
    claim: string;                    // the specific fact this supports
    sourceUrl?: string;               // required unless level is "inferred"
    sourceTitle?: string;
    sourceKind?: "official_docs" | "official_policy" | "official_forum_or_blog"
               | "composio_docs" | "community" | "probe";
    retrievedAt: string;              // ISO date
    note?: string;                    // inferred: the reasoning; probe: status/result; tested: who/when
  }[];

  changelog: {                        // corrections from verification (seeds), empty for live
    at: string;
    change: string;
    reason: string;
    evidenceIds?: string[];
  }[];
}
```

## Rules enforced in code (`lib/guide/postprocess.ts`, deterministic, tested)

1. Every `evidenceIds` reference must exist in `evidence`. Drop dangling references; if an item is left with none, attach an `inferred` placeholder noting "no supporting source was found" and lower `verdict.confidence` by one level.
2. Non-`inferred` evidence must have `sourceUrl` (http/https). Otherwise downgrade to `inferred`.
3. `live` guides can never contain `tested` evidence. Downgrade to `sourced`/`inferred`.
4. Ranges: `min <= max`; hours clamp to [0, 200]; days clamp to [0, 365] or null.
5. Exactly the stages that apply, in order prototype → limited → production. At least `prototype` and `production`.
6. `steps` sorted by stage order, original order within a stage.
7. `verdict.label` is derived from `verdict.tier` (never trust the model's label).
8. `verdict.confidence` cannot be `high` if the tier-determining evidence (evidence referenced by `verdict`) is only `inferred`.
9. `oauth.support === "none"` → tier must reflect that: set `summary` to say OAuth is not offered, keep `alternatives`, empty `scopeTiers` allowed.
10. Every scope tier has at least one `useCases` entry; if the model omitted it, infer `read` for tiers whose name or scopes mention read/view/history, else `write`, and mark that tier's evidence note.

## Derived in UI code, not stored (pure functions, tested)

- `tierForUseCases(guide, selected)`: hardest tier among scope tiers matching the selected chips, mapped from `reviewLevel` (none→1, light→2, review→3, review_plus_audit→4, partner_only→5); falls back to `verdict.tier`.
- `attemptDepth(guide)`: `human_setup` if any `tested` evidence; `portal_checked` if any `probe` evidence about the developer portal; `endpoints_probed` if any other `probed`; else `docs_read`.

## Evidence levels (UI legend text)

- **Tested**: a person followed this step for real and it matched. Date noted.
- **Probed**: our agent called the provider's live endpoint and saw this response.
- **Sourced**: stated on the linked page (official unless marked community).
- **Inferred**: our reasoning from related facts. Check before relying on it.

## Confidence rules

- High: the tier-deciding claim has at least 2 independent sourced/probed/tested items, at least one official.
- Medium: 1 official source.
- Low: community-only or inferred.
