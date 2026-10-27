# Assignment: verbatim + traceability

Do not edit the verbatim section. The traceability table is how we make sure nothing is missed. Before the final commit, re-check every row and fill the "Where" column with real file paths and URLs.

## Verbatim problem statement

> # APM Integrations - Take-home Assignment
>
> ## Problem
>
> A developer building an AI agent wants their users to connect an app. Before they can launch, they may need to create an OAuth app with the provider and get it approved.
>
> Today, developers piece together documentation, work through unfamiliar setup flows, and email providers to understand the requirements. It can be hard to tell whether setup will take an hour or involve weeks of waiting, how much work is needed, or what might block approval.
>
> **Help developers understand that path and make progress on it.** They should be able to look up an app, get a guide they can use and share, and know what to do next.
>
> ## Your assignment
>
> Build a working experience that gives developers and agent builders clear, actionable guidance for setting up an OAuth app and getting it approved. A developer should know where to start, what to do next, how much time and effort to expect, and how to proceed when they hit a blocker.
>
> The goal is a library of ready-to-use guides for 100 apps that support OAuth. A developer should also be able to submit the name or website of an app they are interested in. An agent should investigate that app and generate a shareable guide in real time, including for apps outside the existing library.
>
> For this take-home, demonstrate a few varied apps and this live generation flow. You do not need to produce all 100 guides.
>
> A developer using your result should understand:
>
> - How easy or difficult it is to get their OAuth app ready for use.
> - The likely time and effort involved, including any wait for approval.
> - The requirements and nuances that could affect their setup.
> - What an agent can do for them and where they need to take over.
>
> Use agents to investigate and attempt as much of the setup process as practical. Let what they discover shape the guidance. Be clear about what you tested, what sources support, and what remains uncertain.
>
> You decide the approach, format, and implementation. The result should be useful enough for a developer to follow and share without you explaining it.
>
> ## Start by understanding the problem
>
> Understand what a provider OAuth app is and how it relates to a developer's integration and their users' connections. The managed OAuth app directory is a good starting point.
>
> We care about what you learn and the product decisions you make from it. Choose a focused scope and explain why it addresses the developer's problem.
>
> ## Show us that it works
>
> 1. Demonstrate the experience on a few real apps with different setup challenges. Be ready for us to submit an unfamiliar app and watch the agent generate its guide live.
> 2. Check a sample of the guidance against real sources or setup attempts. Show what you learned, corrected, or could not verify.
> 3. Submit a link to the working experience and a source repository. Include a short README with setup instructions, your key decisions, and limitations.
>
> We will look for understanding of the developer's problem, useful guidance, sound judgment about evidence, and thoughtful use of agents.
>
> **Budget 6 to 8 hours.** A focused working slice is enough. You do not need paid accounts, completed provider approvals, or a production-ready product. Keep credentials out of the submission.

"The managed OAuth app directory" refers to Composio's managed auth toolkit list: https://docs.composio.dev/toolkits/managed-auth (decision guide: https://docs.composio.dev/docs/custom-app-vs-managed-app). Read both early in Task 0.

## Traceability

| ID | Requirement (from the text above) | How we satisfy it | Where (fill in) |
|---|---|---|---|
| R1 | Look up an app | Search box over seeds + the live generator on the home page | |
| R2 | Get a guide they can use and share | Stable URL per guide, "Copy link", "Copy as Markdown", print-friendly page | |
| R3 | Know what to do next; make progress on it | "Your next step" = first unchecked step; checkable steps with progress saved in the share URL; steps ordered by stage with owner tags | |
| R4 | Know where to start | First step is always the concrete starting action, plus whether a Composio managed app lets them start today | |
| R5 | How much time and effort to expect | Hands-on hours and waiting days shown separately, per stage | |
| R6 | How to proceed when they hit a blocker | Blockers section: symptom, cause, fix, who to contact | |
| R7 | Goal: library of 100 OAuth apps (not required for the take-home) | Deliberately not built. 5 verified seeds + live generator for any app. README names the 100-app path as roadmap and explains the cut. | |
| R8 | Submit the name or website of an app | Input accepts both; URL normalized to domain + name | |
| R9 | Agent investigates and generates a shareable guide in real time, including outside the library | `/api/generate` streams agent progress; guide persisted at a stable URL; works for any input | |
| R10 | Demonstrate a few varied apps | 7 seeds, each a different setup challenge (see PRODUCT.md table) | |
| R11 | Understand how easy or difficult | Tier verdict (1 to 5) with a one-line reason naming the deciding factor | |
| R12 | Time and effort, including any wait for approval | Per-stage hands-on and wait ranges; provider-stated vs developer-reported waits side by side; tier for the developer's selected use case | |
| R13 | Requirements and nuances | Requirements checklist + scope tiers table + gotchas inside steps and blockers | |
| R14 | What an agent can do for them and where they take over | Every step tagged agent / you / provider; agent-drafted submission materials (scope justifications, demo video script, etc.) | |
| R15 | Use agents to investigate and attempt as much of the setup as practical | Research agent with web search + page fetch + unauthenticated OAuth endpoint probes; drafts the paperwork; human attempts for a sample in the morning | |
| R16 | Let what agents discover shape the guidance | Live findings stream into the guide; verification lessons changed the prompts (EVAL.md, LESSONS.md) | |
| R17 | Be clear about tested / sourced / uncertain | Evidence badge on every claim (tested, probed, sourced, inferred) + attempt-depth indicator per guide + "What we don't know" section | |
| R18 | Useful without you explaining it | Self-explaining UI: legend for tiers and evidence, plain language, no jargon without a one-line definition | |
| R19 | Understand provider OAuth app vs integration vs users' connections; managed directory | `/about` explainer + per-guide "Can you start today with a Composio managed app?" field | |
| R20 | Focused scope, explain why | Scope: the go-live path from Composio's managed app to your own approved app. README "Scope and why", /about, DECISIONS.md | |
| R21 | Real apps with different challenges; ready for an unfamiliar app live | 7 seeds; live flow hardened against odd inputs; LIVE_TESTS.md | |
| R22 | Check a sample against real sources or setup attempts; show learned, corrected, not verifiable | `verification/<slug>.md` per seed, EVAL.md, LESSONS.md, human attempt logs | |
| R23 | Link + repo + short README (setup, key decisions, limitations) | README; deploy is a morning task in MORNING_HANDOFF | |
| R24 | Judged on: problem understanding, useful guidance, evidence judgment, thoughtful agent use | README opens with these four, each with a pointer to proof | |
| R25 | 6 to 8 hour slice; no paid accounts, approvals, production polish needed | Ponytail rules; cuts listed in Limitations | |
| R26 | Keep credentials out of the submission | `.gitignore`, `.env.example`, `check:secrets`, no client IDs in attempt logs | |
