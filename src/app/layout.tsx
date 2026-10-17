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
    "Nathan Espejo, 3rd-year Software Engineering at Western. I build software and applied AI tools on low-cost and self-hosted models. Looking for Summer 2027.",
  alternates: { canonical: "/", types: { "text/markdown": "/llms.txt" } },
  openGraph: {
    type: "profile",
    siteName: "Nathan Espejo",
    title: "Nathan Espejo, Software Engineer",
    description:
      "Software engineer building applied AI tools on low-cost and self-hosted models. 3rd year at Western, looking for a Summer 2027 internship.",
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Nathan Espejo, software engineer building applied AI tools" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nathan Espejo, Software Engineer",
    description: "Software engineer building applied AI tools on low-cost and self-hosted models.",
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
