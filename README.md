# OAuth Readiness

Type an app your AI agent needs to connect to, such as Gmail or https://slack.com, and get a guide you can share. It tells you how hard it is to get that provider's OAuth app approved, how much is hands-on work and how much is waiting, what triggers review, what can block you, what an agent can do for you, and how sure we are about each claim. Seven apps have verified guides. For any other app, an agent researches it live and streams its progress while it writes the guide.

- Live demo: _add link_
- Repository: _add link_

## The problem, and the insight

Before launch, a developer building an AI agent often needs their own OAuth app with each provider, and it may need review. It is hard to tell up front whether that takes an hour or months, what the provider will ask for, or what will block it. The answer usually turns up too late, after the product is built.

What I learned while building this:
- **Lead with the decision.** The developer's real question is "can I ship with this, how long, and what blocks me?", not "which buttons do I click?".
- **Work and waiting are different numbers.** "A day of work, then 6 weeks of waiting" is the most useful sentence on a hard guide, because you can do the waiting in parallel.
- **Scopes decide the difficulty, and agents ask for the hard ones.** The same provider can be self-serve or need a paid security audit, depending on what you request. Reading mail, history, or posts, and working while the user is offline, are exactly what agents need and what providers guard most.
- **Start on a managed app, apply for your own early.** You can build today on Composio's managed OAuth app and start the slow review in parallel.

## Scope and why

**We help a developer get from Composio's managed OAuth app to their own approved OAuth app before launch.** Composio users can start building on managed apps with no registration and no review. The pain arrives at go-live, when they need their own app (their brand on the consent screen, custom scopes, their own quota) and discover it needs review, an audit, a partner application, or their customers' admins to approve it. That is when "an hour or weeks of waiting?" is decided, and nobody tells them early. If we tell them on day one, they can start the slow parts while they build, or ask for less to avoid them.

