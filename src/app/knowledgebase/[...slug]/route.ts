import { knowledgebase } from "@/data/site";
import { getCorpusDoc } from "@/lib/corpus";

export const dynamic = "force-static";

/**
 * Serves the public knowledge base as plain markdown at /knowledgebase/<path>.md
 * Only files listed in `knowledgebase` (src/data/site.ts) are reachable — that
 * list is the allowlist. Anything not on it 404s, so private notes stay private
 * even if they sit in the same folder.
 *
 * The body comes from the corpus projection, so what a crawler reads here is the
 * same text the chat retrieves from.
 */
export function generateStaticParams() {
  return knowledgebase.map((entry) => ({ slug: entry.path.split("/") }));
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

  const entry = knowledgebase.find((e) => e.path === rel);
  if (!entry) return notFound();

  const doc = getCorpusDoc(rel);
  if (!doc) return notFound();

  return new Response(doc.text, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
