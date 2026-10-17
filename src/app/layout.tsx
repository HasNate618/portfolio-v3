import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nathan Espejo",
  description: "Software engineer working on applied AI systems.",
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
