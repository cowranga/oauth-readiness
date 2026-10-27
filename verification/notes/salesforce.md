# Salesforce: research notes

Researcher: oauth-researcher subagent. Retrieved 2026-10-28. About 25 page reads, 3 probes.
Scope: an AI agent product whose customers connect their own Salesforce orgs (each with its own My Domain, plus sandboxes).

Access note: developer.salesforce.com and admin.salesforce.com return HTTP 403 to plain fetches, and help.salesforce.com is a JavaScript app. Official pages were read by loading them in a browser tab (unauthenticated public pages, no sign-in, no forms).

## Verdict

Tier 2 (Self-serve, optional review), with the customer-side gate flag. Deciding factor: no Salesforce approval sits between you and a working multi-org app. You put a Packaged External Client App (ECA) in a managed 2GP package and each customer's admin installs it. Security review is only needed for an AgentExchange listing, to remove the "not authorized" install notice, or to reach Group and Professional Edition orgs without the API add-on. The customer admin install is mandatory in every deal, so the gate is real.

Confidence: medium. The tier rests on several official pages (Trailhead ECA units, ISVforce security review, install notification, REST intro), but two key points are untested: how cross-org OAuth behaves with a packaged ECA (shared vs per-org consumer key), and whether the partner agreement allows paid unlisted distribution without review.

## Findings with sources

### Connected apps vs External Client Apps
- Creating connected apps is restricted as of Spring '26. Existing ones keep working. Salesforce recommends ECAs and says to contact Support if you must create a connected app. https://developer.salesforce.com/docs/platform/api-rest/guide/intro-oauth-and-connected-apps.html
- ISVforce guide repeats it: from Spring '26 you can't create new connected apps. https://developer.salesforce.com/docs/platform/isvforce/guide/secure-code-ac-eca.html
- ECAs are local by default. Local = usable only in its own org. Packaged = can go into a 2GP managed package and be distributed. Connected apps were globally available by default. https://trailhead.salesforce.com/content/learn/modules/external-client-app-basics/use-external-client-apps-when-connected-apps-wont-do
- Consumer credentials are global settings, not packaged, kept in a long-lived org. A subscriber org can share the original credentials or generate new ones; local credentials break the association. https://trailhead.salesforce.com/content/learn/modules/external-client-app-basics/package-and-distribute-external-client-apps
- Packaging needs a Dev Hub with a namespace prefix; namespace is permanent; customer admins can edit default policies of the distributed app. https://developer.salesforce.com/docs/platform/canvas-framework/guide/quick-start-package-canvas-app-eca.html
- Community walkthrough (Nango) of the full packaged ECA path: Dev Hub (irreversible), namespace in a separate org, Distribution State Packaged, retrieve metadata, sf package version create, install URL. https://nango.dev/docs/api-integrations/salesforce/salesforce-api-oauth-app-setup.md

