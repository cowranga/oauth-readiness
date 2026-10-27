import { describe, expect, it } from "vitest";
import { auditEvidence } from "@/lib/agent/audit";
import { canonicalUrl, submitGuideTool } from "@/lib/agent/tools";
import { lookupToolkit, managedResultFor, parseManagedAuthMarkdown } from "@/lib/composio/managed";
import { htmlTitle, htmlToText } from "@/lib/net/htmlText";
import { fixtureGuide } from "./helpers";

const managedMd = `# Managed OAuth apps

## Composio-managed OAuth available (3)

| Toolkit | Slug |
|---------|------|
| [Gmail](/toolkits/gmail.md) | \`GMAIL\` |
| [Outlook](/toolkits/outlook.md) | \`OUTLOOK\` |
| [Salesforce](/toolkits/salesforce.md) | \`SALESFORCE\` |

## Bring your own OAuth app (2)

| Toolkit | Slug |
|---------|------|
| [Notion MCP](/toolkits/notion_mcp.md) | \`NOTION_MCP\` |
| [Salesforce Service Cloud](/toolkits/salesforce_service_cloud.md) | \`SALESFORCE_SERVICE_CLOUD\` |
`;

describe("Composio managed-auth parsing", () => {
  const rows = parseManagedAuthMarkdown(managedMd);
  it("reads both tables", () => {
    expect(rows).toHaveLength(5);
    expect(rows.filter((r) => r.managed).map((r) => r.slug)).toEqual(["GMAIL", "OUTLOOK", "SALESFORCE"]);
  });
  it("matches names, slugs, and names inside longer queries", () => {
    expect(lookupToolkit(rows, "gmail")?.slug).toBe("GMAIL");
    expect(lookupToolkit(rows, "Microsoft Outlook")?.slug).toBe("OUTLOOK");
    expect(lookupToolkit(rows, "salesforce_service_cloud")?.managed).toBe(false);
    expect(lookupToolkit(rows, "Salesforce Service Cloud")?.slug).toBe("SALESFORCE_SERVICE_CLOUD");
  });
  it("returns available / not_available / unknown", () => {
    expect(managedResultFor(rows, "Gmail").status).toBe("available");
    expect(managedResultFor(rows, "Notion MCP").status).toBe("not_available");
    expect(managedResultFor(rows, "Blorpify").status).toBe("unknown");
  });
});

describe("htmlToText", () => {
  it("drops scripts and nav, keeps headings and text, decodes entities", () => {
    const html = `<html><head><title>Docs &amp; more</title><script>var x=1</script></head><body><nav>menu</nav><h2>Scopes</h2><p>Use&nbsp;<b>read</b> &#8212; ok</p><footer>f</footer></body></html>`;
    expect(htmlTitle(html)).toBe("Docs & more");
    const text = htmlToText(html);
    expect(text).toContain("## Scopes");
    expect(text).toContain("Use read");
    expect(text).not.toMatch(/var x|menu/);
  });
  it("truncates long pages and survives bad entities", () => {
    expect(htmlToText(`<p>${"a".repeat(100)}</p>`, 10)).toBe("aaaaaaaaaa\n[truncated]");
    expect(htmlToText("<p>&#99999999;</p>")).toBe("");
  });
});

describe("auditEvidence", () => {
  it("downgrades sourced evidence the agent never opened and unmatched probes", () => {
    const g = fixtureGuide();
    const fetched = new Set([canonicalUrl("https://example.com/docs/oauth/#scopes")]);
    const { guide, downgraded } = auditEvidence(g, fetched, ["https://example.com/oauth/authorize?client_id=x"]);
    expect(guide.evidence.find((e) => e.id === "e1")?.level).toBe("sourced");
    expect(guide.evidence.find((e) => e.id === "e2")?.level).toBe("inferred");
    expect(guide.evidence.find((e) => e.id === "e4")?.level).toBe("probed");
    expect(downgraded).toBe(1);
    expect(auditEvidence(g, fetched, []).downgraded).toBe(2);
  });
});

describe("submit_guide tool", () => {
  it("has an object schema without $schema", () => {
    const tool = submitGuideTool();
    expect(tool.input_schema.type).toBe("object");
    expect("$schema" in tool.input_schema).toBe(false);
  });
});

describe("addProbeEvidence", () => {
  it("adds uncited probes as probed evidence and links authorize probes to oauth", async () => {
    const { addProbeEvidence } = await import("@/lib/agent/audit");
    const g = fixtureGuide();
    const out = addProbeEvidence(
      g,
      [
        { url: "https://example.com/oauth/authorize?client_id=x", summary: "already cited" },
        { url: "https://api.example.com/oauth/authorize?client_id=x", summary: "Authorization endpoint at api.example.com is live." },
      ],
      "2026-10-28",
    );
    expect(out.evidence).toHaveLength(g.evidence.length + 1);
    expect(out.evidence.at(-1)).toMatchObject({ id: "e_probe_1", level: "probed", sourceKind: "probe" });
    expect(out.oauth.evidenceIds).toContain("e_probe_1");
  });
});
