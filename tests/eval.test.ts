import { describe, expect, it } from "vitest";
import { closestScopeTier, compareGuides, rangesOverlap } from "@/lib/eval/compare";
import { fixtureGuide } from "./helpers";

describe("eval comparison", () => {
  it("overlaps ranges with open ends", () => {
    expect(rangesOverlap({ min: 0, max: 5 }, { min: 5, max: 9 })).toBe(true);
    expect(rangesOverlap({ min: 0, max: 4 }, { min: 5, max: null })).toBe(false);
    expect(rangesOverlap({ min: 30, max: null }, { min: 5, max: null })).toBe(true);
  });
  it("matches scope tiers by keywords", () => {
    const g = fixtureGuide();
    expect(closestScopeTier(g.scopeTiers[1]!, g.scopeTiers)?.name).toBe("Edit pages");
  });
  it("scores a guide against itself as a full match", () => {
    const g = fixtureGuide();
    const result = compareGuides(g, g);
    expect(result).toMatchObject({ tierExact: true, oauthSupport: true, managedApp: true });
    expect(result.scopeReviewLevels).toEqual({ matched: 3, total: 3 });
    expect(result.stageWaitOverlap).toEqual({ matched: 2, total: 2 });
  });
  it("flags a tier miss", () => {
    const g = fixtureGuide();
    const other = { ...g, verdict: { ...g.verdict, tier: 4 as const } };
    expect(compareGuides(other, g)).toMatchObject({ tierExact: false, tierOffByOne: false });
  });
});
