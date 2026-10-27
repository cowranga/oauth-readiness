# Architecture

Small, boring, deployable. Pure logic in `lib/`, side effects at the edges (route handlers, tool handlers, store).

## Layout

```
app/
  page.tsx                      home: search, generate input, library grid
  guides/[slug]/page.tsx        guide view (server component)
  generate/page.tsx             live progress view (client component), then redirect
  about/page.tsx                mental model, tiers, evidence legend, method, limits
  api/generate/route.ts         POST {query} -> text/event-stream of AgentEvent
  api/guides/[slug]/route.ts    GET guide JSON; ?format=md returns markdown
components/                     only what pages need; no component library
lib/
  guide/schema.ts               zod schema + types (single source of truth)
  guide/postprocess.ts          deterministic rules from GUIDE_SCHEMA.md
  guide/markdown.ts             guide -> markdown (Copy as Markdown, API ?format=md)
  guide/tiers.ts                tier table, labels, colors
  agent/run.ts                  orchestration: research loop -> synthesis -> validate -> repair once
  agent/prompts.ts              system prompts, exported PROMPT_VERSION
  agent/tools.ts                client tool schemas + handlers
  agent/events.ts               AgentEvent union type
  agent/mock.ts                 MOCK_AGENT replay (fixture events + fixture guide)
  probe/oauth.ts                endpoint probes + interpretation (interpretation is pure, tested)
  net/safeFetch.ts              fetch with timeout, size cap, SSRF guard
  input/normalize.ts            name/URL -> {name, domain, kind}; slugify
  store/index.ts                GuideStore interface + env-based selection
  store/file.ts                 local dev store (.data/guides/*.json)
  store/upstash.ts              Upstash Redis REST via fetch (no SDK)
data/
  guides/<slug>.json            verified seed guides (read-only at runtime)
scripts/
  generate.ts                   CLI wrapper around agent/run.ts
  eval.ts                       generator vs seed comparison -> docs/EVAL.md
  check-secrets.sh
verification/
  <slug>.md                     verification log per seed
  raw/<slug>.v1.json            first-pass guide before verification
  attempts/                     human setup attempt logs (morning)
tests/
```

## Before implementing: verify these in docs (Task 0)

Do not code from memory. Fetch and record findings + URLs in DECISIONS.md:
- Anthropic Messages API: current server-side web search tool type string and options (`max_uses`, domain filters), current web fetch tool if any, `tool_choice` forcing a specific tool, streaming, prompt caching. Start at https://docs.claude.com/en/docs_site_map.md
- Current model IDs. Default `claude-sonnet-5-5` (quality/latency balance); `claude-haiku-5-5` is the cheap option. Make it `GUIDE_MODEL` env.
- Vercel function max duration for route handlers on the Hobby plan; set `export const maxDuration` accordingly and note it in README.
- How to tell if a Composio toolkit has a managed app without an API key (toolkit docs pages, possibly `.md` variants of docs URLs). With `COMPOSIO_API_KEY` set, docs say `GET https://backend.composio.dev/api/v3.1/toolkits/<slug>` with header `x-api-key` lists managed auth schemes. Support both; default to the keyless method.

## Live generation pipeline (`lib/agent/run.ts`)

```
input -> normalize -> [seed match?] -> research loop -> synthesis -> postprocess -> store -> done
```

1. **Normalize.** Accept a name or URL. URL: take hostname, strip `www.`, derive a display name guess. Empty or over 200 chars: reject with a friendly error.
2. **Seed shortcut.** If the input matches a verified seed and the request does not set `fresh: true`, emit a `done` event pointing at the seed (instant). The UI offers "Generate a fresh live guide anyway".
3. **Research loop.** Messages API with tools:
   - Anthropic server-side web search (verified type string).
   - `fetch_page(url)`: our server fetches a page and returns cleaned text.
   - `probe_oauth(input)`: unauthenticated probes (below).
   - `check_composio_managed(appName)`: managed app status.
   Budgets: max 20 tool calls, soft deadline 100s. On budget or deadline, stop researching and synthesize with what we have; the prompt tells the model to lower confidence and list gaps.
4. **Synthesis.** (As built: `claude-sonnet-5-5` rejects forced `tool_choice`, so `submit_guide` is offered with `tool_choice: auto`, the prompt says to call it, and a text-only turn gets one nudge. See DECISIONS.md.) Same conversation, force `tool_choice` to `submit_guide` whose `input_schema` is generated from the zod schema (omit fields the server fills: slug, origin, generatedAt, generator).
5. **Validate.** zod parse. On failure, send the zod issues back once and ask for a corrected `submit_guide`. Second failure: emit `error` with a clear message.
6. **Postprocess.** Deterministic rules from GUIDE_SCHEMA.md.
7. **Persist.** Live slug = `<appslug>-<6 random base36>`; immutable. Store, then emit `done {slug}`.

