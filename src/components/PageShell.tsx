import type { ReactNode } from "react";
import { LightboxKeys } from "@/components/LightboxKeys";
import { MobileTopBar } from "@/components/MobileTopBar";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * The two-column shell: identity and nav stick on the left, content scrolls on
 * the right, one column below lg — where a sticky top bar carries the nav
 * instead. The bar sits outside the padded wrapper so it spans the full width
 * of the column container. Each page passes its own `current` rather than
 * reading the pathname, which would pull in a client component and cost JS on
 * a site that must read with JavaScript off.
 */
export function PageShell({ current, children }: { current: string; children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-screen-xl lg:px-12">
      {/* Renders nothing: it only listens, so the shell stays server-rendered. */}
      <LightboxKeys />
      <MobileTopBar current={current} />
      {/*
       * Below `lg` the vertical rhythm is tighter than the desktop py-24, but the
       * content still has to clear the floating bar, whose pill hangs 12px below
       * its own 48px flow box: 48px above the content is 36px of clearance under
       * that pill. 24px below is enough breathing room at the end of a page. The
       * chat's height subtracts exactly this (see --chat-chrome in globals.css).
       */}
      <div className="px-6 pb-6 lg:px-0 lg:py-0">
        <div className="lg:grid lg:grid-cols-[23rem_1fr] lg:gap-24">
          <SiteHeader current={current} />
          <main id="content" className="page-enter-delayed pt-12 lg:py-24">{children}</main>
        </div>
      </div>
    </div>
  );
}
