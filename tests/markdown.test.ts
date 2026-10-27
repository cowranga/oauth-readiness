import { describe, expect, it } from "vitest";
import { formatDays, guideToMarkdown } from "@/lib/guide/markdown";
import { fixtureGuide } from "./helpers";

describe("guideToMarkdown", () => {
  it("matches the snapshot for the fixture", () => {
    expect(guideToMarkdown(fixtureGuide(), "https://example.org/guides/example-notes-mock01")).toMatchSnapshot();
  });
  it("shows provider-stated and reported waits side by side", () => {
    expect(guideToMarkdown(fixtureGuide())).toContain("Provider says 0 to 7 days; developers report 0 to 14 days");
  });
});

describe("formatDays", () => {
  it("handles open and empty ranges", () => {
    expect(formatDays({ min: 0, max: 0 })).toBe("none");
    expect(formatDays({ min: 14, max: null })).toBe("14+ days");
    expect(formatDays({ min: 0, max: null })).toBe("unknown");
  });
});
