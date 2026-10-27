import type { Guide, Stage } from "./schema";
import { REVIEW_LEVEL_LABEL, USE_CASE_LABEL } from "./tiers";

// Guide -> Markdown for "Copy as Markdown" and /api/guides/[slug]?format=md.
// Plain CommonMark + GFM tables and task lists so it pastes into GitHub, Slack, and Notion.

export function formatDays(range: { min: number; max: number | null }): string {
  if (range.max === null) return range.min === 0 ? "unknown" : `${range.min}+ days`;
  if (range.max === 0) return "none";
  if (range.min === range.max) return `${range.min} days`;
  return `${range.min} to ${range.max} days`;
}

export function formatHours(range: { min: number; max: number }): string {
  const show = (h: number): string => (h < 1 ? `${Math.round(h * 60)} min` : `${h} h`);
  if (range.min === range.max) return show(range.min);
  return `${show(range.min)} to ${show(range.max)}`;
}

function cell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function stageWait(stage: Stage): string {
  const reported = formatDays(stage.waitDays);
  if (!stage.providerStatedWaitDays) return reported;
  return `Provider says ${formatDays(stage.providerStatedWaitDays)}; developers report ${reported}`;
}

export function guideToMarkdown(guide: Guide, shareUrl?: string): string {
  const lines: string[] = [];
  const push = (...items: string[]): void => {
    lines.push(...items);
  };

  push(`# ${guide.app.name}: OAuth app setup and approval`, "");
  push(`**Tier ${guide.verdict.tier}: ${guide.verdict.label}.** ${guide.verdict.summary}`, "");
  if (guide.oauth.support === "none") push("**This app does not offer OAuth.**", "");
  if (guide.verdict.customerSideGate) {
    push(`**Customer-side gate:** ${guide.verdict.customerSideGateNote ?? "Your users' admins may need to approve your app."}`, "");
  }
  push(`**Next step:** ${guide.verdict.nextStep}`, "");
  push(
    `Confidence: ${guide.verdict.confidence}. Researched ${guide.generatedAt.slice(0, 10)}. ` +
      `${guide.origin === "verified_seed" ? "Verified seed guide." : "Live-generated, not human-verified."}` +
      (shareUrl ? ` Source: ${shareUrl}` : ""),
    "",
  );

  push("## Start today with Composio", "", `Managed app: ${guide.composio.managedApp.replace("_", " ")}. ${guide.composio.note}`, "");

  push("## Time and effort", "", "| Stage | Who can connect | Hands-on | Waiting | Review |", "|---|---|---|---|---|");
  for (const stage of guide.stages) {
    push(
      `| ${cell(stage.name)} | ${cell(stage.whoCanConnect)} | ${formatHours(stage.handsOnHours)} | ${cell(stageWait(stage))} | ${stage.reviewRequired ? "yes" : "no"} |`,
    );
  }
  push("");

  if (guide.scopeTiers.length > 0) {
    push("## Scopes decide the difficulty", "", "| Scope tier | Example scopes | Review | Serves | Effect |", "|---|---|---|---|---|");
    for (const tier of guide.scopeTiers) {
      push(
        `| ${cell(tier.name)} | ${cell(tier.exampleScopes.map((s) => `\`${s}\``).join(", "))} | ${REVIEW_LEVEL_LABEL[tier.reviewLevel]} | ${tier.useCases.map((u) => USE_CASE_LABEL[u]).join(", ")} | ${cell(tier.effect)} |`,
      );
    }
    push("");
  }

  push("## What you need before you start", "");
  for (const req of guide.requirements) push(`- [ ] ${req.item} (${req.stage})${req.detail ? `: ${req.detail}` : ""}`);
  push("");

  push("## Steps", "");
  for (const step of guide.steps) {
    push(`- [ ] **${step.title}** (${step.owner}, ${step.estimate}, ${step.stage}). ${step.detail}${step.url ? ` ${step.url}` : ""}`);
  }
  push("");

  if (guide.blockers.length > 0) {
    push("## If you get stuck", "");
    for (const b of guide.blockers) {
      push(`- **${b.symptom}.** Cause: ${b.cause} Fix: ${b.fix}${b.escalation ? ` Help: ${b.escalation}` : ""}`);
    }
    push("");
  }

  if (guide.uncertainties.length > 0) {
    push("## What we don't know", "");
    for (const u of guide.uncertainties) push(`- **${u.question}** ${u.why} To resolve: ${u.howToResolve}`);
    push("");
  }

  push("## Sources", "");
  const seen = new Set<string>();
  for (const e of guide.evidence) {
    if (!e.sourceUrl || seen.has(e.sourceUrl)) continue;
    seen.add(e.sourceUrl);
    const label = e.sourceTitle ? `[${e.sourceTitle}](${e.sourceUrl})` : `<${e.sourceUrl}>`;
    push(`${seen.size}. ${label} (${e.level}, retrieved ${e.retrievedAt})`);
  }
  return lines.join("\n").trimEnd() + "\n";
}
