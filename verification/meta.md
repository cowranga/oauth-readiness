# Verification: Meta (Facebook, Instagram, WhatsApp)
Date: 2026-10-28 | Verifier: claim-verifier subagent | Claims checked: 38 (load-bearing 33, sampled 5)

## Summary
- Confirmed: 30 | Corrected: 1 | Narrowed: 5 | Downgraded: 0 | Unverifiable: 2 | Removed: 0
- Biggest correction: The guide said WhatsApp onboarding goes from 10 to 200 new businesses a week "after review". Meta's Embedded Signup page names three steps for 200 (Business Verification, App Review, Access Verification), and Meta retired Access Verification on October 9, 2026, so the guide now says this and tells you to check the limit in WhatsApp Manager.

The tier 3 call holds. Four separate official Meta pages (Access Levels, Business Verification, App Review, Instagram Platform overview) all say that users without a role on your app need Advanced Access, which needs App Review per permission and a verified business. No page mentions a paid third-party audit. A partner's docs (360dialog) give the same Business Verification flow from outside Meta.

## Claims
| # | Claim (as first written) | Verdict | What the sources say | Action | Sources |
|---|---|---|---|---|---|
| 1 | Meta supports OAuth 2.0; the v26.0 dialog is live and shows Invalid app ID for an unknown client | confirmed | Re-probed: HTTP 200, page contains "Invalid app ID", no redirect. Manual flow page documents the dialog | none | e25, e35 |
| 2 | PKCE support unknown | confirmed | Manual flow page does not mention PKCE or code_verifier; the exchange uses the app secret | Added e35 to oauth evidence | e35 |
| 3 | Tier 3: Advanced Access needs App Review per permission plus Business Verification | confirmed | Access Levels: each permission approved through App Review; Business Verification required since Feb 1, 2023. Business Verification page says the same | none | e1, e2, e3 |
| 4 | Business Verification: needed for Advanced Access, only a Business Admin can finish it, role-only apps skip it | confirmed | Business Verification page says all three | none | e3 |
| 5 | Review is triggered by users without a role on the app | narrowed | App Review page: also exempt are people with a role in a Business that claimed the app | Reworded e4 | e4 |
| 6 | One successful API call per permission within 30 days; button grayed out until logged | narrowed | Submission guide says so, and adds that logging can take up to 2 days and Graph API Explorer calls count | Updated e6, s5, blocker fix | e6 |
| 7 | Meta says a decision within a week | confirmed | Submission guide: "receive a decision within a week" | none | e7 |
| 8 | Forum report in May 2026: dashboard estimate about 10 days, still pending at 13 days | corrected | Request pending since May 21, 2026; post written 13 days later, so early June | Fixed e31 date | e31 |
| 9 | Business verification takes up to 14 business days (partner report) | confirmed | 360dialog page says "up to 14 business days" | none | e30 |
| 10 | Production realistic wait 7 to 56 days | unverifiable | Built from e7, e30, e31; no source measures rejection cycles. Range is plausible but not stated anywhere | Kept as inferred (e33) | e33 |
| 11 | Prototype: Standard Access automatic, role holders can grant any permission, no wait | confirmed | Access Levels: Standard Access granted automatically, limited to role holders | none | e1 |
| 12 | Limited beta: add testers in App Roles, no review | confirmed | Access Levels and App Review: role holders need no review | none | e1, e4 |
| 13 | App settings: icon, privacy policy URL, category, business email, platforms | confirmed | App Review content page lists these. The 1024x1024 no-logo rule is on the submission guide, not that page | Re-cited r5 and s7 to new e38 | e10, e38 |
| 14 | Data deletion URL or callback in Basic Settings; callback over HTTPS | confirmed | Data Deletion Callback page says both | none | e11 |
| 15 | Data handling questions come after business verification | confirmed | App Review content page and submission guide | none | e10, e38 |
| 16 | Data Use Checkup is annual, required before Live and to keep access | confirmed | Data Use Checkup page says all three | none | e12 |
| 17 | Screencast per permission: 1080p, width 1440 or less, English UI, captions, no audio | narrowed | Captions are asked only when the UI is not English or not self-explanatory; English UI "if possible" | Updated s9 and e5 | e5 |
| 18 | Log in only tier (public_profile, email) needs no review | narrowed | Permissions Reference: only public_profile is automatic. email points to App Review | Removed email from tier, noted it needs review; new e37 | e37 |
| 19 | pages_read_engagement needs review, depends on pages_show_list | confirmed | Permissions Reference says both, with a screencast of Page content | none | e16 |
| 20 | pages_manage_posts needs review and depends on the read permissions | confirmed | Depends on pages_read_engagement and pages_show_list | none | e16 |
| 21 | Instagram: professional accounts only, review plus Business Verification | confirmed | Instagram overview says both logins need a professional account; Advanced Access needs App Review and Business Verification | none | e14 |
| 22 | Instagram Basic Display API ended December 4, 2024, announced September 4, 2024 | confirmed | Meta blog post says both, and that no consumer Instagram API remains | none | e15 |
| 23 | WhatsApp Tech Provider: verification before review, two videos, Advanced Access to two permissions | confirmed | Tech Provider page says all of this | none | e18 |
| 24 | WhatsApp onboarding: 10 a week, 200 after review | narrowed | Embedded Signup page: 200 after Business Verification, App Review, and Access Verification. Confirmed on a second Meta docs URL (documentation/business-messaging) | Updated e20, blocker, tier effect, production notes | e20, e22, e36 |
| 25 | Access Verification page says it is no longer required | confirmed | Page notice: "Access Verification is no longer required." News report dates it to October 9, 2026 | Added e36 | e22, e36 |
| 26 | Whether Access Verification still gates the 200 limit | unverifiable | Embedded Signup page still lists it; no source says how the retirement changes the limit | Kept as uncertainty with date added | e20, e22, e36 |
| 27 | business_management needs review | confirmed | Permissions Reference says so | none | e16 |
| 28 | Composio managed OAuth for Facebook, Instagram, WhatsApp | confirmed | All three in the managed table | none | e27 |
| 29 | Switching to your own app affects new connections only | confirmed | White-labeling page says so | none | e28 |
| 30 | Managed apps share quota; 15 minute polling minimum | confirmed | Custom vs managed page says both | none | e29 |
| 31 | Customer-side gate: the connecting person needs Page tasks or business admin rights | confirmed | Instagram overview: users must perform admin-equivalent tasks on the linked Page. Embedded Signup acts for the client business | none (e34 stays inferred) | e14, e34 |
| 32 | Use cases cannot be removed; the Page use case adds business_management and pages_show_list | confirmed | Create an App page says both | none | e13 |
| 33 | Long-lived user tokens about 60 days, Page tokens no expiry, expired tokens cannot be exchanged | confirmed | Long-lived tokens page says all three; latest version v26.0 per changelog | none | e23, e24 |
| 34 | (sample, s1) Create the app by choosing use cases; incompatible ones greyed out | confirmed | Create an App page | none | e13 |
| 35 | (sample, s3) Add the redirect URI in Facebook Login settings | confirmed | Manual flow page names Valid OAuth redirect URIs under Client OAuth Settings | Upgraded e35 from inferred to sourced; named the field in s3 | e35 |
| 36 | (sample, s8) Data handling answers are checked right away | confirmed | Submission guide: evaluated right away, up to 30 seconds. The cited content page did not say this | Re-cited s8 to e38 | e38 |
| 37 | (sample, blocker) Business verification rejected when documents, website, and email domain do not match | confirmed | 360dialog page says each of these | none | e30 |
| 38 | (sample, blocker) Personal Instagram accounts cannot connect since December 4, 2024 | confirmed | Blog post and Instagram overview | none | e15, e14 |

## Could not verify
- Production realistic wait of 7 to 56 days: no source measures resubmission cycles. Resolved by recording dates on a real submission.
- Whether Access Verification still counts toward the 200 a week WhatsApp limit: the Embedded Signup page lists it and the retirement report does not mention WhatsApp. Resolved by checking the limit in WhatsApp Manager after review or asking Meta developer support.
- Meta's own retirement post for Access Verification: only a secondary news report was read. Resolved by opening the October 9, 2026 Meta developer blog post.
- Tester count limit and PKCE support: no page we read states either.

## Human setup attempt
Not yet. See docs/MORNING_HANDOFF.md.
