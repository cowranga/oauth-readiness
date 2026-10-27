# Slack: research notes

Researcher: oauth-researcher subagent. Retrieved 2026-10-28. About 21 page reads, 2 probes.
Scope: an AI agent product (reads channel history, summarizes threads, posts replies) that any Slack workspace can install.

## Verdict

Tier 2 (Self-serve, optional review). Deciding factor: no Slack review is needed for any workspace to install an unlisted app once public distribution is on, but new installs of unlisted apps get 1 request a minute and 15 messages per call on conversations.history and conversations.replies. For a thread-reading agent, that makes a Marketplace listing the practical requirement for production. The guide expresses this through scope tiers: "Read history and threads on demand at full speed" is `review`, so the default read+write chips show tier 3, while an events-first design stays at no review.

Confidence: high on the rules (official docs and changelog). Low on real-world Marketplace wait times.

## Findings with sources

### OAuth and tokens
- OAuth v2 at slack.com/oauth/v2/authorize. redirect_uri must be HTTPS, match or sit under a configured Redirect URL, no `#`, same value in both steps (else bad_redirect_uri). Codes expire in 10 minutes. Tokens do not expire without rotation. Scopes are additive. scope_not_allowed_on_enterprise for some scopes on org installs. No localhost rule stated. https://docs.slack.dev/authentication/installing-with-oauth/
- Token rotation: 12-hour access tokens, single-use refresh tokens, cannot be turned off once on, max 2 active tokens. https://docs.slack.dev/authentication/using-token-rotation/
- PKCE GA March 30, 2026. Enabling it makes the app a public client (one-way). PKCE refresh tokens expire after 30 days. Desktop redirects cannot request bot scopes. https://docs.slack.dev/changelog/2026/03/30/pkce/
- Optional scopes released March 16, 2026 (changelog index). https://docs.slack.dev/changelog/

### Distribution and customer-side gates
- Activate Public Distribution under Manage Distribution after the checklist. Any workspace can then install, unless it limits installs to admins, to Marketplace apps, or requires approval. SSL required for redirect, events, interactivity URLs. Unlisted distribution is for pilots and early customers. Auto-uninstall when the installing user leaves, for apps with scopes beyond bot/commands/webhook/identify. https://docs.slack.dev/app-management/distribution/
- Workspace owners can require approved apps (Admin > Apps and workflows > App management settings). Members request; owners or app managers approve; automation rules possible. On Enterprise Grid an org policy turns approval on automatically. https://slack.com/help/articles/222386767-Manage-app-approval-for-your-workspace
- Org-ready apps: add a bot scope, opt in under Org Level Apps (org_deploy_enabled), Org Admin approves via DM and installs, then picks workspaces. https://docs.slack.dev/enterprise/developing-for-enterprise-orgs/

### Rate limit change (May 29, 2025)
https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps/
- conversations.history and conversations.replies move from Tier 3 to Tier 1 (1 per minute), limit max/default 15, for commercially distributed apps not approved for the Marketplace. Applies immediately to new unlisted apps and new installs of existing unlisted apps.
- Marketplace apps unaffected. Internal customer-built apps keep 50+ per minute and 1,000 objects.
- Existing installs of unlisted apps: the page (current text, retrieved today) says not affected.
- FAQ: the API terms now name the Marketplace as the only appropriate channel for commercial distribution, unlisted or templated custom apps included. Stated reason is preventing bulk exfiltration by unvetted apps.
- The per-method page for conversations.history still shows Tier 3 without a note about unlisted apps. https://docs.slack.dev/reference/methods/conversations.history/
- Rate limit tier definitions: https://docs.slack.dev/apis/web-api/rate-limits/