**What I built**
- A guide format that leads with a tier (1 to 5, decided by what you wait on), a one-sentence verdict naming the deciding factor, and your next step.
- Use-case chips (read, write, act while offline, admin). The guide shows your tier for what your agent actually needs, and marks the scopes that drive it.
- Checkable steps and requirements, each tagged agent, you, or provider. Progress is stored in the link (`?done=s1,s4`), so sharing the link shares where the team is. Copy as Markdown and print work too.
- An evidence badge on every claim (tested, probed, sourced, inferred), plus an attempt-depth indicator and a "What we don't know" section.
- Seven verified guides chosen for different challenges: GitHub (pick the right app type; org owners gate), Slack (works anywhere but rate limited unless listed), Google (restricted scopes and a paid yearly audit), Meta (business verification and per-permission review), Microsoft (your customer's admin is the gate), Salesforce (one app, many customer orgs), LinkedIn (a partner gate on the APIs agents want).
- A live agent that researches any other app in about a minute.

**What I cut**
- The 100-app library. The assignment says it is not required, and 100 unverified guides would look complete while hiding which claims hold. The live generator covers any app instead.
- Accounts, editing guides in the UI, automated form filling on provider portals, and scheduled re-checks.

**How this gets to 100**
1. Generate all 100 with the live agent, about a minute and a few cents each.
2. Verify only the tier-deciding claims with an independent checker agent, and send disagreements to a person.
3. Have a person set up the top 20 apps by usage, so those reach "Set up by a person".
4. Re-check monthly, because policies change (four of the seven seeds had changes in 2025 or 2026). Diff each run against the stored guide and flag tier changes for review.
5. Let developers report "this step was different for me" and feed that into the next re-check.

## How it works

1. **Normalize** the input (name or URL). Verified apps open instantly; anything else goes to the agent.
2. **Research** with Claude (`claude-sonnet-5-5`): web search, opening pages, unauthenticated OAuth probes (discovery document, the authorize endpoint with a fake client ID, the developer portal), and a check of Composio's managed-app list. Up to 20 tool calls, with an 80-second research budget.
3. **Write** the guide through a `submit_guide` tool whose schema comes from the same zod schema the app uses. If it does not validate, the agent gets one repair turn.
4. **Check it in code:** a claim can only be "sourced" if the agent opened that page during the run, and only "probed" if a probe hit that URL. Probes the agent forgot to cite are added. Deterministic rules fix ranges, stages, labels, and confidence.
5. **Save** the guide at a stable link and stream progress to the browser the whole time.

**What the agent does, and what you must do.** The agent researches, probes, and drafts the paperwork (scope justifications, demo video scripts, privacy policy checklists, emails to customer admins). It never signs in, creates accounts, or submits forms. Sign-ins, 2FA, DNS, legal acceptance, business documents, payments, and recordings are tagged as yours.

## Evidence: what is tested, sourced, and uncertain

- **Tested:** nothing yet. Only a person can mark a claim tested, after a real setup attempt. Templates are ready in `verification/attempts/` for GitHub, Slack, and Google.
- **Probed:** each seed has 2 or 3 live probe results (for example, Google's authorize endpoint rejecting an unknown client with `invalid_client`).
- **Sourced:** most claims, each linked to the official page it came from, and opened during research.
- **Inferred:** marked with a dashed badge and the reasoning. Mostly real-world wait times, where no source measures them.

**How the seeds were checked.** A research agent wrote each seed from official sources. A second agent, with no access to the first one's notes, re-checked every tier-deciding claim against its cited page, looked for a second source, and fixed what was wrong. Across the 7 seeds it checked 231 claims: 179 confirmed, 30 narrowed (overstated, made more precise), 10 corrected, 12 it could not verify, none removed. Most fixes were overstatements, not wrong facts. For example, the Salesforce guide said an unlisted app needs no approval; it works in practice, but Salesforce calls an unreviewed package "not authorized for distribution", and the guide now says so. Every change is listed at the bottom of each guide and in `verification/<slug>.md`.

- What verification and the eval taught us, and how the prompt changed: [docs/LESSONS.md](docs/LESSONS.md)
- Live generator against the verified seeds: [docs/EVAL.md](docs/EVAL.md). The tier was exact for 5 of 7 and within one for all 7; both misses were too easy. Prompt v2 is written but not yet measured.
- Live runs on odd inputs: [docs/LIVE_TESTS.md](docs/LIVE_TESTS.md). Two of six ran before the API account ran out of credits.

**What we could not verify:** real review times (developer reports are few, and some forum pages would not load), CASA assessment prices (vendor pages only), and how long your customers' admins take to approve an app. Each guide lists its own open questions.

## Key decisions

- **A small verified library plus a live generator, not 100 guides.** Depth over breadth, and honest about which claims hold. (DECISIONS.md has the full log.)
- **Tiers are decided by what you wait on,** with a separate customer-side gate badge, because an admin approval blocks real deals even when the provider approves.
- **Hands-on and waiting time shown separately, and provider-stated waits next to developer reports,** never blended into one number.
- **"Your tier" is the hardest scope tier matching what your agent needs.** I first used the easiest scope per need, but on Google that hid that reading mail needs an audit. Understating is the worse error, so the guide shows the hardest case and mentions the lighter option.
- **Evidence rules enforced in code, not just in the prompt.** A live guide cannot cite a page the agent did not open, and can never claim "tested".
- **No forced tool choice.** Claude Sonnet 5.5 rejects forced `tool_choice`, so the agent is told to call `submit_guide` and nudged once if it does not.
- **Progress lives in the URL,** so there are no accounts and a shared link shows where the team is.

## Setup

```bash
git clone <repo-url> && cd <repo>
npm install
cp .env.example .env.local     # add ANTHROPIC_API_KEY
npm run dev                    # http://localhost:3000
```

- **Mock mode:** `MOCK_AGENT=1 npm run dev` replays a fake run with no API calls. Tests use it too.
- **CLI:** `npm run generate -- "Notion"` runs the live agent and writes the guide JSON to `.data/cli/`.
- **Checks:** `npm test`, `npm run lint`, `npm run build`, `npm run check:secrets`.
- **Eval:** `npm run eval` rewrites the table in docs/EVAL.md. `bash scripts/live-tests.sh` runs the remaining live tests and the v2 re-runs.

**Deploying to Vercel.** Set `ANTHROPIC_API_KEY`. For share links that survive, add an Upstash Redis database and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Without them, live guides go to the instance's temporary disk and the UI warns that the link may expire. `/api/generate` sets `maxDuration = 300`, the Hobby plan maximum with Fluid compute. Runs take about a minute, and the agent stops itself at 250 seconds. `GENERATION_DAILY_CAP` (default 50) and a per-IP limit of 5 per hour cap spend.

## Limitations

- No human setup attempts yet, so nothing is "tested".
- Live guides come from one agent run and are not checked by a person. They say so at the top.
- Prompt v2 is unmeasured (API credits ran out). LIVE_TESTS has 2 of 6 rows filled.
- Wait times rest on few developer reports; guides show them as ranges and mark estimates.
- Provider rules change often. Each guide shows its research date, and nothing re-checks them automatically.
- Shortcuts in the code, each marked with a `ponytail:` comment and its upgrade path:
  - The rate limit is in memory and per instance: move it to Upstash INCR with a TTL.
  - The rate limit trusts `x-forwarded-for` as Vercel sets it: use the platform's client IP elsewhere.
  - The SSRF guard checks DNS, then fetch resolves again (a rebinding window): pin the checked IP.
  - HTML to text is regex-based: use a readability pass if pages read badly.
  - The Composio managed-app list is cached per instance: cache it in the store with a daily TTL.
  - The Upstash `put` makes three requests that can half-succeed: use `/multi-exec`.
  - The file store counts daily generations in memory: fine locally, Upstash counts in production.
  - On Vercel without Upstash, live guides do not persist: set the Upstash variables.
  - Domain-to-name guessing uses a tiny second-level-domain list: use the Public Suffix List.

**What I would do next:** run the human setup attempts on GitHub, Slack, and Google; measure prompt v2; add a second, narrow research pass that only answers the agent-critical checks; and add monthly re-checks that diff against the stored guides.
