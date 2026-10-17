import Link from "next/link";
import { NAV_LINKS, isActiveNav } from "@/components/SiteHeader";

/**
 * Below `lg` there is no left column, so the sidebar's nav would scroll away
 * with the identity block. This bar keeps the same destinations pinned to the
 * top of the viewport instead.
 *
 * It is a second "Site" nav landmark next to the one in SiteHeader, but never
 * a visible second one: this bar is `lg:hidden` and the header's nav is
 * `hidden lg:block`, so display:none removes each from the accessibility tree
 * at the width where the other applies. Screen readers meet exactly one.
 *
 * The bar floats (inset, rounded, shadowed) rather than spanning the width,
 * and each destination is a filled pill rather than bare text, so the row
 * reads as controls instead of a run of words.
 *
 * The fill is the page colour at 80% over a backdrop blur. The blur is what
 * makes that legible: content scrolling underneath arrives dissolved instead of
 * showing through the bar and competing with the links. The 80% is deliberate
 * too — under a large bright image the blur has little left to dissolve, so the
 * bar keeps most of the page colour rather than trusting the blur alone.
 *
 * The labels are `text-fg`, not `text-muted`, for that same reason. The contrast
 * check validates muted against the page colour, but this bar's background is
 * whatever scrolls under it, and the colour that can sit there is not part of
 * that check: over a bright figure in the light scheme muted falls to roughly
 * 3:1, and even in the dark scheme only just clears 4.5:1. The foreground colour
 * holds above 8:1 against the worst a backdrop can do — pure white under the
 * dark bar, pure black under the light one — so nothing scrolling past can
 * break it.
 *
 * The chat is deliberately not a fifth item: it has its own button on the About
 * page, and five pills do not fit a phone width.
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
        className="rounded-full border border-rule bg-bg/80 px-2 py-1.5 shadow-lg shadow-black/25 backdrop-blur-md"
      >
        <ul className="flex items-center justify-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = isActiveNav(link.href, current);
            return (
              <li key={link.href} className="flex-1">
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`block whitespace-nowrap rounded-full px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-fg transition-colors ${
                    active ? "bg-bubble" : "hover:text-accent"
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
