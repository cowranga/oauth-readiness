# GitHub: research notes

Researcher: oauth-researcher subagent. Retrieved 2026-10-28. About 19 page reads, 3 probes.
Scope: an AI agent product (for example a coding agent that reads repos, opens issues and PRs) where any GitHub user connects their own account.

## Verdict

Tier 2 (Self-serve, optional review). Deciding factor: GitHub does not review apps before strangers can use them. A public GitHub App can be installed and authorized by any GitHub user. The only GitHub-side review is the optional Marketplace listing. The real gate is on the customer side: organization owners control whether your app reaches org repositories.

Confidence: high. The tier claim rests on several official pages (differences page, registering a GitHub App, public vs private, Marketplace requirements).

Customer-side gate: yes. OAuth app access restrictions are on by default for new organizations. GitHub Apps are exempt from that policy, but installing one on an org needs an org owner (or a repo admin, only if the app asks for no org permissions and not Repository administration).

## Findings with sources

### App type choice
- GitHub says GitHub Apps are generally preferred over OAuth apps. OAuth apps are still needed for enterprise-level resources. GitHub Apps are not subject to org application policies. GitHub App access is limited to repos picked at install; OAuth tokens reach everything the user can reach. Installation tokens expire after about 1 hour. Org install needs owner or repo admin. https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps
- Reasons for GitHub Apps: fine-grained permissions (read-only contents vs the write-capable `repo` scope), installer picks repos, short-lived tokens, acts without a user, scaling rate limits, central webhooks. Actions are labeled as the app acting for the user. https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/deciding-when-to-build-a-github-app

### OAuth details
- PKCE: `code_challenge` with `S256` only, "strongly recommended", not required. Device flow must be enabled in settings (else `device_flow_disabled`); device codes expire in 15 minutes. Redirect matching: exact unless wildcard matching is on for that callback URL. Loopback: port may differ; GitHub recommends 127.0.0.1 or ::1 over localhost. Expiring tokens: 8 h access, 6 month refresh; refresh returns a new pair and kills the old one; scopes cannot change on refresh. Limit of 10 tokens per user/app/scope combination (older ones revoked) and 10 tokens created per hour. https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- GitHub App user tokens: web flow (PKCE S256 supported), device flow, or authorize during install. Token access is the overlap of the app's and the user's permissions. 8 h access, 6 month refresh. Expiry can be turned off in optional features; `offline_access` forces expiring tokens. https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app
- Registration: Settings > Developer settings > GitHub Apps > New GitHub App. Name up to 34 chars, unique across GitHub. Up to 10 callback URLs. "Expire user authorization tokens" on by default. Device flow off by default. Webhook "Active" on by default. "Where can this GitHub App be installed?": only this account or any account. Up to 100 GitHub Apps per user or org. https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app
- Callback URL page: up to 10; wildcard matching per URL; apps with a single callback URL before Aug 3, 2026 have wildcard matching on by default. https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/about-the-user-authorization-callback-url
- Scopes: `repo` grants full read and write to public and private repos. No read-only scope for private repo code exists. Users can edit granted scopes, so check `X-OAuth-Scopes`. GitHub Apps do not use scopes. https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps
- Authorization errors: `application_suspended` (contact Support), `redirect_uri_mismatch`, `access_denied`. https://docs.github.com/en/apps/oauth-apps/maintaining-oauth-apps/troubleshooting-authorization-request-errors

### Public vs private, installs, org controls
- Public app: any GitHub user can install and authorize; only public apps can be listed on Marketplace. Private app: only installable on the owning account, only owning org members can authorize. https://docs.github.com/en/apps/creating-github-apps/setting-up-a-github-app/making-a-github-app-public-or-private
- Third-party install: owners install; repo admins can install if the app requests no org permissions and not Repository administration; members and outside collaborators can request; owners can block repo admins. Installer picks all repos or selected repos. https://docs.github.com/en/apps/using-github-apps/installing-a-github-app-from-a-third-party
- OAuth app access restrictions: on by default for new orgs. Members must request owner approval for OAuth apps to reach org resources. Page gives no date for when the default started. https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions
- App access requests: enabled by default; owners can limit who requests; blocking requests from members is public preview, and also blocks repo admin installs. https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/limiting-oauth-app-and-github-app-access-requests

