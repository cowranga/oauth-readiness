import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// Every outbound request the agent makes goes through here.
// http/https only, public IPs only (checked on every redirect hop), 10s timeout, 2 MB cap.

export const USER_AGENT = "OAuthGuideResearchBot/1.0 (+https://github.com/oauth-readiness)";

export class SafeFetchError extends Error {}

export type SafeResponse = {
  status: number;
  finalUrl: string;
  headers: Headers;
  body: string;
  truncated: boolean;
};

type Options = {
  method?: "GET" | "HEAD";
  followRedirects?: boolean;
  maxBytes?: number;
  timeoutMs?: number;
};

const MAX_REDIRECTS = 3;

export async function safeFetch(rawUrl: string, options: Options = {}): Promise<SafeResponse> {
  const { method = "GET", followRedirects = true, maxBytes = 2_000_000, timeoutMs = 10_000 } = options;
  const signal = AbortSignal.timeout(timeoutMs);
  let url = parseUrl(rawUrl);

  for (let hop = 0; ; hop++) {
    await assertPublicHost(url.hostname);
    // ponytail: DNS is resolved again by fetch (rebinding window) -> pin the checked IP with an undici Agent lookup
    const response = await fetch(url, {
      method,
      redirect: "manual",
      signal,
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/json;q=0.9,*/*;q=0.5" },
    }).catch((error: unknown) => {
      throw new SafeFetchError(error instanceof Error && error.name === "TimeoutError" ? "timed out" : "network error");
    });

    const location = response.headers.get("location");
    if (followRedirects && response.status >= 300 && response.status < 400 && location) {
      if (hop >= MAX_REDIRECTS) throw new SafeFetchError("too many redirects");
      await response.body?.cancel();
      url = parseUrl(new URL(location, url).toString());
      continue;
    }
    const { text, truncated } = method === "HEAD" ? { text: "", truncated: false } : await readCapped(response, maxBytes);
    return { status: response.status, finalUrl: url.toString(), headers: response.headers, body: text, truncated };
  }
}

function parseUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SafeFetchError("invalid URL");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new SafeFetchError("only http and https URLs are allowed");
  if (url.username || url.password) throw new SafeFetchError("URLs with credentials are not allowed");
  return url;
}

async function readCapped(response: Response, maxBytes: number): Promise<{ text: string; truncated: boolean }> {
  if (!response.body) return { text: "", truncated: false };
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      truncated = true;
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return { text: new TextDecoder().decode(Buffer.concat(chunks)), truncated };
}

export async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new SafeFetchError("blocked host");
  }
  const addresses = isIP(host) ? [host] : await resolveAll(host);
  if (addresses.length === 0 || addresses.some(isBlockedIp)) throw new SafeFetchError("blocked host");
}

async function resolveAll(host: string): Promise<string[]> {
  try {
    return (await lookup(host, { all: true })).map((entry) => entry.address);
  } catch {
    throw new SafeFetchError("could not resolve host");
  }
}

/** True for loopback, private, link-local (incl. cloud metadata), CGNAT, multicast, and reserved ranges. */
export function isBlockedIp(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isBlockedIpv4(address);
  if (version !== 6) return true;
  const lower = address.toLowerCase();
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped?.[1]) return isBlockedIpv4(mapped[1]);
  if (lower === "::" || lower === "::1") return true;
  return /^(fc|fd|fe[89ab]|ff)/.test(lower) || lower.startsWith("64:ff9b:") || lower.startsWith("2001:db8:");
}

function isBlockedIpv4(address: string): boolean {
  const [a = 0, b = 0] = address.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}
