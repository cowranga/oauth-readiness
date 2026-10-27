import { describe, expect, it } from "vitest";
import { nextStep, parseDone, parseUseCases, progressQuery, stepProgress } from "@/lib/guide/progress";
import { fixtureGuide } from "./helpers";

describe("URL progress", () => {
  it("parses done ids and ignores junk", () => {
    expect([...parseDone("s1, r2,,<script>")]).toEqual(["s1", "r2"]);
    expect(parseDone(null).size).toBe(0);
  });
  it("defaults use cases to read + write, and accepts an explicit empty selection", () => {
    expect(parseUseCases(null)).toEqual(["read", "write"]);
    expect(parseUseCases("offline,bogus,admin")).toEqual(["offline", "admin"]);
    expect(parseUseCases("")).toEqual([]);
  });
  it("builds short query strings", () => {
    expect(progressQuery(new Set(), ["read", "write"])).toBe("");
    expect(progressQuery(new Set(["s1", "r2"]), ["write", "read"])).toBe("?done=s1,r2");
    expect(progressQuery(new Set(), ["offline"])).toBe("?use=offline");
  });
  it("next step is the first unchecked step", () => {
    const g = fixtureGuide();
    expect(nextStep(g, new Set(["s1"]))?.id).toBe("s2");
    expect(nextStep(g, new Set(["s1", "s2", "s3", "s4"]))).toBeUndefined();
    expect(stepProgress(g, new Set(["s1", "r1"]))).toEqual({ done: 1, total: 4 });
  });
});
