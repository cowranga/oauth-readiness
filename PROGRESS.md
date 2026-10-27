# Progress

## 2026-10-27T20:21Z Task 0.1: Read everything
- changed: read CLAUDE.md and every doc in read order plus TASKS.md; created PROGRESS.md and DECISIONS.md.
- verified: `grep -q '^ANTHROPIC_API_KEY=.\+' .env.local` -> present. COMPOSIO_API_KEY and UPSTASH_* unset. `.claude/agents/` does not exist.
- next: Task 0.2 verify external facts.

## 2026-10-27T20:40Z Task 0.2: Verify external facts
- changed: DECISIONS.md has 12 fact lines with URLs (web search tool, tool_choice 400 on Sonnet 5.5, models, caching, streaming, Vercel 300s, Composio keyless managed check, brand).
- verified: fetched each page; curl'd managed-auth.md and confirmed all 7 seed providers are in the managed table.
- next: Task 0.3 scaffold. Big change from ARCHITECTURE.md: no forced tool_choice on Sonnet 5.5.

## 2026-10-27T21:00Z Task 0.3: Scaffold
- changed: Next 16.4 App Router + TS strict (noUncheckedIndexedAccess) + Tailwind 4 + eslint; zod 4, @anthropic-ai/sdk 1.3, geist, vitest 5, tsx; brand tokens in globals.css; layout with top bar/footer; check-secrets.sh; .env.example; .claude/agents/*.
- verified: `npm run build`, `npm test` (1 pass), `npm run lint`, `tsc --noEmit`, `npm run check:secrets` all pass; planted fake key made check-secrets exit 1.
- next: Phase 1 domain core (schema, tiers, postprocess).

## 2026-10-27T21:25Z Tasks 1.1 to 1.5: Domain core
- changed: lib/guide/{schema,tiers,attempt,postprocess,markdown}.ts, lib/input/normalize.ts, fixture guide "Example Notes", scripts/validate-guide.ts (schema + voice checks for subagents).
- verified: `npm test` 28 pass (one test per postprocess rule, normalize cases, tierForUseCases, attemptDepth, markdown snapshot); lint and tsc clean.
- next: code-reviewer on cf9f12a..HEAD (running), then Phase 3 safeFetch.

## 2026-10-27T22:10Z Tasks 3.1 to 3.6: Agent pipeline
- changed: lib/net/safeFetch.ts (SSRF guard), lib/probe/oauth.ts (probes + pure interpretProbe from recorded Google/GitHub/Microsoft/LinkedIn shapes), lib/agent/{tools,audit,prompts,run,mock,generate}.ts, lib/composio/managed.ts (keyless managed-auth parse), scripts/generate.ts.
- verified: `npm test` 82 pass; `MOCK_AGENT=1 npm run generate -- "Example"` writes a guide in 1.2s; live `npm run generate -- "Notion"` valid guide, tier 2, read and judged useful.
- live runs so far: 2/30.
  - run 1 (accidental, nonsense "Blorpify Zzz <pid> !!"): claude-sonnet-5-5, NOT_FOUND handled, clean error; tokens not captured (fixed: usage now attached to AgentError).
  - run 2 "Notion": claude-sonnet-5-5, 43.4s, in=40209 out=5251 cacheRead=45250 cacheWrite=20427, 1 web search, 7 tool calls.
- fixes from reading the Notion output: probe findings now always recorded as probed evidence; portal probe no longer claims "loads without sign-in" for client-side apps.
- next: Phase 4 store, API, pages.

## 2026-10-27T22:40Z Task 5.1 (started early, parallel with Phase 4): First-pass v1 guides
- changed: verification/raw/<slug>.v1.json for all 7 seeds (prompt v1, claude-sonnet-5-5).
- verified: all 7 runs produced schema-valid guides. Live runs now 9/30.
  - google-gmail "Gmail": 63.3s, tier 4, in=17688 out=7855 cacheRead=36200 cacheWrite=20487, 1 search
  - meta "Meta": 60.2s, tier 3, in=20241 out=7838 cacheRead=36200 cacheWrite=20521, 1 search
  - microsoft-outlook: 45.5s, tier 2, in=22535 out=6477 cacheRead=27150, 0 searches
  - github: 50.1s, tier 2, in=24901 out=6609 cacheRead=27150, 0 searches
  - slack: 64.6s, tier 2, in=79464 out=8487 cacheRead=45250 cacheWrite=18675, 1 search
  - salesforce: 67.5s, tier 2 (low confidence), in=24660 out=8201 cacheRead=45732 cacheWrite=18933, 2 searches
  - linkedin: 67.6s, tier 2, in=30121 out=11244 cacheRead=36200, 0 searches
- next: oauth-researcher subagents (google-gmail, meta, microsoft-outlook running), finish Phase 4 pages meanwhile.

## 2026-10-27T23:30Z Tasks 4.1 to 4.4: Store, API, pages, route test
- changed: lib/store (file + Upstash REST + seeds loader), /api/generate (SSE, per-IP limit, daily cap, seed shortcut, maxDuration 300), /api/guides/[slug] (+ ?format=md), pages /, /guides/[slug], /generate, /about, not-found; components for tier/evidence/owner/attempt-depth/copy/interactive guide; lib/guide/progress.ts (URL state, tested).
- verified: `npm test` 104 pass incl. mock route stream ending in done; `npm run build` ok; `MOCK_AGENT=1 npm run start` + curl: all pages 200, unknown slug 404, SSE ends with done, md endpoint ok; Playwright (cached browser): checking a step sets ?done=s1, chip sets ?use=, tier updates, home -> generate -> guide flow works; screenshots in docs/screenshots at 375 and 1280.
- fixes found by looking: global link color overrode nav utilities (scoped to class-less links), sidebar tier now captioned as "your tier for <chips>", generate timer no longer renders Date.now() on the server (intermittent hydration warning).
- next: Phase 4 code review; Phase 5 research agents running (google-gmail, meta, microsoft-outlook).

## 2026-10-28T01:30Z Tasks 5.1 to 5.2: Seed guides
- changed: data/guides/{google-gmail,meta,microsoft-outlook,salesforce,github,slack,linkedin}.json and verification/notes/*.md from oauth-researcher subagents (max 3 at once, hardest first).
- verified: validate-guide prints ok for all 7 (28 to 44 evidence items each, nothing tested); `npm test` 115 pass incl. per-seed schema tests; all 7 pages render with no console errors and no overflow at 375px; read Slack and Google guides top to bottom.
- tiers: Google 4, Meta 3, Microsoft 3 (+gate), LinkedIn 3, Slack 2 (read+write chips show 3), Salesforce 2 (+gate), GitHub 2 (+gate).
- note: the Salesforce researcher read JS-only official docs through the human's Chrome tab (read-only); later briefs forbid the browser extension.
- next: claim-verifier runs (Google done; Meta, Microsoft, GitHub running), then Slack, Salesforce, LinkedIn.

## Blocked
- 2026-10-28T02:10Z: ANTHROPIC_API_KEY returns HTTP 400 "Your credit balance is too low to access the Anthropic API" (request req_011CgTRcv84JWWC92askrVLs). Tried: two v2 runs (0 tokens used) and a count_tokens call. Blocks: Task 6.3 v2 re-runs and Task 7.1 live tests. Needs the human to add credits. Everything else continues; the remaining live runs are scripted in scripts/live-tests.sh.
- Live runs used: 9 successful + 1 accidental nonsense run + 2 failed at 0 tokens = 12 attempts, under the 30 cap.
