import Link from "next/link";
import { NAV_LINKS } from "@/components/SiteHeader";

/**
 * Below `lg` there is no left column, so the sidebar's nav would scroll away
 * with the identity block. This bar keeps the same four destinations pinned to
 * the top of the viewport instead.
 *
 * It is a second "Site" nav landmark next to the one in SiteHeader, but never
 * a visible second one: this bar is `lg:hidden` and the header's nav is
 * `hidden lg:block`, so display:none removes each from the accessibility tree
 * at the width where the other applies. Screen readers meet exactly one.
 *
 * The background is the solid page colour rather than a translucent blur: text
 * scrolling under a translucent bar shows through and competes with the links,
 * and a solid bar needs no contrast argument at all.
 */
export function MobileTopBar({ current }: { current: string }) {
  return (
    <div className="sticky top-0 z-30 border-b border-rule bg-bg lg:hidden">
      {/*
       * The header's own skip link is hidden at this width, so the bar carries
       * one of its own — a mobile keyboard reader's first tab stop lands here.
       */}
      <a
        href="#content"
        className="absolute left-4 top-0 -translate-y-32 rounded bg-accent px-4 py-2 font-medium text-bg transition-transform focus-visible:translate-y-2"
      >
        Skip to content
      </a>
      <nav aria-label="Site" className="px-6">
        <ul className="flex items-center justify-between">
          {NAV_LINKS.map((link) => {
            const active = link.href === current;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`block py-3 text-xs font-bold uppercase tracking-wider transition-colors hover:text-accent ${
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
  );
}
