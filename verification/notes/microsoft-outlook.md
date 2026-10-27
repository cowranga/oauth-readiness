# Research notes: microsoft-outlook

Researched 2026-10-28 by the oauth-researcher subagent. About 22 page reads plus 3 probes. Nothing here is `tested`.

Scope: an AI agent product that reads and sends Outlook mail and manages calendars through Microsoft Graph, for users from any Entra tenant and personal Microsoft accounts.

## Verdict

Tier 3 (Review required), customer-side gate: yes, confidence medium.

Deciding factor: consent in your customer's tenant. Microsoft's managed default user consent policy (default for new tenants, rolled out to default-configured tenants from mid-July 2025) blocks users from consenting to Mail.Read, Mail.ReadWrite, Calendars.Read, Calendars.ReadWrite and similar delegated scopes, even though Graph lists them as "admin consent required: No". So in a default work tenant, an admin must approve your app before anyone can connect for mail or calendar read access. On top of that, publisher verification (which needs a business-verified Microsoft AI Cloud Partner Program account) is needed for users in other tenants to consent to anything beyond basic sign-in when risk-based step-up consent is on, which is the default.

Why tier 3 and not 2: Microsoft does not review the app itself, but publisher verification depends on Partner Center business verification (Microsoft says 3 to 5 business days, developers report 2 weeks or more). Without it, users in other tenants cannot self-consent to non-basic scopes. That is a provider-side business check you wait on. Personal Microsoft accounts are not affected by tenant policies.

## Findings with sources

### App registration and protocol
- Register in Entra admin center: Entra ID > App registrations > New registration. Account types now labeled "Single tenant only", "Multiple Entra ID tenants", "Any Entra ID Tenant + Personal Microsoft accounts", "Personal accounts only". Needs at least Application Developer role. https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app (page date 2026-05-14)
- Auth code flow: PKCE now recommended for all app types, required for SPAs. Tenant path values: common, organizations, consumers, tenant id. Refresh token returned only if `offline_access` requested. https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow
- Redirect URIs: https required except localhost; localhost port ignored; max 100 URIs for apps with personal accounts (256 for work-only); max 256 characters; no wildcards and no query parameters when personal accounts are enabled. Mismatch error AADSTS50011. https://learn.microsoft.com/en-us/entra/identity-platform/reply-url
- Refresh tokens: 90 days default, 24 hours for SPA redirect type; each use returns a new one, discard the old. Confidential client tokens are revoked when an admin resets the password in the Entra or M365 admin center, or when user/admin revokes tokens. https://learn.microsoft.com/en-us/entra/identity-platform/refresh-tokens

### Permissions
- Graph permissions reference: delegated Mail.Read, Mail.ReadWrite, Mail.ReadBasic, Mail.Send, Calendars.Read, Calendars.ReadWrite all list AdminConsentRequired "No"; the application versions all "Yes". Each delegated one notes it is available for consent in personal Microsoft accounts. offline_access and User.Read: No. https://learn.microsoft.com/en-us/graph/permissions-reference
- Granting Graph application permissions (app roles) needs Privileged Role Administrator; Cloud Application Administrator / Application Administrator can grant anything except Graph app roles. Admin consent URL: `https://login.microsoftonline.com/{organization}/adminconsent?client_id={client-id}`. https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/grant-admin-consent

### Consent policies in customer tenants (the key finding)
- "Let Microsoft manage your consent settings" is the default for new tenants and auto-updates. Current rule: users can consent to any user-consentable delegated permission EXCEPT a list that includes Mail.Read, Mail.ReadWrite, Mail.ReadBasic, Mail.Read.Shared, Calendars.Read, Calendars.ReadBasic, Calendars.ReadWrite, Contacts.ReadWrite, MailboxSettings.*, Files.Read.All, Sites.Read.All, People.Read, plus Exchange EWS/IMAP/POP/EAS AccessAsUser.All. Mail.Send is NOT on the list (as of page update 2026-08-28). A separate managed policy lets users consent to mail scopes only for a short allowlist of mail clients (Apple Mail, Spark, eM Client, Thunderbird, two Android mail apps). https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/manage-app-consent-policies
- Other admin options: allow user consent for verified publishers and low-impact permissions only (microsoft-user-default-low), legacy allow-all-user-consentable, or disable user consent. Changes affect only future consents. https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-user-consent
- Risk-based step-up consent is on by default. Requests for newly registered, unverified multitenant apps asking for non-basic permissions step up to admin consent; without an admin consent workflow the user sees AADSTS90094. https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-risk-based-step-up-consent
- Publisher verification overview: since November 2020 (apps registered after Nov 8, 2020) users in other tenants cannot consent to unverified multitenant apps asking beyond basic sign-in when step-up is on. https://learn.microsoft.com/en-us/entra/identity-platform/publisher-verification-overview
- Admin consent workflow: users can request approval from the consent prompt; reviewers get email; Global Administrator enables it; up to an hour to take effect; only Global Admins approve Graph app roles. https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-admin-consent-workflow

