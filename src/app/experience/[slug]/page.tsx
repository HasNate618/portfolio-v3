import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { CaseStudy } from "@/components/CaseStudy";
import { getPage, listPages } from "@/lib/content";

/** /projects/[slug] is single-segment and cannot carry /experience/terago, so it gets its own route. */
function experiencePages() {
  return listPages().filter((page) => page.route.startsWith("/experience/"));
}

export function generateStaticParams() {
  return experiencePages().map((page) => ({ slug: page.route.replace("/experience/", "") }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getPage(`/experience/${slug}`);
  if (!page) notFound();

  return (
    <PageShell current="/#experience">
      <CaseStudy page={page} backHref="/#experience" backLabel="experience" />
    </PageShell>
  );
}
