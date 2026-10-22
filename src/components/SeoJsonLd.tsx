import { site } from "@/data/site";
import { siteBaseUrl } from "@/lib/site-url";

/**
 * Server-only Person + WebSite JSON-LD so search engines and AI agents get
 * structured facts without running JS.
 */
export function SeoJsonLd() {
  const base = siteBaseUrl();

  const graph = [
    {
      "@type": "Person",
      "@id": `${base}/#person`,
      name: site.identity.name,
      url: base,
      image: `${base}/og.png`,
      email: `mailto:${site.contact.email}`,
      jobTitle: "Software Engineering student",
      description: "Software engineer building full-stack, infrastructure and hardware projects, lately mostly LLM tooling.",
      affiliation: { "@type": "CollegeOrUniversity", name: site.identity.education.school },
      homeLocation: { "@type": "Place", name: site.identity.location },
      sameAs: site.contact.links
        .filter((link) => link.label !== "Resume PDF" && link.label !== "Portfolio")
        .map((link) => link.href),
      knowsAbout: [
        "Python",
        "TypeScript",
        "LLM agents",
        "Retrieval-augmented generation",
        "NixOS",
        "FastAPI",
        "React",
        "Embedded systems",
        "Unity",
      ],
      award: site.awards.map((award) => `${award.prize}, ${award.project} (${award.event} ${award.year})`),
    },
    {
      "@type": "WebSite",
      "@id": `${base}/#website`,
      name: site.identity.name,
      url: base,
      inLanguage: "en",
      publisher: { "@id": `${base}/#person` },
    },
    {
      "@type": "ProfilePage",
      "@id": `${base}/#profile`,
      url: base,
      mainEntity: { "@id": `${base}/#person` },
      isPartOf: { "@id": `${base}/#website` },
    },
  ];

  // Rendered as a text child: React escapes any `</script` sequence in the
  // payload, so this cannot break out of the tag (verified against React 19).
  return (
    <script type="application/ld+json">
      {JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}
    </script>
  );
}
