# Verification protocol

The assignment asks us to check a sample of the guidance against real sources or setup attempts, and show what we learned, corrected, or could not verify. This is a core deliverable, not an afterthought. Reviewers will read these files.

## Pipeline per seed

1. **First pass.** If `ANTHROPIC_API_KEY` is set: run the live generator (`npm run generate -- "<app>"`) and save its output as `verification/raw/<slug>.v1.json`. This lets us measure the generator itself. If no key: the `oauth-researcher` subagent writes the first pass and we note that the eval was skipped.
2. **Deep research.** `oauth-researcher` subagent produces the seed guide `data/guides/<slug>.json`, using the v1 output only as a starting point and re-checking everything per `docs/RESEARCH_PLAYBOOK.md`.
3. **Independent check.** `claim-verifier` subagent, fresh context, gets only the seed JSON (not the researcher's notes). It checks:
   - All load-bearing claims: OAuth support, tier and its deciding factor, what triggers review, each stage's wait range, requirements for production, scope tier classification, managed app status, customer-side gate.
   - A random sample of 5 other claims (steps, blockers).
   For each: open the cited URL, confirm it says this, and for tier-deciding claims look for a second independent source.
4. **Verdict per claim:** `confirmed` / `corrected` (wrong, fixed) / `narrowed` (overstated, made more precise) / `downgraded` (sourced → inferred, because the page does not say it) / `unverifiable` (kept as uncertainty) / `removed`.
5. **Apply.** Edit the seed JSON, add `changelog` entries (what changed, why, evidence ids), re-run schema tests.
6. **Log.** Write `verification/<slug>.md`:

```md
# Verification: <App>
Date: <date> | Verifier: claim-verifier subagent | Claims checked: N (load-bearing L, sampled S)

## Summary
- Confirmed: x | Corrected: y | Narrowed: z | Downgraded: w | Unverifiable: u | Removed: r
- Biggest correction: <one sentence>

## Claims
| # | Claim (as first written) | Verdict | What the sources say | Action | Sources |
|---|---|---|---|---|---|

## Could not verify
- <claim>: <why>, <what would resolve it>

## Human setup attempt
Not yet. See docs/MORNING_HANDOFF.md.
```

## Lessons → prompt changes

After all seeds are verified, write `docs/LESSONS.md`: recurring error patterns across apps (e.g. "overstated review times", "confused app types", "cited search snippets not pages", "missed customer-side gates"). For each pattern, the prompt change made in `lib/agent/prompts.ts` (bump `PROMPT_VERSION`).

Then re-run the generator on 2 seeds with the new prompt (`verification/raw/<slug>.v2.json`) and run `npm run eval`.

## Eval (`scripts/eval.ts` → `docs/EVAL.md`)

Compare each `raw/<slug>.vN.json` against the verified seed on fields that matter to the developer:

| Field | Match rule |
|---|---|
| `oauth.support` | exact |
| `verdict.tier` | exact; also report off-by-one |
| `verdict.customerSideGate` | exact |
| `composio.managedApp` | exact |
| per stage `reviewRequired` | exact |
| per stage `waitDays` | ranges overlap |
| scope tier review levels | share of seed scope tiers whose review level matches the closest generated tier (keyword match on names/scopes) |
| evidence quality | share of evidence with a URL; count of `inferred` |

Output a table per prompt version, plus 3 to 5 sentences: what improved, what did not, what we would do next. Small N, so say so. No inflated claims.

## Human setup attempts (morning, by the human)

Template for `verification/attempts/<slug>.md` (create one blank per seed; the human fills them):

```md
# Setup attempt: <App>
Date: | Account used: personal free / work / other | Total time:

| Guide step id | Did it | Minutes | Matched the guide? | Notes |
|---|---|---|---|---|

## What differed from the guide

## Screenshots
(no client IDs, secrets, emails; blur them)

## Evidence upgraded to "tested"
- e<id>: <claim>
```

Recommended order (fast to slow): GitHub (about 10 min), Slack (about 15 min), Google consent screen up to the verification submission page without submitting (about 20 min). After an attempt, the human (or Claude next session) upgrades matching evidence to `tested` with a note, and adds changelog entries.
