# Product

## Focused scope (and why)

**We help a developer get from Composio's managed OAuth app to their own approved OAuth app before launch.**

Why this scope: Composio users can start building today on Composio's managed apps, with no registration and no review. The pain arrives later, at go-live, when they need their own app (their brand on the consent screen, custom scopes, dedicated quota) and discover it needs review, an audit, a partner application, or their customers' admins to approve it. That is when "an hour or weeks of waiting?" is decided, and nobody tells them early. If we tell them on day 1, they can start the slow parts in parallel while they build, or change what they ask for to avoid the slow parts. The README opens with this paragraph.

## The user

A developer building an AI agent product (example: an inbox assistant that reads Gmail and drafts replies). Their users must connect third-party accounts. They know what OAuth is. They do not know, per provider, what it takes to go from "works for me" to "works for any user", or how long that takes.

The question they actually have is: **"Can I ship with this app, how long will it take, and what will block me?"** Setup clicks are secondary. The guide leads with the decision, then the path, then helps them track progress along it.

### Why agents make this harder

AI agents tend to need exactly what providers guard most: broad read access to user data, long-lived refresh tokens so they can act while the user is offline, and sometimes admin-level access. These push an app into the hard tiers. So the guide asks what the agent needs to do and shows the difficulty for that use case, not a generic one.

## Mental model we teach (put this on /about, in plain words)

1. **Provider OAuth app**: one registration per product (per developer), made in the provider's developer portal. It holds the client ID, secret, redirect URIs, requested scopes, and the name and logo users see on the consent screen. The provider reviews this app, not each user.
2. **The developer's integration** (in Composio terms, an auth config) points at one OAuth app: either Composio's managed app or the developer's own.
3. **Users' connections** (connected accounts): each end user clicks through the consent screen of that OAuth app and gets tokens. Whether that consent screen works for strangers, shows a warning, or is blocked depends on the app's review status.

So: approval happens once per app, but its effects hit every user connection.

### Managed vs own app (Composio facts, verify and cite in Task 0)

From https://docs.composio.dev/docs/custom-app-vs-managed-app and https://docs.composio.dev/toolkits/managed-auth (as of Oct 2026, re-check):
- Composio registers and maintains OAuth apps for many toolkits. Developers can start with zero setup.
- Users then see Composio's name on the consent screen. Managed apps share quota across Composio users. Managed auth has a 15-minute minimum polling interval for triggers.
- Reasons to bring your own app: your branding on consent, custom scopes beyond defaults, dedicated rate limits, faster polling, custom instances (e.g. a private Salesforce subdomain), enterprise branding demands.
- You can mix per toolkit, and import existing managed connections into your own auth config later.
- Some toolkits have no managed app; then you must register your own.

Every guide answers "Can you start today?" (managed app available, yes/no/unknown) and then "What does it take to switch to your own app before launch?" The UI makes this prominent.

## Product principles

1. **Decision first.** Top of guide: tier, one-sentence verdict naming the single deciding factor, the next action.
2. **Hands-on time and waiting time are different things.** Always show both, separately, as ranges. "1 hour of work, 2 to 6 weeks of waiting" is the most important sentence on hard guides.
3. **What the provider says vs what developers report.** Where they differ, show both: "Google says 3 to 5 days. Developers report 2 to 6 weeks." Never blend them into one number.
4. **Your use case decides the difficulty.** The same provider can be tier 1 or tier 4 depending on what you request. The developer picks what their agent needs (chips below); the guide highlights the matching scope tier and shows the tier for that choice. Default selection: read + write.
5. **Stages, not a single path.** Prototype (just you or test users) → Limited (a few external users / beta) → Production (anyone). Each stage has its own work, wait, and who-can-connect.
6. **A guide is also a plan.** Steps and requirements are checkable. Progress is stored in the URL (`?done=s1,s4,r2`), so sharing the link shares where the team is. "Your next step" updates to the first unchecked step. No accounts needed.
7. **Evidence is visible.** Every claim carries a badge: Tested (a human did it), Probed (our agent hit the live endpoint), Sourced (official or reputable page, linked), Inferred (reasoning, no direct source). Plus a "What we don't know" section.
8. **Show how far we got.** Each guide shows the deepest level of attempt reached, as a 4-step indicator: Docs read → Endpoints probed → Portal pages checked → Set up by a person. Derived from the evidence, not hand-set.
9. **Agent does what it can, and says where you take over.** Steps are tagged Agent / You / Provider (waiting). The agent also drafts the paperwork: scope justifications, app description, demo video script, privacy policy checklist, a support email. Humans must do sign-ins, 2FA, DNS for domain verification, legal attestations, business documents, payments, recording videos.
10. **Share-ready.** Stable URL, Copy as Markdown (paste into a ticket or Slack), clean print view. No login.

## Use-case chips

| Chip | Meaning | Typical effect |
|---|---|---|
| Read data | Read the user's content (mail, messages, files, records) | Often triggers review on consumer-data providers |
| Write data | Create or change content (send, post, update) | Usually lighter than read, sometimes not |
| Act while offline | Keep working without the user present (refresh tokens, background jobs) | Can trigger token limits on unverified apps |
| Admin-level | Org-wide or admin-consent permissions | Brings in customer-side gates |

Each scope tier in a guide is tagged with the chips it serves. Selecting chips highlights matching rows and shows the hardest matching tier as "your tier".

## Difficulty tiers (deciding factor = what you wait on)

