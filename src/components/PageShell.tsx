import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ScrollReveal } from "@/components/ScrollReveal";

/**
 * The two-column shell: identity and nav stick on the left, content scrolls on
 * the right, one column below lg. Each page passes its own `current` rather than
 * reading the pathname, which would pull in a client component and cost JS on a
 * site that must read with JavaScript off.
 */
export function PageShell({ current, children }: { current: string; children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-screen-xl px-6 py-12 lg:px-12 lg:py-0">
      <div className="lg:grid lg:grid-cols-[23rem_1fr] lg:gap-24">
        <SiteHeader current={current} />
        <main id="content" className="pt-16 lg:py-24">
          <ScrollReveal />
          {children}
        </main>
      </div>
    </div>
  );
}
