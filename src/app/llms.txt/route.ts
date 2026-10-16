import { site, highlightProjects } from "@/data/site";
import { listPages } from "@/lib/content";
import { getCorpusDocs, corpusTitle } from "@/lib/corpus";
import { siteBaseUrl } from "@/lib/site-url";

/**
 * Serves /llms.txt — a short index for AI crawlers.
 *
 * Routes come from listPages() and are ordered by the page's own `priority`
 * frontmatter, so a new page appears here by existing rather than by being
 * added to a list. Full text lives at /knowledgebase/*.md.
 */
export async function GET(): Promise<Response> {
  const base = siteBaseUrl();

  const pages = listPages();
  const startHere = pages.filter((page) => page.priority === "start-here");
  const reference = pages.filter((page) => page.priority === "reference");

  const lines: string[] = [];
  lines.push(`# ${site.identity.name}`);
  lines.push(`> ${site.identity.headline}`);
  lines.push("");
  if (site.identity.positioning) {
    lines.push(site.identity.positioning);
    lines.push("");
  }
  lines.push(`${site.identity.seeking} · ${site.identity.location} · ${site.identity.year}`);
  lines.push("");
  lines.push("## Contact");
  lines.push(`- Email: ${site.contact.email}`);
  for (const link of site.contact.links) {
    lines.push(`- ${link.label}: ${link.href}`);
  }

  const section = (heading: string, entries: typeof pages) => {
    if (entries.length === 0) return;
    lines.push("");
    lines.push(`## ${heading}`);
    for (const page of entries) {
      lines.push(`- [${page.title}](${base}${page.route}): ${page.description}`);
    }
  };

  section("Start here", startHere);
  section("Reference", reference);

  lines.push("");
  lines.push("## Highlighted projects");
  for (const project of highlightProjects()) {
    const file = project.file ? ` — ${base}${project.file}` : "";
    lines.push(`- ${project.name} (${project.dates}; ${project.displayRole}): ${project.covers}${file}`);
  }

  lines.push("");
  lines.push(`Hackathons: entered ${site.hackathons.entered}, awards ${site.hackathons.awards}.`);

  lines.push("");
  lines.push("## Full text");
  lines.push(`Every document below is plain markdown at ${base}/knowledgebase/<path>.`);
  for (const doc of getCorpusDocs()) {
    lines.push(`- [${corpusTitle(doc)}](${base}/knowledgebase/${doc.path})`);
  }

  return new Response(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
