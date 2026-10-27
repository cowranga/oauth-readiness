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
        <h1 className="text-3xl sm:text-4xl">How hard is it to get your OAuth app approved?</h1>
        <p className="text-muted">
          Look up an app your AI agent needs to connect to. Get a shareable guide: how hard it is, hands-on time versus waiting time, what
          triggers review, what can block you, and which claims are checked.
        </p>
      </section>

      <Library seeds={seeds} />

      {recent.length > 0 ? (
        <section aria-labelledby="recent" className="space-y-3">
          <h2 id="recent" className="text-xl font-medium">
            Recently generated
          </h2>
          <p className="text-sm text-muted">Live guides written by the agent. Not checked by a person.</p>
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
          What the tiers mean
        </h2>
        <p className="text-sm text-muted">The tier is decided by what you wait on, not by how much you click.</p>
        <ul className="space-y-2">
          {([1, 2, 3, 4, 5] as Tier[]).map((tier) => (
            <li key={tier} className="flex flex-wrap items-center gap-3 text-sm">
              <TierBadge tier={tier} />
              <span className="text-muted">{TIERS[tier].meaning}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">
          A customer-side gate badge means your users&apos; admins may also need to approve your app. <Link href="/about">How guides are made and checked</Link>.
        </p>
      </section>
    </div>
  );
}
