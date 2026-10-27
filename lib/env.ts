import { z } from "zod";

// All configuration comes from here. Secrets are read, never logged.
const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().optional(),
  GUIDE_MODEL: z.string().default("claude-sonnet-5-5"),
  COMPOSIO_API_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  GENERATION_DAILY_CAP: z.coerce.number().int().positive().default(50),
  MOCK_AGENT: z.string().optional(),
});

export type Env = {
  anthropicApiKey?: string;
  guideModel: string;
  composioApiKey?: string;
  upstash?: { url: string; token: string };
  dailyCap: number;
  mockAgent: boolean;
};

export function getEnv(source: Record<string, string | undefined> = process.env): Env {
  const blankToUndefined = Object.fromEntries(Object.entries(source).map(([k, v]) => [k, v?.trim() ? v.trim() : undefined]));
  const env = envSchema.parse(blankToUndefined);
  return {
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    guideModel: env.GUIDE_MODEL,
    composioApiKey: env.COMPOSIO_API_KEY,
    upstash:
      env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
        ? { url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN }
        : undefined,
    dailyCap: env.GENERATION_DAILY_CAP,
    mockAgent: env.MOCK_AGENT === "1" || env.MOCK_AGENT === "true",
  };
}
