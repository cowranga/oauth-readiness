import fixture from "@/lib/agent/fixtures/guide.json";
import { guideSchema, type Guide } from "@/lib/guide/schema";

export function fixtureGuide(): Guide {
  return guideSchema.parse(structuredClone(fixture));
}
