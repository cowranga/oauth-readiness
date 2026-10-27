# Lessons: what verification taught us, and what changed in the prompt

Two sources of lessons:
1. **Verifying the seed guides.** A claim-verifier agent with fresh context re-checked every tier-deciding claim against its cited page. See `verification/<slug>.md`.
2. **Comparing the live generator's first pass (prompt v1) with the verified seeds.** See `verification/raw/<slug>.v1.json` and `docs/EVAL.md`.

Each lesson below names the change it caused. Prompt changes live in `lib/agent/prompts.ts` (`PROMPT_VERSION = "v2"`). Code changes are enforced the same way on every run.

## From verification: most errors were overstatements, not wrong facts

Across the verified seeds, the verifier confirmed most claims. Of the changes it made, "narrowed" was the most common verdict, well ahead of "corrected". The per-app counts are in each log and the totals are in README.md. The guides were mostly right but said things a little stronger than the sources do.

| # | Pattern | Example | Change |
|---|---|---|---|
| 1 | Numbers rounded up or made firmer than the source | A forum report of a review wait of "about 4 months" became "over 4 months". Slack states only upper limits (up to 10 business days, then up to 10 weeks), and the guide said "2 to 12 weeks". "Many workspaces require approval", when approval is off by default. | Prompt v2: report numbers exactly as the source gives them; if a source gives only an upper bound, write "up to". |
| 2 | Vendor or blog tables presented as "developers report" | Google CASA lab timelines came from one vendor's comparison table and were labeled as developer reports. | Prompt v2: a vendor or blog table is community evidence, not "developers report", unless it describes real reports. |
| 3 | Dates attached to changes without a source for the date | Microsoft: "blocked since 2025". The mid-2025 change was about files and sites, and no page we could open dated the mail and calendar addition. | Prompt v2: only give a date for a policy change if a page you opened states that date. |
| 4 | "Optional review" read as "no review" | GitHub Marketplace was described as having only requirements. GitHub's own page says listings are reviewed. | Prompt v2: optional listings still have requirements and timelines; list them. |
| 5 | Conflicting official pages resolved silently | Meta: Access Verification is "no longer required" on one page and still listed as a step on another. Microsoft: an older page says users can consent to mailbox access. | Prompt v2: when two official pages disagree, cite both and add an uncertainty. |
| 6 | Waits with no source | Google production minimum of 35 days; Meta 1 to 8 weeks. Both were the researcher's estimates. | Prompt v2: every wait range must point at evidence; unsourced estimates say "our estimate" and use an inferred item. |

## From the first-pass generator (v1) against the seeds

v1 got the tier exactly right for 5 of 7 apps, and within one tier for all 7. Both misses were under-estimates (Microsoft 2 vs 3, LinkedIn 2 vs 3). The bigger problem is what it left out. These checks look for whether a v1 guide mentions the fact at all:

| Fact a developer building an agent needs | In v1? |
|---|---|
| Slack: non-Marketplace apps limited to 1 history call a minute | yes |
| Salesforce: new connected apps can no longer be created; use External Client Apps | yes |
| GitHub: August 2026 expiring OAuth tokens | yes |
| Google: test users' access expires after 7 days, which breaks a background agent | **no** |
| Meta: you need a successful API call per permission in the last 30 days before you can request review | **no** |
| Microsoft: tenant default consent settings stop users from approving mail and calendar scopes | **no** (this caused the tier miss) |
| LinkedIn: reading a member's own posts (`r_member_social`) is closed | **no** (this caused the tier miss) |
| Slack: PKCE is supported (GA March 2026) | v1 said "unknown" |

| # | Pattern | Evidence | Change |
|---|---|---|---|
| 7 | Thin research | v1 runs made 0 to 2 web searches and had 2 to 7 sourced items, against 28 to 44 evidence items in the seeds. Runs finished in 45 to 68 seconds, well under the 80-second research budget. | Prompt v2: at least two searches, one for recent changes, and at least 5 pages opened before submitting. The time budget was not the limit, so it is unchanged. |
| 8 | Missed the agent-specific traps | The four "no" rows above: testing-mode token expiry, prerequisites to request review, tenant consent defaults, closed read scopes. | Prompt v2: a new "Agent-critical checks" section asks each of these explicitly. |
| 9 | Under-tiered when the gate is a default setting, not a review | Microsoft: the scope reference says "admin consent required: No", but tenant defaults block it. | Prompt v2: "Check the provider's current default consent settings, not only the scope reference." |
| 10 | Probes run but not cited | The Notion run made 3 probes and cited none, so the guide showed only "Docs read". | Code: `addProbeEvidence` records every probe the run made as probed evidence. Not left to the prompt. |
| 11 | Portal probe overclaimed | "Loads without sign-in" for a client-rendered page that asks for sign-in in a browser. | Code: `interpretProbe` now says only what the HTTP response shows. |
| 12 | Cited pages it never opened | Hard rule 3 forbids this. Prompts alone do not guarantee it. | Code: `auditEvidence` downgrades any live "sourced" claim whose URL was not fetched during the run, and any "probed" claim without a matching probe. |

## What is not yet measured

Prompt v2 has not been run live. The API account ran out of credits before the v2 re-runs (see PROGRESS.md, Blocked). `scripts/live-tests.sh` runs v2 on Microsoft and LinkedIn, the two apps v1 under-tiered, and refreshes `docs/EVAL.md`. Until then, the v2 changes are untested hypotheses.
