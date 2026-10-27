import type { Metadata } from "next";
import Link from "next/link";
import { TierBadge } from "@/components/TierBadge";
import { ATTEMPT_LABEL, ATTEMPT_LEVELS } from "@/lib/guide/attempt";
import type { Tier } from "@/lib/guide/schema";
import { TIERS } from "@/lib/guide/tiers";

export const metadata: Metadata = { title: "About these guides" };

const EVIDENCE = [
  ["Tested", "A person followed this step for real and it matched. The date is noted."],
  ["Probed", "Our agent called the provider's live endpoint and saw this response. It never signs in and uses a fake client ID."],
  ["Sourced", "Stated on the linked page, which the agent opened. Official unless marked community."],
  ["Inferred", "Our reasoning from related facts. Check it before you rely on it."],
] as const;

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-xl font-medium">
        {title}
      </h2>
      <div className="space-y-3 text-muted [&_strong]:text-foreground">{children}</div>
    </section>
  );
}

export default function AboutPage(): React.ReactElement {
  return (
    <article className="max-w-[720px] space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl">About these guides</h1>
        <p className="text-muted">
          We help you get from Composio&apos;s managed OAuth app to your own approved OAuth app before you launch. You can start building today
          on a managed app with no registration and no review. The hard part comes at go-live, when you need your own app and find out it
          needs review, an audit, a partner application, or your customers&apos; admins to approve it. These guides tell you that on day one,
          so you can start the slow parts while you build, or ask for less so you avoid them.
        </p>
      </header>

      <Section id="model" title="Three things that are easy to mix up">
        <p>
          <strong>1. The provider OAuth app.</strong> One registration per product, made in the provider&apos;s developer portal. It holds the
          client ID and secret, redirect URIs, the scopes you ask for, and the name and logo users see on the consent screen. The provider
          reviews this app, not each user.
        </p>
        <p>
          <strong>2. Your integration.</strong> In Composio terms, an auth config. It points at one OAuth app: Composio&apos;s managed app or
          your own.
        </p>
        <p>
          <strong>3. Your users&apos; connections.</strong> Each user clicks through the consent screen of that OAuth app and gets tokens.
          Whether that screen works for strangers, shows a warning, or is blocked depends on the app&apos;s review status.
        </p>
        <p>So approval happens once per app, but it affects every user connection.</p>
      </Section>

      <Section id="managed" title="Managed app or your own?">
        <p>
          Composio registers and maintains OAuth apps for many toolkits, so you can start with no setup. Users then see Composio on the
          consent screen, quota is shared across Composio users, and triggers poll at most every 15 minutes.
        </p>
        <p>
          You bring your own app for your name on the consent screen, custom scopes, your own rate limits, faster polling, custom instances
          (such as a private Salesforce domain), or because enterprise customers ask for it. You can mix per toolkit.
        </p>
        <p>
          <strong>Plan for the switch.</strong> A new auth config only applies to new connections. Users who connected through the managed
          app keep that connection until they reconnect, so plan a reconnect prompt.
        </p>
        <p className="text-sm">
          Sources:{" "}
          <a href="https://docs.composio.dev/docs/custom-app-vs-managed-app" target="_blank" rel="noreferrer noopener">
            Managed vs custom auth
          </a>
          ,{" "}
          <a href="https://docs.composio.dev/toolkits/managed-auth" target="_blank" rel="noreferrer noopener">
            Managed OAuth apps list
          </a>
          ,{" "}
          <a href="https://docs.composio.dev/docs/white-labeling-authentication" target="_blank" rel="noreferrer noopener">
            White-labeling authentication
          </a>{" "}
          (read 2026-10-28).
        </p>
      </Section>

      <Section id="tiers" title="Tiers: decided by what you wait on">
        <ul className="space-y-2">
          {([1, 2, 3, 4, 5] as Tier[]).map((tier) => (
            <li key={tier} className="flex flex-wrap items-center gap-3 text-sm">
              <TierBadge tier={tier} />
              <span>{TIERS[tier].meaning}</span>
            </li>
          ))}
        </ul>
        <p>
          The same provider can be tier 1 or tier 4 depending on what you ask for. On each guide, pick what your agent needs (read, write,
          act while offline, admin) and the guide shows your tier: the hardest scope tier that matches what you picked. When lighter scopes
          might be enough, the guide says so. <strong>Customer-side gate</strong> means your users&apos; admins may also have to approve your app, even after the
          provider does.
        </p>
      </Section>

      <Section id="evidence" title="How sure are we?">
        <ul className="space-y-2 text-sm">
          {EVIDENCE.map(([label, text]) => (
            <li key={label}>
              <span className="mr-2 inline-block rounded border border-border px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-foreground">
                {label}
              </span>
              {text}
            </li>
          ))}
        </ul>
        <p>Each guide also shows how far our checks got:</p>
        <ul className="space-y-1 text-sm">
          {ATTEMPT_LEVELS.map((level) => (
            <li key={level}>
              <strong>{ATTEMPT_LABEL[level].label}.</strong> {ATTEMPT_LABEL[level].explain}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="method" title="How guides are made and checked">
        <p>
          <strong>Live guides.</strong> An agent (Claude) searches the provider&apos;s docs, opens the pages it cites, probes the live OAuth
          endpoints with a fake client ID, and checks Composio&apos;s managed app list. Code then checks its work: a claim can only be
          &quot;sourced&quot; if the agent actually opened that page during the run, and only &quot;probed&quot; if a probe hit that URL.
          Everything else is marked inferred. Live guides are never marked tested.
        </p>
        <p>
          <strong>Verified guides.</strong> A research agent wrote each one from official sources. A second agent, with no access to the
          first one&apos;s notes, then checked every tier-deciding claim against its source and looked for a second source. Corrections are
          listed at the bottom of each guide, and the full logs are in the repository under <code className="font-mono text-xs">verification/</code>.
        </p>
        <p>
          <strong>What no agent does.</strong> It never signs in, creates accounts, submits forms, or registers apps. Anything that needs a
          sign-in, 2FA, DNS changes, legal acceptance, documents, payment, or a screen recording is marked as yours to do.
        </p>
      </Section>

      <Section id="scale" title="How this gets to 100 apps">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Generate all 100 with the live agent, about a minute and a few cents each.</li>
          <li>Verify only the tier-deciding claims with an independent checker agent, and send disagreements to a person.</li>
          <li>Have a person set up the top 20 apps by usage, so those reach &quot;Set up by a person&quot;.</li>
          <li>Re-check monthly, because policies change. Diff each new run against the stored guide and flag tier changes for review.</li>
          <li>Let developers report &quot;this step was different for me&quot; and feed that into the next re-check.</li>
        </ol>
      </Section>

      <Section id="limits" title="Limitations">
        <ul className="list-disc space-y-1 pl-5">
          <li>Provider rules change. Every guide shows the date it was researched.</li>
          <li>Wait times from developer reports are small samples. We show them as ranges next to what the provider says.</li>
          <li>No setup has been done by a person yet unless a claim says Tested.</li>
          <li>Live guides are a first draft from one agent run. Treat low-confidence guides as a starting point.</li>
        </ul>
        <p>
          <Link href="/">Back to the library</Link>
        </p>
      </Section>
    </article>
  );
}
