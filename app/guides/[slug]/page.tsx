import { Inline } from "@/components/Inline";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AttemptDepth } from "@/components/AttemptDepth";
import { EvidenceList } from "@/components/EvidenceBadge";
import { GuideInteractive } from "@/components/GuideInteractive";
import { GuideSections } from "@/components/GuideSections";
import { TierBadge } from "@/components/TierBadge";
import { attemptDepth } from "@/lib/guide/attempt";
import { EVIDENCE_LEVELS, type Evidence } from "@/lib/guide/schema";
import { cache } from "react";
import { safeHref } from "@/lib/guide/url";
import { loadGuide as loadGuideUncached } from "@/lib/store";

// One store read per request, shared by metadata and the page.
const loadGuide = cache(loadGuideUncached);

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const guide = await loadGuide((await params).slug);
  if (!guide) return { title: "Guide not found" };
  return { title: `${guide.app.name} OAuth app guide`, description: guide.verdict.summary };
}

export default async function GuidePage({ params, searchParams }: Params): Promise<React.ReactElement> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const guide = await loadGuide(slug);
  if (!guide) notFound();

  const evidence = new Map<string, Evidence>(guide.evidence.map((e) => [e.id, e]));
  const counts = EVIDENCE_LEVELS.map((level) => `${guide.evidence.filter((e) => e.level === level).length} ${level}`).join(", ");
  const seed = guide.origin === "verified_seed";
  const single = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

  return (
    <article className="space-y-8">
      <header className="max-w-[720px] space-y-4">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
          <span className={`rounded border px-1.5 py-px ${seed ? "border-foreground" : "border-dashed border-border text-muted"}`}>
            {seed ? "Verified" : "Live, not verified"}
          </span>
          <span className="text-muted">Researched {guide.generatedAt.slice(0, 10)}</span>
          <span className="text-muted">Confidence {guide.verdict.confidence}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl">{guide.app.name}</h1>
        <p className="text-sm text-muted">
          {guide.app.provider}
          {safeHref(guide.app.website) ? (
            <>
              {" · "}
              <a href={safeHref(guide.app.website)} target="_blank" rel="noreferrer noopener">
                {guide.app.website.replace(/^https?:\/\//, "")}
              </a>
            </>
          ) : null}
          {safeHref(guide.app.developerPortalUrl) ? (
            <>
              {" · "}
              <a href={safeHref(guide.app.developerPortalUrl)} target="_blank" rel="noreferrer noopener">
                Developer portal
              </a>
            </>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <TierBadge tier={guide.verdict.tier} noOauth={guide.oauth.support === "none"} />
          {guide.verdict.customerSideGate ? (
            <span
              className="inline-flex items-center gap-2 rounded border border-border px-2 py-0.5 font-mono text-xs uppercase tracking-wider"
              title="Your users' admins may need to approve the app."
            >
              <span aria-hidden className="h-2 w-2 rounded-full bg-warning" />
              Customer-side gate
            </span>
          ) : null}
        </div>
        {/* div, not p: evidence badges are <details>, which a <p> cannot contain */}
        <div className="text-lg">
          <Inline text={guide.verdict.summary} /> <EvidenceList ids={guide.verdict.evidenceIds} evidence={evidence} />
        </div>
        {guide.verdict.customerSideGate && guide.verdict.customerSideGateNote ? (
          <p className="text-sm text-muted"><strong>Customer-side gate:</strong> <Inline text={guide.verdict.customerSideGateNote} /></p>
        ) : null}
        {guide.oauth.appTypes && guide.oauth.appTypes.length > 0 ? (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted">App types ({guide.oauth.appTypes.length})</summary>
            <ul className="mt-2 space-y-1">
              {guide.oauth.appTypes.map((t, index) => (
                <li key={`${index}-${t.name}`}>
                  {t.name}: <span className="text-muted"><Inline text={t.whenToUse} /></span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
        {guide.oauth.support === "none" && guide.oauth.alternatives ? <p className="text-sm">Instead: <Inline text={guide.oauth.alternatives} /></p> : null}
        <div className="space-y-1">
          <AttemptDepth level={attemptDepth(guide)} />
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Evidence: {counts}</p>
        </div>
        {seed ? (
          <p className="no-print text-xs text-muted">
            <Link href={`/generate?q=${encodeURIComponent(guide.input.query)}&fresh=1`}>Generate a live guide</Link> to compare with this one.
          </p>
        ) : null}
      </header>

      <GuideInteractive guide={guide} initialDone={single(query.done)} initialUse={single(query.use)}>
        <GuideSections guide={guide} evidence={evidence} />
      </GuideInteractive>
    </article>
  );
}
