import { describe, expect, it } from "vitest";
import { InputError, normalizeInput, slugify } from "@/lib/input/normalize";

describe("normalizeInput", () => {
  it("keeps plain names", () => {
    expect(normalizeInput("  Google   Calendar ")).toMatchObject({ kind: "name", name: "Google Calendar", slug: "google-calendar" });
  });
  it("parses URLs with paths and www", () => {
    expect(normalizeInput("https://www.Slack.com/apps/new?x=1")).toMatchObject({ kind: "url", domain: "slack.com", name: "Slack" });
  });
  it("parses bare domains and subdomains", () => {
    expect(normalizeInput("mail.google.com")).toMatchObject({ kind: "url", domain: "mail.google.com", name: "Google" });
    expect(normalizeInput("bbc.co.uk")).toMatchObject({ name: "Bbc" });
  });
  it("treats uppercase names case-insensitively in the slug", () => {
    expect(normalizeInput("HUBSPOT").slug).toBe("hubspot");
  });
  it("rejects empty, junk, and too-long input", () => {
    expect(() => normalizeInput("   ")).toThrow(InputError);
    expect(() => normalizeInput("!!! ???")).toThrow(InputError);
    expect(() => normalizeInput("a".repeat(201))).toThrow(InputError);
  });
  it("treats names with dots and spaces as names", () => {
    expect(normalizeInput("Monday.com CRM").kind).toBe("name");
  });
});

describe("slugify", () => {
  it("strips accents and punctuation", () => {
    expect(slugify("Café & Co.")).toBe("cafe-co");
  });
});