### Customer-side controls
- Since early September 2025, uninstalled connected apps are blocked for most users. Prior authorizers keep access unless device flow. Bypass permissions: Approve Uninstalled Connected Apps (Summer '25) and Use Any API Client. Admin blog dated Aug 25, 2025. https://admin.salesforce.com/blog/2025/get-ready-for-changes-to-connected-app-usage-restrictions
- API Access Control: request from Customer Support; when on, installed apps become Admin approved users are pre-authorized and only allowlisted apps can call APIs. Editions: Professional, Enterprise, Performance, Unlimited, Developer. https://help.salesforce.com/s/articleView?id=xcloud.security_api_access_control_all_users.htm&type=5
- ECA Policies tab: Permitted Users (pre-authorized with profiles and permission sets, or self-authorize) and refresh token policy (for example expire after 90 days). Callback can be http://localhost for CLI. https://developer.salesforce.com/docs/platform/sfdx-dev/guide/sfdx-dev-auth-eca.html

### Editions
- API access by default in Enterprise, Performance, Unlimited, Developer. Professional needs a paid add-on. Error API_DISABLED_FOR_ORG. Users need API Enabled. https://developer.salesforce.com/docs/platform/api-rest/guide/intro-rest-compatible-editions.html
- Group and Professional: after passing security review you can get an API token or REST allowlisting. Bulk API 2.0 stays unavailable. https://developer.salesforce.com/docs/platform/isvforce/guide/dev-packages-api-access.html

### OAuth details
- Endpoints require HTTPS. Hosts: login.salesforce.com, My Domain, Experience Cloud site, custom URL. Sandboxes: test.salesforce.com or sandbox My Domain. https://help.salesforce.com/s/articleView?id=xcloud.remoteaccess_oauth_endpoints.htm&type=5
- ECA OAuth settings: redirect must match one listed callback URL (2000 chars), HTTPS or custom scheme for token-passing flows; Require PKCE option blocks flows without PKCE; option for new refresh token on each refresh. https://help.salesforce.com/s/articleView?id=xcloud.configure_external_client_app_oauth_settings.htm&type=5
- Partner apps used by more than two customer production orgs must enable PKCE, refresh token rotation, 30-day idle refresh TTL, refresh token IP allowlist (256 IPs total), and self-attest (locks them). Due May 11, 2026. Non-compliance can mean delisting or suspension. https://developer.salesforce.com/docs/platform/isvforce/guide/secure-code-ac-eca.html

### Security review (AgentExchange, formerly AppExchange)
- Required to distribute managed packages and API solutions on AgentExchange. Prereqs: ISV Partner Program, Lightning Ready, Partner Console, provider profile, scanners, Developer Edition test org with docs. Stated times: verify 1 to 2 weeks, first test 3 to 4 weeks, retest 2 to 3 weeks. Free solutions pay no fee. https://developer.salesforce.com/docs/platform/isvforce/guide/security-review-how-it-works.html
- Fee: $999 per attempt for paid solutions (Trailhead). https://trailhead.salesforce.com/content/learn/modules/isv_security_review/isv_security_review_submit
- Unreviewed managed packages still install, with a notice the customer must acknowledge. https://developer.salesforce.com/docs/platform/pkg1-dev/guide/packaging-install-notification.html (first-gen guide; assumed to apply to 2GP)
- Community: no fixed SLA, two or three round trips common for first-timers; typical findings CRUD/FLS, sharing, MFA blocking reviewers, misplaced secrets. https://tekunda.com/blog/How-ISVs-Pass-the-Salesforce-AppExchange-Security-Review

### Composio
- Salesforce is in the Composio-managed OAuth table; Salesforce Service Cloud is bring-your-own. https://docs.composio.dev/toolkits/managed-auth
- New auth config only affects new connections. https://docs.composio.dev/docs/white-labeling-authentication
- Private Salesforce subdomain named as a reason to bring your own app. https://docs.composio.dev/docs/custom-app-vs-managed-app

## Probes (3)
1. GET https://login.salesforce.com/.well-known/openid-configuration: 200, S256 only, 39 scopes incl. offline_access and refresh_token.
2. GET https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=oauth-guide-probe-invalid&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback: HTTP 400, body `error=invalid_client_id`, no redirect.
3. GET https://test.salesforce.com/.well-known/openid-configuration: 200, issuer https://test.salesforce.com, S256.
No developer portal probe was run, so the attempt depth is "endpoints probed".

## Contradictions with PRODUCT.md hypotheses
- "Connected app works across customer orgs": no longer true for new apps. New connected apps cannot be created since Spring '26, and even old ones are blocked in orgs that have not installed them (Sept 2025). The working path is a Packaged ECA in a managed 2GP package, which means Dev Hub, namespace, and Salesforce CLI work up front.
- "AppExchange listing needs a paid security review": true but incomplete. The marketplace is now called AgentExchange, review is free for free solutions, and review also matters outside listing: it removes the install warning and is the only route to Group and Professional Edition orgs without the API add-on.
- Hidden partner obligation not in the hypothesis: four locked OAuth controls (PKCE, rotation, 30-day idle TTL, IP allowlist) for partner apps in more than two production orgs, due May 11, 2026.

## Open questions
- Paid distribution of an unlisted, unreviewed managed package: allowed under the partner agreement?
- Do subscriber orgs reuse your consumer key or generate per-org credentials? Community snippets mention OAUTH_AUTHORIZATION_BLOCKED after install (Trailblazer thread seen only in search results, not opened).
- Does "partner" in the OAuth controls page include non-enrolled vendors?
- Current fee: $999 (Trailhead) vs $2,550 in older guide versions.
- Does Composio's managed Salesforce app now need customer admin install or approval?
- No first-hand dated developer reports on review duration.
- Device flow limits for ECAs (a third-party summary mentioned a Nov 30, 2026 date) not verified.
