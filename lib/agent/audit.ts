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

/** Probes the agent ran are facts about this run: record each as probed evidence even if the model forgot to cite it. */
export function addProbeEvidence(guide: Guide, probes: { url: string; summary: string }[], date: string): Guide {
  const cited = new Set(guide.evidence.filter((e) => e.level === "probed" && e.sourceUrl).map((e) => pathKey(e.sourceUrl ?? "")));
  const missing = probes.filter((p) => !cited.has(pathKey(p.url)));
  if (missing.length === 0) return guide;
  const added = missing.map((probe, index) => ({
    id: `e_probe_${index + 1}`,
    level: "probed" as const,
    claim: probe.summary,
    sourceUrl: probe.url,
    sourceKind: "probe" as const,
    retrievedAt: date,
    note: "Recorded automatically from the probe this run made.",
  }));
  const authorizeIds = added.filter((e) => /authorization endpoint/i.test(e.claim)).map((e) => e.id);
  return {
    ...guide,
    oauth: { ...guide.oauth, evidenceIds: [...guide.oauth.evidenceIds, ...authorizeIds] },
    evidence: [...guide.evidence, ...added],
  };
}
