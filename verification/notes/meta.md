# Meta (Facebook, Instagram, WhatsApp): research notes

Researcher: oauth-researcher subagent. Retrieved 2026-10-28. About 25 page reads, 3 probes.
Scope: an AI agent product whose users connect their Facebook Pages, Instagram professional accounts, and/or WhatsApp Business accounts.

## Verdict

Tier 3 (Review required). Deciding factor: any user without a role on your app can only grant a permission after it has Advanced Access, and Advanced Access needs App Review per permission plus Business Verification. Nothing in the path needs a paid third-party audit, so not tier 4. The WhatsApp partner program (Meta Business Partner) only matters above 200 new customers a week, so it is a scale gate, not the entry gate.

Confidence: high. The tier claim is backed by several official pages (access levels, business verification, app review, Instagram overview, permissions reference).

## Findings with sources

### Access levels and review
- Standard Access: only people with a role on the app can grant permissions. Advanced Access: any user; each permission needs App Review; Business Verification required (since Feb 1, 2023); annual Data Use Checkup. https://developers.facebook.com/docs/graph-api/overview/access-levels
- Apps used by anyone without an app role (or a role in the Business that claimed the app) must pass App Review. If reviewers cannot reach the app, the whole submission is rejected. https://developers.facebook.com/docs/app-review
- Business Verification needed for Advanced Access or for letting other businesses access their data. Only a Business Admin can finish it. Page does not list documents or timing. https://developers.facebook.com/docs/development/release/business-verification
- Business verification required to complete App Review since 2023; data handling questions required from June 12, 2023. App settings: icon, privacy policy URL, category, business email, platforms. https://developers.facebook.com/documentation/resp-plat-initiatives/individual-processes/app-review/content.md

### Submission details (submission guide)
https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review/submission-guide
- One screen recording per permission or feature. At least 1080p, monitor width 1440 or less, English UI, captions, no audio, larger cursor.
- At least one successful API call per permission within 30 days before submitting. The request button stays grayed out until a call is logged.
- Reviewers use their own test accounts. Do not share personal Meta credentials. App must be public or you give access instructions.
- Usage descriptions must be specific per permission. Copy-paste is a rejection reason.
- Changing settings after submission can trigger re-review. Switching to Live mode before review completes is a listed problem.
- Stated timeline: you "should receive a decision within a week".
- Icon 1024x1024, no Meta trademarks.

### Data deletion and Data Use Checkup
- You must give either a data deletion instructions URL or a data deletion callback URL in Basic Settings. https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
- Data Use Checkup is annual for live apps or apps with Advanced Access; must be done before switching to Live mode. No deadline length stated on the page. https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/data-use-checkup

### App creation (use cases)
- The dashboard now creates apps by use case (app name, email, use cases, business portfolio, requirements). Use cases cannot be removed later; some are incompatible (greyed out). "Manage everything on your Page" adds business_management, pages_show_list, public_profile. Apps that access data you do not own must connect a business portfolio. https://developers.facebook.com/docs/development/create-an-app

### Instagram
- Two paths. Instagram API with Instagram Login: professional (business or creator) account, no Facebook Page needed, permissions instagram_business_*, host graph.instagram.com, no hashtag search. With Facebook Login for Business: professional account linked to a Page, permissions instagram_basic, instagram_manage_messages, pages_show_list, pages_read_engagement, etc. Advanced Access needs App Review and Business Verification. https://developers.facebook.com/docs/instagram-platform/overview
- Basic Display API (personal accounts) shut down Dec 4, 2024, announced Sep 4, 2024. No Instagram API for consumer apps after that. https://developers.facebook.com/blog/post/2024/09/04/update-on-instagram-basic-display-api

### Permissions reference
https://developers.facebook.com/docs/permissions
- pages_read_engagement: depends on pages_show_list. Review asks why you need the data for Pages you do not own plus a screencast showing Page content in your app.
- instagram_business_manage_messages: depends on instagram_business_basic. Review asks you to show sending a message and a cURL request.
- Every permission listed needs App Review for Advanced Access. public_profile is granted to all apps.

