import { readFile } from "node:fs/promises";
import path from "node:path";
import { knowledgebase } from "@/data/site";

export const dynamic = "force-static";

/**
 * Serves the public knowledge base as plain markdown at /knowledgebase/<path>.md
 * Only files listed in `knowledgebase` (src/data/site.ts) are reachable — that
 * list is the allowlist. Anything not on it 404s, so private notes stay private
 * even if they sit in the same folder.
 */
export function generateStaticParams() {
  return knowledgebase.map((entry) => ({ slug: entry.path.split("/") }));
}

function rewriteRelativeLinks(markdown: string, fromDir: string): string {
  // Relative .md links break for a crawler that lands mid-tree; point them at
  // absolute /knowledgebase/ URLs so the map stays traversable.
  return markdown.replace(
    /\]\((?!https?:\/\/|\/|#)([^)\s]+\.md)(#[^)\s]*)?\)/g,
    (_match, target: string, hash: string | undefined) => {
      const resolved = path.posix.normalize(path.posix.join(fromDir, target));
      return `](/knowledgebase/${resolved}${hash ?? ""})`;
    }
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<Response> {
  const { slug } = await params;
  const rel = slug.join("/");

  const entry = knowledgebase.find((e) => e.path === rel);
  if (!entry) {
    return new Response("Not found\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const filePath = path.join(process.cwd(), "content", rel);
  // Defence in depth: the allowlist already blocks traversal, but never read
  // outside the content directory.
  const root = path.join(process.cwd(), "content");
  if (!filePath.startsWith(root + path.sep)) {
    return new Response("Not found\n", { status: 404 });
  }

  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch {
    return new Response("Not found\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const body = rewriteRelativeLinks(raw, path.posix.dirname(rel));
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
