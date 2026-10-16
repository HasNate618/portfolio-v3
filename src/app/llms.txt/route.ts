import { site, knowledgebase, highlightProjects } from "@/data/site";
import { siteBaseUrl } from "@/lib/site-url";

/**
 * Serves /llms.txt — short index for AI/scrapers.
 * Full depth lives in /knowledgebase/*.md (see `knowledgebase` in src/data/site.ts).
 */
export async function GET(): Promise<Response> {
  const base = siteBaseUrl();
  const startHere = knowledgebase.filter((e) => e.priority === "start-here");
  const reference = knowledgebase.filter((e) => e.priority === "reference");

  const lines: string[] = [];
  lines.push(`# ${site.identity.name}`);
  lines.push(`> ${site.identity.headline}`);
  lines.push("");
  lines.push(site.identity.positioning);
  lines.push("");
  lines.push(`${site.identity.seeking} · ${site.identity.location} · ${site.identity.year}`);
  lines.push("");
  lines.push("## Contact");
  lines.push(`- Email: ${site.contact.email}`);
  for (const link of site.contact.links) {
    lines.push(`- ${link.label}: ${link.href}`);
  }
  lines.push("");
  lines.push("## Start here");
  for (const entry of startHere) {
    lines.push(`- [${entry.title}](${base}${entry.url}): ${entry.description}`);
  }
  lines.push("");
  lines.push("## Reference");
  for (const entry of reference) {
    lines.push(`- [${entry.title}](${base}${entry.url}): ${entry.description}`);
  }
  lines.push("");
  lines.push("## Flagship projects");
  for (const p of highlightProjects()) {
    const file = p.file ? ` — ${base}${p.file}` : "";
    lines.push(`- ${p.name} (${p.dates}; ${p.displayRole}): ${p.covers}${file}`);
  }
  lines.push("");
  lines.push(`Hackathons: entered ${site.hackathons.entered}, awards ${site.hackathons.awards}. See ${base}/knowledgebase/awards.md.`);

  const body = lines.join("\n") + "\n";
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
