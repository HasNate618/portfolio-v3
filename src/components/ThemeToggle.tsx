"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "portfolio-v3:theme";

/**
 * Light/dark toggle.
 *
 * The site follows the operating system by default and needs no JavaScript to
 * do it: globals.css carries the light scheme behind `prefers-color-scheme`.
 * This button only exists to override that choice, so it renders nothing until
 * it has mounted — a script-less reader gets the system scheme and no dead
 * control, and a reader with script gets a button that reflects the scheme
 * actually in effect.
 *
 * The stored override is applied before first paint by the boot script in the
 * root layout, so a chosen theme does not flash the wrong colours on load.
 */
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setMounted(true);

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }

    // No explicit choice yet: report what the system is asking for.
    setTheme(window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  }, []);

  function apply(next: Theme) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode with storage disabled: the choice simply does not persist.
    }
  }

  if (!mounted) return null;

  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${next} theme`;

  return (
    <button
      type="button"
      onClick={() => apply(next)}
      aria-label={label}
      title={label}
      className="fixed right-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-rule bg-surface text-muted transition-colors hover:border-accent hover:text-accent lg:right-6 lg:top-6"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        {next === "light" ? (
          // A sun: pressing it brings the light scheme.
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
          </>
        ) : (
          // A moon: pressing it brings the dark scheme.
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
        )}
      </svg>
    </button>
  );
}
