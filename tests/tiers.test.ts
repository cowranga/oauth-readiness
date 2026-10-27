import { describe, expect, it } from "vitest";
import { attemptDepth } from "@/lib/guide/attempt";
import { matchingScopeTierIndexes, tierForUseCases } from "@/lib/guide/tiers";
import { fixtureGuide } from "./helpers";

describe("tierForUseCases", () => {
  const g = fixtureGuide();
  it("uses the easiest tier per chip, hardest across chips", () => {
    expect(tierForUseCases(g, ["read", "write"])).toBe(1);
    expect(tierForUseCases(g, ["read", "admin"])).toBe(2);
  });
  it("falls back to the verdict tier when nothing matches", () => {
    expect(tierForUseCases(g, [])).toBe(g.verdict.tier);
    expect(tierForUseCases({ ...g, scopeTiers: [] }, ["read"])).toBe(g.verdict.tier);
  });
  it("highlights tiers that serve any selected chip", () => {
    expect(matchingScopeTierIndexes(g, ["offline"])).toEqual([1]);
  });
});

describe("attemptDepth", () => {
  it("reads levels from the evidence", () => {
    const g = fixtureGuide();
    expect(attemptDepth(g)).toBe("endpoints_probed");
    expect(attemptDepth({ evidence: g.evidence.filter((e) => e.level !== "probed") })).toBe("docs_read");
    const portal = { ...g.evidence[3]!, claim: "Developer portal at example.com loads and asks you to sign in." };
    expect(attemptDepth({ evidence: [...g.evidence, portal] })).toBe("portal_checked");
    expect(attemptDepth({ evidence: [...g.evidence, { ...g.evidence[0]!, level: "tested" as const }] })).toBe("human_setup");
  });
});
