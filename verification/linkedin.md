# Verification: LinkedIn
Date: 2026-10-28 | Verifier: claim-verifier subagent | Claims checked: 34 (load-bearing 29, sampled 5)

## Summary
- Confirmed: 27 | Corrected: 2 | Narrowed: 3 | Downgraded: 0 | Unverifiable: 2 | Removed: 0
- Biggest correction: The guide said everything you read through the Community Management API can be stored only 24 to 48 hours. LinkedIn's Data Storage Requirements table sets limits per data type: 48 hours for member social activity, 24 hours for other members' profile data, no limit for the connected member's own basic profile, and one year for Page analytics.

The tier 3 call holds. LinkedIn's app review page and its separate product catalog page both describe a vetted review that asks for a registered business, a business email, and Page verification. A vendor guide checked in September 2026 agrees. The tier-deciding evidence now has two official LinkedIn pages and one independent source.

## Claims
| # | Claim (as first written) | Verdict | What the sources say | Action | Sources |
|---|---|---|---|---|---|
| 1 | OIDC discovery at /oauth/.well-known/openid-configuration: issuer https://www.linkedin.com/oauth, code only, scopes openid, profile, email | confirmed | Re-probed: HTTP 200, same issuer, endpoints, jwks_uri, and scopes | none | e10 |
| 2 | Authorize endpoint rejects an unknown client ID on an error page | confirmed | Re-probed: HTTP 200, title Authorize, LinkedIn, says the client_id is invalid | none | e11 |
| 3 | PKCE (S256) only for native apps, loopback redirects, LinkedIn must turn it on | confirmed | Native client page says all three; page last updated April 2023 | none | e9 |
| 4 | Tier 3: Community Management needs an application from a registered legal organization | confirmed | App review page: registered legal organizations, commercial use only. Product catalog page asks for an established business and legal details | Added e47 and e48 to verdict | e19, e47, e48 |
| 5 | A Page super admin must verify the app and has 30 days | confirmed | App review page requires super admin verification; help article gives 30 days | none | e20, e14 |
| 6 | Development tier first, then Standard tier with a screencast of each use case | confirmed | Overview and app review page both say so | none | e15, e22 |
| 7 | Sign In with LinkedIn using OpenID Connect and Share on LinkedIn are self-serve | confirmed | Getting Access lists profile, email, w_member_social as open permissions on the Products tab | none | e1, e13, e33 |
| 8 | r_member_social is closed | confirmed | Overview FAQ 6: closed, not accepting requests, resource constraints. Vendor guide agrees | none | e16, e48 |
| 9 | Community Management can only be requested on an app with no other products | narrowed | True for the Development tier request (FAQ 4). FAQ 1 and 5 say you can add it to an existing app after Standard tier approval | Rewrote the app type text | e17, e22 |
| 10 | A rejection at either tier means a new app | confirmed | App review page says this for both tiers; product catalog page agrees | none | e21, e47 |
| 11 | Access tokens last 60 days; codes last 30 minutes | confirmed | 3-legged flow page says both | none | e5 |
| 12 | Programmatic refresh tokens only for approved partners; 365 days from first consent, not extended | confirmed | Flow page: limited set of partners. Refresh page: all approved MDP partners, 365 days, TTL not reset, revocable | none | e6, e8 |
| 13 | Data you read can only be stored 24 to 48 hours | corrected | Restricted uses page gives the 48 hour and "most profile data" 24 hour rule. The storage table is finer: own profile no limit, other members 24 hours, Page reporting one year, organization activity six weeks or six months | Rewrote r11, scope tier, s12, three drafts; added e45 | e28, e45 |
| 14 | Development tier wait: 2 to 6 weeks (vendor blog) | narrowed | Blog says 2 to 6 weeks for an initial response, with follow-ups extending it | Notes now say first response only | e37 |
| 15 | Uncertainty: the vendor blog has no dates | corrected | The blog is dated 12 February 2026; it has no named author | Fixed the uncertainty text | e37 |
| 16 | Standard tier wait: 14 days to unknown; developers report weeks | unverifiable | No source gives a Standard tier timeline. LinkedIn says restricted APIs have no fixed timeline | Removed "developers report weeks"; kept the range as an estimate | e25, e38 |
| 17 | Development tier: 500 calls per app, 100 per member, no BATCH_GET, no webhooks, 12 months to build | confirmed | Increasing Access table and overview FAQ 3 | none | e24 |
| 18 | LinkedIn may decline even if you meet the rules; no fixed timeline | confirmed | Increasing Access says both | none | e25 |
| 19 | Scope tier: openid, profile, email need no review | confirmed | Open permissions on Getting Access | none | e1, e13 |
| 20 | Scope tier: w_member_social needs no review; 150 requests per member per day | confirmed | Getting Access and Share on LinkedIn rate limit table | none | e1, e33 |
| 21 | Scope tier: refresh tokens need partner approval | confirmed | Refresh page: approved MDP partners | none | e8 |
| 22 | Scope tier: Community Management scopes need review | confirmed | Increasing Access lists r_member_postAnalytics, r_member_profileAnalytics, w_member_social_feed, r_organization_social, w_organization_social, rw_organization_admin | none | e23 |
| 23 | Scope tier: Sales Navigator, Talent, Compliance, Company Intelligence are partner only or closed | confirmed | Getting Access: SNAP partner, Talent application, Compliance closed. Increasing Access: Company Intelligence closed | none | e2, e3, e27 |
| 24 | Composio managed OAuth is available for LinkedIn; LinkedIn Ads needs your own app | confirmed | Managed auth table lists LinkedIn as managed and LinkedIn Ads as bring your own. Toolkit page agrees and notes a shared, rate-limited default app | Added e49 | e34, e49 |
| 25 | With managed auth the consent screen says Composio; switching affects new connections only; shared quota and 15 minute polling | confirmed | White-labeling and custom vs managed pages say all of this | none | e35, e36 |
| 26 | Customer-side gate: the member must hold the ADMINISTRATOR role on the Page | narrowed | ADMINISTRATOR is required for rw_organization_admin. w_organization_social also accepts DIRECT_SPONSORED_CONTENT_POSTER and LEAD_GEN_FORMS_MANAGER. Roles are granted only in the UI | Rewrote the gate note; added e46 | e26, e30, e46 |
| 27 | Restricted uses: manage Pages or profiles only, no export, no combining, no sales, recruiting, ads, or social feeds | confirmed | Restricted uses page says all of this | none | e28, e29 |
| 28 | Live discovery issuer differs from the docs sample issuer | confirmed | Docs sample shows https://www.linkedin.com; live document shows https://www.linkedin.com/oauth | none | e10, e13, e44 |
| 29 | An app is tied to one Page for good | confirmed | Help article: permanently associated, cannot be transferred | none | e14 |
| 30 | (sample, s2) App form asks for name, Page, privacy policy URL, logo, and API terms | unverifiable | Official pages confirm the Page choice and the name rule. Privacy policy URL, logo, and terms checkbox appear only in third-party setup guides; the signed-in form was not opened | Kept; listed below | e30, e12, e20 |
| 31 | (sample, s5) Code flow with state, 30 minute exchange, validate the ID token from the discovery document | confirmed | Flow page and Sign In page say so | none | e5, e10, e13 |
| 32 | (sample, s13) Screencast: full OAuth flow, posting, comment display, profile fields; narrate in English | confirmed | App review page lists the test cases. Integrator guide says LinkedIn's email asks for English commentary | none | e22, e38 |
| 33 | (sample, blocker) 403 Not enough permissions on follower statistics, fixed by requesting rw_organization_admin | confirmed | n8n thread, November 2024: the built-in credential lacked the scope; a generic OAuth2 credential with it worked | none | e39 |
| 34 | (sample, blocker) Missing or old Linkedin-Version header fails; 202511 sunsets November 16, 2026 | confirmed | Versioning page: monthly versions, at least one year support, errors for missing or deprecated headers, sunset notice | none | e31 |

## Could not verify
- Standard tier review time: no official or community source gives one. Resolved by logging the dates of a real submission.
- Exact fields on the create app form (privacy policy URL, logo, API terms checkbox): only third-party setup guides list them, and we did not sign in. Resolved by opening linkedin.com/developers/apps/new while signed in.
- Which data type covers member post analytics (r_member_postAnalytics) in the storage table: it could count as member social activity metadata (48 hours) or as reporting data. Resolved by asking LinkedIn Developer Support.

## Human setup attempt
Not yet. See docs/MORNING_HANDOFF.md.
