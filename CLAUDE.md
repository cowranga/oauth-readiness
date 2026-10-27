# CLAUDE.md: OAuth App Setup Guides (Composio APM take-home)

You are building, unattended, a take-home submission for Composio's APM Integrations role. The human is asleep. Your job is to wake them up to a working, honest, well-documented project.

## What we are building (one paragraph)

A web app where a developer types an app name or website (e.g. "Gmail", "https://slack.com") and gets a shareable guide for creating that provider's OAuth app and getting it approved: how hard it is, hands-on time vs waiting time, what triggers review, requirements, ordered steps, blockers and fixes, what an agent can do vs what the developer must do, and exactly which claims are probed, sourced, inferred, or tested. It has (1) a small library of deeply verified seed guides for apps with different setup challenges, and (2) a live agent that researches any app, including ones with no seed guide, and streams its progress while it builds the guide. We do not build a 100-app catalog: the assignment says we do not need all 100 guides, so the live generator is the path to any app, and the README names the 100-app library as the roadmap.

## Read order (before writing any code)

1. `CLAUDE.md` (this file)
2. `docs/ASSIGNMENT.md`: verbatim problem statement + requirement traceability. Every requirement must map to something we ship.
3. `docs/PRODUCT.md`: focused scope, user, product decisions, tiers, use-case chips, 7 seed apps, scaling roadmap.
4. `docs/GUIDE_SCHEMA.md`: the guide data model. Single source of truth.
5. `docs/ARCHITECTURE.md`: stack, layout, pipeline, tools, storage.
6. `docs/CODING_STANDARDS.md`: how we write code (ponytail rules).
7. `docs/DESIGN.md`: Composio's visual language (fonts, colors, layout). Read before any UI work.
8. `TASKS.md`: the ordered work plan with acceptance checks.

Also, when relevant: `docs/RESEARCH_PLAYBOOK.md` (any research about a provider), `docs/VERIFICATION.md` (checking guides), `docs/MORNING_HANDOFF.md` (fill at the end).

Subagents live in `.claude/agents/`: `oauth-researcher`, `claim-verifier`, `code-reviewer`. Use them as TASKS.md says. Run independent research in parallel (max 3 concurrent).

## Operating mode (unattended)

- Do not ask the human questions. They are asleep. When something is ambiguous, pick the option that best serves the reviewer criteria in `docs/ASSIGNMENT.md`, log it in `DECISIONS.md`, and continue.
- Work through `TASKS.md` in order. Tick a task only when its acceptance check passes.
- After every task, append to `PROGRESS.md`: timestamp, what changed, how you verified it, what is next. Keep entries to 3 to 5 lines.
- After any context compaction, restart, or confusion: re-read `CLAUDE.md`, `TASKS.md`, and the last 40 lines of `PROGRESS.md` before acting.
- Commit after every completed task: `git add -A && git commit -m "<type>: <what>"` (feat, fix, docs, test, chore, refactor). Run `npm run check:secrets` first. Never push. Never force anything. Never rewrite history.
- Blocked? Record it under a `## Blocked` heading in `PROGRESS.md` with what you tried, then move to the next unblocked task. Max 3 attempts at the same failure, then change approach or skip.
- Time boxes in `TASKS.md` are guides. If a task runs past 2x its box, ship the simplest working version, mark the cut with a `ponytail:` comment, and move on.
- Do not stop early. Stop only when the Definition of Done is met, or every remaining task is blocked on the human. Either way, finish by writing `docs/MORNING_HANDOFF.md`.

### Log file formats

`DECISIONS.md`, one line each:
```
- 2026-10-28 | <decision> | why: <reason> | rejected: <alternative>
```

`PROGRESS.md`:
```
## <timestamp> Task <id>: <title>
- changed: ...
- verified: <command run + result>
- next: ...
```

## Hard rules (never break)

1. **Credentials.** Never print, log, echo, or commit secrets. Read `ANTHROPIC_API_KEY` (and optional `COMPOSIO_API_KEY`, `UPSTASH_*`) only from env via `.env.local`, which is gitignored. Never `cat` env files. `npm run check:secrets` must pass before every commit.
2. **No accounts, no sign-ins.** Never create accounts, sign in, submit forms, solve CAPTCHAs, or register OAuth apps on any provider. Allowed: unauthenticated GET/HEAD requests, as defined in `docs/RESEARCH_PLAYBOOK.md`.
3. **No fabricated evidence.** Every claim in a guide carries an evidence level. Non-inferred claims need a real URL you actually fetched. Never mark anything `tested`: only the human can, after a real setup attempt. If you cannot support a claim, mark it `inferred` with low confidence, or drop it.
4. **Copyright.** Summarize sources in your own words. Quotes: under 20 words, at most one per source.
5. **API spend.** Cap live generation runs during the night at 30 total. Log each run's model, duration, and token usage in `PROGRESS.md`. Use `MOCK_AGENT=1` for UI and test work.
6. **Depth over breadth.** Two things working end to end (verified seed guides + live generation) beat ten half-done features. No feature outside `TASKS.md` until the Definition of Done is met.
7. **Writing voice** for all user-facing copy, guides, and the README: plain, short sentences, second person, no em dashes, no emojis, no marketing words (seamless, powerful, robust, leverage, unlock, effortless). The README goes out under the human's name.
8. **Don't trust memory for fast-changing facts.** Provider policies, review timelines, Anthropic API tool versions, Composio behavior: look them up and cite them.

## Definition of Done

1. `npm run build`, `npm test`, `npm run lint`, `npm run check:secrets` all pass.
2. Home page: search + submit box + library of the verified seed guides, each marked "verified". Guide pages have working use-case chips, checkable steps with progress in the URL, and the attempt-depth indicator.
3. 7 seed guides (minimum 5; drop order in docs/PRODUCT.md) render from verified JSON in `data/guides/`, each with `verification/<slug>.md`.
4. Live generation works end to end: name or URL in, streamed progress, persisted guide at a stable shareable URL, typically under 2 minutes. It handles apps with no seed guide, ambiguous names, apps without OAuth, and nonsense input without crashing. Results recorded in `docs/LIVE_TESTS.md`.
5. `docs/EVAL.md` compares first-pass generator output against verified seeds, and shows what changed in the prompts because of it.
6. `README.md` complete per the outline in `TASKS.md` (setup, scope and why, key decisions, evidence, limitations).
7. `docs/MORNING_HANDOFF.md` lists exactly what the human must do, in order, with time estimates.

If `ANTHROPIC_API_KEY` is missing: build everything with `MOCK_AGENT=1`, produce seed guides with the `oauth-researcher` subagent directly, skip runs that need the key, and say so plainly in the handoff.

## Stack (fixed, do not relitigate)

- Next.js (App Router) + TypeScript (strict) + Tailwind CSS
- zod (schema, validation, JSON Schema generation)
- `@anthropic-ai/sdk` for the live agent. Default model `claude-sonnet-5-5` via `GUIDE_MODEL` env.
- vitest for tests, eslint for lint
- Storage: file store locally, Upstash Redis REST in production (env-selected)
- Deploy target: Vercel (the human deploys in the morning)
- Node 20+, npm

## Commands (create these in Task 0)

```
npm run dev              # local server
npm run build            # production build
npm test                 # vitest
npm run lint
npm run check:secrets    # fail if anything secret-looking is tracked
npm run generate -- "<app name or url>"   # CLI: run the live agent, write guide JSON
npm run eval             # compare generator output vs verified seeds -> docs/EVAL.md
```
