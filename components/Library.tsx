"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TierBadge } from "@/components/TierBadge";
import type { GuideSummary } from "@/lib/store/types";
import type { Tier } from "@/lib/guide/schema";

const TIER_OPTIONS: Tier[] = [1, 2, 3, 4, 5];

/** One box: typing filters the verified library, submitting asks the agent for any app. */
export function Library({ seeds }: { seeds: GuideSummary[] }): React.ReactElement {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tiers, setTiers] = useState<Tier[]>([]);
  const needle = query.trim().toLowerCase();
  const shown = seeds.filter(
    (g) =>
      (tiers.length === 0 || tiers.includes(g.verdict.tier)) &&
      (!needle || `${g.app.name} ${g.app.provider} ${g.app.category}`.toLowerCase().includes(needle)),
  );

  return (
    <div className="space-y-8">
      <form
        id="generate"
        className="max-w-[520px] space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (query.trim()) router.push(`/generate?q=${encodeURIComponent(query.trim())}`);
        }}
      >
        <label htmlFor="app-query" className="block text-sm text-muted">
          App name or website
        </label>
        <div className="flex gap-2">
          <input
            id="app-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Gmail, HubSpot, https://linear.app"
            maxLength={200}
            autoComplete="off"
            className="min-w-0 flex-1 rounded-md border border-white/15 bg-card px-3 py-2 text-base placeholder:text-muted"
          />
          <button type="submit" className="rounded-md bg-foreground px-4 py-2 text-background hover:opacity-90 disabled:opacity-50" disabled={!query.trim()}>
            Get guide
          </button>
        </div>
        <p className="text-xs text-muted">Verified guides open instantly. For any other app, an agent researches it live in about a minute.</p>
      </form>

      <section id="library" aria-labelledby="library-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="library-heading" className="text-xl font-medium">
            Verified guides
          </h2>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by tier">
            {TIER_OPTIONS.map((tier) => {
              const selected = tiers.includes(tier);
              return (
                <button
                  key={tier}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setTiers(selected ? tiers.filter((t) => t !== tier) : [...tiers, tier])}
                  className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${selected ? "bg-brand text-on-brand" : "border border-white/15 hover:bg-accent"}`}
                >
                  Tier {tier}
                </button>
              );
            })}
          </div>
        </div>
        {shown.length === 0 ? (
          <p className="text-sm text-muted">
            No verified guide matches. Press Get guide and the agent will research {query.trim() ? `"${query.trim()}"` : "it"} live.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`} className="block h-full rounded-md border border-border bg-card p-4 text-foreground no-underline hover:bg-accent">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-lg">{g.app.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted">Verified</span>
                  </span>
                  <span className="mt-2 block">
                    <TierBadge tier={g.verdict.tier} />
                  </span>
                  <span className="mt-3 block text-sm text-muted">{g.verdict.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
