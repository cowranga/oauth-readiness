import { guideToMarkdown } from "@/lib/guide/markdown";
import { loadGuide } from "@/lib/store";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }): Promise<Response> {
  const { slug } = await params;
  const guide = await loadGuide(slug);
  if (!guide) return Response.json({ error: "No guide with that link. It may have expired, or the link is mistyped." }, { status: 404 });
  const url = new URL(request.url);
  if (url.searchParams.get("format") === "md") {
    const shareUrl = `${url.origin}/guides/${guide.slug}`;
    return new Response(guideToMarkdown(guide, shareUrl), { headers: { "content-type": "text/markdown; charset=utf-8" } });
  }
  return Response.json(guide);
}
