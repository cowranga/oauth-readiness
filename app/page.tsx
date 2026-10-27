import Link from "next/link";
import { Library } from "@/components/Library";
import { TierBadge } from "@/components/TierBadge";
import { TIERS } from "@/lib/guide/tiers";
import type { Tier } from "@/lib/guide/schema";
import { getStore } from "@/lib/store";
import { listSeeds } from "@/lib/store/seeds";
import { summarize, type GuideSummary } from "@/lib/store/types";

export const dynamic = "force-dynamic";

async function recentLive(): Promise<GuideSummary[]> {
  try {
    return (await getStore().listRecent(8)).filter((g) => g.origin === "live");
  } catch {
    return [];
  }
}

export default async function HomePage(): Promise<React.ReactElement> {
  const seeds = listSeeds().map(summarize);
  const recent = await recentLive();
  return (
    <div className="space-y-12">
      <section className="max-w-[720px] space-y-3">
        <h1 className="text-3xl sm:text-4xl">OAuth app approval guides</h1>
        <p className="text-muted">Each guide shows the work, wait time, and review needed to get an app&apos;s OAuth app approved.</p>
      </section>

      <Library seeds={seeds} />

      {recent.length > 0 ? (
        <section aria-labelledby="recent" className="space-y-3">
          <h2 id="recent" className="text-xl font-medium">
            Recent live guides
          </h2>
          <p className="text-sm text-muted">Written by the agent. Not verified.</p>
          <ul className="space-y-1 text-sm">
            {recent.map((g) => (
              <li key={g.slug} className="flex flex-wrap items-center gap-3">
                <Link href={`/guides/${g.slug}`}>{g.app.name}</Link>
                <TierBadge tier={g.verdict.tier} />
                <span className="font-mono text-[10px] text-muted">{g.generatedAt.slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="legend" className="space-y-3">
        <h2 id="legend" className="text-xl font-medium">
          Tiers
        </h2>
        <p className="text-sm text-muted">The tier reflects what you wait on.</p>
        <ul className="space-y-2">
          {([1, 2, 3, 4, 5] as Tier[]).map((tier) => (
            <li key={tier} className="flex flex-wrap items-center gap-3 text-sm">
              <TierBadge tier={tier} />
              <span className="text-muted">{TIERS[tier].meaning}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">
          <strong>Customer-side gate</strong>: your users&apos; admins may need to approve the app. See <Link href="/about">About</Link> for how guides are made.
        </p>
      </section>
    </div>
  );
}
