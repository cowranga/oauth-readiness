import type { Guide, ReviewLevel, Tier, UseCase } from "./schema";

// The only place tier labels and meanings live (docs/PRODUCT.md tier table).
export const TIERS: Record<Tier, { label: string; meaning: string; risk: "low" | "medium" | "high" }> = {
  1: { label: "Self-serve", meaning: "Any user can connect after you register. No review.", risk: "low" },
  2: {
    label: "Self-serve, optional review",
    meaning: "Any user can connect. Review applies only to a public listing or higher limits.",
    risk: "low",
  },
  3: {
    label: "Review required",
    meaning: "The provider must approve the app before users outside your test list can connect.",
    risk: "medium",
  },
  4: {
    label: "Review + external audit",
    meaning: "Review plus a third-party security assessment. Often paid and yearly.",
    risk: "high",
  },
  5: {
    label: "Gated",
    meaning: "Requires a partner application, paid plan, or business approval. The provider can refuse.",
    risk: "high",
  },
};

export const TIER_DOT_CLASS: Record<"low" | "medium" | "high", string> = {
  low: "bg-success",
  medium: "bg-warning",
  high: "bg-destructive",
};

export const REVIEW_LEVEL_TIER: Record<ReviewLevel, Tier> = {
  none: 1,
  light: 2,
  review: 3,
  review_plus_audit: 4,
  partner_only: 5,
};

export const REVIEW_LEVEL_LABEL: Record<ReviewLevel, string> = {
  none: "No review",
  light: "Light review",
  review: "Review",
  review_plus_audit: "Review + audit",
  partner_only: "Partner only",
};

export const USE_CASE_LABEL: Record<UseCase, string> = {
  read: "Read data",
  write: "Write data",
  offline: "Act while offline",
  admin: "Admin-level",
};

export const DEFAULT_USE_CASES: UseCase[] = ["read", "write"];

export function tierLabel(tier: Tier): string {
  return TIERS[tier].label;
}

/**
 * "Your tier": the hardest scope tier that serves any selected chip (docs/GUIDE_SCHEMA.md).
 * Conservative on purpose: "read" on Google matches both Calendar (review) and Gmail (review + audit).
 * Falls back to the guide's overall tier when nothing matches.
 */
export function tierForUseCases(guide: Pick<Guide, "scopeTiers" | "verdict">, selected: UseCase[]): Tier {
  const matching = guide.scopeTiers.filter((scopeTier) => matches(scopeTier, selected));
  if (matching.length === 0) return guide.verdict.tier;
  return withAppFloor(guide, Math.max(...matching.map((s) => REVIEW_LEVEL_TIER[s.reviewLevel])) as Tier);
}

// Tier 1 vs 2 is an app-level fact (an optional listing review exists), not a scope fact, so scopes never go below it.
function withAppFloor(guide: Pick<Guide, "verdict">, tier: Tier): Tier {
  return Math.max(tier, Math.min(guide.verdict.tier, 2)) as Tier;
}

/**
 * The best case for the same chips: for each chip the lightest scope tier that serves it, then the hardest of those.
 * When this is lower than tierForUseCases, the guide says you may get away with the lighter scopes.
 */
export function lightestTierForUseCases(guide: Pick<Guide, "scopeTiers" | "verdict">, selected: UseCase[]): Tier {
  const perChip: Tier[] = [];
  for (const useCase of selected) {
    const serving = guide.scopeTiers.filter((scopeTier) => scopeTier.useCases.includes(useCase) && matches(scopeTier, selected));
    if (serving.length > 0) perChip.push(Math.min(...serving.map((s) => REVIEW_LEVEL_TIER[s.reviewLevel])) as Tier);
  }
  return perChip.length === 0 ? guide.verdict.tier : withAppFloor(guide, Math.max(...perChip) as Tier);
}

/**
 * A scope tier matches when it serves a selected chip. Tiers that include admin-level access match only when
 * "Admin-level" is selected (Slack: one partner-only search/admin tier made read + write look gated).
 */
function matches(scopeTier: Guide["scopeTiers"][number], selected: UseCase[]): boolean {
  if (scopeTier.useCases.includes("admin") && !selected.includes("admin")) return false;
  return scopeTier.useCases.some((useCase) => selected.includes(useCase));
}

/** Scope tiers to highlight for the selected chips. */
export function matchingScopeTierIndexes(guide: Pick<Guide, "scopeTiers">, selected: UseCase[]): number[] {
  return guide.scopeTiers.flatMap((scopeTier, index) => (matches(scopeTier, selected) ? [index] : []));
}
