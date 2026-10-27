# Verification: Google (Gmail + Calendar)
Date: 2026-10-28 | Verifier: claim-verifier subagent | Claims checked: 31 (load-bearing 26, sampled 5)

## Summary
- Confirmed: 26 | Corrected: 1 | Narrowed: 3 | Downgraded: 0 | Unverifiable: 1 | Removed: 0
- Biggest correction: The guide said CASA labs take 1 to 4 weeks, citing "developers". The source is a vendor comparison, and 1 to 4 weeks covers its Tier 2 labs only. Tier 3 runs to 6 weeks and some large labs quote 4 to 8 weeks, so the guide now says 1 to 8 weeks.

The tier 4 call holds. Two official Google pages (the Gmail scope page and Google's restricted scope list) both mark gmail.readonly, gmail.modify, and gmail.compose as restricted. Two more official pages require a yearly CASA assessment when restricted data passes through your server.

## Claims
| # | Claim (as first written) | Verdict | What the sources say | Action | Sources |
|---|---|---|---|---|---|
| 1 | Google supports OAuth 2.0 with OIDC and PKCE (S256) | confirmed | Re-probed: OpenID config lists authorize, token, revoke endpoints and code_challenge_methods_supported plain, S256 | none | e26 |
| 2 | Authorize endpoint rejects an unknown client with invalid_client (probe URL with client_id only) | corrected | With client_id only, the endpoint now returns invalid_request (missing response_type). With response_type, redirect_uri, and scope it returns invalid_client | Fixed probe URL and note | e27 |
| 3 | Tier 4: restricted Gmail scopes need verification plus a CASA assessment | confirmed | Restricted scope page: apps that access restricted data from or through a third-party server need a security assessment (CASA). Security Assessment page: annual, AL1 or AL2 | Added second official source e35 to verdict | e1, e2, e12, e35 |
| 4 | gmail.compose is restricted | confirmed | Listed as restricted on the Gmail scope page and on Google's restricted scope list | none | e1, e35 |
| 5 | Calendar scopes are sensitive and need verification only | narrowed | No Calendar scope is on Google's restricted list. Google uses Calendar event reading as a sensitive example. No official page labels each Calendar scope | Verdict summary now says no Calendar scope is restricted; e33 stays inferred with fuller note | e9, e33, e35 |
| 6 | gmail.send is sensitive | confirmed | Gmail scope page lists it as sensitive | none | e1 |
| 7 | gmail.labels and add-on action scopes are non-sensitive; two add-on message scopes are sensitive | confirmed | Matches the Gmail scope table exactly | none | e1 |
| 8 | gmail.settings.basic and gmail.settings.sharing are restricted | confirmed | On both the scope page and the restricted list | none | e1, e35 |
| 9 | Review is triggered for external users on sensitive or restricted scopes; not needed for personal use, testing, service-owned data, or Internal type | confirmed | Restricted scope page lists the same four exemptions | none | e6, e16 |
| 10 | Testing: up to 100 test users; grants and refresh tokens expire after 7 days | confirmed | Audience page: 100 test users, 7 day expiry unless only basic sign-in scopes. OAuth overview: 7 day refresh tokens in Testing | none | e13, e15 |
| 11 | Unverified: 100 new users over the project's lifetime, cannot be reset | confirmed | Audience page says the cap covers the whole project life and cannot be reset or changed | none | e14, e32 |
| 12 | Provider-stated waits: branding 2 to 3 business days, restricted 6 weeks, not guaranteed | confirmed | FAQ table gives these and says estimates are not guaranteed and depend on developer responsiveness | none | e7 |
| 13 | Sensitive review: 3 to 5 business days on one page, 10 business days in the FAQ | confirmed | Both pages say this; the conflict is real | none | e7, e8 |
| 14 | Production realistic wait: 35 days minimum, no upper bound | unverifiable | No source gives 35 days. The open upper bound is supported by "might require several months" and community reports | Kept; listed below | e7, e32 |
| 15 | Developers report waits of 50 days to over 4 months | narrowed | One thread: submitted 22 April, posted late August, about 4 months. The 50 day figure is only a related thread title | Reworded e29 | e29 |
| 16 | Developers report CASA labs taking 1 to 4 weeks | narrowed | Vendor-published 2024 comparison: Tier 2 1 to 4 weeks, Tier 3 2 to 6 weeks, some labs 4 to 8 weeks | Production notes, s12 estimate, e30 now say 1 to 8 weeks from a vendor comparison | e30 |
| 17 | Reassess at least every 12 months after the Letter of Assessment | confirmed | Restricted scope page says this; ADA tiering page says all apps are revalidated yearly | none | e3, e12 |
| 18 | Google does not charge for CASA; you pay the lab | confirmed | FAQ says so; a free Tier 2 path exists via the standard process | none | e10, e11 |
| 19 | Homepage, privacy policy on same domain, Search Console domain verification by Owner or Editor | confirmed | Verification requirements page says all of this | none | e17 |
| 20 | Limited Use statement required; no training generalized AI models on Workspace data | confirmed | Workspace user data policy says both | none | e19, e20 |
| 21 | Request narrowest scopes and justify each, including why narrower ones fail | confirmed | Verification requirements page | none | e18 |
| 22 | Demo video: YouTube Unlisted, English consent flow, app name, client ID in address bar, each scope's feature, each client | confirmed | Restricted scope page lists all of these | none | e4 |
| 23 | Composio managed OAuth is available for Gmail and Google Calendar | confirmed | Both in the managed auth table | none | e23 |
| 24 | With managed auth the consent screen says Composio; switching apps affects new connections only | confirmed | White-labeling page says both; existing users must reconnect or be imported | none | e24 |
| 25 | Managed apps share quota and have a 15 minute polling minimum | confirmed | Custom vs managed app page says both | none | e25 |
| 26 | Customer-side gate: Workspace admins can restrict Gmail or Calendar or block unconfigured apps, even after verification | confirmed | Admin help page: Trusted, Specific Google data, Limited, Blocked; restricted services only reachable by Trusted or Specific data apps. OAuth overview: admin_policy_enforced | none | e21, e15 |
| 27 | (sample, s5) Users may grant Calendar but not Gmail; check granted scopes | confirmed | Granular permissions page uses this exact example | none | e22 |
| 28 | (sample, s8) A compliant brand result must be published within 7 days | confirmed | Sensitive scope page: results are valid for 7 days | none | e8 |
| 29 | (sample, s10) Verification Center: declare scopes, up to three doc links, pick application type | confirmed | Restricted scope page says this | none | e5 |
| 30 | (sample, blocker) Appeal the user cap by requesting verification | confirmed | Audience page names that as the appeal route | none | e14 |
| 31 | (sample, blocker) Fix critical and high findings for a Letter of Assessment; Scout Suite can preview | confirmed | FAQ says both | none | e11 |

## Could not verify
- Production realistic minimum wait of 35 days: no source gives it. Google's own estimate is 6 weeks for restricted scopes plus 2 to 3 business days for branding, and CASA may add time. Resolved by tracking a real submission.
- Exact sensitivity label of each Calendar scope (calendar.events, calendar.readonly, calendar): no official per-scope table was found. Not restricted (e35), probably sensitive. Resolved by adding the scopes on the Data Access page of a test project and reading the console labels.
- CASA lab prices and timelines in 2026: the only source is a vendor comparison labeled as of 2024. Resolved by asking two or three authorized labs for quotes.

## Human setup attempt
Not yet. See docs/MORNING_HANDOFF.md.
