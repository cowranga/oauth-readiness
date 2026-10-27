# google-gmail research notes

Researched 2026-10-28 by the oauth-researcher subagent. About 24 page reads and 3 probes. Nothing here is `tested`.

## Verdict

Tier 4 (Review + external audit). Deciding factor: reading mail (`gmail.readonly`, `gmail.modify`) and even creating drafts (`gmail.compose`) are restricted scopes. Restricted scopes need data access verification plus an annual third-party CASA security assessment when the data reaches your server. Confidence high: Gmail scopes page plus restricted-scope page plus Security Assessment help page, all official.

## Findings with sources

Scope classification
- Gmail scopes page lists the sensitivity of each scope. Restricted: `https://mail.google.com/`, `gmail.readonly`, `gmail.compose`, `gmail.insert`, `gmail.modify`, `gmail.metadata`, `gmail.settings.basic`, `gmail.settings.sharing`. Sensitive: `gmail.send`, `gmail.addons.current.message.readonly`, `gmail.addons.current.message.metadata`. Non-sensitive: `gmail.labels`, `gmail.addons.current.action.compose`, `gmail.addons.current.message.action`. https://developers.google.com/workspace/gmail/api/auth/scopes
- Calendar scopes page lists 20 scopes but gives no sensitivity labels. https://developers.google.com/workspace/calendar/api/auth
- The sensitive-scope verification page uses "reading events stored in Google Calendar" as its example of a sensitive scope, and its sample justification names the full `calendar` scope. https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification
- Community: a Sept 2026 forum thread treats `calendar.events` as sensitive. No official page I opened calls any Calendar scope restricted. A third-party (Nylas) search snippet claims `calendar` is restricted; I did not open it and did not use it.

Verification and review
- Brand verification, then data access verification. You must publish branding before requesting data access verification. https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification
- Demo video: YouTube unlisted, English consent flow, app name on consent screen, OAuth client ID in the address bar, each scope's feature shown. Same page and the sensitive page.
- Verification requirements: homepage on a domain you own, privacy policy on the same domain linked from homepage and consent screen, domain verified in Search Console by a project Owner or Editor, justification for each scope including why a narrower one will not work, and explicit consent shown in the video if user data trains AI models. https://support.google.com/cloud/answer/13464321
- Restricted scope apps that access data "from or through a third-party server" need a security assessment by a Google-empanelled assessor (CASA, App Defense Alliance). Reverify and reassess at least every 12 months from the Letter of Assessment approval date. Restricted page.
- Security Assessment help page: two assurance levels, AL1 and AL2, assigned by risk (user count, scopes, other signals). Annual revalidation. Google Trust and Safety contacts you when it is time to start; it is the last step. https://support.google.com/cloud/answer/13465431
- ADA tiering page also shows AL1 and AL2, annual revalidation, framework user (Google) picks the level. https://appdefensealliance.dev/casa/casa-tiering
- Verification FAQ: Google does not charge for the assessment; price is between you and the assessor. Mentions "free tier 2 assessment" for some apps, and tier depending on users per data type. Tier 3 assessors need read-only access to your cloud. https://support.google.com/cloud/answer/13463817
- Provider-stated timelines (FAQ): brand 2 to 3 business days, sensitive 10 business days, restricted 6 weeks, "not guaranteed". The sensitive-scope page says sensitive verification "typically takes 3-5 business days". These conflict.
- Unverified app screen page: verification "might require several months" depending on data sensitivity. 100 new users in total once the unverified screen shows. https://support.google.com/cloud/answer/7454865

Testing and caps
- Testing status: up to 100 test users. Test user authorizations and refresh tokens expire 7 days after consent, unless only basic sign-in scopes are requested. Unverified app cap of 100 new users is over the project's lifetime and cannot be reset. Internal user type limits to your Cloud organization. https://support.google.com/cloud/answer/15549945
- OAuth 2.0 overview: 7-day refresh token for External + Testing, 100 refresh tokens per Google Account per client (oldest silently invalidated), Gmail-scoped refresh tokens die on password change, 6 months unused, `admin_policy_enforced` when an admin restricts services. https://developers.google.com/identity/protocols/oauth2

