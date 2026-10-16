import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { CaseStudy } from "@/components/CaseStudy";
import { getPage, listPages } from "@/lib/content";
import { getProject } from "@/data/site";
import type { Page } from "@/lib/content";

/** Single-segment route: /experience/terago gets its own [slug] route in Task 13. */
function projectPages(): Page[] {
  return listPages()
    .filter((page) => page.route.startsWith("/projects/"))
    .sort((a, b) => {
      const order = (page: Page) => getProject(page.projectId ?? "")?.order ?? Number.MAX_SAFE_INTEGER;
      return order(a) - order(b);
    });
}

export function generateStaticParams() {
  return projectPages().map((page) => ({ slug: page.route.replace("/projects/", "") }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getPage(`/projects/${slug}`);
  if (!page) notFound();

  const pages = projectPages();
  const index = pages.findIndex((candidate) => candidate.route === page.route);
  const next = pages.length > 1 ? pages[(index + 1) % pages.length] : undefined;

  return (
    <PageShell current="/projects">
      <CaseStudy
        page={page}
        backHref="/projects"
        backLabel="all projects"
        nextHref={next?.route}
        nextLabel={next?.title}
      />
    </PageShell>
  );
}
