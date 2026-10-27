import type { Guide } from "../guide/schema";
import { canonicalUrl } from "./tools";

export type AuditResult = { guide: Guide; downgraded: number };

/**
 * Hard rule: a live guide may call a claim "sourced" only if the agent opened that page this run,
 * and "probed" only if a probe hit that URL. Anything else becomes inferred, with the reason in the note.
 */
export function auditEvidence(guide: Guide, fetchedUrls: Set<string>, probeUrls: string[]): AuditResult {
  const probePaths = new Set(probeUrls.map(pathKey));
  let downgraded = 0;
  const evidence = guide.evidence.map((e) => {
    if (e.level === "sourced" && e.sourceUrl && !fetchedUrls.has(canonicalUrl(e.sourceUrl))) {
      downgraded++;
      return { ...e, level: "inferred" as const, note: joinNote(e.note, "Not opened during research (search result only). Check the link.") };
    }
    if (e.level === "probed" && (!e.sourceUrl || !probePaths.has(pathKey(e.sourceUrl)))) {
      downgraded++;
      return { ...e, level: "inferred" as const, note: joinNote(e.note, "No matching probe was run.") };
    }
    return e;
  });
  return { guide: { ...guide, evidence }, downgraded };
}

// Probe URLs carry query strings (fake client ID); match on host + path.
function pathKey(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`.replace(/\/$/, "");
  } catch {
    return url;
  }
}

function joinNote(note: string | undefined, extra: string): string {
  return note ? `${note} ${extra}` : extra;
}
