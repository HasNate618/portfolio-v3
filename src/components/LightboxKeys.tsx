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
 *
 * It also holds the reader's place. Fragment navigation scrolls to the target,
 * and the close link points at the thumbnail, so without this the page jumps
 * when an image opens or closes. With script on, the scroll offset is captured
 * on the opening click and restored on every step and on close.
 */
export function LightboxKeys() {
  useEffect(() => {
    let savedScroll: number | null = null;

    const openOverlay = () => document.querySelector<HTMLElement>(".lightbox:target:not([data-closed])");

    /** Restore the exact offset the reader had before they clicked the image. */
    const restoreScroll = () => {
      if (savedScroll !== null) window.scrollTo(0, savedScroll);
    };

    const focusOpenOverlay = () => {
      const overlay = document.querySelector<HTMLElement>(".lightbox:target");
      if (!overlay) return;
      // A previous Escape leaves its flag behind; opening again clears it.
      overlay.removeAttribute("data-closed");
      overlay.focus({ preventScroll: true });
      restoreScroll();
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
      // Not scrollIntoView: that anchor sits at the thumbnail, which can be
      // above or below the reader's actual position by the time they close.
      restoreScroll();
      savedScroll = null;
    };

    // Step replaces the history entry, so Back closes the viewer instead
    // of walking back through every image the reader looked at.
    const step = (overlay: HTMLElement, direction: "prev" | "next") => {
      const target = overlay.dataset[direction];
      if (target) location.replace(`#${target}`);
    };

    // Capture before the browser handles the fragment click: hashchange fires
    // after it has already scrolled, which is too late to remember the offset.
    const onOpenClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.('a[href^="#"]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const target = document.getElementById(anchor.hash.slice(1));
      if (!target?.classList.contains("lightbox")) return;
      savedScroll = window.scrollY;
    };

    // The close links must stay real anchors for readers without script. With
    // script, handle them here so the fragment never moves the page.
    const onCloseClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a.lightbox-backdrop, a.lightbox-close");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const overlay = anchor.closest<HTMLElement>(".lightbox");
      if (!overlay) return;
      event.preventDefault();
      close(overlay);
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

    document.addEventListener("click", onOpenClick, true);
    document.addEventListener("click", onCloseClick, true);
    window.addEventListener("hashchange", focusOpenOverlay);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    // A page loaded straight onto a fragment opens an overlay too.
    focusOpenOverlay();

    return () => {
      document.removeEventListener("click", onOpenClick, true);
      document.removeEventListener("click", onCloseClick, true);
      window.removeEventListener("hashchange", focusOpenOverlay);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return null;
}