Policy
- User Data Policy Limited Use: feature-only use, no transfers except listed cases, no human reading except listed cases, no ads, data brokers, or credit decisions. Annual assessment and Letter of Assessment for restricted scopes depending on API and user count. https://developers.google.com/terms/api-services-user-data-policy
- Workspace API User Data and Developer Policy: no training generalized AI/ML models on the data beyond the user's own personalized model; you must post an affirmative Limited Use statement in the app or on your website. https://developers.google.com/workspace/workspace-api-user-data-developer-policy

Customer-side gate
- Workspace admins: Security > Access and data control > API controls. Apps can be Trusted, Specific Google data, Limited, or Blocked. Gmail and Calendar can be set Restricted, which blocks Limited apps and revokes tokens of untrusted apps. Gmail has extra high-risk scope controls. Admins can block unconfigured third-party apps entirely. https://knowledge.workspace.google.com/admin/apps/control-which-apps-access-google-workspace-data

Granular consent
- When you request more than one non-sign-in scope, users get checkboxes and can grant Calendar but not Gmail. You must check granted scopes. https://developers.google.com/identity/protocols/oauth2/resources/granular-permissions

Composio
- Gmail and Google Calendar are in the managed OAuth table. https://docs.composio.dev/toolkits/managed-auth
- Switching auth config affects new connections only; existing users must reconnect or be imported. Default Google consent screen says "Composio wants to access your account". https://docs.composio.dev/docs/white-labeling-authentication
- Reasons for own app: branding, custom scopes, dedicated quota, faster polling (managed minimum 15 minutes). https://docs.composio.dev/docs/custom-app-vs-managed-app

Community (in practice)
- discuss.google.dev thread: `calendar.events` (sensitive) verification submitted 2026-04-22, still no Trust and Safety email on 2026-08-24. Related threads: 50+ days stuck, review since April 2026. https://discuss.google.dev/t/oauth-verification-pending-since-22-apr-2026-first-trust-safety-email-never-received/392005
- Switch Labs comparison ("as of 2024"): CASA Tier 2 about $540 to $1,800 at TAC, $800+ elsewhere; Tier 3 about $4,500 to $8,000+; 1 to 4 weeks turnaround. https://www.switchlabs.dev/post/casa-tier-2-tier-3-security-review-providers-pricing-and-the-cheapest-option
- James Cui (Dec 2023): Tier 2 via PwC, not charged, lab required a Fortify scan of uploaded source. https://jamescui.substack.com/p/crack-googles-casa-review
- TAC Security CASA site returned 403; pricing not confirmed first hand.

## Probes (3)
1. GET https://accounts.google.com/.well-known/openid-configuration: 200. Authorize `https://accounts.google.com/o/oauth2/v2/auth`, token `https://oauth2.googleapis.com/token`, revoke `https://oauth2.googleapis.com/revoke`, `code_challenge_methods_supported` [plain, S256].
2. GET authorize endpoint with `client_id=oauth-guide-probe-invalid`, scope `gmail.readonly`: 302 to `/signin/oauth/error`; `authError` decodes to `invalid_client` / "The OAuth client was not found." (401).
3. HEAD https://console.cloud.google.com/auth/overview: 302 to `accounts.google.com/ServiceLogin?service=cloudconsole`. Sign-in required.

## Versus PRODUCT.md hypotheses
- Confirmed: Gmail read/modify restricted plus audit; Calendar sensitive (official example, not an official per-scope list); verification needs domain, privacy policy, homepage, demo video.
- Correction: `gmail.compose` (drafts) is restricted too. An assistant that only drafts replies still lands in tier 4. Only `gmail.send` is sensitive.
- Correction: "small number of test users" is 100. The bigger trap is the 7-day expiry of test user authorizations, and the 100-new-user unverified cap is lifetime and never resets.
- New: Google says it does not charge for CASA, and some apps qualify for a free Tier 2 assessment. Paid lab prices are community-reported only.
- New: Google's own two pages disagree on sensitive review time (3 to 5 vs 10 business days). Community reports months-long stalls in 2026 even for sensitive scopes.
- New: Workspace policy bans training generalized AI models on Gmail/Calendar data. Matters for AI agent products.

## Open questions
- Exact sensitivity of each Calendar scope (the official per-scope list was not in the pages I opened; check the Data Access page in the console).
- Whether the restricted assessment is waived if data never touches your server (page says "from or through a third-party server"; an agent backend almost always does).
- Current CASA prices and whether a free Tier 2 path is still offered in 2026.
- Which AL level a new inbox agent gets.
- Whether the FAQ's 6 weeks for restricted includes the assessment.