| Tier | Label | Meaning | Typical wait (rough, check per guide) |
|---|---|---|---|
| 1 | Self-serve | Register and any user can connect. No review. | none |
| 2 | Self-serve, optional review | Works for any user without review; review only for a public directory or marketplace listing, or for higher limits. | none to launch |
| 3 | Review required | Provider must approve before non-test users can connect (verification, app review, business verification). | days to weeks |
| 4 | Review + external audit | Review plus a third-party security assessment, often paid and recurring. | weeks to months |
| 5 | Gated | Needs a partner application, paid tier, or business approval that may be refused. | unknown, may never happen |

The waits in this table are rough orientation for the legend only. Guides must use researched, cited ranges, never these.

Modifier flag (any tier): **Customer-side gate**: your users' admins may need to approve or allowlist your app (enterprise tenants, org OAuth policies). Shown as a badge, because it blocks real deals even when the provider approves.

## Seed apps (7 archetypes, each a different challenge)

The "hypotheses" are things I believe but have NOT verified. Treat them as questions to research, never as facts. Correct them freely.

| Slug | App | Challenge | Hypotheses to verify |
|---|---|---|---|
| `github` | GitHub | Baseline easy, but you must pick the right app type; org owners can block | OAuth App vs GitHub App is the real decision; no review for either; Marketplace listing optional; organizations can restrict third-party OAuth app access, so org owners may need to approve. |
| `slack` | Slack | Works anywhere, but limited unless listed (agent-specific catch) | Install to your own workspace instantly; distributing to other workspaces needs public distribution turned on; Marketplace listing is optional and reviewed; recent rate-limit rules may treat non-Marketplace commercial apps differently for reading message history. |
| `google-gmail` | Google (Gmail + Calendar) | Scope-triggered review plus a paid, recurring security audit | Gmail read/modify scopes are "restricted" and need verification plus a third-party security assessment; Calendar scopes are "sensitive" and need verification without the audit; unverified apps in testing mode are capped at a small number of test users and refresh tokens expire quickly; verification needs domain ownership, privacy policy, homepage, demo video. |
| `meta` | Meta (Instagram / Facebook / WhatsApp) | Business verification plus per-permission review with screencasts | Advanced access to most permissions needs App Review with a screencast per permission; business verification with company documents is required; periodic data use checkups; Instagram API access depends on account type (business/creator). |
| `microsoft-outlook` | Microsoft (Entra ID / Graph: Outlook, Calendar) | Your customer's admin is the gate | Multi-tenant app registration is self-serve; publisher verification (needs a partner program ID) affects whether users in other tenants can consent; many enterprise tenants require admin consent; some scopes always need admin consent. |
| `salesforce` | Salesforce | One app, many customer instances; paid review only for listing | Connected app (or a newer app type, check for recent changes to how new apps are created) works across customer orgs; each customer has their own login domain, and sandbox vs production use different login URLs; customer admins can restrict connected apps; AppExchange listing needs a paid security review. |
| `linkedin` | LinkedIn | Partner gate that may never open | Basic sign-in and posting products are self-serve; most other APIs (community management, marketing, etc.) need an application and approval that is often refused. |

If time runs short, drop in this order: slack, then linkedin. Never drop google, meta, or microsoft: they carry the hardest and most distinct challenges. Backups if one seed proves unworkable: Zendesk (per-subdomain OAuth clients), Notion (tier 1), X (paid API tiers), HubSpot.

## Pages

- `/`: one-line pitch, search + "Generate a guide" input (name or URL), tier legend, library grid of the verified seeds (marked Verified), plus a short "Recently generated" list. Filter by tier.
- `/guides/[slug]`: the guide (section order below).
- `/generate`: live progress view (or an inline panel on `/`), then navigates to the guide.
- `/about`: focused scope, mental model, managed vs own, tiers, evidence legend, attempt levels, method (how guides are made and checked), how this scales to 100, limitations.

## Guide page section order

1. Header: app name, website, tier badge + label, verdict sentence, customer-side gate badge if any, confidence, attempt-depth indicator, "Researched <date>", evidence counts (e.g. 3 probed, 14 sourced, 4 inferred, 0 tested), Verified-seed or Live-generated badge.
2. **Your next step**: the first unchecked step, one concrete action. Progress bar (x of y steps).
3. **What does your agent need to do?**: use-case chips; shows "your tier" for the selection.
4. **Start today?**: Composio managed app status + what switching to your own app involves.
5. **Time and effort**: per stage: who can connect, hands-on hours, waiting days (provider says / developers report), review needed.
6. **Scopes decide the difficulty**: scope tiers table, rows highlighted by the selected chips.
7. **What you need before you start**: requirements checklist (checkable, per stage).
8. **Steps**: ordered, grouped by stage, checkable, each with owner tag, estimate, link, evidence badge.
9. **If you get stuck**: blockers.
10. **What the agent did and drafted for you**: probes run, plus drafts (copy buttons).
11. **What we don't know**: uncertainties and how to resolve each.
12. **Sources**: list with titles, URLs, retrieved dates.
13. **Changes after verification** (seeds only): changelog of corrections.

## How this scales to 100 (roadmap, not built; put on /about and in the README)

1. Generate all 100 with the live agent (about 2 minutes and a few cents each).
2. Verify only the tier-deciding claims with an independent checker agent; flag disagreements for a human.
3. Human setup attempts for the top 20 apps by Composio usage, so those reach "Set up by a person".
4. Re-check monthly, because provider policies change. Diff each new run against the stored guide; send changed tier-deciding claims to a human.
5. Let developers report "this step was different for me" on a guide, and route reports into the next re-check.

## Non-goals (say so in README)

User accounts, editing guides in the UI, automated sign-in or form filling on provider portals, a 100-app catalog or 100 pre-generated guides (roadmap only), multi-language, scheduled freshness checks.

## Stretch (only after Definition of Done)

1. Up to 2 more apps from the backup list, badged "Live, not verified" unless verified.
