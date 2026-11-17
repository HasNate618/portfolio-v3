"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * A case study has two natural ways in: the cards on home, or the index on
 * /projects. Its back link should return the reader the way they came.
 * `document.referrer` cannot tell us: next/link navigates without loading a new
 * document, so it keeps pointing at whatever loaded the site originally.
 * Recording the origin on the click, in sessionStorage, works for both.
 *
 * Mounted once in PageShell. With JavaScript off nothing is recorded and the
 * back link keeps its server-rendered destination, which is still a real page.
 */
const ORIGIN_KEY = "case-study-origin";

export function NavOrigin() {
  useEffect(() => {
    const remember = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.(
        "a[href^='/projects/'], a[href^='/experience/']",
      );
      if (!(link instanceof HTMLAnchorElement)) return;
      // Skip the full-size image links: they open a new tab and have a file
      // extension, so they are not case studies at all.
      if (link.target === "_blank") return;
      if (/\.[a-z0-9]+$/i.test(link.pathname)) return;
      try {
        sessionStorage.setItem(ORIGIN_KEY, location.pathname === "/" ? "home" : "index");
      } catch {
        // Private browsing can refuse storage; the default back link is fine.
      }
    };
    document.addEventListener("click", remember, true);
    return () => document.removeEventListener("click", remember, true);
  }, []);

  return null;
}

/**
 * The back link itself. The server render is the default destination, so the
 * HTML works with script off; the origin is read after mount and does not
 * change the markup during hydration.
 */
export function CaseStudyBack({ href, label }: { href: string; label: string }) {
  const [back, setBack] = useState({ href, label });

  useEffect(() => {
    let fromHome = false;
    try {
      fromHome = sessionStorage.getItem(ORIGIN_KEY) === "home";
      sessionStorage.removeItem(ORIGIN_KEY);
    } catch {
      // No storage: keep the default.
    }
    if (fromHome) setBack({ href: "/", label: "about" });
  }, []);

  return (
    <p className="text-sm">
      <Link href={back.href} className="text-muted hover:text-accent">
        <span aria-hidden="true">←</span> {back.label}
      </Link>
    </p>
  );
}
