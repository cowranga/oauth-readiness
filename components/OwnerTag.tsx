import type { Step } from "@/lib/guide/schema";

const LABEL: Record<Step["owner"], string> = { agent: "Agent", you: "You", provider: "Provider (wait)" };

export function OwnerTag({ owner }: { owner: Step["owner"] }): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-border px-1.5 py-px font-mono text-[10px] uppercase tracking-wider">
      {owner === "agent" ? <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" /> : null}
      {LABEL[owner]}
    </span>
  );
}
