import type { Guide, ReviewLevel, Tier, UseCase } from "./schema";

// The only place tier labels and meanings live (docs/PRODUCT.md tier table).
export const TIERS: Record<Tier, { label: string; meaning: string; risk: "low" | "medium" | "high" }> = {
  1: { label: "Self-serve", meaning: "Register and any user can connect. No review.", risk: "low" },
  2: {
    label: "Self-serve, optional review",
    meaning: "Works for any user without review. Review only for a public listing or higher limits.",
    risk: "low",
  },
  3: {
    label: "Review required",
    meaning: "The provider must approve before users outside your test list can connect.",
    risk: "medium",
  },
  4: {
    label: "Review + external audit",
    meaning: "Review plus a third-party security assessment, often paid and recurring.",
    risk: "high",
  },
  5: {
    label: "Gated",
    meaning: "Needs a partner application, paid tier, or business approval that may be refused.",
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
 * The tier a developer lands in for the chips they selected.
 * Per chip, take the easiest scope tier that serves it (you would pick the lightest scope that works),
 * then the hardest across chips. Falls back to the guide's overall tier when nothing matches.
 */
export function tierForUseCases(guide: Pick<Guide, "scopeTiers" | "verdict">, selected: UseCase[]): Tier {
  const perChip: Tier[] = [];
  for (const useCase of selected) {
    const serving = guide.scopeTiers.filter((scopeTier) => scopeTier.useCases.includes(useCase));
    if (serving.length === 0) continue;
    perChip.push(Math.min(...serving.map((s) => REVIEW_LEVEL_TIER[s.reviewLevel])) as Tier);
  }
  if (perChip.length === 0) return guide.verdict.tier;
  return Math.max(...perChip) as Tier;
}

/** Scope tiers to highlight for the selected chips. */
export function matchingScopeTierIndexes(guide: Pick<Guide, "scopeTiers">, selected: UseCase[]): number[] {
  return guide.scopeTiers.flatMap((scopeTier, index) =>
    scopeTier.useCases.some((useCase) => selected.includes(useCase)) ? [index] : [],
  );
}
