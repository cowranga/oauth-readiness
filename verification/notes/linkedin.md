# LinkedIn: research notes

Researcher: oauth-researcher subagent. Retrieved 2026-10-28. About 21 page reads, 3 probes.
Scope: an AI agent product where any LinkedIn member connects their account (sign in, post for them, read their posts and analytics, manage company Pages, messaging).

## Verdict

Tier 3 (Review required), confidence high. Deciding factor: sign-in and posting are self-serve, but anything an agent reads beyond the basic profile (post analytics, Page management, comments) needs the Community Management API. That API is vetted, open only to registered legal organizations, and has two reviews (Development tier, then Standard tier with a screencast). Reading a member's own posts or feed (r_member_social) is closed to everyone, so that use case is tier 5. No messaging API exists in any listed product.

Customer-side gate: yes, for Page features. The member must be an ADMINISTRATOR of the Page; roles are granted only in LinkedIn's UI.

## Findings with sources

### Access model
- Open permissions: profile, email (Sign In with LinkedIn using OIDC), w_member_social (Share on LinkedIn). Self-serve on the Products tab. Most other permissions need approval. Sales Navigator needs SNAP partnership; Talent has its own application; Compliance is closed. https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access (updated 2026-06-03)
- Apps are tied to one Page forever; products for individual developers need a default Page; Page super admin has 30 days to approve verification. https://www.linkedin.com/help/linkedin/answer/a548360/associate-an-app-with-a-linkedin-page?lang=en
- Quick start: create Page, create app, apply on Products tab. Page access cannot be granted through the API. https://learn.microsoft.com/en-us/linkedin/marketing/quick-start

### Community Management API
- Vetted product, Development tier then Standard tier (screencast). FAQ: r_member_social is closed, not accepting requests "due to resource constraints". CM can only be requested on a new app with no other products (grayed out otherwise). Dev tier limits raised to 500/app and 100/member. https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview (ms.date 2026-03-31)
- Only registered legal organizations, commercial use. Verified business email (personal fails), legal name, address, website, privacy policy, Page super admin verification, no LinkedIn/Microsoft names in app. Rejected: new app, cannot reapply on same app. Standard: integrated app, test credentials, screencast per use case. https://learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review
- Scopes: r_member_postAnalytics, r_member_profileAnalytics, w_member_social_feed, r/w_organization_social, rw_organization_admin (ADMINISTRATOR only) and more. Dev tier: 500 calls/app/day, 100/member/day, no BATCH_GET, no webhooks, build within 12 months. LinkedIn may decline upgrades at its discretion. Restricted APIs have no fixed timeline. Company Intelligence closed. Boost scopes from 202610. https://learn.microsoft.com/en-us/linkedin/marketing/increasing-access (updated 2026-10-19)
- Restricted uses: manage Pages/profiles only; no sales, recruiting, ads, CRM enrichment; no export or combining; 48 h storage for social activity, 24 h for most profile data; no social feed displays. https://learn.microsoft.com/en-us/linkedin/marketing/restricted-use-cases

### Tokens and OAuth
- Auth code flow: HTTPS absolute redirect, params ignored, no #. Code 30 min. Access token 60 days. Refresh means rerunning the browser flow (consent skipped if still signed in). Programmatic refresh only for a limited set of partners. Changing scopes invalidates earlier tokens. enable_extended_login for social/passkey login on native. https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow (updated 2026-05-15)
- Programmatic refresh tokens: all approved MDP partners; 365 days fixed from first consent. https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens
- PKCE: native clients only, loopback redirect, LinkedIn must enable on request (page from 2023). https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow-native
- OIDC: openid/profile/email, ID token, does not verify identity. Docs sample issuer https://www.linkedin.com. https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2
- Share on LinkedIn: POST /v2/ugcPosts; 150/member/day, 100,000/app/day. https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin
- Rate limits: daily, midnight UTC reset, unpublished, Analytics tab, 429, 75 percent alert email. https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/rate-limits
- Versioning: monthly, at least one year support, Linkedin-Version header required; 202511 sunsets 2026-11-16. https://learn.microsoft.com/en-us/linkedin/marketing/versioning

### Probes (3)
1. GET https://www.linkedin.com/oauth/.well-known/openid-configuration: 200 JSON. issuer `https://www.linkedin.com/oauth`, scopes openid/profile/email, response_types code only, subject type pairwise.
2. GET authorize with client_id=oauth-guide-probe-invalid: 200 HTML error page "The passed in client_id is invalid". No sign-in redirect.
3. GET https://www.linkedin.com/developers/apps: 200, title "Developers | LinkedIn", JS app shell. Form not seen (no sign-in).

### Composio
- LinkedIn in the managed OAuth table; LinkedIn Ads in the bring-your-own table. https://docs.composio.dev/toolkits/managed-auth
- Own auth config affects only new connections. https://docs.composio.dev/docs/white-labeling-authentication
- Reasons to bring your own app. https://docs.composio.dev/docs/custom-app-vs-managed-app

### Community (labeled)
- SocialRouter blog (Feb 2026, vendor, no author): 2 to 6 weeks for a first response on CM. https://socialrouter-marketing.pages.dev/blog/platform-api-reviews
- Expertflow integrator docs: Standard tier form fields; developer-access@linkedin.com asks for narrated walkthrough. https://docs.expertflow.com/cx/4.9/guide-for-standard-tier-upgrade
- n8n forum (Nov 2024): 403 because client requested too few scopes. https://community.n8n.io/t/issue-with-linkedin-community-management-scopes/61687

## Contradictions with PRODUCT.md hypotheses and the v1 draft

- Hypothesis said "partner gate that may never open". Partly true: r_member_social (read own posts) and messaging are closed outright. But Community Management (analytics, Pages, comments) is a general-availability vetted product for registered companies, so the typical agent path is tier 3, not tier 5.
- v1 said there was no OIDC discovery document. Wrong path: it exists at /oauth/.well-known/openid-configuration. Its issuer (`https://www.linkedin.com/oauth`) differs from the docs sample (`https://www.linkedin.com`).
- v1 said customerSideGate false. Page features need the member to be a Page ADMINISTRATOR, granted only in the UI.
- v1 marked PKCE unknown. It exists but only for native clients, enabled by LinkedIn on request.
- Not in the hypothesis: self-serve apps get no refresh token (60-day tokens, browser re-auth). Data storage limits (24 h / 48 h) block long-term agent memory of LinkedIn data. Rejection forces a brand-new app.

## Open questions

- Real review times for Development and Standard tiers (only one vendor source).
- Whether CM approval brings programmatic refresh tokens.
- Whether self-serve products need Page verification or only a selected Page.
- Which scopes Composio's managed LinkedIn app holds.
- LinkedIn API Terms on AI use of content (not read in this pass).
- Dates of the recent CM changes (new member analytics scopes, raised dev tier limits).
