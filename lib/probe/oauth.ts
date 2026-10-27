import { safeFetch } from "../net/safeFetch";

// Unauthenticated OAuth probes (docs/RESEARCH_PLAYBOOK.md): discovery documents, an authorize request with an
// obviously fake client ID, and a developer portal load. Never sign in, never POST, never a real client ID.

export const PROBE_CLIENT_ID = "oauth-guide-probe-invalid";
export const MAX_PROBE_REQUESTS = 3;

export type ProbeKind = "discovery" | "authorize" | "portal";

/** What one probe request saw. Recorded shape, so interpretation can be tested without the network. */
export type ProbeRecord = {
  kind: ProbeKind;
  url: string;
  status?: number;
  location?: string;
  finalUrl?: string;
  contentType?: string;
  body?: string;
  error?: string;
};

export type ProbeFinding = {
  kind: ProbeKind;
  url: string;
  ok: boolean;
  summary: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  pkceMethods?: string[];
  scopesSample?: string[];
};

const CLIENT_ERROR = /invalid[_ -]?client(?:[_ ]id)?|client[_ ]id is invalid|unknown client|client[^.<]{0,40}not found|unauthorized_client|AADSTS\d+/i;
const SIGN_IN = /\b(log ?in|sign ?in|signin|login)\b/i;

export function interpretProbe(record: ProbeRecord): ProbeFinding {
  const base = { kind: record.kind, url: record.url };
  if (record.error) return { ...base, ok: false, summary: `Could not reach ${hostOf(record.url)}: ${record.error}.` };
  if (record.kind === "discovery") return interpretDiscovery(record);
  if (record.kind === "portal") return interpretPortal(record);
  return { ...base, ok: (record.status ?? 0) < 500, summary: interpretAuthorize(record) };
}

function interpretDiscovery(record: ProbeRecord): ProbeFinding {
  const base = { kind: record.kind, url: record.url };
  const doc = parseJson(record.body);
  const endpoint = typeof doc?.authorization_endpoint === "string" ? doc.authorization_endpoint : undefined;
  if (record.status !== 200 || !endpoint) {
    return { ...base, ok: false, summary: `No OAuth discovery document at ${record.url} (HTTP ${record.status ?? "?"}).` };
  }
  const pkce = stringList(doc?.code_challenge_methods_supported);
  const scopes = stringList(doc?.scopes_supported);
  const token = typeof doc?.token_endpoint === "string" ? doc.token_endpoint : undefined;
  const parts = [`Discovery document found at ${record.url}. Authorization endpoint: ${endpoint}.`];
  if (pkce.length > 0) parts.push(`PKCE methods listed: ${pkce.join(", ")}.`);
  if (scopes.length > 0) parts.push(`Lists ${scopes.length} scopes, for example ${scopes.slice(0, 5).join(", ")}.`);
  return {
    ...base,
    ok: true,
    summary: parts.join(" "),
    authorizationEndpoint: endpoint,
    tokenEndpoint: token,
    pkceMethods: pkce,
    scopesSample: scopes.slice(0, 20),
  };
}

function interpretAuthorize(record: ProbeRecord): string {
  const status = record.status ?? 0;
  const host = hostOf(record.url);
  if (status >= 300 && status < 400 && record.location) {
    const target = safeUrl(record.location, record.url);
    const error = target ? redirectError(target) : undefined;
    if (error) return `Authorization endpoint at ${host} is live and rejects an unknown client ID (${error}), as expected.`;
    if (target && SIGN_IN.test(target.pathname)) {
      return `Authorization endpoint at ${host} is live. It sends visitors to sign in at ${target.host} before it checks the client ID, so the probe cannot see client validation.`;
    }
    return `Authorization endpoint at ${host} is live and redirects to ${target?.host ?? "another page"} (HTTP ${status}).`;
  }
  const bodyError = record.body?.slice(0, 60_000).match(CLIENT_ERROR)?.[0];
  if (status >= 500) return `Authorization endpoint at ${host} returned a server error (HTTP ${status}).`;
  if (status === 404) return `Authorization URL ${record.url} returned HTTP 404. The endpoint path may be wrong.`;
  if (bodyError) return `Authorization endpoint at ${host} is live and shows an error for an unknown client ID (${bodyError}), as expected.`;
  if (status === 200 && SIGN_IN.test(titleOf(record.body) ?? "")) {
    return `Authorization endpoint at ${host} is live and shows a sign-in page. It checks the client ID after sign-in.`;
  }
  return `Authorization endpoint at ${host} responded with HTTP ${status}. The response did not show how it treats an unknown client.`;
}

