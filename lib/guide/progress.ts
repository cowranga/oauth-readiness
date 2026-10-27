import { USE_CASES, type Guide, type UseCase } from "./schema";
import { DEFAULT_USE_CASES } from "./tiers";

// Progress and chip selection live in the URL (?done=s1,r2&use=read,offline) so a shared link shares state.

export function parseDone(param: string | null | undefined): Set<string> {
  return new Set((param ?? "").split(",").map((s) => s.trim()).filter((s) => /^[\w-]{1,40}$/.test(s)));
}

export function parseUseCases(param: string | null | undefined): UseCase[] {
  if (param === null || param === undefined) return DEFAULT_USE_CASES;
  return USE_CASES.filter((useCase) => param.split(",").includes(useCase));
}

/** Query string for the current state; omits defaults to keep links short. */
export function progressQuery(done: Set<string>, useCases: UseCase[]): string {
  const params = new URLSearchParams();
  if (done.size > 0) params.set("done", [...done].join(","));
  const isDefault = useCases.length === DEFAULT_USE_CASES.length && DEFAULT_USE_CASES.every((u) => useCases.includes(u));
  if (!isDefault) params.set("use", useCases.join(","));
  const query = params.toString().replace(/%2C/g, ",");
  return query ? `?${query}` : "";
}

export function nextStep(guide: Pick<Guide, "steps">, done: Set<string>): Guide["steps"][number] | undefined {
  return guide.steps.find((step) => !done.has(step.id));
}

export function stepProgress(guide: Pick<Guide, "steps">, done: Set<string>): { done: number; total: number } {
  return { done: guide.steps.filter((s) => done.has(s.id)).length, total: guide.steps.length };
}

/** Hands-on hours and waiting days summed across stages (an unknown max anywhere makes the total open-ended). */
export function effortTotals(guide: Pick<Guide, "stages">): { hours: { min: number; max: number }; days: { min: number; max: number | null } } {
  const sum = (values: number[]): number => Math.round(values.reduce((a, b) => a + b, 0) * 10) / 10;
  const maxDays = guide.stages.map((s) => s.waitDays.max);
  return {
    hours: { min: sum(guide.stages.map((s) => s.handsOnHours.min)), max: sum(guide.stages.map((s) => s.handsOnHours.max)) },
    days: {
      min: sum(guide.stages.map((s) => s.waitDays.min)),
      max: maxDays.some((d) => d === null) ? null : sum(maxDays.map((d) => d ?? 0)),
    },
  };
}
