# TASKS

Work top to bottom. Tick `[x]` only when the acceptance check passes. Time boxes are agent wall-clock guides. Update PROGRESS.md after each task, commit after each task.

## Phase 0: Foundations (40 min)

- [x] **0.1 Read everything.** Read all files listed in CLAUDE.md read order. Create `PROGRESS.md`, `DECISIONS.md`. Check whether `ANTHROPIC_API_KEY` is present in `.env.local` without printing it (`grep -q '^ANTHROPIC_API_KEY=.\+' .env.local && echo present || echo missing`). Log the result.
  - Accept: both log files exist; key status logged.
- [x] **0.2 Verify external facts.** Fetch and record in DECISIONS.md with URLs: Anthropic web search tool type string + options, `tool_choice` for forcing a tool, streaming basics, prompt caching syntax, current model IDs; Vercel route max duration on Hobby; keyless way to check Composio managed app status; re-read the two Composio pages linked in docs/ASSIGNMENT.md and note anything that changes docs/PRODUCT.md.
  - Accept: DECISIONS.md has one line per fact with a URL.
- [x] **0.3 Scaffold.** `git init`. Next.js App Router + TypeScript strict + Tailwind + eslint (create-next-app, non-interactive flags). Add zod, @anthropic-ai/sdk, vitest. `.gitignore` covers `.env*` (not `.env.example`), `.data/`. Add `.env.example` from ARCHITECTURE.md. Add `scripts/check-secrets.sh` (fails if tracked files contain `sk-ant-`, `-----BEGIN`, `xox[bpa]-`, `ghp_`, `AKIA`, `client_secret` with a value, or any `.env` file other than `.env.example`). npm scripts from CLAUDE.md (generate and eval can be stubs for now).
  - Accept: `npm run build && npm test && npm run lint && npm run check:secrets` pass. First commit.

## Phase 1: Domain core (45 min)

- [x] **1.1 Schema.** `lib/guide/schema.ts` per docs/GUIDE_SCHEMA.md. `lib/guide/tiers.ts`.
- [x] **1.2 Postprocess.** `lib/guide/postprocess.ts` with all 9 rules, one test each.
- [x] **1.3 Markdown export.** `lib/guide/markdown.ts`. Output readable when pasted into GitHub, Slack, or Notion: title, verdict, next step, time table, requirements as checkboxes, steps, blockers, uncertainties, sources.
- [x] **1.4 Input normalize + slug.** `lib/input/normalize.ts` with tests (names, URLs with paths, `www.`, uppercase, junk, too long, empty).
- [x] **1.5 Fixture guide.** Hand-write one small valid fixture guide (`lib/agent/fixtures/guide.json`, clearly fake app "Example Notes") for mock mode and tests.
  - Accept (phase): tests pass; code-reviewer pass on the phase diff.

## Phase 2: Removed

No 100-app catalog (decision, 2026-10-28). The 7 seeds are the library; the live generator covers everything else. Skip to Phase 3.


## Phase 3: Agent pipeline (100 min)

- [ ] **3.1 Safe fetch.** `lib/net/safeFetch.ts` + SSRF tests.
- [ ] **3.2 Probes.** `lib/probe/oauth.ts`: well-known discovery, invalid-client authorize probe, pure `interpretProbe` with tests from recorded response shapes.
- [ ] **3.3 Tools.** `lib/agent/tools.ts`: `fetch_page`, `probe_oauth`, `check_composio_managed`, `submit_guide` (schema from zod). Errors returned as data.
- [ ] **3.4 Prompts.** `lib/agent/prompts.ts` from docs/RESEARCH_PLAYBOOK.md + tier table + schema rules + voice rules. `PROMPT_VERSION = "v1"`.
- [ ] **3.5 Run loop.** `lib/agent/run.ts` per ARCHITECTURE.md: budgets, deadline, forced synthesis, one repair attempt, postprocess, events via callback. `lib/agent/mock.ts` for `MOCK_AGENT=1`.
- [ ] **3.6 CLI.** `scripts/generate.ts`: `npm run generate -- "<query>" [--out <dir>]` prints events and writes JSON.
  - Accept: `MOCK_AGENT=1 npm run generate -- "Example"` works. With key: `npm run generate -- "Notion"` returns a valid guide in under 3 minutes; log duration and tokens. Inspect the output by reading it: is it actually useful? Fix the prompt if not.

## Phase 4: API and UI (100 min)

