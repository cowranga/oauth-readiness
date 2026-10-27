import { getEnv } from "../env";
import type { Guide } from "../guide/schema";
import { createFileStore } from "./file";
import { getSeed } from "./seeds";
import type { GuideStore } from "./types";
import { createUpstashStore } from "./upstash";

let store: GuideStore | undefined;

/** Upstash when configured, else the local file store. On Vercel without Upstash, links do not survive. */
export function getStore(): GuideStore {
  if (store) return store;
  const { upstash } = getEnv();
  if (upstash) store = createUpstashStore(upstash);
  else if (process.env.VERCEL) {
    // ponytail: Vercel's filesystem is read-only and per instance -> set UPSTASH_* for persistent share links
    store = { ...createFileStore("/tmp/oauth-guides"), persistent: false };
  } else store = createFileStore();
  return store;
}

/** Seeds first, then live guides. */
export async function loadGuide(slug: string): Promise<Guide | null> {
  return getSeed(slug) ?? (await getStore().get(slug));
}
