import { CopyText } from "@/components/CopyButtons";
import { EvidenceList } from "@/components/EvidenceBadge";
import type { Evidence, Guide } from "@/lib/guide/schema";
import { safeHref } from "@/lib/guide/url";

// The read-only lower half of a guide: blockers, agent work, unknowns, sources, changelog.
export function GuideSections({ guide, evidence }: { guide: Guide; evidence: Map<string, Evidence> }): React.ReactElement {
  const sources = [...new Map(guide.evidence.filter((e) => safeHref(e.sourceUrl)).map((e) => [e.sourceUrl, e])).values()];
  return (
    <>
      {guide.blockers.length > 0 ? (
        <section aria-labelledby="stuck">
          <h2 id="stuck" className="text-lg font-medium">
            Blockers
          </h2>
          <ul className="mt-3 space-y-3">
            {guide.blockers.map((b, index) => (
              <li key={`${index}-${b.symptom}`} className="rounded-md border border-border bg-card p-3 text-sm">
                <p>{b.symptom}</p>
                <p className="mt-1 text-muted">
                  <span className="font-mono text-[10px] uppercase tracking-wider">Cause: </span>
                  {b.cause}
                </p>
                <p className="mt-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">Fix: </span>
                  {b.fix}
                </p>
                {b.escalation ? (
                  <p className="mt-1 text-muted">
                    <span className="font-mono text-[10px] uppercase tracking-wider">Help: </span>
                    {b.escalation}
                  </p>
                ) : null}
                <div className="mt-2">
                  <EvidenceList ids={b.evidenceIds} evidence={evidence} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="agent">
        <h2 id="agent" className="text-lg font-medium">
          Agent and you
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <AssistList title="Agent did" items={guide.agentAssist.didForYou} />
          <AssistList title="Agent can do" items={guide.agentAssist.canDoForYou} />
          <AssistList title="You must do" items={guide.agentAssist.youMustDo} />
        </div>
        {guide.drafts.length > 0 ? (
          <div className="mt-6 space-y-3">
            <h3 className="text-base">Drafts</h3>
            {guide.drafts.map((draft, index) => (
              <details key={`${index}-${draft.title}`} className="rounded-md border border-border bg-card p-3">
                <summary className="cursor-pointer text-sm">
                  {draft.title} <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted">draft · {draft.kind.replace(/_/g, " ")}</span>
                </summary>
                <div className="mt-3 flex justify-end">
                  <CopyText text={draft.body} />
                </div>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-muted">{draft.body}</pre>
              </details>
            ))}
          </div>
        ) : null}
      </section>

      {guide.uncertainties.length > 0 ? (
        <section aria-labelledby="unknowns">
          <h2 id="unknowns" className="text-lg font-medium">
            Open questions
          </h2>
          <ul className="mt-3 space-y-3 text-sm">
            {guide.uncertainties.map((u, index) => (
              <li key={`${index}-${u.question}`}>
                <p>{u.question}</p>
                <p className="text-muted">{u.why}</p>
                <p className="text-muted">
                  <span className="font-mono text-[10px] uppercase tracking-wider">To resolve: </span>
                  {u.howToResolve}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="sources">
        <h2 id="sources" className="text-lg font-medium">
          Sources
        </h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
          {sources.map((e) => (
            <li key={e.id}>
              <a href={e.sourceUrl} target="_blank" rel="noreferrer noopener" className="break-all text-ink">
                {e.sourceTitle ?? e.sourceUrl}
              </a>{" "}
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                {e.sourceKind?.replace(/_/g, " ") ?? e.level} · {e.retrievedAt}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {guide.changelog.length > 0 ? (
        <section aria-labelledby="changes">
          <h2 id="changes" className="text-lg font-medium">
            Verification changes
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {guide.changelog.map((c, index) => (
              <li key={`${index}-${c.at}`}>
                <p>{c.change}</p>
                <p className="text-muted">
                  {c.reason} <span className="font-mono text-[10px] text-muted">{c.at.slice(0, 10)}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

function AssistList({ title, items }: { title: string; items: string[] }): React.ReactElement {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
        {items.map((item, index) => (
          <li key={`${index}-${item}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
