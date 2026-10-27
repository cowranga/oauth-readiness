import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GenerateRunner } from "@/components/GenerateRunner";

export const metadata: Metadata = { title: "Generating a guide" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function GeneratePage({ searchParams }: Props): Promise<React.ReactElement> {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim();
  if (!query) redirect("/");
  // key restarts the runner when the query changes in the same tab.
  return <GenerateRunner key={`${query}|${params.fresh}`} query={query} fresh={params.fresh === "1"} />;
}
