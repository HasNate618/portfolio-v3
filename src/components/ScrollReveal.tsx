"use client";

import { useEffect } from "react";

/**
 * Minimal scroll motion, in the spirit of the reference design: each block eases
 * in once as it enters the viewport, and interactive elements ease their colour.
 *
 * Progressive enhancement, and the only reason this is a client component: the
 * `js` class it depends on is set before paint, so with JavaScript off none of
 * the motion CSS applies and every page is fully visible and readable. It adds a
 * class and nothing else — it never moves content, and nothing loops.
 */
export function ScrollReveal() {
  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("main article > *, main > header")
    );
    if (targets.length === 0) return;

    if (typeof IntersectionObserver === "undefined") {
      for (const element of targets) element.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    for (const element of targets) observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return null;
}
