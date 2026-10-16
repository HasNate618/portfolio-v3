import { getCorpusDoc, getCorpusDocs } from "@/lib/corpus";

export const dynamic = "force-static";

/**
 * Serves the public knowledge base as plain markdown at /knowledgebase/<path>.md.
 *
 * The allowlist is the corpus projection itself, which walks content/ only and
 * never reads private/. That is the same boundary the loader enforces, so there
 * is no second list to keep in step — and nothing outside content/ is reachable.
 *
 * The body is the projection, so a crawler reads exactly the text the chat
 * retrieves from.
 */
export function generateStaticParams() {
  return getCorpusDocs().map((doc) => ({ slug: doc.path.split("/") }));
}

function notFound(): Response {
  return new Response("Not found\n", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<Response> {
  const { slug } = await params;
  const rel = slug.join("/");

  const doc = getCorpusDoc(rel);
  if (!doc) return notFound();

  return new Response(doc.text, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
