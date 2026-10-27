import { safeFetch } from "../net/safeFetch";

// Is there a Composio-managed OAuth app for a toolkit?
// Keyless (default): parse the two tables on the public managed-auth docs page.
// With COMPOSIO_API_KEY: read `composio_managed_auth_schemes` from the toolkit API.
// Source: https://docs.composio.dev/toolkits/managed-auth (checked 2026-10-28).

export const MANAGED_AUTH_MD = "https://docs.composio.dev/toolkits/managed-auth.md";
const MANAGED_AUTH_PAGE = "https://docs.composio.dev/toolkits/managed-auth";

export type ManagedStatus = "available" | "not_available" | "unknown";
export type ManagedResult = { status: ManagedStatus; url: string; note: string; toolkit?: string };
export const SWITCH_RULE_PAGE = "https://docs.composio.dev/docs/white-labeling-authentication";
export const SWITCH_RULE_CLAIM =
  "Switching to your own auth config only affects new connections. Existing users keep their current connection until they re-authenticate, or until you import their credentials where Composio supports it.";

/**
 * `fetchedUrl` is set only when a page was actually loaded, so evidence can cite it honestly.
 * `authSchemes` and `toolkitPageUrl` come from the toolkit's own docs page; `switchRuleUrl` is set when the
 * switching rule was read on Composio's page during this check.
 */
export type ManagedCheck = ManagedResult & { fetchedUrl?: string; authSchemes?: string[]; toolkitPageUrl?: string; switchRuleUrl?: string };

/** Reads "- **Auth:** OAUTH2, API_KEY" from a toolkit page such as /toolkits/linear.md. */
export function parseToolkitAuthSchemes(markdown: string): string[] {
  const line = markdown.match(/^\s*-\s*\*\*Auth:\*\*\s*(.+)$/m)?.[1] ?? "";
  return line.split(",").map((s) => s.trim()).filter((s) => /^[A-Z0-9_]+$/.test(s));
}

/** Evidence the server records for the Composio section, from pages this check actually opened. */
export function composioEvidence(check: ManagedCheck, date: string): { id: string; level: "sourced"; claim: string; sourceUrl: string; sourceTitle: string; sourceKind: "composio_docs"; retrievedAt: string }[] {
  const items = [];
  const statusUrl = check.toolkitPageUrl ?? check.fetchedUrl;
  if (statusUrl && check.status !== "unknown") {
    const schemes = check.authSchemes?.length ? ` Composio supports these auth schemes for it: ${check.authSchemes.join(", ")}.` : "";
    items.push({ id: "e_composio_status", claim: `${check.note}${schemes}`, sourceUrl: statusUrl, sourceTitle: "Composio toolkit docs" });
  }
  if (check.switchRuleUrl) {
    items.push({ id: "e_composio_switch", claim: SWITCH_RULE_CLAIM, sourceUrl: check.switchRuleUrl, sourceTitle: "Composio: White-labeling authentication" });
  }
  return items.map((item) => ({ ...item, level: "sourced" as const, sourceKind: "composio_docs" as const, retrievedAt: date }));
}
export type ToolkitRow = { name: string; slug: string; managed: boolean };

