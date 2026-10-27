# OAuth Readiness

- Live app: _link_
- Repository: _link_

## Problem

A developer building an AI agent can start on Composio's managed OAuth app with no setup. Before launch, they often need their own OAuth app, and the provider may need to review it.

The work is rarely the hard part. The wait is. Review, security audits, partner programs, and customer admins decide whether going live takes an hour or months. Developers usually find out after they build.

**OAuth Readiness tells them on day one.** Enter an app name or website and get a guide you can follow and share.

## What a guide shows

- **Tier.** How hard approval is, from 1 (self-serve) to 5 (gated), decided by what you wait on.
- **Your tier.** Select what your agent does (read, write, act while offline, admin). Scopes decide the tier.
- **Time.** Hands-on hours and waiting days, shown separately. Provider-stated waits appear next to developer reports.
- **Start today.** Whether a Composio managed app exists, and what changes when you switch to your own.
- **Steps and requirements.** Checkable, tagged **Agent**, **You**, or **Provider**. Progress is saved in the link.
- **Blockers.** Cause, fix, and where to get help.
- **Drafts.** Scope justifications, demo video scripts, and admin emails to edit and send.
- **Evidence.** Every claim is marked **Tested**, **Probed**, **Sourced**, or **Inferred**, with its source and date. Open questions are listed.

## Scope

The library has 7 verified guides, each a different challenge:

| App | Tier | Challenge |
|---|---|---|
| Google (Gmail + Calendar) | 4 | Reading or drafting mail requires a yearly third-party security audit. |
| Meta | 3 | Business verification and review per permission. |
| Microsoft Outlook | 3 | By default, the customer's admin must approve mail and calendar access. |
| LinkedIn | 3 | Most APIs an agent needs require an application LinkedIn can refuse. |
| Slack | 2 | No review, but unlisted apps can read history only once a minute. |
| Salesforce | 2 | One app across many customer orgs. Each admin installs it. |
| GitHub | 2 | No review. Org owners decide installs. |

Any other app goes to a live agent. It researches the app and writes the guide in about a minute.

I did not build the 100-app library. 100 unchecked guides would look complete while hiding which claims hold. The live agent covers any app, and the path to 100 is below.

## How it works

1. You enter an app name or website. Verified guides open instantly.
2. An agent (Claude) searches the provider's docs, opens the pages it cites, calls the OAuth endpoints with a fake client ID, and checks Composio's managed app list. Progress streams to the page.
3. The agent submits the guide in a fixed format. Invalid output gets one repair attempt.
4. Code checks the evidence. A claim is **Sourced** only if the agent opened that page. A claim is **Probed** only if a probe hit that URL. Live guides are never marked **Tested**.
5. The guide is saved at a stable link.

The agent never signs in, creates accounts, or submits forms. Sign-ins, DNS, legal terms, documents, payments, and recordings are marked as yours.

## How I checked the guidance

**Verified guides.** One agent wrote each guide from official sources. A second agent, without the first one's notes, checked every tier-deciding claim against its source and looked for a second source.

- 231 claims checked: 179 confirmed, 30 narrowed, 10 corrected, 12 could not be verified.
- Most errors were overstatements, not wrong facts. Example: the Salesforce guide said an unlisted app needs no approval. It works, but Salesforce calls an unreviewed package "not authorized for distribution". The guide now says so.
- Every correction is listed on its guide and in [verification/](verification/).

**Live agent against the verified guides.** See [docs/EVAL.md](docs/EVAL.md).

- The tier matched for 5 of 7 apps and was within one tier for all 7. Both misses were too easy: Microsoft (2, not 3) and LinkedIn (2, not 3).
- The agent missed facts that change an agent builder's plan: Google test users lose access after 7 days, and Meta requires recent API calls before review.
- A revised prompt and a stricter research rule did not fix the two misses. The verified guides have both right, from deeper research and an independent check. Live guides should get a short check pass next.

**Odd inputs.** See [docs/LIVE_TESTS.md](docs/LIVE_TESTS.md). A website, an ambiguous name ("Google"), an API-key service, an app with no public API, and nonsense input all completed. None produced a made-up guide.

**Lessons.** Each error pattern and the change it caused are in [docs/LESSONS.md](docs/LESSONS.md). Rules that matter are enforced in code, not only in the prompt.

**Not tested.** No setup has been done by a person yet, so no claim is marked **Tested**.

## Key decisions

- **A small verified library and a live agent, not 100 guides.** Depth over breadth.
- **Tier reflects what you wait on.** A separate **Customer-side gate** badge shows when your users' admins can block you, even after the provider approves.
- **Work and wait are separate numbers.** "A day of work, then six weeks of waiting" is the key line on a hard guide.
- **"Your tier" uses the hardest scope you need.** Understating difficulty is the worse error. When lighter scopes might do, the guide says so.
- **Evidence rules live in code.** The model cannot cite a page it did not open.
- **Progress lives in the link.** No accounts. Sharing the link shares where the team is.

## Roadmap to 100 apps

1. Generate guides with the live agent.
2. Verify tier-deciding claims with a second agent. Send disagreements to a person.
3. Set up the top 20 apps by hand.
4. Re-check monthly. Provider rules changed for 4 of the 7 apps in the last 18 months.
5. Collect "this step was different" reports from developers.

## Limitations

- No claim is tested by a person yet.
- Live guides come from one agent run and are not verified.
- Wait times come from few developer reports.
- Provider rules change. Each guide shows its research date. Nothing re-checks guides automatically.
- Rate limits are kept in memory per server instance.
- Without Upstash, live guide links do not survive a redeploy.

## Setup

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

- `MOCK_AGENT=1 npm run dev` runs a replayed agent with no API calls.
- `npm run generate -- "Notion"` runs the live agent from the command line.
- `npm test`, `npm run lint`, `npm run build`, and `npm run check:secrets` run the checks.

**Deploy on Vercel.** Set `ANTHROPIC_API_KEY`. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` so share links persist. `GENERATION_DAILY_CAP` (default 50) and a limit of 5 live guides per hour per IP cap spend.

Built with Next.js, TypeScript, Tailwind, zod, and the Anthropic SDK (`claude-sonnet-5-5`).
