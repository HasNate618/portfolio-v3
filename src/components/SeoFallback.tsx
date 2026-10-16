import { site, highlightProjects } from "@/data/site";
import { siteBaseUrl } from "@/lib/site-url";

/**
 * Server-rendered, visually hidden fallback for no-JS visitors and ATS-style
 * fetches, which otherwise receive an empty document (the visible UI is
 * client-rendered over WebGL).
 *
 * Deliberately facts only — name, seeking, links, project names. It does not
 * mirror the page prose: hidden text that duplicates visible copy is what
 * hidden-text filters look for. Depth belongs in /llms.txt and /knowledgebase,
 * which crawlers are invited to fetch openly.
 *
 * Content comes from src/data/site.ts — edit there, not here.
 */
export function SeoFallback() {
  const base = siteBaseUrl();
  const highlights = highlightProjects();

  return (
    <section className="sr-only" aria-label="Site summary">
      <h1>{site.identity.name}</h1>
      <p>{site.identity.headline}</p>
      <p>
        Seeking {site.identity.seeking}. Based in {site.identity.location}.{" "}
        {site.identity.education.degree}, {site.identity.education.school}.
      </p>

      <h2>Projects</h2>
      <ul>
        {highlights.map((project) => (
          <li key={project.id}>
            {project.name}
            {project.links.map((link) => (
              <span key={link.href}>
                {" — "}
                <a href={link.href}>{link.label}</a>
              </span>
            ))}
          </li>
        ))}
      </ul>

      <h2>Contact</h2>
      <ul>
        <li>
          <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
        </li>
        {site.contact.links.map((link) => (
          <li key={link.href}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>

      <p>
        Full details for AI agents: <a href={`${base}/llms.txt`}>/llms.txt</a> and{" "}
        <a href={`${base}/knowledgebase/index.md`}>/knowledgebase/index.md</a>.
      </p>
    </section>
  );
}
