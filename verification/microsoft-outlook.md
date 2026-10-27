# Verification: Microsoft (Outlook and Calendar via Graph)
Date: 2026-10-28 | Verifier: claim-verifier subagent | Claims checked: 31 (load-bearing 26, sampled 5)

## Summary
- Confirmed: 25 | Corrected: 1 | Narrowed: 3 | Downgraded: 0 | Unverifiable: 2 | Removed: 0
- Biggest correction: The verdict said Microsoft's default policy has blocked user consent to mail and calendar since 2025. The mid-2025 change (MC1097272) covered files and sites only, and we could not open a page that dates the mail and calendar addition, so the summary now says the policy blocks them now, with no date.

The tier 3 call holds, with a caveat. Microsoft does not review the app itself. What Microsoft gates is business verification: when risk-based step-up consent is on (the default), users in other tenants cannot consent to an unverified multitenant app that asks for more than basic sign-in. Publisher verification needs a Partner Center account that passed business verification. That fits our tier 3 definition ("business verification"). The harder gate for mail and calendar read is the customer's admin, which the guide already shows as the customer-side gate flag. We found no source that supports a different tier. The tier-deciding exclusion list has one official source (Manage app consent policies, updated 2026-08-28). A second independent source could not be opened, and an older Microsoft page conflicts, so confidence stays medium.

