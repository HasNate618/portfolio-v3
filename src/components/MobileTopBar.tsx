import Link from "next/link";
import { NAV_LINKS } from "@/components/SiteHeader";

/**
 * Below `lg` there is no left column, so the sidebar's nav would scroll away
 * with the identity block. This bar keeps the three destinations pinned to the
 * top of the viewport instead. The chat is not one of them: it has its own
 * button in the header block, and four items did not fit a phone width.
 *
 * It is a second "Site" nav landmark next to the one in SiteHeader, but never
 * a visible second one: this bar is `lg:hidden` and the header's nav is
 * `hidden lg:block`, so display:none removes each from the accessibility tree
 * at the width where the other applies. Screen readers meet exactly one.
 *
 * The bar floats (inset, rounded, shadowed) rather than spanning the width,
 * and each destination is a filled pill rather than bare text, so the row
 * reads as controls instead of a run of words. The fill is the solid page
 * colour rather than a translucent blur: text scrolling under a translucent
 * bar shows through and competes with the links.
 */
export function MobileTopBar({ current }: { current: string }) {
  return (
    <div className="sticky top-3 z-30 px-4 lg:hidden">
      {/*
       * The header's own skip link is hidden at this width, so the bar carries
       * one of its own — a mobile keyboard reader's first tab stop lands here.
       */}
      <a
        href="#content"
        className="absolute left-6 top-0 -translate-y-32 rounded bg-accent px-4 py-2 font-medium text-bg transition-transform focus-visible:translate-y-2"
      >
        Skip to content
      </a>
      <nav
        aria-label="Site"
        className="rounded-full border border-rule bg-bg px-2 py-1.5 shadow-lg shadow-black/25"
      >
        <ul className="flex items-center justify-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = link.href === current;
            return (
              <li key={link.href} className="flex-1">
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-full px-3 py-2 text-center text-xs font-bold uppercase tracking-wider transition-colors ${
                    active ? "bg-bubble text-fg" : "text-muted hover:text-accent"
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
