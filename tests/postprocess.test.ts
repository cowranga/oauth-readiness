import { describe, expect, it } from "vitest";
import { NO_SOURCE_ID, postprocess } from "@/lib/guide/postprocess";
import { fixtureGuide } from "./helpers";

describe("postprocess", () => {
  it("rule 1: drops dangling evidence ids and adds a placeholder, lowering confidence", () => {
    const g = fixtureGuide();
    g.steps[0]!.evidenceIds = ["e999"];
    const out = postprocess(g);
    expect(out.steps[0]!.evidenceIds).toEqual([NO_SOURCE_ID]);
    expect(out.evidence.find((e) => e.id === NO_SOURCE_ID)?.level).toBe("inferred");
    expect(out.verdict.confidence).toBe("low");
  });

  it("rule 2: non-inferred evidence without an http URL becomes inferred", () => {
    const g = fixtureGuide();
    g.evidence[0]!.sourceUrl = "ftp://example.com/x";
    expect(postprocess(g).evidence[0]!.level).toBe("inferred");
  });

  it("rule 3: live guides cannot contain tested evidence", () => {
    const g = fixtureGuide();
    g.evidence[0]!.level = "tested";
    expect(postprocess(g).evidence[0]!.level).toBe("sourced");
    const seed = { ...fixtureGuide(), origin: "verified_seed" as const };
    seed.evidence[0]!.level = "tested";
    expect(postprocess(seed).evidence[0]!.level).toBe("tested");
  });

  it("rule 4: clamps and orders ranges", () => {
    const g = fixtureGuide();
    g.stages[0]!.handsOnHours = { min: 500, max: -3 };
    g.stages[1]!.waitDays = { min: 900, max: 10 };
    const out = postprocess(g);
    expect(out.stages[0]!.handsOnHours).toEqual({ min: 0, max: 200 });
    expect(out.stages[1]!.waitDays).toEqual({ min: 10, max: 365 });
  });

  it("rule 5: orders stages, dedupes, and adds a missing production stage", () => {
    const g = fixtureGuide();
    const prototype = g.stages[0]!;
    g.stages = [{ ...prototype, id: "limited", name: "Beta" }, prototype, { ...prototype, name: "Dup" }];
    const out = postprocess(g);
    expect(out.stages.map((s) => s.id)).toEqual(["prototype", "limited", "production"]);
    expect(out.stages[0]!.name).toBe("Prototype");
    expect(out.stages[2]!.evidenceIds).toEqual([NO_SOURCE_ID]);
  });

  it("rule 6: sorts steps by stage, stable within a stage", () => {
    const g = fixtureGuide();
    g.steps.reverse();
    expect(postprocess(g).steps.map((s) => s.id)).toEqual(["s2", "s1", "s4", "s3"]);
  });

  it("rule 7: derives the label from the tier", () => {
    const g = fixtureGuide();
    g.verdict.tier = 4;
    g.verdict.label = "Easy peasy";
    expect(postprocess(g).verdict.label).toBe("Review + external audit");
  });

  it("rule 8: high confidence needs non-inferred verdict evidence", () => {
    const g = fixtureGuide();
    g.verdict.confidence = "high";
    g.verdict.evidenceIds = ["e3"];
    expect(postprocess(g).verdict.confidence).toBe("medium");
  });

  it("rule 9: no OAuth says so in the summary and keeps alternatives", () => {
    const g = fixtureGuide();
    g.oauth.support = "none";
    g.verdict.tier = 3;
    g.verdict.summary = "Use API keys.";
    g.scopeTiers = [];
    const out = postprocess(g);
    expect(out.verdict.summary).toMatch(/^This app does not offer OAuth\./);
    expect(out.oauth.alternatives).toBeTruthy();
    expect(out.verdict.tier).toBe(1);
  });

  it("rule 10: infers a use case for scope tiers without one", () => {
    const g = fixtureGuide();
    g.scopeTiers[0]!.useCases = [];
    g.scopeTiers[1]!.useCases = [];
    const out = postprocess(g);
    expect(out.scopeTiers[0]!.useCases).toEqual(["read"]);
    expect(out.scopeTiers[1]!.useCases).toEqual(["write"]);
    expect(out.evidence.some((e) => e.id === "e_usecase_1" && e.level === "inferred")).toBe(true);
  });

  it("does not mutate its input", () => {
    const g = fixtureGuide();
    const before = JSON.stringify(g);
    postprocess({ ...g, verdict: { ...g.verdict, label: "x" } });
    expect(JSON.stringify(g)).toBe(before);
  });
});
