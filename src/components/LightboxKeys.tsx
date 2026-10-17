"use client";

import { useEffect } from "react";

/**
 * Escape closes an expanded image, and the overlay takes focus when it opens.
 *
 * The overlay itself is CSS-only — the thumbnail links to its fragment and
 * `:target` reveals it — which is what keeps the whole thing working with
 * JavaScript off. This adds the two things CSS cannot: Escape, and moving focus
 * into the overlay so a keyboard or screen-reader reader lands inside it rather
 * than on whatever followed the thumbnail. Without JavaScript the close and
 * backdrop links still do the job.
 */
export function LightboxKeys() {
  useEffect(() => {
    const openOverlay = () => document.querySelector<HTMLElement>(".lightbox:target");

    const focusOpenOverlay = () => {
      const overlay = openOverlay();
      if (!overlay) return;
      // A previous Escape leaves its flag behind; opening again clears it.
      overlay.removeAttribute("data-closed");
      overlay.focus({ preventScroll: true });
    };

    const close = (overlay: HTMLElement) => {
      // Hiding is done here rather than by clearing the fragment: `:target`
      // keeps matching after history.replaceState in Chromium, so the flag is
      // what actually takes it off the screen.
      overlay.setAttribute("data-closed", "true");
      const thumbId = overlay.id ? `${overlay.id}-thumb` : null;
      // Replace rather than push: closing is not a step to go back to, and the
      // thumbnail is exactly where the reader was.
      history.replaceState(null, "", `${location.pathname}${location.search}`);
      const thumb = thumbId ? document.getElementById(thumbId) : null;
      thumb?.focus();
      thumb?.scrollIntoView({ block: "nearest" });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const overlay = openOverlay();
      if (!overlay) return;
      event.preventDefault();
      close(overlay);
    };

    window.addEventListener("hashchange", focusOpenOverlay);
    window.addEventListener("keydown", onKeyDown);
    // A page loaded straight onto a fragment opens an overlay too.
    focusOpenOverlay();

    return () => {
      window.removeEventListener("hashchange", focusOpenOverlay);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return null;
}
