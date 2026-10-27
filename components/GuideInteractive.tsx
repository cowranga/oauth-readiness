"use client";

import { useMemo, useState } from "react";
import { EvidenceList } from "@/components/EvidenceBadge";
import { OwnerTag } from "@/components/OwnerTag";
import { TierBadge } from "@/components/TierBadge";
import { CopyButtons } from "@/components/CopyButtons";
import { formatDays, formatHours } from "@/lib/guide/markdown";
import { effortTotals, nextStep, parseDone, parseUseCases, progressQuery, stepProgress } from "@/lib/guide/progress";
import { STAGE_IDS, USE_CASES, type Evidence, type Guide, type StageId, type UseCase } from "@/lib/guide/schema";
import { safeHref } from "@/lib/guide/url";
import { lightestTierForUseCases, matchingScopeTierIndexes, REVIEW_LEVEL_LABEL, TIERS, tierForUseCases, USE_CASE_LABEL } from "@/lib/guide/tiers";

type Props = { guide: Guide; initialDone?: string; initialUse?: string; children: React.ReactNode };

const STAGE_LABEL: Record<StageId, string> = { prototype: "Prototype", limited: "Limited beta", production: "Production" };
const MANAGED_LABEL = { available: "Yes", not_available: "No", unknown: "Unknown" } as const;

