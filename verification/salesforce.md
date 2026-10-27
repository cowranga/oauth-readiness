# Verification: Salesforce
Date: 2026-10-28 | Verifier: claim-verifier subagent | Claims checked: 32 (load-bearing 27, sampled 5)

## Summary
- Confirmed: 22 | Corrected: 2 | Narrowed: 6 | Downgraded: 0 | Unverifiable: 2 | Removed: 0
- Biggest correction: The verdict said nothing in the unlisted path needs Salesforce approval. That is true mechanically, but Salesforce's own pages call an unreviewed package "not authorized for distribution", and the security review page says a not approved solution cannot be distributed to customers. The summary now names the install notice, and the open question about selling without review cites this wording.

The tier 2 call holds, with that caveat. Two official pages (the Trailhead ECA unit and the canvas packaging guide) describe the Packaged ECA in a 2GP managed package that customer admins install. The 1GP and 2GP packaging guides both show that an unreviewed package still installs, after the customer confirms a notice. An independent 2019 Stack Exchange answer says unreviewed managed packages install and work. Salesforce Help pages (help.salesforce.com) did not load for the verifier; developer.salesforce.com returned 403 to a plain fetch and was read through a text reader proxy (r.jina.ai), which is an unauthenticated GET.

## Claims
| # | Claim (as first written) | Verdict | What the sources say | Action | Sources |
|---|---|---|---|---|---|
| 1 | OAuth 2.0 with OIDC; PKCE supported, S256 only | confirmed | Re-probed both discovery documents: HTTP 200, issuer set, code_challenge_methods_supported is S256 only, 39 scopes | none | e18, e20 |
| 2 | Authorize endpoint rejects an unknown client with invalid_client_id, no redirect | confirmed | Re-probed: HTTP 400, error=invalid_client_id, no redirect | none | e19 |
| 3 | Tier 2: Salesforce does not approve your app; each customer admin installs a Packaged ECA in a managed package; review only for AgentExchange or Group and Professional | narrowed | Packaging path confirmed. Unreviewed packages install after a notice and work. But Salesforce calls them "not authorized for distribution", and the review page says a not approved solution cannot be distributed to customers. Professional with the API add-on needs no review | Summary rewritten to name the install notice and "without the API add-on"; added e31, e32, e33, e34 to verdict | e3, e5, e13, e31, e32, e33 |
| 4 | New connected apps cannot be created since Spring '26; contact Support if you must | confirmed | REST guide: creation restricted as of Spring '26, existing apps keep working, contact Support. ISVforce guide: you can't create new ones. Torii: off by default in UI and Metadata API | Added e34 as independent source | e1, e2, e34 |
| 5 | ECAs are Local (own org only) or Packaged (2GP, distributable); connected apps were global by default | confirmed | Trailhead says exactly this. Nango's guide uses the same two states | none | e3, e24 |
| 6 | Consumer credentials are global settings, not packaged, kept in a long-lived org; local credentials break the association | confirmed | Trailhead package unit says all of this | none | e4 |
| 7 | Managed 2GP via Salesforce CLI and a Dev Hub with a namespace that cannot change; default policies are admin-editable | confirmed | Canvas packaging page lists these steps | none | e5 |
| 8 | Uninstalled connected apps blocked for most users since September 2025; prior users keep access except device flow; two bypass permissions | confirmed | Admins blog (Aug 25, 2025) says all of this; Torii repeats it | none | e6, e34 |
| 9 | Partner apps used by more than two customer production orgs must enable PKCE, rotation, 30-day idle limit, IP allowlist (256 addresses), self-attest, locks; due May 11, 2026; risk of delisting or suspension | narrowed | All confirmed on the ISVforce page. The page also says to enable the IP allowlist only if the callback is not localhost, a Salesforce org, or a custom scheme, and that IP ranges stay editable after attestation | r7 and s10 updated | e14 |
| 10 | Security review needed to distribute on AgentExchange; prerequisites: ISV Partner Program, Lightning Ready, Partner Console, provider profile, scanners, Developer Edition test org | confirmed | Review page lists each item; the test org is required "for most submissions" | none | e10, e11 |
| 11 | $999 per attempt for a paid solution, no fee for free | confirmed | Trailhead: $999 for the initial submission and each later attempt. Review page: free solutions pay no fee | Added "most pass on the second attempt" to e12 | e10, e12 |
| 12 | Provider-stated 4 to 6 weeks: 1 to 2 weeks verify, 3 to 4 weeks test, 2 to 3 weeks per retest | confirmed | Review page table gives these and calls them estimates | none | e10 |
| 13 | Plan for 2 to 4 months if you list, because two or three rounds are common | narrowed | No source gives 2 to 4 months. Tekunda mentions "two or three round trips" for first-timers; Trailhead says most pass on the second attempt | Production notes label it our estimate and add the Trailhead line | e10, e12, e25 |
| 14 | API access on by default in Enterprise, Performance, Unlimited, Developer; Professional needs add-on; API_DISABLED_FOR_ORG; users need API Enabled | confirmed | Supported Editions page says all of this | none | e8 |
| 15 | Group and Professional Edition customers need a security-reviewed app | narrowed | True for Group, and for Professional without the add-on. After review you can request an API token or REST allowlisting; Bulk API 2.0 stays off | Verdict summary now says "without the API add-on" | e8, e9 |
| 16 | Unauthorized managed packages show an install notice the customer must confirm (note: 1GP page, 2GP assumed) | confirmed | Same text exists in the 2GP packaging guide | e13 note updated; e31 added to s8 and the blocker | e13, e31 |
| 17 | Prototype and limited stages have no Salesforce wait | confirmed | Developer Edition is self-serve; unreviewed packages install with a notice. Customer approval time is unmeasured, as the guide says | none | e8, e13, e33 |
| 18 | All scope tiers have review level none | confirmed | No source ties review to scopes. Review is triggered by AgentExchange distribution and Group or Professional API access | none | e10, e9, e18 |
| 19 | Scopes openid, profile, email, id, api, refresh_token, offline_access, full exist | confirmed | All present in the live discovery document | none | e18 |
| 20 | Composio managed OAuth is available for Salesforce | confirmed | Listed in the managed table; toolkit page says "Composio-managed OAuth available" | none | e21, e29 |
| 21 | Salesforce Service Cloud is a separate toolkit that needs your own app | confirmed | Its toolkit page says Composio-managed OAuth not available | none | e21 |
| 22 | Switching auth config affects only new connections; private subdomains are a reason to bring your own app | confirmed | White-labeling FAQ and custom vs managed page say both | none | e22, e23 |
| 23 | Open question: does Composio's managed app need customer admin approval? | corrected | Composio's Salesforce FAQ: users may see "app must be installed into org"; an org admin must approve or install the app | Composio note updated; open question removed | e29 |
| 24 | API Access Control is on by Support request; allowlisted apps only; Use Any API Client users bypass it | corrected | Help page did not load. A community post reports Salesforce deprecated the Use Any API Client bypass within API Access Control in October 2025 | Bypass line removed from e7; gate note says no user-level bypass | e7, e30 |
| 25 | ECA OAuth settings: callback must match (2000 chars), Require PKCE, new refresh token on each refresh | unverifiable | help.salesforce.com did not load. ISVforce page confirms PKCE and rotation are ECA OAuth settings | kept | e15, e14 |
| 26 | OAuth hosts: login.salesforce.com, My Domain, Experience Cloud, custom; test.salesforce.com for sandboxes | unverifiable | Help page did not load. Probes confirm login and test hosts are live with separate issuers | kept | e17, e18, e20 |
| 27 | AgentExchange is "the marketplace formerly called AppExchange" | narrowed | The review page uses only AgentExchange; no page read states the rename | e10 reworded | e10 |
| 28 | (sample, s2) In Setup, search External Client App Manager and click New External Client App | narrowed | CLI guide starts from App Manager; key and secret are on the Settings tab under External Client App Manager after an emailed code | s2 rewritten | e16 |
| 29 | (sample, s5) Enabling Dev Hub cannot be undone; register the namespace in a separate org and link it | confirmed | Nango guide says both; canvas page says the namespace cannot be changed | none | e24, e5 |
| 30 | (sample, s7) Create a package version, promote it, copy the install URL | confirmed | Canvas page: new versions are beta until released; Nango: install URL is returned | none | e5, e24 |
| 31 | (sample, blocker) API_DISABLED_FOR_ORG: buy the add-on or pass review and request API access | confirmed | Editions page and Group and Professional page | none | e8, e9 |
| 32 | (sample, blocker) Not Approved: common findings are CRUD/FLS, sharing, MFA blocking reviewers, secrets; fix every instance | confirmed | Tekunda lists the four buckets; review page says to find and fix all instances of each issue type | none | e10, e25 |

## Could not verify
- ECA OAuth settings details (e15) and OAuth endpoint hosts (e17): help.salesforce.com is a JavaScript app and returned only a loading shell through every route tried. Resolved by opening the pages in a browser, or by the human creating a Local ECA.
- API Access Control turned on by Support request (e7): same reason. The Use Any API Client deprecation rests on one community post. Resolved by reading Salesforce Help article 005224855 in a browser.
- Whether you may sell an unlisted managed package before security review: Salesforce calls it "not authorized for distribution" but we found no partner agreement text. Resolved by asking a Salesforce partner account manager.
- Whether resubmissions cost another $999: current Trailhead says yes; an older fee table seen only in search results may say no. Resolved in the Partner Console review wizard.
- The 2 to 4 month estimate if you list: no source gives it. Resolved by first-hand ISV reports with dates.

## Human setup attempt
Not yet. See docs/MORNING_HANDOFF.md.
