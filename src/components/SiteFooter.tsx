import { site } from "@/data/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 max-w-md border-t border-rule pt-8 pb-16 text-sm">
      <p className="text-muted">
        This site is plain text on purpose — no WebGL, no client-side rendering.{" "}
        <a href={`mailto:${site.contact.email}`} className="text-fg underline hover:text-accent">
          {site.contact.email}
        </a>
      </p>
    </footer>
  );
}
