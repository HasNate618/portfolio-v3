import Link from "next/link";
import { SocialLinks } from "@/components/SocialLinks";
import { site } from "@/data/site";

/**
 * Left column on desktop: identity, nav, contact. Collapses above the content
 * on mobile. Plain <a> rather than next/link — every route is static, so there
 * is nothing for client-side routing to save, and this keeps the chrome at zero
 * client JS (the whole site must read with JavaScript off).
 */

/**
 * The first two point at sections of the home page rather than at index pages:
 * `#experience` and `#projects` are ids rendered by HomeView. Off the home page
 * they navigate home and scroll, which is the intended behaviour.
 */
export const NAV_LINKS = [
  { href: "/#experience", label: "Experience" },
  { href: "/#projects", label: "Projects" },
  { href: "/now", label: "Now" },
  { href: "/resume", label: "Resume" },
  { href: "/chat", label: "Ask about me" },
] as const;

export function SiteHeader({ current }: { current: string }) {
  return (
    <header className="page-enter lg:sticky lg:top-0 lg:flex lg:max-h-screen lg:flex-col lg:justify-between lg:py-24">
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

        {/* Deliberately quiet: the name leads, this sets context without
            competing with it for attention. */}
        <p className="mt-3 max-w-md text-base leading-relaxed text-muted sm:text-lg">
          {site.identity.headline}
        </p>

        {site.identity.positioning ? (
          <p className="mt-4 max-w-xs leading-relaxed text-muted">{site.identity.positioning}</p>
        ) : null}

        <nav aria-label="Site" className="mt-10">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 lg:mt-16 lg:flex-col lg:gap-4">
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

      <SocialLinks />
    </header>
  );
}