### Marketplace
- Guidelines: unsuitable if under 10 active workspaces and under 10 WAU. Enhanced review for `*:history`, files:read, search:read.*, canvases:read, admin.* and others. Restricted scopes (search:read, admin.*, identity.*) generally rejected. No LLM training on Slack data. AI disclosures required (model, retention, residency, inaccuracy). Agent container apps: disclose paid plan need, work on free plans, do not store Slack data (zero-copy). Listing assets, privacy policy, support within 2 business days, TLS 1.2+. https://docs.slack.dev/slack-marketplace/slack-marketplace-app-guidelines-and-requirements/
- Review guide: preliminary feedback up to 10 business days; functional review up to 10 weeks (new) or 6 weeks (updates); preliminary resubmits reset queue place; no expediting. Reviewers install in their own workspace. https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide/
- Since July 2026 the 10-install minimum is back (after a temporary lower threshold from August 2025) and must hold for the whole review. https://docs.slack.dev/changelog/2026/09/01/slack-marketplace-install-requirement/

### Terms on AI and data
- API Terms, effective 10 October 2025: no training an LLM on API data; no bulk export without a separate agreement; no persistent copies or indexes of other organizations' data for Data Access / Real-time Search APIs; no background collection unrelated to user queries. https://slack.com/terms-of-service/api
- Feb 17, 2026: Slack MCP server and Real-time Search API (evolved from the Data Access API). https://docs.slack.dev/changelog/2026/02/17/slack-mcp

### Agent features
- assistant:write: bot scope, assistant.threads.setStatus / setSuggestedPrompts / setTitle. https://docs.slack.dev/reference/scopes/assistant.write/ The page does not mention the Agents & AI Apps toggle; the toggle and paid-plan requirement come from the Marketplace guidelines and search results, so the guide only claims the paid-plan disclosure rule.
- channels:history: public channels the app was added to; covers conversations.history, conversations.replies, and message events. https://docs.slack.dev/reference/scopes/channels.history/

### Composio
- Slack and Slackbot listed under managed OAuth. https://docs.composio.dev/toolkits/managed-auth
- Switching auth config affects only new connections. https://docs.composio.dev/docs/white-labeling-authentication
- Reasons to bring your own app: branding, custom scopes, dedicated quota, polling speed. https://docs.composio.dev/docs/custom-app-vs-managed-app

### Probes
1. GET https://slack.com/oauth/v2/authorize?client_id=oauth-guide-probe-invalid&scope=chat:write&redirect_uri=https://example.com/callback : HTTP 200, ~4 KB page whose script redirects to the same URL with tracked=1. Not followed; no error text seen.
2. GET https://api.slack.com/apps : HTTP 200, title "Slack API: Applications", asks you to sign in to create an application.

## Contradictions with PRODUCT.md hypotheses
- Hypothesis "rate-limit rules may treat non-Marketplace commercial apps differently": confirmed and sharper than stated. 1 request a minute and 15 messages, for new installs since May 29, 2025. Internal apps are exempt.
- "Marketplace listing is optional": technically yes, but the API terms call the Marketplace the only appropriate channel for commercial distribution, and the Marketplace now has a hard 10-active-workspace gate before you can even submit, with up to about 12 weeks of stated review.
- v1 generator said "no PKCE": wrong as of March 30, 2026. v1 also cited the rate-limit fact as `inferred` while the page directly supports it.

## Open questions
- Existing unlisted installs: Slack says unaffected; a community article (https://dev.to/helen_mireille_47b02db70c/slack-just-throttled-your-openclaw-agent-you-probably-havent-noticed-yet-d4) claims March 3, 2026 enforcement with no source. An early WebFetch summary of the changelog also produced a March 3 date that the raw HTML did not contain, so treat that date as unconfirmed.
- Whether the limit applies to user tokens as well as bot tokens.
- Real Marketplace wait times. One developer write-up (levelup.gitconnected.com) reports about four months end to end but returned 403, so it is not cited.
- Whether Composio's managed Slack app is Marketplace-listed (decides which limit managed users get).
- Where the line is between a free pilot and "commercial distribution".
- Plan requirement for the Agents & AI Apps container: only confirmed indirectly through the Marketplace disclosure rule.
