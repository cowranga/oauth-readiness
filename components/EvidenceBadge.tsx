import type { Evidence } from "@/lib/guide/schema";

const LEVEL_STYLE: Record<Evidence["level"], string> = {
  tested: "border-foreground text-foreground",
  probed: "border-border text-foreground",
  sourced: "border-border text-foreground",
  inferred: "border-dashed border-border text-muted",
};

/** Small pill; click or keyboard-open shows the claim, level, source link, and date. No JS needed. */
export function EvidenceBadge({ evidence }: { evidence: Evidence }): React.ReactElement {
  return (
    <details className="group relative inline-block align-middle">
      <summary
        className={`inline-flex cursor-pointer list-none items-center rounded border px-1.5 py-px font-mono text-[10px] uppercase tracking-wider ${LEVEL_STYLE[evidence.level]}`}
        aria-label={`Evidence: ${evidence.level}. Show details`}
      >
        {evidence.level}
      </summary>
      <div className="absolute left-0 z-20 mt-1 w-72 max-w-[80vw] rounded-md border border-border bg-popover p-3 text-xs leading-relaxed text-foreground shadow-lg">
        <p>{evidence.claim}</p>
        {evidence.sourceUrl ? (
          <a href={evidence.sourceUrl} target="_blank" rel="noreferrer noopener" className="mt-2 block break-all">
            {evidence.sourceTitle ?? evidence.sourceUrl}
          </a>
        ) : null}
        {evidence.note ? <p className="mt-2 text-muted">{evidence.note}</p> : null}
        <p className="mt-2 font-mono text-[10px] uppercase text-muted">
          {evidence.level} · {evidence.sourceKind?.replace(/_/g, " ") ?? "reasoning"} · {evidence.retrievedAt}
        </p>
      </div>
    </details>
  );
}

export function EvidenceList({ ids, evidence }: { ids: string[]; evidence: Map<string, Evidence> }): React.ReactElement | null {
  const items = ids.flatMap((id) => {
    const found = evidence.get(id);
    return found ? [found] : [];
  });
  if (items.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {items.map((item) => (
        <EvidenceBadge key={item.id} evidence={item} />
      ))}
    </span>
  );
}