export function GuideInteractive({ guide, initialDone, initialUse, children }: Props): React.ReactElement {
  const [done, setDone] = useState(() => parseDone(initialDone));
  const [useCases, setUseCases] = useState<UseCase[]>(() => parseUseCases(initialUse));
  const evidence = useMemo(() => new Map<string, Evidence>(guide.evidence.map((e) => [e.id, e])), [guide.evidence]);
  const noOauth = guide.oauth.support === "none";

  const sync = (nextDone: Set<string>, nextUse: UseCase[]): void => {
    window.history.replaceState(null, "", `${window.location.pathname}${progressQuery(nextDone, nextUse)}`);
  };
  const toggleDone = (id: string): void => {
    const next = new Set(done);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setDone(next);
    sync(next, useCases);
  };
  const toggleUse = (useCase: UseCase): void => {
    const next = useCases.includes(useCase) ? useCases.filter((u) => u !== useCase) : USE_CASES.filter((u) => u === useCase || useCases.includes(u));
    setUseCases(next);
    sync(done, next);
  };

  const yourTier = tierForUseCases(guide, useCases);
  const bestCaseTier = lightestTierForUseCases(guide, useCases);
  const highlighted = new Set(matchingScopeTierIndexes(guide, useCases));
  const next = nextStep(guide, done);
  const progress = stepProgress(guide, done);
  const totals = effortTotals(guide);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,720px)_minmax(260px,320px)] lg:justify-between">
      <aside className="order-first lg:order-last">
        <div className="space-y-4 rounded-md border border-border bg-card p-4 lg:sticky lg:top-6">
          <div className="space-y-1">
            <TierBadge tier={yourTier} noOauth={noOauth} />
            {!noOauth && guide.scopeTiers.length > 0 ? (
              <p className="text-xs text-muted">
                Your tier for: {useCases.length ? useCases.map((u) => USE_CASE_LABEL[u]).join(", ") : "nothing selected"}. The header shows the overall tier.
              </p>
            ) : null}
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted">Hands-on work</dt>
              <dd className="font-mono">{formatHours(totals.hours)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Waiting</dt>
              <dd className="font-mono">{formatDays(totals.days)}</dd>
            </div>
          </dl>
          <div>
            <p className="text-xs text-muted">Your next step</p>
            <p className="mt-1 text-sm">{next ? next.title : "All steps done."}</p>
          </div>
          <CopyButtons slug={guide.slug} />
        </div>
      </aside>

      <div className="min-w-0 space-y-10">
        <section aria-labelledby="next-step" className="rounded-md border border-border bg-card p-5">
          <h2 id="next-step" className="text-lg font-medium">
            Your next step
          </h2>
          {next ? (
            <div className="mt-3 space-y-2">
              <p className="flex flex-wrap items-center gap-2 text-base">
                {next.title} <OwnerTag owner={next.owner} />
                <span className="font-mono text-xs text-muted">{next.estimate}</span>
              </p>
              <p className="text-sm text-muted">{next.detail}</p>
              {safeHref(next.url) ? (
                <a href={safeHref(next.url)} target="_blank" rel="noreferrer noopener" className="text-sm break-all text-ink">
                  {next.url}
                </a>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">You have checked every step. Keep this link to show your team where you are.</p>
          )}
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1 flex-1 rounded bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done} aria-label="Steps done">
              <div className="h-1 rounded bg-brand" style={{ width: `${progress.total ? (100 * progress.done) / progress.total : 0}%` }} />
            </div>
            <span className="font-mono text-xs text-muted">
              {progress.done} of {progress.total}
            </span>
          </div>
        </section>

        {!noOauth && guide.scopeTiers.length > 0 ? (
          <section aria-labelledby="needs">
            <h2 id="needs" className="text-lg font-medium">
              What does your agent need to do?
            </h2>
            <p className="mt-1 text-sm text-muted">Pick everything it needs. The difficulty depends on what you ask for.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {USE_CASES.map((useCase) => {
                const selected = useCases.includes(useCase);
                return (
                  <button
                    key={useCase}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleUse(useCase)}
                    className={`rounded-full px-3 py-1 text-sm ${selected ? "bg-brand text-on-brand" : "border border-white/15 hover:bg-accent"}`}
                  >
                    {USE_CASE_LABEL[useCase]}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-baseline gap-3" aria-live="polite">
              <span className="text-4xl">{yourTier}</span>
              <span>
                <span className="block">Your tier: {TIERS[yourTier].label}</span>
                <span className="block text-sm text-muted">{TIERS[yourTier].meaning}</span>
              </span>
            </div>
            {bestCaseTier < yourTier ? (
              <p className="mt-2 text-sm text-muted">
                This is the hardest case among the marked rows. If the lighter scopes cover what your agent does, you may only need tier {bestCaseTier} ({TIERS[bestCaseTier].label}).
              </p>
            ) : null}
          </section>
        ) : null}

        <section aria-labelledby="start-today">
          <h2 id="start-today" className="text-lg font-medium">
            Can you start today?
          </h2>
          <p className="mt-2 text-sm">
            <span className="font-mono text-xs uppercase tracking-wider text-muted">Composio managed app: </span>
            {MANAGED_LABEL[guide.composio.managedApp]} <EvidenceList ids={guide.composio.evidenceIds} evidence={evidence} />
          </p>
          <p className="mt-2 text-sm text-muted">{guide.composio.note}</p>
        </section>

        <section aria-labelledby="time">
          <h2 id="time" className="text-lg font-medium">
            Time and effort
          </h2>
          <p className="mt-1 text-sm text-muted">Hands-on work and waiting are different. You can build while you wait.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 font-normal">Stage</th>
                  <th className="py-2 pr-3 font-normal">Who can connect</th>
                  <th className="py-2 pr-3 font-normal">Hands-on</th>
                  <th className="py-2 pr-3 font-normal">Waiting</th>
                  <th className="py-2 font-normal">Review</th>
                </tr>
              </thead>
              <tbody>
                {guide.stages.map((stage) => (
                  <tr key={stage.id} className="border-b border-border align-top">
                    <td className="py-2 pr-3">{stage.name}</td>
                    <td className="py-2 pr-3 text-muted">
                      {stage.whoCanConnect} <EvidenceList ids={stage.evidenceIds} evidence={evidence} />
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">{formatHours(stage.handsOnHours)}</td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {stage.providerStatedWaitDays ? (
                        <>
                          <span className="block">Provider says: {formatDays(stage.providerStatedWaitDays)}</span>
                          <span className="block">Developers report: {formatDays(stage.waitDays)}</span>
                        </>
                      ) : (
                        formatDays(stage.waitDays)
                      )}
                    </td>
                    <td className="py-2 font-mono text-xs">{stage.reviewRequired ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {guide.stages.some((s) => s.notes) ? (
            <ul className="mt-2 space-y-1 text-xs text-muted">
              {guide.stages.filter((s) => s.notes).map((s) => (
                <li key={s.id}>
                  {s.name}: {s.notes}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {guide.scopeTiers.length > 0 ? (
          <section aria-labelledby="scopes">
            <h2 id="scopes" className="text-lg font-medium">
              Scopes decide the difficulty
            </h2>
            <p className="mt-1 text-sm text-muted">Rows that match what your agent needs are marked on the left.</p>
            <ul className="mt-3 space-y-2">
              {guide.scopeTiers.map((scopeTier, index) => (
                <li
                  key={`${index}-${scopeTier.name}`}
                  className={`rounded-md border border-border bg-card p-3 ${highlighted.has(index) ? "border-l-2 border-l-brand" : "opacity-70"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>{scopeTier.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                      {REVIEW_LEVEL_LABEL[scopeTier.reviewLevel]} · {scopeTier.useCases.map((u) => USE_CASE_LABEL[u]).join(", ")}
                    </span>
                  </div>
                  <p className="mt-1 break-words font-mono text-xs text-muted">{scopeTier.exampleScopes.join("  ")}</p>
                  <p className="mt-1 text-sm">
                    {scopeTier.effect} <EvidenceList ids={scopeTier.evidenceIds} evidence={evidence} />
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="requirements">
          <h2 id="requirements" className="text-lg font-medium">
            What you need before you start
          </h2>
          <ul className="mt-3 space-y-2">
            {guide.requirements.map((req) => (
              <li key={req.id} className={`flex gap-3 text-sm ${done.has(req.id) ? "text-muted" : ""}`}>
                <input id={`req-${req.id}`} type="checkbox" className="mt-1 h-4 w-4 shrink-0" checked={done.has(req.id)} onChange={() => toggleDone(req.id)} />
                <label htmlFor={`req-${req.id}`} className="space-y-0.5">
                  <span className="block">
                    {req.item} <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{STAGE_LABEL[req.stage]}</span>
                    {req.agentCanHelp ? <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted">agent can help</span> : null}
                  </span>
                  {req.detail ? <span className="block text-muted">{req.detail}</span> : null}
                </label>
                <EvidenceList ids={req.evidenceIds} evidence={evidence} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="steps">
          <h2 id="steps" className="text-lg font-medium">
            Steps
          </h2>
          {STAGE_IDS.map((stageId) => {
            const steps = guide.steps.filter((s) => s.stage === stageId);
            if (steps.length === 0) return null;
            return (
              <div key={stageId} className="mt-4">
                <h3 className="font-mono text-xs uppercase tracking-wider text-muted">{STAGE_LABEL[stageId]}</h3>
                <ol className="mt-2 space-y-3">
                  {steps.map((step) => (
                    <li key={step.id} className={`flex gap-3 rounded-md border border-border bg-card p-3 ${done.has(step.id) ? "text-muted" : ""}`}>
                      <input id={`step-${step.id}`} type="checkbox" className="mt-1 h-4 w-4 shrink-0" checked={done.has(step.id)} onChange={() => toggleDone(step.id)} />
                      <div className="min-w-0 space-y-1">
                        <label htmlFor={`step-${step.id}`} className="flex flex-wrap items-center gap-2">
                          <span>{step.title}</span>
                          <OwnerTag owner={step.owner} />
                          <span className="font-mono text-xs text-muted">{step.estimate}</span>
                        </label>
                        <p className="text-sm text-muted">{step.detail}</p>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          {safeHref(step.url) ? (
                            <a href={safeHref(step.url)} target="_blank" rel="noreferrer noopener" className="break-all text-ink">
                              {step.url}
                            </a>
                          ) : null}
                          <EvidenceList ids={step.evidenceIds} evidence={evidence} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </section>

        {children}
      </div>
    </div>
  );
}
