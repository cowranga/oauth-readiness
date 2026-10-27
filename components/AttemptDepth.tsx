import { ATTEMPT_LABEL, ATTEMPT_LEVELS, type AttemptLevel } from "@/lib/guide/attempt";

export function AttemptDepth({ level }: { level: AttemptLevel }): React.ReactElement {
  const reached = ATTEMPT_LEVELS.indexOf(level);
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-wider" aria-label="How far our checks got">
      {ATTEMPT_LEVELS.map((item, index) => (
        <li key={item} className={`flex items-center gap-2 ${index <= reached ? "text-foreground" : "text-muted opacity-60"}`} title={ATTEMPT_LABEL[item].explain}>
          <span aria-hidden>{index <= reached ? "●" : "○"}</span>
          {ATTEMPT_LABEL[item].label}
          {index < ATTEMPT_LEVELS.length - 1 ? <span aria-hidden className="text-muted">→</span> : null}
          <span className="sr-only">{index <= reached ? "(reached)" : "(not reached)"}</span>
        </li>
      ))}
    </ol>
  );
}
