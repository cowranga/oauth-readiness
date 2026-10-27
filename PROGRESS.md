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