/** Parses "| [Gmail](/toolkits/gmail.md) | `GMAIL` |" rows under the managed and bring-your-own headings. */
export function parseManagedAuthMarkdown(markdown: string): ToolkitRow[] {
  const rows: ToolkitRow[] = [];
  let section: boolean | undefined;
  for (const line of markdown.split("\n")) {
    if (/^##\s+Composio-managed/i.test(line)) section = true;
    else if (/^##\s+Bring your own/i.test(line)) section = false;
    else if (/^##\s/.test(line)) section = undefined;
    const match = line.match(/^\|\s*\[([^\]]+)\]\([^)]*\)\s*\|\s*`([A-Z0-9_]+)`\s*\|/);
    if (match && section !== undefined) rows.push({ name: match[1] ?? "", slug: match[2] ?? "", managed: section });
  }
  return rows;
}

const key = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Exact name or slug match first, then a toolkit whose name is contained in the query ("Google Gmail" -> Gmail). */
export function lookupToolkit(rows: ToolkitRow[], appName: string): ToolkitRow | undefined {
  const wanted = key(appName);
  if (!wanted) return undefined;
  const exact = rows.find((row) => key(row.name) === wanted || key(row.slug) === wanted);
  if (exact) return exact;
  const contained = rows
    .filter((row) => key(row.name).length >= 4 && wanted.includes(key(row.name)))
    .sort((a, b) => b.name.length - a.name.length);
  return contained[0];
}

export function managedResultFor(rows: ToolkitRow[], appName: string): ManagedResult {
  const row = lookupToolkit(rows, appName);
  if (!row) {
    return {
      status: "unknown",
      url: MANAGED_AUTH_PAGE,
      note: `"${appName}" is not in Composio's OAuth toolkit list. It may have no Composio toolkit, use only API keys, or go by another name.`,
    };
  }
  return row.managed
    ? { status: "available", url: MANAGED_AUTH_PAGE, toolkit: row.slug, note: `${row.name} (${row.slug}) is listed under Composio-managed OAuth.` }
    : {
        status: "not_available",
        url: MANAGED_AUTH_PAGE,
        toolkit: row.slug,
        note: `${row.name} (${row.slug}) is listed under "Bring your own OAuth app": you must register your own.`,
      };
}

// ponytail: per-instance cache, refetched on cold start -> cache in the store with a daily TTL
let cached: { at: number; rows: ToolkitRow[] } | undefined;
let switchRuleSeen: number | undefined;

// The switching rule is checked against Composio's live page so the guide can cite it as sourced.
async function readSwitchRule(): Promise<string | undefined> {
  if (switchRuleSeen && Date.now() - switchRuleSeen < 3_600_000) return SWITCH_RULE_PAGE;
  const response = await safeFetch(SWITCH_RULE_PAGE, { maxBytes: 1_500_000 }).catch(() => undefined);
  if (response?.status !== 200 || !/re-authenticate or you import/i.test(response.body)) return undefined;
  switchRuleSeen = Date.now();
  return SWITCH_RULE_PAGE;
}

async function readToolkitPage(toolkit: string): Promise<{ url: string; schemes: string[] } | undefined> {
  const slug = toolkit.toLowerCase();
  const response = await safeFetch(`https://docs.composio.dev/toolkits/${slug}.md`, { maxBytes: 300_000 }).catch(() => undefined);
  if (response?.status !== 200) return undefined;
  return { url: `https://docs.composio.dev/toolkits/${slug}`, schemes: parseToolkitAuthSchemes(response.body) };
}

async function loadRows(): Promise<ToolkitRow[]> {
  if (cached && Date.now() - cached.at < 3_600_000) return cached.rows;
  const response = await safeFetch(MANAGED_AUTH_MD, { maxBytes: 500_000 });
  const rows = response.status === 200 ? parseManagedAuthMarkdown(response.body) : [];
  if (rows.length > 0) cached = { at: Date.now(), rows };
  return rows;
}

export async function checkComposioManaged(appName: string, apiKey?: string): Promise<ManagedCheck> {
  try {
    const rows = await loadRows();
    if (rows.length === 0) return { status: "unknown", url: MANAGED_AUTH_PAGE, note: "Could not load Composio's managed-auth list." };
    const listed = managedResultFor(rows, appName);
    const [page, switchRuleUrl] = await Promise.all([listed.toolkit ? readToolkitPage(listed.toolkit) : undefined, readSwitchRule()]);
    const result: ManagedCheck = { ...listed, fetchedUrl: MANAGED_AUTH_PAGE, authSchemes: page?.schemes, toolkitPageUrl: page?.url, switchRuleUrl };
    if (!apiKey || !result.toolkit) return result;
    const fromApi = await checkWithApi(result.toolkit, apiKey);
    return fromApi ? { ...result, ...fromApi } : result;
  } catch {
    return { status: "unknown", url: MANAGED_AUTH_PAGE, note: "Could not load Composio's managed-auth list." };
  }
}

async function checkWithApi(toolkit: string, apiKey: string): Promise<ManagedResult | undefined> {
  const url = `https://backend.composio.dev/api/v3.1/toolkits/${toolkit.toLowerCase()}`;
  const response = await fetch(url, { headers: { "x-api-key": apiKey }, signal: AbortSignal.timeout(8_000) }).catch(() => undefined);
  if (!response?.ok) return undefined;
  const body: unknown = await response.json().catch(() => undefined);
  const schemes = (body as { composio_managed_auth_schemes?: unknown } | undefined)?.composio_managed_auth_schemes;
  if (!Array.isArray(schemes)) return undefined;
  const managed = schemes.some((scheme) => /oauth/i.test(String(scheme)));
  return {
    status: managed ? "available" : "not_available",
    url: `https://docs.composio.dev/toolkits/${toolkit.toLowerCase()}`,
    toolkit,
    note: managed
      ? `Composio's API lists a managed OAuth scheme for ${toolkit}.`
      : `Composio's API lists no managed OAuth scheme for ${toolkit}.`,
  };
}