### Dated changes (last 18 months)
- 17 June 2025: Microsoft message center MC1097272 announced a Microsoft-managed app consent policy; rollout mid-July to August 2025; only tenants on default consent settings; not retroactive. Source: community (Office 365 for IT Pros) https://office365itpros.com/2025/06/19/app-consent-policy-user-app-consent/ . Initially about Files/Sites permissions.
- September 2025: developers on Microsoft Q&A hit "Need admin approval" for delegated Sites.Read.All that docs list as not needing admin consent. https://learn.microsoft.com/en-us/answers/questions/5556903/admin-approval-prompt-for-sites-read-all-delegated
- Later expansion to Mail and Calendar scopes: a third-party blog (blog-en.topedia.com, November 2025, and a May 2026 post on 8 more Exchange permissions) reports this, but both returned HTTP 403 to us, so not cited as sourced. The current Learn list (page updated 2026-08-28) does include Mail and Calendar scopes, which is what the guide relies on.

### Publisher verification
- Requirements: Partner One ID of a verified Microsoft AI Cloud Partner Program partner global account (not a location ID); app registered with a work or school account (not a personal account); tenant associated with the PGA; publisher domain set, not *.onmicrosoft.com, and matching the email domain used in Partner Center verification or a DNS-verified custom domain; user with Application Administrator or Cloud Application Administrator in Entra plus CPP Partner Admin or Account Admin in Partner Center; MFA in session. Free. "can be verified in minutes" once prerequisites are met. Not supported in national clouds or B2C tenants. https://learn.microsoft.com/en-us/entra/identity-platform/publisher-verification-overview
- Steps: App registrations > app > Branding & properties > Add Partner ID to verify publisher > Verify and save. Badge may take time to replicate; test with prompt=consent. https://learn.microsoft.com/en-us/entra/identity-platform/mark-app-as-publisher-verified
- Errors: MPNGlobalAccountNotFound (location ID used), MPNAccountNotVetted, PublisherDomainMismatch, NoPublisherDomainOnApplication, InteractionRequired (MFA), MSANotSupported (registered with personal account), UnableToAddPublisher (risk assessment, retry next day). https://learn.microsoft.com/en-us/entra/identity-platform/troubleshoot-publisher-verification
- Partner Center verification: email, identity (government ID), employment (domain registrar documents), business (registration documents), possibly additional checks. Microsoft says three to five business days in most cases. https://learn.microsoft.com/en-us/partner-center/enroll/understand-the-verification-process
- Community: a Tech Community thread shows manual verification taking about 2 weeks after support tickets (2024). https://techcommunity.microsoft.com/discussions/partnercomplianceforum/stuck-on-employment-verification-with-no-indication-of-issue-or-how-to-fix/3925477/replies/4055303 . Search snippets mentioned waits of two months or more, but I did not open those threads, so they are not cited.

### Microsoft 365 App Compliance (optional)
- Publisher Attestation is a self-assessment, most done in an hour or less. Microsoft 365 Certification is a yearly independent audit with pen testing; contract with Claranet Limited first; "In some cases, certification may be required for apps to be enabled within a Microsoft tenant." Optional from Microsoft's side; some customers may demand it. https://learn.microsoft.com/en-us/microsoft-365-app-certification/overview

### Composio
- Outlook is in the Composio-managed OAuth table. https://docs.composio.dev/toolkits/managed-auth
- Switching to your own auth config: existing connections keep refreshing with their original config; new connections use yours; to move users, they reconnect (or import credentials where supported). https://docs.composio.dev/docs/white-labeling-authentication
- Reasons for your own app: your name on consent, custom scopes, dedicated rate quota, faster polling than the 15-minute managed minimum, enterprise branding. https://docs.composio.dev/docs/custom-app-vs-managed-app

## Probes (3)
1. GET https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration : HTTP 200. Authorization endpoint `/common/oauth2/v2.0/authorize`, token endpoint `/common/oauth2/v2.0/token`, issuer template `https://login.microsoftonline.com/{tenantid}/v2.0`, scopes_supported openid, profile, email, offline_access. No `code_challenge_methods_supported` field (PKCE support comes from the docs instead).
2. GET authorize endpoint with client_id=oauth-guide-probe-invalid : HTTP 200, "Sign in to your account" page, no AADSTS error shown before sign-in. The client id is not validated until after the user signs in.
3. GET https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade : HTTP 403 "Service unavailable" for a scripted, signed-out request. We could not check portal pages.

## Contradictions vs PRODUCT.md hypotheses
- "Some scopes always need admin consent": true for application permissions, but the bigger finding is that delegated Mail and Calendar scopes, which Microsoft lists as not needing admin consent, are blocked from user consent by the default tenant policy. Admin consent is the normal path for work tenants, not an edge case.
- "Publisher verification affects whether users in other tenants can consent": true, but in default-policy tenants it does not unlock Mail.Read or Calendars.Read. It mainly matters for permissions outside the exclusion list (such as Mail.Send) and for tenants that use the verified-publisher policy.
- "Multi-tenant registration is self-serve": confirmed. Note the account-type labels changed in the portal (2026 docs).
- The first-pass generator said publisher verification is "free, quick". The Microsoft step is quick, but the Partner Center business verification it depends on takes days to weeks and needs business documents and a government ID.

## Open questions
- Exact date Mail and Calendar scopes joined the Microsoft-managed exclusion list (third-party blog says November 2025; we could not open it).
- What share of real customer tenants run the Microsoft-managed policy vs custom or legacy settings.
- Whether personal Microsoft account users see an unverified-publisher warning for an unverified app (no source found).
- Whether Composio's managed Outlook app is publisher verified, and how it fares in default-policy tenants.
- Real-world Partner Center verification waits beyond the one community thread.
