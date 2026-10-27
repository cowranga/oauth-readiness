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

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

export function normalizeInput(raw: string): NormalizedInput {
  const query = raw.trim().replace(/\s+/g, " ");
  if (query.length === 0) throw new InputError("Type an app name or website, for example Gmail or https://slack.com.");
  if (query.length > MAX_LENGTH) throw new InputError(`Keep it under ${MAX_LENGTH} characters: just the app name or its website.`);

  if (!query.includes(" ") && LOOKS_LIKE_URL.test(query)) {
    const url = new URL(/^https?:\/\//i.test(query) ? query : `https://${query}`);
    const domain = url.hostname.toLowerCase().replace(/^www\./, "");
    const name = nameFromDomain(domain);
    return { query, kind: "url", name, domain, slug: slugify(name) || "app" };
  }

  const slug = slugify(query);
  if (!slug) throw new InputError("That does not look like an app name. Try a name like Notion or a website like notion.so.");
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
