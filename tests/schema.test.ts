import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { guideContentJsonSchema, guideSchema } from "@/lib/guide/schema";
import { fixtureGuide } from "./helpers";

const seedDir = join(process.cwd(), "data/guides");
const seedFiles = (() => {
  try {
    return readdirSync(seedDir).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
})();

describe("guide schema", () => {
  it("accepts the fixture guide", () => {
    expect(fixtureGuide().app.name).toBe("Example Notes");
  });

  it("rejects a guide with a bad tier", () => {
    const bad = { ...fixtureGuide(), verdict: { ...fixtureGuide().verdict, tier: 7 } };
    expect(guideSchema.safeParse(bad).success).toBe(false);
  });

  it("produces a JSON schema for the agent tool", () => {
    const schema = guideContentJsonSchema();
    expect(schema.type).toBe("object");
    expect(Object.keys(schema.properties as object)).toContain("verdict");
    expect(Object.keys(schema.properties as object)).not.toContain("slug");
  });

  it.each(seedFiles)("seed %s is valid, a verified seed, and its slug matches the file name", (file) => {
    const guide = guideSchema.parse(JSON.parse(readFileSync(join(seedDir, file), "utf8")));
    expect(guide.origin).toBe("verified_seed");
    expect(guide.slug).toBe(file.replace(/\.json$/, ""));
    expect(guide.evidence.some((e) => e.level === "tested")).toBe(false);
  });
});