Every tool call and notable finding emits an `AgentEvent` so the user watches the work:

```ts
type AgentEvent =
  | { type: "status"; message: string }                          // "Identifying the app"
  | { type: "search"; query: string }
  | { type: "read"; url: string; title?: string; ok: boolean }
  | { type: "probe"; target: string; result: string }            // "authorize endpoint live; rejects unknown client (expected)"
  | { type: "finding"; message: string }                         // short, model-written, optional
  | { type: "done"; slug: string; durationMs: number }
  | { type: "error"; message: string; retryable: boolean };
```

Stream as SSE (`data: <json>\n\n`). The client uses `fetch` + `ReadableStream` reader (EventSource cannot POST). Show events as a readable log with an elapsed timer, then navigate to the guide.

Prompt structure (`lib/agent/prompts.ts`): research system prompt derived from `docs/RESEARCH_PLAYBOOK.md` (questions, source hierarchy, evidence rules, probing rules, writing voice), the tier table, and the schema rules. Static parts first so prompt caching applies (verify syntax in docs). Bump `PROMPT_VERSION` on every change and say why in `docs/LESSONS.md`.

## Tools (`lib/agent/tools.ts`)

All network calls go through `lib/net/safeFetch.ts`:
- http/https only; block localhost, private, link-local, and metadata IP ranges (resolve DNS first); max 3 redirects, each re-checked; 10s timeout; 2 MB cap; identify with a clear User-Agent (`OAuthGuideResearchBot/1.0 (+<repo url>)`).

**fetch_page(url)** → `{finalUrl, status, title, text}`. Strip script/style/nav/footer, collapse whitespace, cap text at ~15k chars. Prefer a tiny HTML-to-text approach over heavy deps (ponytail ladder). Return errors as data, never throw into the loop.

**probe_oauth({ domain?, authorizeUrl?, scope? })**, max 3 requests per call:
1. GET `https://<domain>/.well-known/openid-configuration` and `/.well-known/oauth-authorization-server`. If found, extract `authorization_endpoint`, `token_endpoint`, `scopes_supported`, `code_challenge_methods_supported`.
2. If an authorize URL is known: GET it with `response_type=code&client_id=oauth-guide-probe-invalid&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback&state=probe` (+ `scope` if given), `redirect: "manual"`. Record status, `Location` host, any `error` params, and a short body snippet.
3. `interpretProbe()` (pure, unit-tested) turns that into one plain sentence, e.g. "Authorization endpoint is live and rejects an unknown client ID, as expected." Never claim more than the response shows.

**check_composio_managed(appName)** → `{status: "available" | "not_available" | "unknown", url, note}` using the method found in Task 0.

## Storage

```ts
interface GuideStore {
  get(slug: string): Promise<Guide | null>;
  put(guide: Guide): Promise<void>;
  listRecent(limit: number): Promise<Pick<Guide, "slug" | "app" | "verdict" | "generatedAt">[]>;
}
```
Seeds always load from `data/guides/` first. Live guides: Upstash REST if `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set, else the file store in `.data/`. On Vercel without Upstash, generation still streams but the share link may not persist: warn in the UI and README. (`ponytail:` marker.)

## Abuse and cost guard

In-memory per-IP limit (5 generations per hour) + `GENERATION_DAILY_CAP` env (default 50, counted in the store when Upstash is present). Friendly message when hit. `ponytail:` marker for the in-memory part.

## Mock mode

`MOCK_AGENT=1` replays `lib/agent/fixtures/` events with short delays and returns a fixture guide. Used by tests, UI work, and as a fallback demo. Never active in production unless explicitly set.

## Environment (`.env.example`, no real values)

```
ANTHROPIC_API_KEY=
GUIDE_MODEL=claude-sonnet-5-5
COMPOSIO_API_KEY=            # optional
UPSTASH_REDIS_REST_URL=      # optional, needed for persistent share links on Vercel
UPSTASH_REDIS_REST_TOKEN=
GENERATION_DAILY_CAP=50
MOCK_AGENT=0
```

## UI notes

- Server components for guide and about pages; the only client components are the generate flow, copy buttons, filters, use-case chips, and the step checklist (progress in the `?done=` query string, no storage).
- Look and feel: follow `docs/DESIGN.md` (Composio brand: Geist Sans + JetBrains Mono, dark DEV surface, brand blue only for interactive state). Readable at 375px width. Sufficient contrast, visible focus states, semantic headings. Tier dot colors live in `lib/guide/tiers.ts`.
- Evidence badge is a small pill. Click or focus shows the claim, level, source link, retrieved date.
- "Copy as Markdown" uses `lib/guide/markdown.ts` (same output as `?format=md`).
- Print stylesheet hides nav and buttons.
