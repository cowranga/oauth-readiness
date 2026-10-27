# Live generation tests

Model `claude-sonnet-5-5`, run with `npm run generate`. Durations are wall-clock for the whole run.

**Status:** 2 of the 6 required cases ran live before the API account ran out of credits at about 02:10 UTC on 2026-10-28 ("Your credit balance is too low"). The other 4 are scripted in `scripts/live-tests.sh` and need about 8 runs once credits are added. I have not filled in results for runs that did not happen.

## Required cases

| # | Input | Duration | Tier | Made sense? | Issues found | Fix |
|---|---|---|---|---|---|---|
| 1 | `Notion` (no seed guide) | 43.4s | 2 | Yes. Correct deciding factor: a public connection works for any workspace, and only a Marketplace listing is reviewed. It picked the right app type and added a reconnect step for existing Composio users. | Ran 3 probes but cited none, so the guide showed only "Docs read". Portal probe said the page "loads without sign-in" for a page that renders sign-in in the browser. | Probe findings are now always recorded as probed evidence (`addProbeEvidence`). Portal wording now says only what the HTTP response shows. |
| 2 | `https://www.figma.com` (URL) | not run | | | Blocked on API credits. Offline: URL parsing to `figma.com` / "Figma" is unit-tested (`tests/normalize.test.ts`). | |
| 3 | `Google` (ambiguous) | not run | | | Blocked on API credits. Without `fresh`, "Google" opens the verified Google (Gmail + Calendar) guide through the seed alias table. The prompt tells the agent to pick Gmail and Calendar and name the alternatives. | |
| 4 | `OpenAI API` (no OAuth, API keys only) | not run | | | Blocked on API credits. Offline: postprocess rule 9 (no-OAuth summary, tier 1, "No OAuth" badge) is unit-tested. | |
| 5 | `Blorpify Zzz <pid> !!` (nonsense) | under 30s | none | Yes. No guide was written. The user saw: "We could not find an app called ... I searched for an app called ... and found no matching product, company, or public API." | The reason was cut off mid-word ("Please check the name an"). Token usage was not logged on errors. | The reason is now cut at a sentence boundary, and errors carry token usage. Offline test: `tests/run.test.ts` checks that NOT_FOUND produces no guide and a non-retryable message. |
| 6 | `BeReal` (consumer app, no public API) | not run | | | Blocked on API credits. The prompt asks for a short `support: "none"` or `"unknown"` guide that says there is no public API. | |

Case 5 ran by accident: I left out `MOCK_AGENT=1` on a command meant for mock mode. The shell expanded `$$` to a process ID. It still tests nonsense input.

## Other live runs tonight (first-pass guides for the seeds)

All 7 produced schema-valid guides on the first try. Full numbers are in PROGRESS.md.

| Input | Duration | Tier (v1) | Verified seed tier |
|---|---|---|---|
| Gmail | 63.3s | 4 | 4 |
| Meta | 60.2s | 3 | 3 |
| Microsoft Outlook | 45.5s | 2 | 3 |
| GitHub | 50.1s | 2 | 2 |
| Slack | 64.6s | 2 | 2 |
| Salesforce | 67.5s | 2 | 2 |
| LinkedIn | 67.6s | 2 | 3 |

Every run finished in under 70 seconds, well inside the 80-second research deadline and the 250-second hard deadline.

## Failure handling checked without the API

The model is not called in these tests. `tests/run.test.ts` drives the real agent loop with a scripted fake model:
- When the research deadline passes, the agent is told to wrap up and still submits a guide (slow runs finish with what they have).
- An invalid guide gets one repair turn. A second invalid guide gives a clear error, not a crash.
- NOT_FOUND produces no guide.
- If the model stops without submitting, it gets one nudge, then a clear error.
- Claims citing pages the agent never opened are downgraded to inferred.

`tests/route.test.ts` checks that the SSE route streams events and ends with `done` (mock mode), and that bad input gives an error event.

## Found during the night: out of credits

When the account ran out of credits, the API returned a plain 400 and the UI said "The model API returned an error (400). Try again." That was wrong: trying again cannot help. Billing errors now say "Live generation is unavailable right now because the server's model API account is out of credits. The verified guides still work." and are not retryable. I checked this against the real API, which was still out of credits.
