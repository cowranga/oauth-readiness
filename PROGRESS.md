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
