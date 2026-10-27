# Verification: Slack
Date: 2026-10-28 | Verifier: claim-verifier subagent | Claims checked: 34 (load-bearing 26, sampled 8)

## Summary
- Confirmed: 25 | Corrected: 1 | Narrowed: 6 | Downgraded: 0 | Unverifiable: 2 | Removed: 0
- Biggest correction: The guide said agent container apps "should not store" Slack data. Slack's Marketplace guidelines say agent apps may not store the Slack data they obtain, and must store metadata and fetch data in real time, so r9 and e8 now say must not.

The tier 2 call holds. Slack's distribution page says unlisted distributed apps skip the review that Marketplace apps get, and a Salesforce Trailhead page describes public distribution as an Add to Slack button and link with no review step. The history limit (1 request a minute, 15 messages, from May 29, 2025, Marketplace and internal apps exempt) is on Slack's changelog and in an independent news report. The method reference pages for conversations.history and the general rate limit page do not mention the special limit, so the changelog is the only official place it appears.

## Claims
| # | Claim (as first written) | Verdict | What the sources say | Action | Sources |
|---|---|---|---|---|---|
| 1 | Slack uses OAuth v2 at slack.com/oauth/v2/authorize; redirect_uri must be HTTPS, under a configured URL, no #, same in both steps or bad_redirect_uri | confirmed | Installing with OAuth page says all of this | none | e1 |
| 2 | PKCE is supported, GA March 30, 2026; enabling it makes the app a public client, one-way without support; PKCE refresh tokens expire after 30 days | confirmed | PKCE changelog says exactly this | none | e15 |
| 3 | Tier 2: any workspace can install once you activate public distribution, with no Slack review | confirmed | Distribution page: Marketplace apps are reviewed, unlike unlisted distributed apps. Trailhead: activation gives an Add to Slack button and link, no review step named | Added e33 as second source to verdict and limited stage | e2, e33 |
| 4 | From May 29, 2025, new unlisted apps and new installs get 1 request a minute and 15 objects on conversations.history and conversations.replies | confirmed | Changelog: Tier 3 to Tier 1, limit max and default 15. News report gives the same numbers and date | Added e32 as second source | e4, e32 |
| 5 | Internal customer-built apps keep 50+ a minute and 1,000 objects; Marketplace apps are not affected | confirmed | Changelog states both exemptions | none | e4 |
| 6 | Existing installs of unlisted apps are not affected (and a community claim of a March 3, 2026 end date conflicts) | unverifiable | Slack's changelog says existing installs are not impacted and gives no end date. A 2025 news report says existing installs would be limited from September 2, 2025. A community post says March 3, 2026. No Slack source for either date | Uncertainty updated with both dates | e5, e27, e32 |
| 7 | API terms name the Marketplace as the only appropriate channel for commercial distribution; the limit targets bulk exfiltration | confirmed | Changelog FAQ says both. API terms (effective 10 October 2025) point paid apps to Marketplace submission | none | e6, e13 |
| 8 | Unlisted distribution is meant for pilots and early customers | confirmed | Distribution page describes it as for testing with a pilot for early customers, and sends commercial apps to the Marketplace | none | e2 |
| 9 | Review is triggered only by submitting to the Marketplace | confirmed | Distribution page and review guide | none | e2, e10 |
| 10 | Prototype wait 0 days; limited stage wait 0 to unbounded, only on customer admins | confirmed | No review for internal or unlisted apps. Admin approval wait depends on the customer | none | e2, e16 |
| 11 | Slack states up to 10 business days for preliminary review and up to 10 weeks for functional review (6 for updates); resubmitting in preliminary resets the queue; no expediting | confirmed | Review guide says all of this. Once a functional reviewer has the app, resubmitting does not reset your place | none | e10 |
| 12 | Step s13 estimate: 2 to 12 weeks, as Slack states | narrowed | Slack gives only upper limits, no 2 week minimum | Estimate now reads up to about 12 weeks, as Slack states | e10 |
| 13 | Realistic production wait: 14 days minimum, no upper bound | unverifiable | No developer report found that gives real Marketplace review times. The guide already says so | Kept; listed below | e10 |
| 14 | Since July 2026, Marketplace submission needs 10 installs on active workspaces, and you must stay at 10 through review | confirmed | Changelog dated September 1, 2026 says "As of July 2026" and the stay-at-10 rule. Review guide says apps below 10 are blocked from submitting | Added e35 to r6, s11, and production stage | e12, e35 |
| 15 | Active means used in the last 28 days and not a sandbox | confirmed | Guidelines and review guide both define it this way | none | e7, e35 |
| 16 | Privacy policy covers collection, use, retention, and deletion with an email or form; support answers within 2 business days; listing assets (10 word short description, 1600x1000 under 2MB, 30 to 90 second video recommended) | confirmed | Guidelines list all of these | none | e9 |
| 17 | AI apps must not train models on Slack data, must disclose model and retention, and must warn about inaccurate output | confirmed | Guidelines say so, and also ask for data tenancy and residency. API terms bar LLM training | Added tenancy to r9 | e8, e13 |
| 18 | Apps using the agent container should not store Slack data | corrected | Guidelines: agent apps may not store Slack data they obtain; store metadata and fetch in real time | r9 detail and e8 claim now say must not | e8 |
| 19 | *:history scopes get enhanced review | confirmed | Guidelines list *:history, files:read, search:read.*, admin.*, canvases:read, and a few others | none | e7 |
| 20 | search:read and admin.* are restricted and generally rejected; admin.* unlikely outside the partner program | confirmed | Guidelines call admin.*, identity.*, search:read and others restricted or legacy scopes and say not to request them. admin.* approval is unlikely outside the partner program | none | e7 |
| 21 | Composio lists Slack and Slackbot with managed OAuth | confirmed | Managed auth page lists both under Composio-managed OAuth available | none | e21 |
| 22 | When you switch to your own app, existing users stay on the old one until they reconnect | narrowed | White-labeling page also offers importing credentials where supported | Composio note and e22 mention import | e22 |
| 23 | Reasons to bring your own app: your name on the consent screen, custom scopes, own quota, polling faster than 15 minutes | confirmed | Custom app vs managed app page gives all four | none | e23 |
| 24 | Workspace owners can require approved apps; members then request and owners or app managers approve | confirmed | Help article says this, and that approval is off by default | none | e16 |
| 25 | On Enterprise Grid an org policy turns on approval; org-wide installs need an Org Admin who picks workspaces | confirmed | Help article and Enterprise orgs page both say this | none | e16, e17 |
| 26 | Step s10: many workspaces require app approval | narrowed | Help article says members can install without approval by default. How common approval is, is not stated | Now says some workspaces, and that it is off by default | e16 |
| 27 | Token rotation: 12 hour access tokens, single-use refresh tokens, cannot be turned off; no expiry without rotation | confirmed | Token rotation page says all of this | none | e14 |
| 28 | Blocker: reusing a refresh token gives invalid_refresh_token | narrowed | Token rotation page says the second refresh fails but names no error code | Symptom now says token refresh fails | e14 |
| 29 | Step s8: the distribution checklist includes no hard-coded tokens | narrowed | Distribution page names OAuth and SSL as preparation. It does not mention hard-coded tokens | Removed that item from s8 | e2 |
| 30 | Step s3: turning on the Agents & AI Apps feature adds assistant:write | narrowed | assistant:write scope page does not say this. Slack's agent docs now call it the Agents feature and list the scope with it; some AI features need a paid plan | s3 now says turn on Agents and check the scope is present | e18, e34 |
| 31 | Apps with scopes beyond bot, incoming-webhook, commands, identify are uninstalled when the installing user leaves or becomes a guest | confirmed | Distribution page says this | none | e3 |
| 32 | Org opt-in needs a bot scope like team:read and Org Level Apps opt-in; some scopes fail with scope_not_allowed_on_enterprise | confirmed | Enterprise orgs page and OAuth page say this | none | e1, e17 |
| 33 | channels:history covers conversations.history, conversations.replies, and message.channels events | confirmed | Scope page lists these methods and events, for bot and user tokens | none | e19 |
| 34 | Real-time Search API and MCP server announced February 17, 2026; optional scopes March 16, 2026 | confirmed | Both changelog entries say so | none | e26, e30 |

## Could not verify
- Whether older installs of unlisted apps now get the reduced history limit: Slack's changelog says no and gives no date, while two third-party sources give different end dates (September 2, 2025 and March 3, 2026). Checking the response size on an old unlisted install, or asking Slack developer support, would resolve it.
- Realistic Marketplace review time: Slack states only upper limits and we found no developer report with real dates. The estimate on your app's submission page, or other Slack partners, would resolve it.
- The probes in e24 and e25 were not re-run. They are unauthenticated GETs and low risk, but they reflect the researcher's run only.
- Reading new messages through events to avoid the history limit (e31) stays inferred. The Marketplace rule that agent apps may not store Slack data limits how much of this you can cache.

## Human setup attempt
Not yet. See docs/MORNING_HANDOFF.md.
