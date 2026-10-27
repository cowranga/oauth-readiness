import Link from "next/link";

export default function NotFound(): React.ReactElement {
  return (
    <div className="max-w-[520px] space-y-3">
      <h1 className="text-2xl">Guide not found</h1>
      <p className="text-muted">The link may be mistyped, or a live guide may have expired on a server without storage.</p>
      <Link href="/">Search the library or generate a new guide</Link>
    </div>
  );
}
