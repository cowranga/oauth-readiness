import type { Metadata } from "next";
import Link from "next/link";
import { TierBadge } from "@/components/TierBadge";
import { ATTEMPT_LABEL, ATTEMPT_LEVELS } from "@/lib/guide/attempt";
import type { Tier } from "@/lib/guide/schema";
import { TIERS } from "@/lib/guide/tiers";

export const metadata: Metadata = { title: "About" };

const EVIDENCE = [
  ["Tested", "A person completed the step. The date is noted."],
  ["Probed", "The agent called the provider's endpoint with a fake client ID and recorded the response."],
  ["Sourced", "The linked page states it. The agent opened the page."],
  ["Inferred", "Reasoning from related facts. Check it before you rely on it."],
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
        <h1 className="text-3xl">About</h1>
        <p className="text-muted">
          You can build on Composio&apos;s managed OAuth app today. Before launch, you often need your own OAuth app, and the provider may
          need to review it. These guides show what that takes, so you can start the slow parts early.
        </p>
      </header>

      <Section id="model" title="OAuth app, auth config, connected account">
        <p>
          <strong>OAuth app.</strong> You register one per product in the provider&apos;s developer portal. It holds the client ID, client
          secret, redirect URIs, scopes, and the name users see on the consent screen. The provider reviews the OAuth app, not each user.
        </p>
        <p>
          <strong>Auth config.</strong> Points at one OAuth app: Composio&apos;s managed app or your own.
        </p>
        <p>
          <strong>Connected account.</strong> Created when a user authorizes the OAuth app. The app&apos;s review status decides whether the
          user sees a warning or is blocked.
        </p>
      </Section>

      <Section id="managed" title="Managed vs custom auth">
        <p>
          Composio provides OAuth apps for many toolkits. Users see Composio on the consent screen, quota is shared, and triggers poll at most
          every 15 minutes.
        </p>
        <p>
          Use your own OAuth app for your name on the consent screen, custom scopes, dedicated quota, faster polling, or custom instances. You
          can mix per toolkit.
        </p>
        <p>
          A new auth config applies only to new connections. Existing users keep their connection until they re-authenticate, or until you
          import their credentials where Composio supports it.
        </p>
        <p className="text-sm">
          See{" "}
          <a href="https://docs.composio.dev/docs/custom-app-vs-managed-app" target="_blank" rel="noreferrer noopener">
            Managed vs custom auth
          </a>
          ,{" "}
          <a href="https://docs.composio.dev/toolkits/managed-auth" target="_blank" rel="noreferrer noopener">
            Managed OAuth apps
          </a>
          , and{" "}
          <a href="https://docs.composio.dev/docs/white-labeling-authentication" target="_blank" rel="noreferrer noopener">
            White-labeling authentication
          </a>
          .
        </p>
      </Section>

      <Section id="tiers" title="Tiers">
        <ul className="space-y-2">
          {([1, 2, 3, 4, 5] as Tier[]).map((tier) => (
            <li key={tier} className="flex flex-wrap items-center gap-3 text-sm">
              <TierBadge tier={tier} />
              <span>{TIERS[tier].meaning}</span>
            </li>
          ))}
        </ul>
        <p>
          Scopes decide the tier. Select what your agent needs on a guide to see your tier. <strong>Customer-side gate</strong> means your
          users&apos; admins may need to approve the app.
        </p>
      </Section>

      <Section id="evidence" title="Evidence">
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
        <p>Each guide also shows how far the checks got:</p>
        <ul className="space-y-1 text-sm">
          {ATTEMPT_LEVELS.map((level) => (
            <li key={level}>
              <strong>{ATTEMPT_LABEL[level].label}.</strong> {ATTEMPT_LABEL[level].explain}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="method" title="How guides are made">
        <p>
          <strong>Live guides.</strong> An agent (Claude) searches the docs, opens the pages it cites, probes the OAuth endpoints, and checks
          Composio&apos;s managed apps. Code marks a claim sourced only if the agent opened that page. Live guides are never marked tested.
        </p>
        <p>
          <strong>Verified guides.</strong> One agent wrote each guide from official sources. A second agent, without the first one&apos;s
          notes, checked every tier-deciding claim and fixed errors. Corrections are listed on each guide and in{" "}
          <code className="font-mono text-xs">verification/</code>.
        </p>
        <p>
          <strong>Limits.</strong> No agent signs in, creates accounts, or submits forms. Sign-ins, DNS, legal terms, documents, payments, and
          recordings are marked as yours.
        </p>
      </Section>

      <Section id="scale" title="Roadmap to 100 apps">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Generate guides with the live agent.</li>
          <li>Verify tier-deciding claims with a second agent. Send disagreements to a person.</li>
          <li>Set up the top 20 apps by hand.</li>
          <li>Re-check monthly and flag tier changes.</li>
          <li>Collect &quot;this step was different&quot; reports from developers.</li>
        </ol>
      </Section>

      <Section id="limits" title="Limitations">
        <ul className="list-disc space-y-1 pl-5">
          <li>Provider rules change. Each guide shows its research date.</li>
          <li>Wait times come from few developer reports.</li>
          <li>No claim is tested yet.</li>
          <li>Live guides come from one agent run.</li>
        </ul>
        <p>
          <Link href="/">Back to library</Link>
        </p>
      </Section>
    </article>
  );
}