### WhatsApp
- Tech Provider onboarding: app with WhatsApp use case, business portfolio, Business Verification first ("must be verified before you can start the app review process"), then App Review with two videos (message sent from your app and received in WhatsApp; template creation). Permissions: whatsapp_business_messaging, whatsapp_business_management. Without the latter, calls on accounts you do not own return error code 200. Clients add their own payment method. https://developers.facebook.com/docs/whatsapp/solution-providers/get-started-for-tech-providers
- Embedded Signup: cannot onboard customers until Advanced Access for each permission. Default 10 new business customers per rolling 7 days; Business Verification + App Review + Access Verification raise it to 200; beyond that apply to be a Meta Business Partner. Embedded Signup v2 and v3 deprecated Oct 15, 2026; move to v4. https://developers.facebook.com/docs/whatsapp/embedded-signup
- Access Verification page now says it is "no longer required" (legacy). Conflicts with the Embedded Signup page that still lists it. https://developers.facebook.com/docs/development/release/access-verification

### Tokens
- Short-lived tokens expire in hours. Long-lived user tokens about 60 days, exchanged server-side with the app secret. Long-lived Page tokens have no expiry date. No refresh tokens. Expired tokens cannot be exchanged; user must log in again. https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived

### Versions
- Latest Graph API v26.0 (July 29, 2026). v25.0 Feb 18, 2026. https://developers.facebook.com/docs/graph-api/changelog

### Timelines
- Provider says: decision within a week (submission guide).
- Community: a developer on Meta's forum reported the dashboard showing about a 10-day review window and their review still pending at 13 days (May 2026, no reply). https://developers.facebook.com/community/threads/2119529588613973/
- Community (WhatsApp BSP 360dialog): Business Verification reviewed within up to 14 business days; documents must match Business Info; website must show the same name, address, phone; email on the website domain. https://docs.360dialog.com/docs/resources/meta-business-verification/classic-business-verification
- Vendor blogs (not opened, not cited) mention 1 to 8 weeks with resubmissions. Not used as evidence.

### Composio
- Facebook, Instagram, WhatsApp listed under Composio-managed OAuth available. https://docs.composio.dev/toolkits/managed-auth
- Switching auth config: existing connections keep their original auth config; only new connections use yours. https://docs.composio.dev/docs/white-labeling-authentication
- Reasons for own app: branding on consent screen, custom scopes, dedicated rate limits, faster trigger polling. https://docs.composio.dev/docs/custom-app-vs-managed-app

## Probes (3 of 3)
1. GET https://www.facebook.com/v26.0/dialog/oauth?client_id=oauth-guide-probe-invalid&redirect_uri=https://example.com/callback&response_type=code&state=probe&scope=pages_show_list: HTTP 200, HTML interstitial with header "Invalid app ID". Endpoint live, rejects unknown client on an error page rather than redirecting.
2. GET https://developers.facebook.com/apps/ (status only): HTTP 200, no redirect.
3. GET same URL with body: 143 KB JavaScript shell, no app list in HTML. The app list renders client-side; creating an app needs a signed-in developer account (per create-an-app docs).

## Contradictions with PRODUCT.md hypotheses
- Hypothesis "business verification with company documents is required": true for Advanced Access, but not for the prototype stage; role-only apps skip it. Docs list no documents; the list lives in a Help Center page that did not render for us.
- Hypothesis "Instagram API access depends on account type": confirmed, and sharper: personal accounts have no API at all since Dec 4, 2024. You also no longer need a Facebook Page if you use Instagram Login.
- Not in the hypotheses: Access Verification is now marked not required; WhatsApp Embedded Signup caps onboarding at 10 then 200 new customers per week; you must make a real API call per permission within 30 days before you can even request review.
- Hypothesis "periodic data use checkups": confirmed annual.

## Open questions
- Real App Review turnaround. Docs say a week; dashboard reportedly says about 10 days; no official data on resubmission cycles.
- Official Business Verification document list and timing (Help Center page did not render).
- Whether Access Verification still affects the Embedded Signup limit.
- Instagram Login token lifetime and refresh (not read this run).
- PKCE support for the Facebook Login dialog (not confirmed).
- Max number of testers per app (not confirmed).
- Which Meta app and which scopes Composio's managed WhatsApp auth uses.
