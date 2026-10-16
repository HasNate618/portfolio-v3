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
      name: site.identity.name,
      url: base,
      email: `mailto:${site.contact.email}`,
      description: site.identity.headline,
      jobTitle: "Software Engineering student",
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: site.identity.education.school,
      },
      homeLocation: {
        "@type": "Place",
        name: site.identity.location,
      },
      sameAs: site.contact.links
        .filter((link) => link.label !== "Resume PDF")
        .map((link) => link.href),
      knowsAbout: site.skills.flatMap((group) => group.items),
      award: site.awards.map(
        (award) => `${award.prize} — ${award.project} (${award.event} ${award.year})`
      ),
    },
    {
      "@type": "WebSite",
      name: site.identity.name,
      url: base,
      inLanguage: "en",
      description: site.identity.headline,
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
