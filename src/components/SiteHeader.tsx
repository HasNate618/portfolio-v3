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
 * The first two point at sections of the home page rather than at index pages:
 * `#experience` and `#projects` are ids rendered by HomeView. Off the home page
 * they navigate home and scroll, which is the intended behaviour.
 */
export const NAV_LINKS = [
  { href: "/#experience", label: "Experience" },
  { href: "/#projects", label: "Projects" },
  { href: "/resume", label: "Resume" },
] as const;

/*
 * The chat is a call to action, not a nav destination, so it is deliberately
 * not in NAV_LINKS: the header renders it as a button near the identity, and
 * the mobile bar leaves it out entirely (the button is on the page anyway).
 */
export const CHAT_LINK = { href: "/chat", label: "Ask about me" } as const;

export function SiteHeader({ current }: { current: string }) {
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

        {/*
         * The chat earns a button, not a link: it is the one place a visitor
         * can do something rather than read something. It lives outside the
         * `lg`-only nav so mobile readers get it too — in the page, since the
         * top bar does not carry it.
         */}
        <p className="mt-8">
          <Link
            href={CHAT_LINK.href}
            aria-current={current === CHAT_LINK.href ? "page" : undefined}
            className="inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-bg transition-opacity hover:opacity-85"
          >
            {CHAT_LINK.label}
          </Link>
        </p>

        {/* Mobile navigates by the top bar, so this list only exists at `lg`
            and up; display:none keeps the second landmark out of the tree. */}
        <nav aria-label="Site" className="hidden lg:block">
          <ul className="mt-16 flex flex-col gap-4">
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