function interpretPortal(record: ProbeRecord): ProbeFinding {
  const base = { kind: record.kind, url: record.url };
  const status = record.status ?? 0;
  const final = record.finalUrl ? safeUrl(record.finalUrl, record.url) : undefined;
  if (status >= 400) return { ...base, ok: false, summary: `Developer portal at ${record.url} returned HTTP ${status}.` };
  const wantsSignIn = (final && SIGN_IN.test(`${final.host} ${final.pathname}`)) || SIGN_IN.test(titleOf(record.body) ?? "");
  const summary = wantsSignIn
    ? `Developer portal at ${record.url} loads and asks you to sign in${final ? ` (${final.host})` : ""}. You need an account to register an app.`
    : `Developer portal at ${record.url} loads without sign-in (HTTP ${status}).`;
  return { ...base, ok: true, summary };
}

/** Error code from a redirect, including Google's base64 `authError` parameter. */
function redirectError(target: URL): string | undefined {
  const direct = target.searchParams.get("error");
  if (direct) return direct;
  const authError = target.searchParams.get("authError");
  if (authError) {
    const decoded = Buffer.from(authError.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("latin1");
    return decoded.match(/[a-z]+_[a-z_]+/)?.[0] ?? "error page";
  }
  return CLIENT_ERROR.exec(target.pathname + target.search)?.[0];
}

function parseJson(body: string | undefined): Record<string, unknown> | undefined {
  try {
    const value: unknown = JSON.parse(body ?? "");
    return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function titleOf(body: string | undefined): string | undefined {
  return body?.match(/<title[^>]*>([^<]*)/i)?.[1]?.trim();
}

function safeUrl(value: string, base: string): URL | undefined {
  try {
    return new URL(value, base);
  } catch {
    return undefined;
  }
}

function hostOf(url: string): string {
  return safeUrl(url, "https://invalid.invalid")?.host ?? url;
}

export function buildAuthorizeProbeUrl(authorizeUrl: string, scope?: string): string | undefined {
  const url = safeUrl(authorizeUrl, "invalid:");
  if (!url || !/^https?:$/.test(url.protocol)) return undefined;
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", PROBE_CLIENT_ID);
  url.searchParams.set("redirect_uri", "https://example.com/callback");
  url.searchParams.set("state", "probe");
  if (scope) url.searchParams.set("scope", scope);
  return url.toString();
}

async function record(kind: ProbeKind, url: string, follow: boolean): Promise<ProbeRecord> {
  try {
    const response = await safeFetch(url, { followRedirects: follow, maxBytes: 300_000 });
    return {
      kind,
      url,
      status: response.status,
      location: response.headers.get("location") ?? undefined,
      finalUrl: response.finalUrl,
      contentType: response.headers.get("content-type") ?? undefined,
      body: response.body,
    };
  } catch (error) {
    return { kind, url, error: error instanceof Error ? error.message : "request failed" };
  }
}

export type ProbeInput = { domain?: string; authorizeUrl?: string; portalUrl?: string; scope?: string };

/** Runs at most `budget` requests: discovery, then authorize, then portal. */
export async function runProbes(input: ProbeInput, budget: number): Promise<ProbeFinding[]> {
  const findings: ProbeFinding[] = [];
  let left = Math.min(budget, MAX_PROBE_REQUESTS);
  let authorizeUrl = input.authorizeUrl;
  if (input.domain && left > 0 && (!authorizeUrl || left > 2)) {
    left--;
    const discovery = interpretProbe(await record("discovery", `https://${input.domain}/.well-known/openid-configuration`, true));
    findings.push(discovery);
    authorizeUrl ??= discovery.authorizationEndpoint;
  }
  const probeUrl = authorizeUrl ? buildAuthorizeProbeUrl(authorizeUrl, input.scope) : undefined;
  if (probeUrl && left > 0) {
    left--;
    findings.push(interpretProbe(await record("authorize", probeUrl, false)));
  }
  if (input.portalUrl && left > 0) {
    left--;
    findings.push(interpretProbe(await record("portal", input.portalUrl, true)));
  }
  return findings;
}
