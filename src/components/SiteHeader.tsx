import Link from "next/link";
import { SocialLinks } from "@/components/SocialLinks";
import { site } from "@/data/site";

/**
 * Left column on desktop: identity, nav, contact. Collapses above the content
 * on mobile, where MobileTopBar takes over navigation — the nav and the skip
 * link below are `lg`-only so the two never both appear. Plain <a> rather than
 * next/link — every route is static, so there is nothing for client-side
 * routing to save, and this keeps the chrome at zero client JS (the whole
 * site must read with JavaScript off).
 */

/**
 * The whole site navigation, in reading order. About is the home page, which
 * holds the short version of everything; Experience and Projects have index
 * pages of their own, so the nav points at routes rather than at anchors inside
 * the home page.
 */
export const NAV_LINKS = [
  { href: "/", label: "About" },
  { href: "/experience", label: "Experience" },
  { href: "/projects", label: "Projects" },
  { href: "/resume", label: "Resume" },
] as const;

/**
 * A destination is current when it *is* the page or when the page is nested
 * under it — /projects/campus keeps Projects lit, /experience/terago keeps
 * Experience lit. Shared with MobileTopBar so the two navs cannot disagree
 * about where the reader is.
 */
export function isActiveNav(href: string, current: string): boolean {
  if (href === "/") return current === "/";
  return current === href || current.startsWith(`${href}/`);
}

/*
 * The chat is a call to action, not a nav destination, so it is deliberately
 * not in NAV_LINKS: the header renders it as a button near the identity on the
 * About page, and the mobile bar leaves it out entirely (four items already
 * fill a phone width).
 */
export const CHAT_LINK = { href: "/chat", label: "Ask about me" } as const;

export function SiteHeader({ current }: { current: string }) {
  const isHome = current === "/";

  /*
   * Below `lg`, the identity block and the contact row are first-page
   * furniture: on every other route they pushed the actual content — a case
   * study, the project list — a screenful down, repeating the same name and
   * blurb. The desktop sidebar keeps them, where they sit beside the content
   * rather than ahead of it.
   */
  const firstPageOnly = isHome ? undefined : "max-lg:hidden";

  return (
    <header className="page-enter lg:sticky lg:top-0 lg:flex lg:max-h-screen lg:flex-col lg:justify-between lg:py-24">
      <div>
        {/* The top bar carries the skip link below `lg`, so this one is
            desktop-only; two competing skip links would both take focus. */}
        <a
          href="#content"
          className="absolute left-4 top-4 -translate-y-32 rounded bg-accent px-4 py-2 font-medium text-bg transition-transform focus-visible:translate-y-0 max-lg:hidden"
        >
          Skip to content
        </a>

        <div className={firstPageOnly}>
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
        </div>

        {/*
         * The chat earns a button, not a link: it is the one place a visitor can
         * do something rather than read something. The About page only — on every
         * other route it was a button repeated at the top of the page, pushing
         * that route's own content down to offer a conversation the reader had
         * not asked for. It stays outside the `lg`-only nav so a mobile reader on
         * the About page still gets it, since the top bar does not carry it.
         */}
        {isHome ? (
          <p className="mt-8">
            {/*
             * No aria-current: this button is rendered only on the About page,
             * so it can never be the page the reader is already on.
             */}
            <Link
              href={CHAT_LINK.href}
              className="inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-bg transition-opacity hover:opacity-85"
            >
              {CHAT_LINK.label}
            </Link>
          </p>
        ) : null}

        {/* Mobile navigates by the top bar, so this list only exists at `lg`
            and up; display:none keeps the second landmark out of the tree. */}
        <nav aria-label="Site" className="hidden lg:block">
          <ul className="mt-16 flex flex-col">
            {NAV_LINKS.map((link) => {
              const active = isActiveNav(link.href, current);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className="group flex items-center py-3"
                  >
                    {/*
                     * A hairline that grows into the accent on hover, and stays
                     * grown while the item is the current page. Two lines of
                     * text alone made the nav look like body copy.
                     */}
                    <span
                      aria-hidden="true"
                      className={`mr-4 h-px transition-all motion-safe:duration-200 ${
                        active
                          ? "w-16 bg-accent"
                          : "w-8 bg-rule group-hover:w-16 group-hover:bg-accent"
                      }`}
                    />
                    <span
                      className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                        active ? "text-fg" : "text-muted group-hover:text-fg"
                      }`}
                    >
                      {link.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Contact links travel with the identity: first page below `lg`, every
          page on the desktop sidebar. */}
      <div className={firstPageOnly}>
        <SocialLinks />
      </div>
    </header>
  );
}
