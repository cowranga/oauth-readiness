// Usage: npm run generate -- "<app name or url>" [--out <dir>] [--fresh] [--model <id>]
// Runs the live agent (or the mock with MOCK_AGENT=1), prints events, writes the guide JSON.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getEnv } from "../lib/env";
import { generateGuide } from "../lib/agent/generate";
import { AgentError } from "../lib/agent/run";
import { InputError } from "../lib/input/normalize";
import { findSeed } from "../lib/store/seeds";

process.loadEnvFile?.(".env.local");

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const query = args.find((a, i) => !a.startsWith("--") && !["--out", "--model"].includes(args[i - 1] ?? ""));
if (!query) {
  console.error('usage: npm run generate -- "<app name or url>" [--out <dir>] [--fresh] [--model <id>]');
  process.exit(2);
}
const appQuery: string = query;
const outDir = flag("--out") ?? ".data/cli";
const env = getEnv();
const model = flag("--model");
const started = Date.now();

async function main(): Promise<void> {
  const outcome = await generateGuide(appQuery, args.includes("--fresh") || Boolean(flag("--out")), {
    env: model ? { ...env, guideModel: model } : env,
    emit: (event) => console.log(`[${((Date.now() - started) / 1000).toFixed(1)}s] ${JSON.stringify(event)}`),
    findSeed,
    save: async (guide) => {
      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, `${guide.slug}.json`), JSON.stringify(guide, null, 2) + "\n");
    },
  });
  if (outcome.kind === "generated") {
    const { guide, usage, toolCalls } = outcome;
    console.log(`\nwrote ${join(outDir, `${guide.slug}.json`)}`);
    console.log(
      `summary: model=${guide.generator.model} duration=${((guide.generator.durationMs ?? 0) / 1000).toFixed(1)}s tier=${guide.verdict.tier} confidence=${guide.verdict.confidence} toolCalls=${toolCalls ?? 0}` +
        (usage
          ? ` tokens in=${usage.inputTokens} out=${usage.outputTokens} cacheRead=${usage.cacheReadTokens} cacheWrite=${usage.cacheWriteTokens} searches=${usage.webSearches}`
          : ""),
    );
  }
}

main().catch((error: unknown) => {
  if (error instanceof InputError || error instanceof AgentError) {
    console.error(`error: ${error.message}`);
    if (error instanceof AgentError && error.usage) console.error(`usage: ${JSON.stringify(error.usage)} duration=${((Date.now() - started) / 1000).toFixed(1)}s`);
    process.exit(1);
  }
  throw error;
});
