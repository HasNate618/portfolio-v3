"use client";

import { useEffect } from "react";

/**
 * Keyboard and touch for the expanded image view.
 *
 * The overlay itself is CSS-only (the thumbnail links to its fragment and
 * `:target` reveals it, and the previous, next and close links are real
 * links), which keeps it working with JavaScript off. This adds what CSS
 * cannot: Escape to close, the left and right arrow keys and a horizontal
 * swipe to move between a project's images, and moving focus into the overlay
 * so a keyboard or screen-reader reader lands inside it.
 */
export function LightboxKeys() {
  useEffect(() => {
    const openOverlay = () => document.querySelector<HTMLElement>(".lightbox:target:not([data-closed])");

    const focusOpenOverlay = () => {
      const overlay = document.querySelector<HTMLElement>(".lightbox:target");
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
      const thumbId = overlay.dataset.thumb ?? (overlay.id ? `${overlay.id}-thumb` : null);
      // Replace rather than push: closing is not a step to go back to, and the
      // thumbnail is exactly where the reader was.
      history.replaceState(null, "", `${location.pathname}${location.search}`);
      const thumb = thumbId ? document.getElementById(thumbId) : null;
      thumb?.focus({ preventScroll: true });
      thumb?.scrollIntoView({ block: "nearest" });
    };

    // Stepping replaces the history entry, so Back closes the viewer instead
    // of walking back through every image the reader looked at.
    const step = (overlay: HTMLElement, direction: "prev" | "next") => {
      const target = overlay.dataset[direction];
      if (target) location.replace(`#${target}`);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const overlay = openOverlay();
      if (!overlay) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close(overlay);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(overlay, "prev");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(overlay, "next");
      }
    };

    let startX = 0;
    let startY = 0;
    const onTouchStart = (event: TouchEvent) => {
      if (!openOverlay()) return;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    };
    const onTouchEnd = (event: TouchEvent) => {
      const overlay = openOverlay();
      if (!overlay) return;
      const dx = event.changedTouches[0].clientX - startX;
      const dy = event.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      step(overlay, dx < 0 ? "next" : "prev");
    };

    window.addEventListener("hashchange", focusOpenOverlay);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    // A page loaded straight onto a fragment opens an overlay too.
    focusOpenOverlay();

    return () => {
      window.removeEventListener("hashchange", focusOpenOverlay);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return null;
}
