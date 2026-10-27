# Coding standards

Ponytail-style minimalism plus ordinary clean code. The best code is the code you did not write, but never at the cost of correctness, security, or the user's trust.

(If the human installed the Ponytail plugin for Claude Code, its rules and `/ponytail-review` apply too. Install, optional: `/plugin marketplace add DietrichGebert/ponytail` then `/plugin install ponytail@ponytail`. These standards work without it.)

## The ladder (walk it before writing any code)

1. Does this need to exist at all for the Definition of Done? If not, skip it.
2. Can the platform do it? (Web APIs, `fetch`, `URL`, `AbortController`, `structuredClone`, Next.js features, HTML elements like `<details>` and `<dialog>`, CSS.)
3. Can an already-installed dependency do it?
4. Can it be one line?
5. Only then: the minimum custom code that works.

Adding a dependency needs a line in DECISIONS.md: what it replaces and why the ladder did not stop earlier. Expected deps: next, react, typescript, tailwind, zod, @anthropic-ai/sdk, geist (font), vitest, eslint. Anything else must earn its place.

## The `ponytail:` marker

Every deliberate shortcut gets a one-line comment naming its upgrade path, so "later" is a ledger and not amnesia:

```ts
// ponytail: in-memory rate limit, resets on cold start -> move counter to Upstash INCR with TTL
```

Before the final commit, harvest all markers (`grep -rn "ponytail:" app lib scripts`) into the README Limitations section.

## Never cut (this is not bloat)

- Input validation at boundaries (API input, tool input, model output via zod).
- Errors the user sees: clear message, what to do next.
- Security: SSRF guard, secret handling, no secrets in logs or client bundles.
- Basic accessibility: semantic HTML, labels, focus states, contrast.
- Tests for pure logic.

## Clean code

- Names say what things are. No abbreviations except well-known ones (url, id, api).
- Functions do one thing. Prefer under 40 lines. Files prefer under 200 lines; split by responsibility, not by layer ceremony.
- Pure core, thin edges: parsing, postprocessing, probe interpretation, markdown export, tier logic, normalization are pure and unit-tested. Network, model calls, storage live at the edges.
- One source of truth: the zod schema drives types, JSON Schema for the model, and seed validation. Tier labels live only in `lib/guide/tiers.ts`.
- No abstraction until the third use. No generic "service" or "manager" classes. No dependency injection frameworks.
- No dead code, no commented-out code, no TODO without a `ponytail:` upgrade path.
- Comments explain why, not what.
- TypeScript: `strict`, `noUncheckedIndexedAccess`. No `any`; use `unknown` and narrow. Explicit return types on exported functions.
- Errors: throw typed errors inside `lib/`, catch at route handlers and the agent loop, and turn them into user-facing messages or `error` events. Tool handlers return errors as data so the model can recover.
- Config from env in one module (`lib/env.ts`), validated with zod at startup, with safe defaults.

## Tests

- vitest. Test: schema validation of every seed file, postprocess rules (one test per rule), normalize/slug, `interpretProbe` cases, markdown export snapshot of one seed, file store round trip, SSRF guard (blocks localhost and private IPs), mock-agent route stream emits `done`.
- Do not test React rendering details. Do not hit the network in tests.

## Review loop

At the end of each phase in TASKS.md, run the `code-reviewer` subagent on the phase's diff (`git diff <phase-start>..HEAD`). Apply its must-fix items. Log skipped suggestions with a reason in DECISIONS.md. Do not let the same agent that wrote code approve its own deletion list in the same step.

## Git

Small commits, conventional messages, one logical change each. Never commit `.env*` (except `.env.example`), `.data/`, `node_modules/`, or anything matching the secret patterns in `scripts/check-secrets.sh`.
