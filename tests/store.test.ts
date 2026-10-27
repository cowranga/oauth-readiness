import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { createFileStore } from "@/lib/store/file";
import { fixtureGuide } from "./helpers";

const dir = mkdtempSync(join(tmpdir(), "guides-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("file store", () => {
  const store = createFileStore(dir);
  it("round-trips a guide and lists it", async () => {
    const guide = fixtureGuide();
    await store.put(guide);
    expect(await store.get(guide.slug)).toEqual(guide);
    const recent = await store.listRecent(5);
    expect(recent[0]).toMatchObject({ slug: guide.slug, app: { name: "Example Notes" } });
  });
  it("returns null for unknown or unsafe slugs", async () => {
    expect(await store.get("nope-123456")).toBeNull();
    expect(await store.get("../../etc/passwd")).toBeNull();
  });
  it("counts generations per day", async () => {
    expect(await store.countGeneration("2026-10-28")).toBe(1);
    expect(await store.countGeneration("2026-10-28")).toBe(2);
    expect(await store.countGeneration("2026-10-29")).toBe(1);
  });
});