- [ ] **4.1 Store.** `lib/store/*` (file + Upstash REST) with file round-trip test.
- [ ] **4.2 API.** `/api/generate` (SSE, rate limit, daily cap, seed shortcut, `fresh` flag, `maxDuration`), `/api/guides/[slug]` (+ `?format=md`).
- [ ] **4.3 Pages.** `/`, `/guides/[slug]`, `/generate`, `/about` per docs/PRODUCT.md section order, ARCHITECTURE.md UI notes, and docs/DESIGN.md (styling time box: 45 min). Must include: use-case chips that highlight scope tiers and show "your tier" (pure function `tierForUseCases` in `lib/guide/tiers.ts`, tested); checkable steps and requirements with progress in the URL (`?done=`), next step = first unchecked step; attempt-depth indicator (pure function `attemptDepth(guide)`, tested); provider-stated vs developer-reported wait shown side by side when both exist. About page content: mental model, managed vs own app, tiers, evidence legend, how guides are made and checked, limitations.
- [ ] **4.4 Route test.** With `MOCK_AGENT=1`, POST to `/api/generate` streams events and ends with `done`.
  - Accept (phase): `npm run build` passes; run `npm run start` with `MOCK_AGENT=1`, curl the SSE endpoint and the md endpoint, fetch each page and confirm 200 + key headings present. If Playwright is quick to add, take screenshots at 375px and 1280px into `docs/screenshots/` and look at them; otherwise skip. code-reviewer pass.

## Phase 5: Seed guides (150 min)

- [ ] **5.1 First pass.** If key present: generate v1 for all 7 seeds → `verification/raw/<slug>.v1.json`.
- [ ] **5.2 Deep research.** Spawn `oauth-researcher` per seed (max 3 at once): google-gmail, meta, microsoft-outlook, salesforce, github, slack, linkedin (this order: hardest and most distinct first, so a short night still gets them). Each writes `verification/notes/<slug>.md` and `data/guides/<slug>.json`.
  - Accept: all seed files pass schema tests; each has drafts relevant to that app (e.g. Google: scope justifications + demo video script); render each guide page and read it top to bottom as the developer would. Fix anything confusing.

## Phase 6: Verification and eval (130 min)

- [ ] **6.1 Verify.** Spawn `claim-verifier` per seed (fresh context, max 3 at once). Apply corrections, add changelog entries, write `verification/<slug>.md`.
- [ ] **6.2 Lessons.** `docs/LESSONS.md`; update prompts, `PROMPT_VERSION = "v2"`.
- [ ] **6.3 Re-run + eval.** If key: generate v2 for 2 seeds; implement `scripts/eval.ts`; write `docs/EVAL.md`.
- [ ] **6.4 Attempt templates.** Blank `verification/attempts/<slug>.md` for github, slack, google-gmail.
  - Accept: every seed has a verification log with counts; EVAL.md exists (or states plainly why it was skipped).

## Phase 7: Live demo hardening (60 min)

- [ ] **7.1** Run the live flow (CLI or route) on these, record results in `docs/LIVE_TESTS.md` (input, duration, tier, did it make sense, issues, fix):
  1. A real app with no seed guide with OAuth (pick one you have not used, e.g. a mid-size SaaS).
  2. A URL input (e.g. `https://www.figma.com`).
  3. An ambiguous name (`Google`): guide should pick the most common agent use (Gmail/Workspace) and say so, or list which Google API it assumed.
  4. An app without OAuth (e.g. an API-key-only service): honest "no OAuth" guide with alternatives.
  5. Nonsense (`Blorpify Zzz`): fails gracefully with a clear message, no fabricated guide.
  6. A consumer app with no public API: says so.
- [ ] **7.2** Fix failures (prompt, budgets, error messages). Make sure a slow run still finishes with lower confidence instead of timing out.
  - Accept: 6 rows in LIVE_TESTS.md, no crashes, no fabricated guides for 5 and 6.

## Phase 8: Docs and handoff (45 min)

- [ ] **8.1 README.md** (short, plain, no em dashes, written as the human):
  1. One paragraph: what it is. Placeholder line for live link and repo link.
  2. The problem in 3 sentences and the core insight (decision first; work vs wait; scopes decide difficulty; start with a managed app while your own app is in review).
  3. Scope and why: open with the focused-scope paragraph from docs/PRODUCT.md (managed app to your own approved app), then what we built, what we cut, and how this scales to 100 (roadmap from PRODUCT.md).
  4. How it works (pipeline in 5 lines; what the agent does vs what a human must do).
  5. Evidence: tiers of evidence, how seeds were verified, links to `verification/`, `docs/EVAL.md`, `docs/LESSONS.md`, `docs/LIVE_TESTS.md`. What we tested vs sourced vs could not verify, honestly.
  6. Key decisions (5 to 8 bullets from DECISIONS.md).
  7. Setup: clone, `npm i`, `.env.local` from `.env.example`, `npm run dev`; mock mode; deploy notes (Vercel + Upstash for persistent links; maxDuration).
  8. Limitations (include harvested `ponytail:` markers) and what I would do next.
- [ ] **8.2** Fill the "Where" column in docs/ASSIGNMENT.md traceability.
- [ ] **8.3** Final code-reviewer pass on the whole repo; apply must-fix items.
- [ ] **8.4** Fill `docs/MORNING_HANDOFF.md`. Final commit.

## Phase 9: Stretch (only if everything above is done)

- [ ] 9.1 Free-text "describe your agent" box that maps to the use-case chips (one small model call).
- [ ] 9.2 Generate guides for up to 2 more apps from the backup list (add them to the seed list if verified, else badge "Live, not verified"). Respect the 30-run nightly cap.
- [ ] 9.3 If `vercel whoami` succeeds and the project is linked, deploy a preview WITHOUT adding secrets (live generation will be off there; note it in the handoff).
