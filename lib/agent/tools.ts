import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { checkComposioManaged } from "../composio/managed";
import { guideContentJsonSchema } from "../guide/schema";
import { htmlTitle, htmlToText } from "../net/htmlText";
import { safeFetch, SafeFetchError } from "../net/safeFetch";
import { MAX_PROBE_REQUESTS, runProbes } from "../probe/oauth";
import type { EmitEvent } from "./events";

// Client tools for the research agent. Handlers return errors as data so the model can recover.

export type ToolContext = {
  emit: EmitEvent;
  composioApiKey?: string;
  /** URLs actually opened this run; sourced evidence must point at one of these. */
  fetchedUrls: Set<string>;
  /** Probe URLs and what they showed; probed evidence must point at one of these. */
  probes: { url: string; summary: string }[];
  probeRequestsLeft: number;
};

export type ToolResult = { content: string; isError?: boolean };

export const WEB_SEARCH_TOOL: Anthropic.Messages.WebSearchTool20260209 = {
  type: "web_search_20260209",
  name: "web_search",
  max_uses: 8,
  allowed_callers: ["direct"],
};

const fetchPageInput = z.object({ url: z.string() });
const probeInput = z.object({
  domain: z.string().optional(),
  authorizeUrl: z.string().optional(),
  portalUrl: z.string().optional(),
  scope: z.string().optional(),
});
const composioInput = z.object({ appName: z.string() });

export const RESEARCH_TOOLS: Anthropic.Tool[] = [
  {
    name: "fetch_page",
    description:
      "Open a public web page and return its readable text (max ~15k chars). Use it on every page you cite as sourced: a search snippet is not enough.",
    input_schema: {
      type: "object",
      properties: { url: { type: "string", description: "Absolute http(s) URL" } },
      required: ["url"],
    },
  },
  {
    name: "probe_oauth",
    description:
      "Run safe unauthenticated probes: the OIDC discovery document on `domain`, the authorization endpoint with a fake client ID, and the developer portal page. At most 3 requests per run in total, so call it once with everything you know.",
    input_schema: {
      type: "object",
      properties: {
        domain: { type: "string", description: "Host serving /.well-known/openid-configuration, e.g. accounts.google.com" },
        authorizeUrl: { type: "string", description: "OAuth authorization endpoint URL from the docs" },
        portalUrl: { type: "string", description: "Developer portal URL where apps are registered" },
        scope: { type: "string", description: "Optional scope to include in the authorize probe" },
      },
    },
  },
  {
    name: "check_composio_managed",
    description: "Check whether Composio offers a managed OAuth app for this toolkit (so developers can start without registering their own).",
    input_schema: {
      type: "object",
      properties: { appName: { type: "string", description: "Toolkit name as Composio would list it, e.g. Gmail, Outlook, Slack" } },
      required: ["appName"],
    },
  },
];

export function submitGuideTool(): Anthropic.Tool {
  const schema = guideContentJsonSchema();
  delete schema.$schema;
  return {
    name: "submit_guide",
    description: "Submit the finished guide. Call this exactly once, at the end, with every field filled from your research.",
    input_schema: schema as Anthropic.Tool["input_schema"],
  };
}

export async function runTool(name: string, input: unknown, ctx: ToolContext): Promise<ToolResult> {
  switch (name) {
    case "fetch_page":
      return fetchPage(input, ctx);
    case "probe_oauth":
      return probe(input, ctx);
    case "check_composio_managed":
      return composio(input, ctx);
    default:
      return { content: `Unknown tool ${name}.`, isError: true };
  }
}

/** Strips fragments and trailing slashes so cited URLs match fetched ones. */
export function canonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

async function fetchPage(input: unknown, ctx: ToolContext): Promise<ToolResult> {
  const parsed = fetchPageInput.safeParse(input);
  if (!parsed.success) return { content: "fetch_page needs {url}.", isError: true };
  const { url } = parsed.data;
  try {
    const response = await safeFetch(url);
    const isHtml = /<html|<body|<div/i.test(response.body.slice(0, 2000));
    const title = isHtml ? htmlTitle(response.body) : undefined;
    const text = isHtml ? htmlToText(response.body) : response.body.slice(0, 15_000);
    const ok = response.status < 400 && text.length > 0;
    ctx.emit({ type: "read", url: response.finalUrl, title, ok });
    if (ok) {
      ctx.fetchedUrls.add(canonicalUrl(url));
      ctx.fetchedUrls.add(canonicalUrl(response.finalUrl));
    }
    return {
      content: JSON.stringify({ finalUrl: response.finalUrl, status: response.status, title, text }),
      isError: !ok,
    };
  } catch (error) {
    ctx.emit({ type: "read", url, ok: false });
    const reason = error instanceof SafeFetchError ? error.message : "request failed";
    return { content: `Could not fetch ${url}: ${reason}. Try another source.`, isError: true };
  }
}

async function probe(input: unknown, ctx: ToolContext): Promise<ToolResult> {
  const parsed = probeInput.safeParse(input);
  if (!parsed.success) return { content: "probe_oauth input is invalid.", isError: true };
  if (ctx.probeRequestsLeft <= 0) {
    return { content: `The probe budget (${MAX_PROBE_REQUESTS} requests per run) is used up. Use what you have.`, isError: true };
  }
  const findings = await runProbes(parsed.data, ctx.probeRequestsLeft);
  ctx.probeRequestsLeft -= findings.length;
  for (const finding of findings) {
    ctx.probes.push({ url: finding.url, summary: finding.summary });
    ctx.emit({ type: "probe", target: finding.url, result: finding.summary });
  }
  return {
    content: JSON.stringify({
      findings,
      reminder: "Cite a probe as level 'probed' with sourceKind 'probe', sourceUrl = the probe url, note = the summary.",
    }),
  };
}

async function composio(input: unknown, ctx: ToolContext): Promise<ToolResult> {
  const parsed = composioInput.safeParse(input);
  if (!parsed.success) return { content: "check_composio_managed needs {appName}.", isError: true };
  const result = await checkComposioManaged(parsed.data.appName, ctx.composioApiKey);
  if (result.fetchedUrl) ctx.fetchedUrls.add(canonicalUrl(result.fetchedUrl));
  ctx.emit({ type: "finding", message: `Composio managed app: ${result.status.replace("_", " ")}. ${result.note}` });
  const { fetchedUrl: _fetched, ...forModel } = result;
  return { content: JSON.stringify({ ...forModel, citeAs: result.fetchedUrl ? "sourced, sourceKind composio_docs" : "inferred" }) };
}
