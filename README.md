# OAuth Readiness

A guide to getting your OAuth app ready for launch.

- Live app: _link_
- Repository: _link_

## Problem

A developer building an AI agent can start with Composio's managed OAuth app. Before launch, they may need their own app and approval from the provider.

The work is often straightforward. The wait is not. Security audits, partner programs, and customer admin approvals can turn a quick setup into months of waiting.

**OAuth Readiness helps developers understand the path before they build.** Enter an app name or website to get an actionable, shareable guide.

## What you get

Each guide covers:

- **Difficulty:** A tier from 1 (self-serve) to 5 (gated), based on approval requirements.
- **Scope:** Select what your agent needs to do and see how it affects your tier.
- **Time:** Estimated hands-on work and waiting time, shown separately.
- **Requirements:** Checkable steps tagged Agent, You, or Provider.
- **Blockers:** What can go wrong, how to resolve it, and where to get help.
- **Drafts:** Scope justifications, demo scripts, and admin emails.
- **Evidence:** Claims marked Tested, Probed, Sourced, or Inferred, with sources and research dates.

Guides also explain whether a Composio managed app is available and what changes when you switch to your own.

## Scope

The library contains seven verified guides, chosen to cover different approval challenges.

| App | Tier | Main challenge |
|---|---|---|
| Google (Gmail + Calendar) | 4 | Annual third-party security audit |
| Meta | 3 | Business verification and permission reviews |
| Microsoft Outlook | 3 | Customer admin approval |
| LinkedIn | 3 | Restricted API access |
| Slack | 2 | History access rate limits |
| Salesforce | 2 | Installation across customer orgs |
| GitHub | 2 | Organization owner approval |

For other apps, a live agent researches the provider and generates a guide in about a minute.

I chose seven verified guides over 100 unchecked ones. The live agent covers apps outside the library, while the roadmap explains how to expand it safely.

## How it works

1. Enter an app name or website.
2. The agent searches official documentation, opens cited pages, probes OAuth endpoints with a fake client ID, and checks Composio's managed app directory.
3. It generates a guide in a fixed format. Invalid output gets one repair attempt.
4. Code validates the evidence labels. A claim is Sourced only if its page was opened, and Probed only if the URL was actually tested.
5. The guide is saved at a shareable link.

The agent does not sign in, create accounts, or submit forms. Tasks involving credentials, DNS, legal agreements, payments, or recordings remain with the developer.

## Validation

**Verified guides**

A second agent independently checked the tier-deciding claims against their sources.

- 231 claims checked: 179 confirmed, 30 narrowed, 10 corrected, 12 unverified.
- Most issues were overstatements rather than incorrect facts.
- Corrections are documented in each guide and [verification/](verification/).

**Live agent**

See [docs/EVAL.md](docs/EVAL.md).

- Tier matched for 5 of 7 apps and was within one tier for all seven.
- Microsoft and LinkedIn were each rated one tier too easy.
- The agent missed important details about Google's test-user access and Meta's review requirements.

Prompt changes did not fix the tier errors. The verified guides got them right through deeper research and independent checks.

**Edge cases**

See [docs/LIVE_TESTS.md](docs/LIVE_TESTS.md). Websites, ambiguous names, API-key services, apps without public APIs, and invalid inputs were tested. None produced a fabricated guide.

Lessons and resulting changes are documented in [docs/LESSONS.md](docs/LESSONS.md).

No setup has been completed by a person, so no claim is marked Tested.

## Key decisions

- **Verified depth over library size.** Seven checked guides are more useful than 100 unchecked ones.
- **Difficulty reflects waiting.** Customer admin approval is shown separately from provider approval.
- **Work and waiting are separate.** A day of setup followed by six weeks of review is not a one-day task.
- **The hardest required scope sets the tier.** Guides also explain when lighter scopes may work.
- **Evidence is enforced in code.** The agent cannot mark an unopened source as Sourced.
- **Progress is shareable.** No account is needed; progress is saved in the guide link.

## Roadmap

1. Generate guides for additional apps.
2. Independently verify tier-deciding claims and escalate disagreements.
3. Manually validate the 20 most-used apps.
4. Recheck guides monthly.
5. Collect developer reports when actual setup differs from the guide.

Provider requirements change. Four of the seven providers changed their rules in the last 18 months.

## Limitations

- Verified guides have not been tested through complete, human-run setup.
- Live guides are generated in a single agent run and are not independently verified.
- Waiting-time estimates rely on limited developer reports.
- Guides are not rechecked automatically.
- Rate limits are stored in memory per server instance.
- Without Upstash, live guide links do not persist across redeployments.

## Setup

```bash
npm install
cp .env.example .env.local
# Add ANTHROPIC_API_KEY
npm run dev
```

The app runs at `http://localhost:3000`.

- `MOCK_AGENT=1 npm run dev` runs a replay without API calls.
- `npm run generate -- "Notion"` generates a guide from the command line.
- `npm test`, `npm run lint`, `npm run build`, and `npm run check:secrets` run the checks.

**Deployment:** On Vercel, set `ANTHROPIC_API_KEY`. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to persist share links. `GENERATION_DAILY_CAP` defaults to 50, with a limit of five live guides per hour per IP.

**Stack:** Next.js, TypeScript, Tailwind CSS, Zod, and the Anthropic SDK (`claude-sonnet-5-5`).