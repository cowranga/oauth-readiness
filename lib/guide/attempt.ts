import type { Guide } from "./schema";

export const ATTEMPT_LEVELS = ["docs_read", "endpoints_probed", "portal_checked", "human_setup"] as const;
export type AttemptLevel = (typeof ATTEMPT_LEVELS)[number];

export const ATTEMPT_LABEL: Record<AttemptLevel, { label: string; explain: string }> = {
  docs_read: { label: "Docs read", explain: "Our agent read the provider's docs and policies." },
  endpoints_probed: {
    label: "Endpoints probed",
    explain: "Our agent called the live OAuth endpoints with a fake client and recorded the response.",
  },
  portal_checked: {
    label: "Portal checked",
    explain: "Our agent loaded the developer portal without signing in and saw what it requires.",
  },
  human_setup: { label: "Set up by a person", explain: "A person followed the steps for real and noted what matched." },
};

// Portal probes are recorded with claims like "Developer portal at ... loads and asks you to sign in".
const PORTAL_HINT = /developer portal|developer console/i;

/** Deepest attempt level reached, derived from the evidence (never hand-set). */
export function attemptDepth(guide: Pick<Guide, "evidence">): AttemptLevel {
  const evidence = guide.evidence;
  if (evidence.some((e) => e.level === "tested")) return "human_setup";
  const probes = evidence.filter((e) => e.level === "probed");
  if (probes.some((e) => PORTAL_HINT.test(`${e.claim} ${e.note ?? ""}`))) return "portal_checked";
  if (probes.length > 0) return "endpoints_probed";
  return "docs_read";
}
