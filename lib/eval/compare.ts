import type { Guide, ScopeTier } from "../guide/schema";

// Compares a generator run against the verified seed on the fields a developer acts on (docs/VERIFICATION.md).

export type Comparison = {
  slug: string;
  oauthSupport: boolean;
  tierExact: boolean;
  tierOffByOne: boolean;
  generatedTier: number;
  seedTier: number;
  customerSideGate: boolean;
  managedApp: boolean;
  stageReview: { matched: number; total: number };
  stageWaitOverlap: { matched: number; total: number };
  scopeReviewLevels: { matched: number; total: number };
  evidenceWithUrl: number;
  inferredCount: number;
  evidenceCount: number;
};

export function rangesOverlap(a: { min: number; max: number | null }, b: { min: number; max: number | null }): boolean {
  const aMax = a.max ?? Number.POSITIVE_INFINITY;
  const bMax = b.max ?? Number.POSITIVE_INFINITY;
  return a.min <= bMax && b.min <= aMax;
}

const words = (tier: ScopeTier): Set<string> =>
  new Set(
    `${tier.name} ${tier.exampleScopes.join(" ")}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !["https", "www", "com", "auth", "googleapis", "scope", "scopes"].includes(w)),
  );

/** Closest generated scope tier by shared keywords; undefined if nothing overlaps. */
export function closestScopeTier(seedTier: ScopeTier, generated: ScopeTier[]): ScopeTier | undefined {
  const target = words(seedTier);
  let best: { tier: ScopeTier; score: number } | undefined;
  for (const tier of generated) {
    const score = [...words(tier)].filter((w) => target.has(w)).length;
    if (score > 0 && (!best || score > best.score)) best = { tier, score };
  }
  return best?.tier;
}

export function compareGuides(generated: Guide, seed: Guide): Comparison {
  const sharedStages = seed.stages.flatMap((s) => {
    const g = generated.stages.find((x) => x.id === s.id);
    return g ? [{ s, g }] : [];
  });
  const scopeMatches = seed.scopeTiers.filter((t) => closestScopeTier(t, generated.scopeTiers)?.reviewLevel === t.reviewLevel).length;
  return {
    slug: seed.slug,
    oauthSupport: generated.oauth.support === seed.oauth.support,
    tierExact: generated.verdict.tier === seed.verdict.tier,
    tierOffByOne: Math.abs(generated.verdict.tier - seed.verdict.tier) <= 1,
    generatedTier: generated.verdict.tier,
    seedTier: seed.verdict.tier,
    customerSideGate: generated.verdict.customerSideGate === seed.verdict.customerSideGate,
    managedApp: generated.composio.managedApp === seed.composio.managedApp,
    stageReview: { matched: sharedStages.filter(({ s, g }) => s.reviewRequired === g.reviewRequired).length, total: seed.stages.length },
    stageWaitOverlap: { matched: sharedStages.filter(({ s, g }) => rangesOverlap(s.waitDays, g.waitDays)).length, total: seed.stages.length },
    scopeReviewLevels: { matched: scopeMatches, total: seed.scopeTiers.length },
    evidenceWithUrl: generated.evidence.length ? generated.evidence.filter((e) => e.sourceUrl).length / generated.evidence.length : 0,
    inferredCount: generated.evidence.filter((e) => e.level === "inferred").length,
    evidenceCount: generated.evidence.length,
  };
}
