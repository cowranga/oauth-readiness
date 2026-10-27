# Live generation tests

Model `claude-sonnet-5-5`, run with `npm run generate`. Durations are wall-clock for the whole run.

**Status:** all 6 required cases have run live. Cases 1 and 5 ran overnight. The account then ran out of credits, and cases 2, 3, 4 and 6 ran the next morning through `scripts/live-tests.sh` after credits were added. No run crashed, and no guide was fabricated.

## Required cases

| # | Input | Duration | Tier | Made sense? | Issues found | Fix |
|---|---|---|---|---|---|---|
| 1 | `Notion` (no seed guide) | 43.4s | 2 | Yes. Correct deciding factor: a public connection works for any workspace, and only a Marketplace listing is reviewed. It picked the right app type and added a reconnect step for existing Composio users. | Ran 3 probes but cited none, so the guide showed only "Docs read". Portal probe said the page "loads without sign-in" for a page that renders sign-in in the browser. | Probe findings are now always recorded as probed evidence (`addProbeEvidence`). Portal wording now says only what the HTTP response shows. |
| 2 | `https://www.figma.com` (URL) | 63.9s | 3 | Yes. The URL resolved to Figma. Public OAuth apps start as drafts that only you and your plan admins can use, and Figma must approve them before other users can connect. It found no audit or fee. 7 sourced, 3 probed. | None. Not checked against a verified guide. | |
| 3 | `Google` (ambiguous, `fresh`) | 84.3s | 4 | Yes. It chose Gmail and Calendar, said so in the summary, and named other Google APIs as alternatives. It caught the 7-day access expiry for test users, which v1 missed. Tier matches the verified Google guide. | Without `fresh`, "Google" opens the verified guide instead. One scope tier ("Admin-only Gmail settings") is marked partner only; the verified guide says review plus audit. | None yet. |
| 4 | `OpenAI API` (expected: no OAuth) | 61.9s | 5 | Partly. It says the OpenAI API itself uses API keys, which was the expected answer. It also found an OAuth route, "Sign in with ChatGPT", where a hosted app gets a client ID only through an interest form OpenAI may refuse, and rated that tier 5. That is more nuanced than my test assumed. I have not checked the "Sign in with ChatGPT" claim myself. | The test input was not a clean no-OAuth app. Case 6 exercised the no-OAuth rule instead. | Pick a clearer API-key-only service for the demo if needed. |
| 5 | `Blorpify Zzz <pid> !!` (nonsense) | under 30s | none | Yes. No guide was written. The user saw: "We could not find an app called ... I searched for an app called ... and found no matching product, company, or public API." | The reason was cut off mid-word ("Please check the name an"). Token usage was not logged on errors. | The reason is now cut at a sentence boundary, and errors carry token usage. Offline test: `tests/run.test.ts` checks that NOT_FOUND produces no guide and a non-retryable message. |
| 6 | `BeReal` (consumer app, no public API) | 28.4s | No OAuth | Yes. "This app does not offer OAuth": no public developer portal found. It advises against unofficial private-API wrappers and suggests emailing BeReal. 2 sourced, 2 inferred, low confidence, 4 steps. | The guide said the Composio managed app was "not available", but the tool had returned "unknown" (BeReal is not in Composio's list). The model overwrote a deterministic tool result. | Code: the Composio status from the tool now always wins (`lib/agent/run.ts`). |

Case 5 ran by accident: I left out `MOCK_AGENT=1` on a command meant for mock mode. The shell expanded `$$` to a process ID. It still tests nonsense input. The morning script ran "Blorpify Zzz" again: it gave a clean not-found message with no guide.

## Extra live run: another app with no seed

| Input | Duration | Tier | Made sense? |
|---|---|---|---|
| `Linear` | 66.9s | 2 | Yes. Any user can connect with no Linear review. It flagged a customer-side gate: paid workspaces can require admin approval before members install an app. 9 sourced, 3 probed. |

## First-pass guides for the seeds (overnight)

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

Every overnight run finished in under 70 seconds. Across all live runs the slowest was 84 seconds ("Google"), well inside the 250-second hard deadline.

## Failure handling checked without the API

The model is not called in these tests. `tests/run.test.ts` drives the real agent loop with a scripted fake model:
- When the research deadline passes, the agent is told to wrap up and still submits a guide (slow runs finish with what they have).
- An invalid guide gets one repair turn. A second invalid guide gives a clear error, not a crash.
- NOT_FOUND produces no guide.
- If the model stops without submitting, it gets one nudge, then a clear error.
- Claims citing pages the agent never opened are downgraded to inferred.

`tests/route.test.ts` checks that the SSE route streams events and ends with `done` (mock mode), and that bad input gives an error event.

## Found along the way: out of credits

When the account ran out of credits, the API returned a plain 400 and the UI said "The model API returned an error (400). Try again." That was wrong: trying again cannot help. Billing errors now say "Live generation is unavailable right now because the server's model API account is out of credits. The verified guides still work." and are not retryable. I checked this against the real API, which was still out of credits.
