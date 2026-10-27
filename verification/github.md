# Verification: GitHub
Date: 2026-10-28 | Verifier: claim-verifier subagent | Claims checked: 31 (load-bearing 26, sampled 5)

## Summary
- Confirmed: 24 | Corrected: 2 | Narrowed: 4 | Downgraded: 0 | Unverifiable: 1 | Removed: 0
- Biggest correction: The guide said the optional Marketplace listing only has requirements. GitHub's submission page says a listing is sent for review and an onboarding expert contacts you, so the verdict summary, production notes, s11, and s12 now say the listing is reviewed (no timeline given).

The tier 2 call holds. Two official pages describe no GitHub review before users connect: the public or private page says any GitHub user can install and authorize a public app, and the Marketplace install page puts vetting on the installer ("you should ensure you trust the owner"). The deciding page for building a GitHub App also mentions no review. The real gate is on the customer side: org owners, OAuth app restrictions on by default in new orgs, and app access requests on by default.

## Claims
| # | Claim (as first written) | Verdict | What the sources say | Action | Sources |
|---|---|---|---|---|---|
| 1 | GitHub supports OAuth 2.0 with PKCE (S256 only), recommended but not required | confirmed | Both the OAuth app and GitHub App token pages accept only S256 and label PKCE strongly recommended | none | e5, e11 |
| 2 | GitHub Apps are generally preferred; OAuth apps still needed for enterprise-level resources | confirmed | Differences page says both | none | e1 |
| 3 | GitHub Apps are exempt from org application policies; OAuth apps need owner approval when a policy is on | confirmed | Differences page says GitHub Apps are not subject to these policies | none | e2 |
| 4 | Tier 2: no GitHub review; a public GitHub App can be installed and authorized by any user | confirmed | Public or private page says any user can install and authorize. Second source: Marketplace install page puts vetting on the installer | Added e33 to verdict | e13, e24, e33 |
| 5 | Only the optional Marketplace listing has requirements; you submit it | corrected | Submission page: listing is sent for review and an onboarding expert contacts you. No timeline | Summary, production notes, s11, s12, uncertainty updated | e19, e32 |
| 6 | Prototype: private app installs only on the owning account, no wait | confirmed | Public or private page says so | none | e12, e13 |
| 7 | Limited beta: GitHub adds no wait; owner approval time has no stated timeline | confirmed | No page gives a duration; e31 stays inferred | none | e13, e14, e31 |
| 8 | Production: no GitHub approval, 0 day wait | confirmed | No official page describes app review outside Marketplace | none | e13, e33 |
| 9 | Marketplace needs privacy policy, support, value beyond auth, public app, webhooks, developer agreement; paid needs verified publisher org, 100 installs (or 200 OAuth users), monthly and annual plans | confirmed | Requirements page and Marketplace overview list all of these | none | e18, e19 |
| 10 | All scope tiers have review level none | confirmed | No GitHub page ties any permission or scope to a review | none | e14, e20, e24 |
| 11 | repo scope is full read and write; no read-only scope for private code | confirmed | Scopes page says so; also says users can edit scopes, check X-OAuth-Scopes | none | e20 |
| 12 | Org permissions or Repository administration mean only an owner can install | confirmed | Third-party install page and differences page | none | e4, e14 |
| 13 | Composio managed OAuth is available for GitHub | confirmed | Listed under managed OAuth on the managed auth page | none | e25 |
| 14 | Bring your own GitHub App for branding, permissions, rate limit; switching affects new connections only | narrowed | Reasons and switching confirmed. Composio's GitHub page adds that users must still install the app and Composio does not give them the install link | Composio note updated, e34 added | e26, e27, e34 |
| 15 | OAuth app access restrictions are on by default for new orgs | confirmed | Page states this in one sentence | none | e10 |
| 16 | Repo admins can install a GitHub App with no org permissions and no Repository administration | narrowed | True, but owners can block repo admins from installing apps | Gate note and e14 updated | e14, e33 |
| 17 | App access requests are on by default; blocking member requests (preview) also stops repo admins installing | corrected | Default and preview confirmed. Repo admin installs are a separate setting; only both together block repo admins | e15 rewritten | e15 |
| 18 | Aug 14, 2026 changelog: OAuth apps can register up to 10 redirect URIs | confirmed | Changelog says up to 10 callback URIs | none | e21 |
| 19 | Changelog: expiring 8 hour tokens with 6 month refresh tokens, on by default for new OAuth apps, or via offline_access | confirmed | Changelog says short-lived tokens are on by default for new apps; existing apps opt in | none | e21, e8 |
| 20 | Wildcard matching per callback URL; on by default for apps with one callback URL before Aug 3, 2026 | confirmed | Callback URL page and authorizing page both give Aug 3, 2026; changelog says it is legacy behavior now visible | none | e7, e21, e22 |
| 21 | User tokens share 5,000 requests per hour per user | confirmed | Rate limit page: PATs, OAuth app tokens, GitHub App user tokens share it | none | e16 |
| 22 | Installation tokens start at 5,000, scale to 12,500, or 15,000 on Enterprise Cloud | confirmed | Rate limit page: plus 50 per repo or user past 20, cap 12,500; Enterprise Cloud installs get 15,000 | s9 now mentions 15,000 | e16 |
| 23 | Secondary limits: 100 concurrent, about 80 per minute and 500 per hour content creation, 2,000 token requests per hour | confirmed | Rate limit page | none | e17 |
| 24 | Registration form: expiring tokens on by default, device flow off | narrowed | Page gives deselect or select instructions, not stated defaults | Defaults moved to e12 note as implied | e12 |
| 25 | Probe: signed-out authorize with invalid client ID redirects to sign-in | confirmed | Re-probed: 302 to github.com/login with return_to | none | e28 |
| 26 | Probe: github.com/settings/apps/new needs sign-in | confirmed | Re-probed: 302 to github.com/login | none | e29 |
| 27 | (sample, s6) Make the app public in Advanced settings | confirmed | Modify registration page: Advanced, Danger zone, Make public | none | e13 |
| 28 | (sample, r3) A public repo or account URL works as homepage | confirmed | Registering page says either is fine | none | e12 |
| 29 | (sample, blocker) GitHub revokes older tokens past 10 per user, app, scope | narrowed | It revokes never-used tokens first, then least recently used; hourly cap triggers re-authorization instead | Blocker and e9 updated | e9 |
| 30 | (sample, blocker) application_suspended means contact Support; omit redirect_uri to use the default | confirmed | Troubleshooting page says both | none | e23 |
| 31 | (sample, r7) Webhooks are on by default | unverifiable | Page says to deselect Active if you do not want webhooks, which implies on, but does not state it | Kept | e12 |

## Could not verify
- Form defaults on the GitHub App registration page (webhook Active, Expire user authorization tokens, device flow): the docs imply them through deselect instructions only. Resolved by opening the form during the human setup attempt.
- Marketplace listing review time: GitHub gives no timeline. Resolved by submitting a free listing and recording dates.
- Personal repos need no approval: no page states this directly. It follows from users installing on their own account. Resolved by the human setup attempt.

## Human setup attempt
Not yet. See docs/MORNING_HANDOFF.md.
