// Small HTML-to-text for research pages. Not a full parser: enough to give the model readable docs text.
// ponytail: regex stripping misses some layouts -> swap in a DOM-based readability pass if pages read badly

const DROP_BLOCKS = /<(script|style|noscript|svg|nav|footer|header|form|iframe|template)\b[\s\S]*?<\/\1>/gi;
const BLOCK_TAGS = /<\/?(p|div|section|article|main|li|ul|ol|tr|table|h[1-6]|br|hr|pre|blockquote|dd|dt)\b[^>]*>/gi;
const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };

export function htmlTitle(html: string): string | undefined {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return title ? decodeEntities(title).replace(/\s+/g, " ").trim() || undefined : undefined;
}

export function htmlToText(html: string, maxChars = 15_000): string {
  const text = decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(DROP_BLOCKS, " ")
      .replace(/<h([1-6])[^>]*>/gi, (_m, level: string) => `\n${"#".repeat(Number(level))} `)
      .replace(BLOCK_TAGS, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n[ \n]*/g, "\n")
    .trim();
  return text.length > maxChars ? `${text.slice(0, maxChars)}\n[truncated]` : text;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_m, code: string) => codePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code: string) => codePoint(parseInt(code, 16)))
    .replace(/&([a-z0-9#]+);/gi, (match, name: string) => ENTITIES[name.toLowerCase()] ?? match);
}

function codePoint(code: number): string {
  return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : " ";
}
