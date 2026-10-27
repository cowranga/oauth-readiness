import Link from "next/link";

export default function NotFound(): React.ReactElement {
  return (
    <div className="max-w-[520px] space-y-3">
      <h1 className="text-2xl">Guide not found</h1>
      <p className="text-muted">Check the link. Live guides can expire on servers without storage.</p>
      <Link href="/">Back to library</Link>
    </div>
  );
}
