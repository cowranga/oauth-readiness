import type { Guide } from "../guide/schema";

export type GuideSummary = Pick<Guide, "slug" | "app" | "verdict" | "generatedAt" | "origin">;

export interface GuideStore {
  readonly persistent: boolean;
  get(slug: string): Promise<Guide | null>;
  put(guide: Guide): Promise<void>;
  listRecent(limit: number): Promise<GuideSummary[]>;
  /** Increments today's generation counter and returns the new value. */
  countGeneration(day: string): Promise<number>;
}

export function summarize(guide: Guide): GuideSummary {
  return { slug: guide.slug, app: guide.app, verdict: guide.verdict, generatedAt: guide.generatedAt, origin: guide.origin };
}
