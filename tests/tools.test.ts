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
    const tested = { ...g, evidence: [{ ...g.evidence[1]!, level: "tested" as const }] };
    expect(auditEvidence(tested, fetched, []).guide.evidence[0]!.level).toBe("inferred");
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
    expect(out.evidence.at(-1)).toMatchObject({ id: "e_autoprobe_1", level: "probed", sourceKind: "probe" });
    expect(out.oauth.evidenceIds).toContain("e_autoprobe_1");
  });
});

describe("Composio toolkit page and server-built evidence", () => {
  it("reads auth schemes from a toolkit page", async () => {
    const { parseToolkitAuthSchemes } = await import("@/lib/composio/managed");
    const page = "# Linear\n\n- **Category:** project management\n- **Auth:** OAUTH2, API_KEY\n- **Composio-managed OAuth available?** Yes\n";
    expect(parseToolkitAuthSchemes(page)).toEqual(["OAUTH2", "API_KEY"]);
    expect(parseToolkitAuthSchemes("no auth line")).toEqual([]);
  });

  it("cites the toolkit page and the switching rule only when they were read", async () => {
    const { composioEvidence } = await import("@/lib/composio/managed");
    const base = { status: "available" as const, url: "u", note: "Linear (LINEAR) is listed under Composio-managed OAuth." };
    const full = composioEvidence(
      { ...base, toolkitPageUrl: "https://docs.composio.dev/toolkits/linear", authSchemes: ["OAUTH2", "API_KEY"], switchRuleUrl: "https://docs.composio.dev/docs/white-labeling-authentication" },
      "2026-10-28",
    );
    expect(full.map((e) => e.id)).toEqual(["e_composio_status", "e_composio_switch"]);
    expect(full[0]!.claim).toContain("OAUTH2, API_KEY");
    expect(full[1]!.claim).toMatch(/re-authenticate, or until you import/);
    expect(composioEvidence({ ...base }, "2026-10-28")).toEqual([]);
    expect(composioEvidence({ ...base, status: "unknown", fetchedUrl: "https://docs.composio.dev/toolkits/managed-auth" }, "2026-10-28")).toEqual([]);
  });
});
