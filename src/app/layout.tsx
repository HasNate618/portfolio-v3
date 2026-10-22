import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { ThemeToggle } from "@/components/ThemeToggle";
import { siteMetadataBase } from "@/lib/site-url";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteMetadataBase(),
  title: { default: "Nathan Espejo, Software Engineer", template: "%s · Nathan Espejo" },
  description:
    "Nathan Espejo, 3rd-year Software Engineering at Western. I build full-stack, infrastructure and hardware projects, lately mostly LLM tooling. Looking for Summer 2027.",
  alternates: { canonical: "/", types: { "text/markdown": "/llms.txt" } },
  openGraph: {
    type: "profile",
    siteName: "Nathan Espejo",
    title: "Nathan Espejo, Software Engineer",
    description:
      "Software engineer building full-stack, infrastructure and hardware projects, lately mostly LLM tooling. 3rd year at Western, looking for a Summer 2027 internship.",
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Nathan Espejo, software engineer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nathan Espejo, Software Engineer",
    description: "Software engineer building full-stack, infrastructure and hardware projects, lately mostly LLM tooling.",
    images: ["/og.png"],
  },
};

/**
 * Applies a stored theme choice before first paint, so a reader who picked light
 * on a dark machine never sees a flash of the wrong scheme.
 *
 * Static string, no interpolation, and nothing is written when no choice is
 * stored — the site keeps following the operating system, which is also what a
 * reader without JavaScript gets.
 */
const THEME_BOOT = `try{var t=localStorage.getItem("portfolio-v3:theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

/**
 * Marks the entrance animation as spent, so it runs once per visit rather than
 * once per page.
 *
 * The flag has to live on <html>: the animation is CSS, and the left column is
 * re-mounted on every navigation, so the stylesheet can only tell a first page
 * from a later one by something that outlives the page. In a client-side
 * navigation the document does; the header does not.
 *
 * Two moments set it, and both are needed. On any load after the first of the
 * visit it is set before first paint, so that page never animates. On the first
 * page it is set once the entrance has finished — or as soon as the reader clicks
 * or types, in case they navigate before it ends. Setting it on load instead
 * would cancel the very animation it exists to allow; leaving it until the next
 * load was the bug, because the router never causes one: every route change
 * replayed the animation for the rest of the visit.
 *
 * sessionStorage, not localStorage: a new visit is a new arrival and earns the
 * animation, while a navigation within the visit does not.
 */
const FIRST_LOAD_BOOT = `try {
  var key = "portfolio-v3:visited";
  var root = document.documentElement;
  if (sessionStorage.getItem(key)) {
    root.dataset.visited = "1";
  } else {
    sessionStorage.setItem(key, "1");
    var spent = false;
    var mark = function () {
      if (spent) return;
      spent = true;
      root.dataset.visited = "1";
    };
    // A click or keypress means the reader is about to navigate, so the
    // entrance is already over as far as the next page is concerned.
    root.addEventListener("click", mark, true);
    root.addEventListener("keydown", mark, true);
    var arm = function () {
      var el = document.querySelector(".page-enter-delayed") || document.querySelector(".page-enter");
      if (el) el.addEventListener("animationend", mark, { once: true });
      // Fallback for a collapsed animation (reduced motion) or an element that
      // never fires the event.
      setTimeout(mark, 1500);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arm);
    else arm();
  }
} catch (e) {}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans text-fg antialiased">
        <Script id="theme-boot" strategy="beforeInteractive">
          {THEME_BOOT}
        </Script>
        <Script id="first-load-boot" strategy="beforeInteractive">
          {FIRST_LOAD_BOOT}
        </Script>
        {/* Person + WebSite structured data. Was migrated but never rendered. */}
        <SeoJsonLd />
        {children}
        <Analytics />
        {/* Renders nothing without script; the system scheme works without it. */}
        <ThemeToggle />
      </body>
    </html>
  );
}
