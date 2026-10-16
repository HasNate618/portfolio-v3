import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SeoJsonLd } from "@/components/SeoJsonLd";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans text-fg antialiased">
        {/*
          Marks the document as scripted before first paint. The reveal CSS is
          scoped to `.js`, so a reader without JavaScript gets the fully visible
          page rather than content stuck at opacity 0.
        */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        {/* Person + WebSite structured data. Was migrated but never rendered. */}
        <SeoJsonLd />
        {children}
      </body>
    </html>
  );
}
