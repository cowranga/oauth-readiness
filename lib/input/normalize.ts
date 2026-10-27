// Turns what a developer typed ("Gmail", "https://www.slack.com/apps") into a lookup key.

export type NormalizedInput = {
  query: string;
  kind: "name" | "url";
  name: string;
  domain?: string;
  slug: string;
};

export class InputError extends Error {}

const MAX_LENGTH = 200;
const LOOKS_LIKE_URL = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?(\/\S*)?$/i;
// "Node.js", "Next.js", "Monday.com" without a scheme are product names more often than websites.
const NAME_SUFFIX = /\.(js|ts)$/i;

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

export function normalizeInput(raw: string): NormalizedInput {
  const query = raw.trim().replace(/\s+/g, " ");
  if (query.length === 0) throw new InputError("Enter an app name or website, such as Gmail or slack.com.");
  if (query.length > MAX_LENGTH) throw new InputError(`Enter ${MAX_LENGTH} characters or fewer.`);

  if (!query.includes(" ") && LOOKS_LIKE_URL.test(query) && !NAME_SUFFIX.test(query)) {
    let url: URL;
    try {
      url = new URL(/^https?:\/\//i.test(query) ? query : `https://${query}`);
    } catch {
      throw new InputError("Enter a valid website, such as slack.com.");
    }
    const domain = url.hostname.toLowerCase().replace(/^www\./, "");
    const name = nameFromDomain(domain);
    return { query, kind: "url", name, domain, slug: slugify(name) || "app" };
  }

  const slug = slugify(query);
  if (!slug) throw new InputError("Enter an app name, such as Notion, or a website, such as notion.so.");
  return { query, kind: "name", name: query, slug };
}

// "mail.google.com" -> "Google", "slack.com" -> "Slack". A guess; the agent confirms the real name.
function nameFromDomain(domain: string): string {
  const parts = domain.split(".");
  // ponytail: tiny second-level-domain list -> use the Public Suffix List if odd TLDs show up
  const secondLevel = parts.length >= 3 && /^(co|com|org|net|gov|ac)$/.test(parts[parts.length - 2] ?? "");
  const core = parts[parts.length - (secondLevel ? 3 : 2)] ?? domain;
  return core.charAt(0).toUpperCase() + core.slice(1);
}
