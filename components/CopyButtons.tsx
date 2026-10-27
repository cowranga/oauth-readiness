"use client";

import { useState } from "react";

export function CopyButtons({ slug }: { slug: string }): React.ReactElement {
  const [message, setMessage] = useState("");
  const flash = (text: string): void => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2000);
  };
  const copy = async (getText: () => Promise<string>, done: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(await getText());
      flash(done);
    } catch {
      flash("Copy failed. Your browser blocked the clipboard.");
    }
  };
  const button = "rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-accent";
  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <button type="button" className={button} onClick={() => copy(async () => window.location.href, "Link copied, with your progress.")}>
        Copy link
      </button>
      <button
        type="button"
        className={button}
        onClick={() => copy(async () => (await fetch(`/api/guides/${slug}?format=md`)).text(), "Markdown copied.")}
      >
        Copy as Markdown
      </button>
      <button type="button" className={button} onClick={() => window.print()}>
        Print
      </button>
      <span role="status" className="text-xs text-muted">
        {message}
      </span>
    </div>
  );
}

export function CopyText({ text, label = "Copy" }: { text: string; label?: string }): React.ReactElement {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="no-print rounded-md border border-white/15 px-2 py-1 text-xs hover:bg-accent"
      onClick={async () => {
        await navigator.clipboard.writeText(text).catch(() => undefined);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
