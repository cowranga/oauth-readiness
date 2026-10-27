# Research playbook

Used by (a) the `oauth-researcher` subagent when building seed guides, and (b) the runtime agent's system prompt in `lib/agent/prompts.ts`. Keep the two in sync.

## Goal

For one app, find out what it takes to go from nothing to "any user can connect their account through my OAuth app", how long each part takes, what can block it, and how sure we are. Then express it in the guide schema.

## Questions to answer (in this order; the first 6 decide the tier)

1. **OAuth support.** OAuth 2.0? OIDC? PKCE? OAuth 1.0a? None (API keys / personal tokens only)? If none, say so and stop early with alternatives.
2. **Where to register.** Developer portal URL. Account needed: free, paid plan, business/verified account, org admin rights, partner program?
3. **App types.** Does the provider have more than one kind of app (GitHub App vs OAuth App, single vs multi-tenant, internal vs external)? Which fits an AI agent product whose many users connect their own accounts?
4. **Before review.** Who can connect while the app is unreviewed (only you, listed test users, a user cap, your workspace/org only)? Any limits on unreviewed apps (token lifetime, user cap, warning screens, rate limits)?
5. **What triggers review.** Which scopes, distribution modes, user counts, or listing choices trigger review or audit. Classify scopes into tiers, and tag each tier with the use cases it serves: read, write, offline (refresh tokens / background access), admin. AI agents usually need read + offline, so get those tiers right first.
6. **The review.** What you submit (privacy policy, homepage, domain proof, demo video, security questionnaire, third-party assessment, business verification), who reviews, stated timelines vs what developers report, any cost, renewals.
7. **Token behavior that matters for agents.** Refresh tokens, offline access parameter, expiry, rotation, revocation triggers, per-app rate limits.
8. **Redirect URI rules.** HTTPS required? localhost allowed for dev? Exact match or wildcards? Limits on count?
9. **Customer-side gates.** Can the user's org admin block or require approval? Admin consent? Allowlists?
10. **Common blockers.** Typical rejection reasons, error messages developers hit, and fixes. Where to get help (support form, forum, email).
11. **Composio.** Managed app available? Anything that pushes you to your own app sooner (custom scopes, branding, quotas)?
12. **Recent changes.** Policy changes, deprecations, new review rules in the last 18 months. Note dates.

## Source hierarchy

1. Official developer docs and policy pages of the provider.
2. Official changelogs, blogs, status pages, staff answers on official forums.
3. Composio docs (for managed app facts only).
4. Reputable community sources (Stack Overflow answers with votes, GitHub issues, engineering blogs): only for "in practice" claims like real review times or undocumented rejections. Label as community.
5. Never: content farms, SEO listicles, AI-generated summaries, outdated mirrors.

Prefer the most recent page. If official sources conflict, say so in `uncertainties` and cite both.

## Evidence rules

- One claim, one evidence item. Make claims specific ("Restricted scopes require a security assessment by an approved assessor") not vague ("Google is strict").
- Timelines: separate "the provider says" from "developers report". Always ranges. If unknown, `max: null` and an uncertainty entry.
- `sourced` only if you fetched the page and it supports the claim. Not from a search snippet alone: open the page.
- `probed` only for what a probe response actually showed.
- `inferred` when reasoning across facts; put the reasoning in `note`.
- Never `tested`.
- Record `retrievedAt` (today's date).
- If two search angles fail to answer a tier-deciding question, stop, mark it uncertain, and lower confidence. Do not guess to fill the schema.

## Probing rules ("attempt as much setup as practical", safely)

Allowed (no account needed):
- GET well-known OIDC / OAuth metadata documents.
- GET the authorization endpoint with an obviously invalid client ID, no redirect follow, to confirm the endpoint is live and see its error behavior.
- GET/HEAD the developer portal URL to confirm it exists and whether it needs sign-in.
- Read public docs, policy pages, forum threads.

Forbidden:
- Creating accounts, signing in, submitting any form, using real client IDs, POSTing to token endpoints, anything that looks like credential stuffing, scraping behind logins, bypassing rate limits or bot checks. Max 3 probe requests per app per run.

What the agent then does for the developer: drafts the submission materials (scope justification per sensitive scope, app description, demo video shot list, privacy policy checklist, a short email to provider support for unclear points) as `drafts`, clearly marked as drafts to edit.

## Writing rules for guide text

- Second person, plain words, short sentences. No em dashes, no emojis, no hype.
- Define a term the first time in a few words ("restricted scope: a permission Google treats as high risk").
- The verdict summary names the one factor that decides the tier.
- Each step is doable without guessing: where to click or what URL, what to enter, what you should see after.
- Every blocker has a fix or an escalation path.

## Stop criteria

Stop researching when questions 1 to 6 have sourced or probed answers (or are explicitly uncertain), and 7 to 12 have at least a best-effort answer. Seed research budget: about 25 page reads. Live runtime budget: 20 tool calls, about 100 seconds.

## Output (researcher subagent)

1. A short notes file `verification/notes/<slug>.md`: findings with URLs, open questions.
2. The guide JSON `data/guides/<slug>.json` (seed) matching the schema, with `origin: "verified_seed"` and `changelog: []` (verification fills it).
