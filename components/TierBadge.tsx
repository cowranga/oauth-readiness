import { TIER_DOT_CLASS, TIERS } from "@/lib/guide/tiers";
import type { Tier } from "@/lib/guide/schema";

export function TierBadge({ tier, noOauth = false }: { tier: Tier; noOauth?: boolean }): React.ReactElement {
  if (noOauth) {
    return <span className="inline-flex items-center gap-2 rounded border border-border px-2 py-0.5 font-mono text-xs uppercase tracking-wider">No OAuth</span>;
  }
  const info = TIERS[tier];
  return (
    <span className="inline-flex items-center gap-2 rounded border border-border px-2 py-0.5 font-mono text-xs uppercase tracking-wider" title={info.meaning}>
      <span aria-hidden className={`h-2 w-2 rounded-full ${TIER_DOT_CLASS[info.risk]}`} />
      Tier {tier} · {info.label}
    </span>
  );
}
