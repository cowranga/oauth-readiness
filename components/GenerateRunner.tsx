"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { AgentEvent } from "@/lib/agent/events";
import { readSse } from "@/lib/api/sse";

type Line = { at: number; event: AgentEvent };

function describe(event: AgentEvent): string {
  switch (event.type) {
    case "status":
      return event.message;
    case "search":
      return `Search: ${event.query}`;
    case "read":
      return `${event.ok ? "Read" : "Failed"}: ${event.title ?? event.url}`;
    case "probe":
      return `Probe: ${event.result}`;
    case "finding":
      return event.message;
    case "done":
      return "Guide ready";
    case "error":
      return event.message;
  }
}

const TAG: Record<AgentEvent["type"], string> = {
  status: "STEP",
  search: "SEARCH",
  read: "READ",
  probe: "PROBE",
  finding: "FOUND",
  done: "DONE",
  error: "ERROR",
};

export function GenerateRunner({ query, fresh }: { query: string; fresh: boolean }): React.ReactElement {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([]);
  const [failure, setFailure] = useState<{ message: string; retryable: boolean } | null>(null);
  // Timer values start at 0 and are set on the client, so server and client HTML match.
  const [started, setStarted] = useState(0);
  const [now, setNow] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const running = useRef<number | null>(null);
  const finished = failure !== null || lines.some((l) => l.event.type === "done");

  useEffect(() => {
    if (running.current === attempt) return; // React dev mode runs effects twice; start one request per attempt.
    running.current = attempt;
    const begin = Date.now();
    setStarted(begin);
    setNow(begin);
    const push = (event: AgentEvent): void => setLines((prev) => [...prev, { at: Date.now() - begin, event }]);
    (async () => {
      let finishedCleanly = false;
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query, fresh }),
        });
        if (!response.body) throw new Error("no response body");
        for await (const event of readSse(response.body)) {
          push(event);
          if (event.type === "error") {
            finishedCleanly = true;
            setFailure({ message: event.message, retryable: event.retryable });
          }
          if (event.type === "done") {
            finishedCleanly = true;
            router.replace(`/guides/${event.slug}`);
          }
        }
      } catch {
        // handled below
      }
      // A stream that ends with no done or error event means the server was cut off (for example a timeout).
      if (!finishedCleanly) setFailure({ message: "The connection dropped. Try again.", retryable: true });
    })();
  }, [attempt, query, fresh, router]);

  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [finished]);

  const elapsed = started ? Math.max(0, Math.round((now - started) / 1000)) : 0;
  return (
    <div className="max-w-[720px] space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl">Researching {query}</h1>
        <span className="font-mono text-sm text-muted">
          {elapsed}s
        </span>
      </div>
      <p className="text-sm text-muted">
        The agent reads the provider&apos;s docs, probes the OAuth endpoints, and checks Composio&apos;s managed apps. This takes about a minute.
      </p>
      <ol className="space-y-1 rounded-md border border-border bg-card p-4 font-mono text-xs" role="log" aria-label="Agent progress">
        {lines.length === 0 ? <li className="text-muted">Starting</li> : null}
        {lines.map((line, index) => (
          <li key={index} className={`flex gap-3 ${line.event.type === "error" ? "text-destructive" : ""}`}>
            <span className="w-12 shrink-0 text-muted">{(line.at / 1000).toFixed(1)}s</span>
            <span className="w-14 shrink-0 text-muted">{TAG[line.event.type]}</span>
            <span className="min-w-0 break-words">{describe(line.event)}</span>
          </li>
        ))}
      </ol>
      {failure ? (
        <div className="space-y-3">
          <p>{failure.message}</p>
          <div className="flex flex-wrap gap-2">
            {failure.retryable ? (
              <button
                type="button"
                className="rounded-md bg-foreground px-4 py-2 text-background"
                onClick={() => {
                  setLines([]);
                  setFailure(null);
                  setStarted(Date.now());
                  setAttempt((a) => a + 1);
                }}
              >
                Try again
              </button>
            ) : null}
            <Link href="/" className="rounded-md border border-white/15 px-4 py-2 text-foreground no-underline hover:bg-accent">
              Back to library
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