## Claims
| # | Claim (as first written) | Verdict | What the sources say | Action | Sources |
|---|---|---|---|---|---|
| 1 | OAuth 2.0 with OIDC; PKCE supported | confirmed | Auth code flow page: PKCE recommended for all app types, required for SPAs, plain and S256 supported. Re-probed discovery doc: HTTP 200, /common authorize and token endpoints, no code_challenge_methods_supported field | none | e2, e24 |
| 2 | Account types: Multiple Entra ID tenants, Any Entra ID Tenant + Personal Microsoft accounts; no wildcards or query strings with personal accounts | confirmed | Register app page uses these exact names. Redirect URI page: no query parameters or wildcards for personal-account apps, 100 URI cap | none | e1, e17 |
| 3 | Microsoft-managed user consent policy is the default for new tenants, updates automatically, and excludes Mail.Read, Mail.ReadWrite, Mail.ReadBasic, Calendars.Read, Calendars.ReadWrite | confirmed | Manage app consent policies page says all of this, and lists more mail, calendar, contacts, tasks and Teams scopes | none | e4 |
| 4 | Default policy has blocked mail and calendar consent "since 2025" (verdict summary) | corrected | MC1097272 (June 2025) covered files and sites only. A third-party blog seen in search dates the mail and calendar expansion to November 2025, but it returned HTTP 403 | Summary now says "now", no date; uncertainty updated | e4, e19 |
| 5 | e19: MC1097272 announced the managed policy (cited for the mail block) | narrowed | Article confirms dates and default-settings scope, but the permissions named are files and sites; mail and calendar are not mentioned | Reworded e19; removed it from the Read mail tier | e19 |
| 6 | e20: Q&A user hit admin approval for a delegated scope (cited for the mail block) | narrowed | Thread is about Sites.Read.All; accepted answer cites a third-party blog for the July 2025 change | Reworded e20 to name the scope; removed it from the mail blocker | e20 |
| 7 | Mail.Send is not on the default exclusion list, so it stays user-consentable | confirmed | Not on the current list. MC1304287 (May 2026) added contacts, people and tasks scopes, not Mail.Send | Added e30 to the Send mail tier | e4, e30 |
| 8 | Delegated Mail and Calendars scopes say admin consent No, application versions Yes; delegated ones work for personal accounts; User.Read and offline_access need no admin | confirmed | Graph permissions reference shows exactly this for each scope | none | e3 |
| 9 | Review trigger: unverified multitenant apps registered after 8 Nov 2020 asking beyond basic sign-in cannot get consent from users in other tenants when step-up is on | confirmed | Publisher verification overview says this | none | e7 |
| 10 | Step-up is on by default; risky requests go to admin consent; AADSTS90094 if the workflow is off | confirmed | Step-up consent page says all three | none | e8 |
| 11 | Publisher verification needs a verified partner global account Partner One ID, work account registration, publisher domain not onmicrosoft.com matching the Partner Center email domain or a DNS-verified domain, roles, MFA; free; minutes once ready | confirmed | Overview requirements list and FAQ say all of this | none | e9 |
| 12 | Partner Center checks email, identity, employment, business; Microsoft says 3 to 5 business days in most cases (providerStatedWaitDays 3 to 7) | confirmed | Verification process page, updated July 2026 | none | e10 |
| 13 | Limited stage realistic wait 5 days to unbounded; a forum thread reports about two weeks with resubmissions | confirmed | Thread (2024): manual verification about two weeks, same documents resubmitted three times, support tickets | none | e11 |
| 14 | Prototype: no Microsoft review, zero wait | confirmed | Registration needs only the Application Developer role; no review step on the register page | none | e1 |
| 15 | Production wait 0 days to unbounded, set by each customer admin | unverifiable | No source gives a timeline; inferred | Kept as inferred | e29 |
| 16 | Business documents and a government ID for one user | confirmed | Verification page: identity of at least one user, domain documents, formation documents | none | e10 |
| 17 | Admin consent URL format and roles (Cloud App Admin or App Admin for all but Graph application permissions) | confirmed | Grant admin consent page; also lists AI Administrator | none | e15 |
| 18 | Admin consent workflow: Global Admin turns it on, up to an hour, reviewers emailed, only Global Admins approve Graph application permission requests | confirmed | Workflow page says all of this | none | e14 |
| 19 | Application permissions always need admin consent | confirmed | Graph reference marks application versions Yes; grant page names Privileged Role Administrator | none | e3, e15 |
| 20 | Publisher Attestation is a self-assessment (most in an hour or less); Certification is a yearly audit through Claranet; may be required in some tenants | confirmed | App Compliance overview says all of this | none | e18 |
| 21 | Composio managed OAuth is available for Outlook | confirmed | Outlook is in the Composio-managed table | none | e21 |
| 22 | Switching to your own auth config affects new connections only; users reconnect to move | confirmed | White-labeling page: existing connections keep refreshing with their original config | none | e22 |
| 23 | Reasons to bring your own app: consent screen name, custom scopes, own quota, 15 minute polling floor, enterprise branding | confirmed | Custom vs managed page lists all five | none | e23 |
| 24 | Customer-side gate: admins can disable user consent, limit it to verified publishers and low impact permissions, or allow all; changes affect only future consent | confirmed | Configure user consent page | none | e6 |
| 25 | Second independent source for the mail and calendar exclusion | unverifiable | Topedia blog returned HTTP 403. Vendor pages found do not state it. Microsoft's own Configure user consent page still says users can consent to mailbox access by default, which conflicts | Added e31 and a new uncertainty | e4, e31 |
| 26 | Tier 3, "Review required", is the right label | confirmed | Microsoft gates business verification, not the app. That matches tier 3's "business verification". The admin gate is the customer-side flag | Summary now says Microsoft does not review the app itself | e7, e9, e10 |
| 27 | (sample, s1) Register in Entra ID, App registrations, New registration; pick Any Entra ID Tenant + Personal Microsoft accounts; copy the client ID | confirmed | Register app page, same path and labels | none | e1 |
| 28 | (sample, s10) Branding and properties, Add Partner ID to verify publisher, Verify and save; blue badge; test with prompt=consent | confirmed | Mark app as publisher verified page | none | e12 |
| 29 | (sample, blocker) MPNGlobalAccountNotFound means a location ID; use the PartnerGlobal ID under Identifiers | confirmed | Troubleshooting page says this | none | e13 |
| 30 | (sample, blocker) AADSTS50011 when redirect_uri differs, including case | confirmed | Redirect URI page gives the error text; URIs are case-sensitive | none | e17 |
| 31 | (sample, blocker) invalid_grant after password reset, revocation, or 90 days without use | narrowed | Page gives a 90 day default lifetime, not an inactivity rule. Confidential client tokens are revoked on admin resets in the Entra or Microsoft 365 admin center, not the Azure portal | Reworded blocker cause and e16 | e16 |

## Could not verify
- Production wait set by customer admins: no source gives a timeline. Resolved by logging admin approval times with early customers.
- When mail and calendar scopes joined the managed exclusion list, and a second independent source for that list: the only third-party source we found (Topedia, November 2025) returned HTTP 403, and Microsoft's older Configure user consent page says the opposite. Resolved by trying Mail.Read consent from a fresh default-settings test tenant, or by finding the message center post for the November 2025 change.
- Hands-on hour ranges for each stage: no source states them. They are estimates.

## Human setup attempt
Not yet. See docs/MORNING_HANDOFF.md.