### Rate limits
- User tokens (PAT, OAuth app, GitHub App user token): 5,000/h shared across all of that user's tokens and apps. Installation tokens: 5,000 base, +50 per repo over 20 and per org user over 20, max 12,500; 15,000 on Enterprise Cloud orgs. Secondary: 100 concurrent, ~80 content-creating requests/min and 500/h, 2,000 OAuth token requests/h per app. https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api

### Marketplace
- Anyone can list a free app. Paid plans only for org-owned apps with publisher verification. https://docs.github.com/en/apps/github-marketplace/github-marketplace-overview/about-github-marketplace-for-apps
- Listing requirements: valid privacy policy, support link or email, value beyond authentication, publicly available (not invite-only), Marketplace webhook events for plan changes, Developer Agreement. Paid: 100 installs (GitHub App) or 200 users (OAuth app), verified publisher org, monthly and annual billing. No review timeline stated. https://docs.github.com/en/apps/github-marketplace/creating-apps-for-github-marketplace/requirements-for-listing-an-app

### Recent changes
- Aug 14, 2026 changelog: OAuth apps can register up to 10 redirect URIs; OAuth apps get expiring tokens (8 h / 6 months), on by default for new apps, or via `offline_access`; wildcard redirect matching is now visible and configurable per URI for OAuth apps and GitHub Apps (previously hidden legacy behavior, on for single-URI apps). In GHES 3.23. https://github.blog/changelog/2026-08-14-multiple-redirect-uris-and-token-refresh-for-oauth-apps

### Composio
- GitHub is in the Composio-managed OAuth table. https://docs.composio.dev/toolkits/managed-auth
- Own app reasons: branding on consent, scopes beyond defaults, dedicated rate limit, faster polling. https://docs.composio.dev/docs/custom-app-vs-managed-app
- Switching auth config affects only new connections; existing accounts stay tied to the old config. https://docs.composio.dev/docs/white-labeling-authentication

## Probes (3 requests)
1. GET https://github.com/login/oauth/authorize?client_id=oauth-guide-probe-invalid&redirect_uri=https://example.com/callback&state=probe (sent twice: status, then body). Result: 302 to https://github.com/login?client_id=...&return_to=... A signed-out visitor is sent to sign in first; the bad client ID is not rejected before sign-in.
2. GET https://github.com/settings/apps/new. Result: 302 to /login. The portal needs a signed-in account.

## Versus PRODUCT.md hypotheses
- "No review for either": confirmed. Only the optional Marketplace listing has requirements and a submit step.
- "Marketplace optional": confirmed; paid listings need 100 installs and a verified publisher org.
- "Orgs can restrict OAuth apps": confirmed and stronger: on by default for new orgs. But GitHub Apps are exempt, and their gate is the install step instead.
- Not in hypotheses: Aug 2026 changes (10 redirect URIs and refresh tokens for OAuth apps, wildcard redirect matching exposed and on for old single-URI apps).
- Not in hypotheses: GitHub App user tokens do not get scaling rate limits. Only installation tokens scale.

## Corrections to the v1 generator output
- v1 said PKCE "supported": correct, S256 only.
- v1 cited an openid-configuration 404 probe; not re-run here, so the OIDC claim is dropped.
- v1 missed: 10-callback-URL limit, wildcard matching change, repo admin install rule, access request policies, rate limit split between user and installation tokens, Marketplace requirements.

## Open questions
- Marketplace review timeline: not stated anywhere I read.
- Whether OAuth app access restrictions also default on for orgs inside an enterprise, and how enterprise policies restrict GitHub App installs: not covered by pages read.
- How long org owners take to approve: depends on each customer; no data.
- Exact behavior of the authorize endpoint for a signed-in user with an invalid client ID: not probed (would need sign-in).
