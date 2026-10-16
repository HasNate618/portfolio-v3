import Link from "next/link";
import { site } from "@/data/site";

/**
 * Left column on desktop: identity, nav, contact. Collapses above the content
 * on mobile. Plain <a> rather than next/link — every route is static, so there
 * is nothing for client-side routing to save, and this keeps the chrome at zero
 * client JS (the whole site must read with JavaScript off).
 */

export const NAV_LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/experience", label: "Experience" },
  { href: "/now", label: "Now" },
  { href: "/resume", label: "Resume" },
  { href: "/chat", label: "Ask about me" },
] as const;

export function SiteHeader({ current }: { current: string }) {
  return (
    <header className="lg:sticky lg:top-0 lg:flex lg:max-h-screen lg:flex-col lg:justify-between lg:py-24">
      <div>
        <a
          href="#content"
          className="absolute left-4 top-4 -translate-y-32 rounded bg-accent px-4 py-2 font-medium text-bg transition-transform focus-visible:translate-y-0"
        >
          Skip to content
        </a>

        <p className="text-4xl font-bold tracking-tight text-fg sm:text-5xl">
          <Link href="/" className="hover:text-accent">
            {site.identity.name}
          </Link>
        </p>

        <p className="mt-3 text-lg font-medium tracking-tight text-fg sm:text-xl">
          {site.identity.headline}
        </p>

        <p className="mt-4 max-w-xs leading-relaxed">{site.identity.positioning}</p>

        <nav aria-label="Site" className="mt-8">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 lg:mt-16 lg:flex-col lg:gap-4">
            {NAV_LINKS.map((link) => {
              const active = link.href === current;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`text-sm font-bold uppercase tracking-widest transition-colors hover:text-accent ${
                      active ? "text-fg" : "text-muted"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <ul className="mt-8 flex flex-wrap items-center gap-4 text-sm lg:mt-0">
        {site.contact.links.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="text-fg underline hover:text-accent">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </header>
  );
}
