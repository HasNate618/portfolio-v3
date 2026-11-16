/**
 * Colour schemes.
 *
 * Kept as data rather than CSS so the contrast gate has something to check: a
 * colour that only exists inside a stylesheet cannot be verified. Two schemes
 * ship — `moss` is the dark default, `paper` the light one — and both are
 * reachable either from the reader's system preference or from the theme toggle
 * in the top-right corner.
 *
 * Practical notes:
 * - `rule`, `surface`, `bubble`, `codeBg`, `preBg` and `scrollbar` are non-text,
 *   so they are not contrast-gated.
 * - `fg`, `muted`, `accent` and `heading` are text and must clear 4.5:1 against
 *   `bg`, the lightest glow composite over it, and the bubble fill.
 *   `check:contrast` tests all four, so the toggle cannot surface an unreadable
 *   scheme.
 * - `glows` is the ambient wash, painted as radial-gradients. Kept as
 *   colour + alpha rather than a CSS string so the checker can composite them.
 */
export type PaletteTokens = {
  bg: string;
  fg: string;
  /**
   * Headings only. Split from `fg` because a heading wants to be a shade of the
   * scheme's own colour rather than plain ink: the light scheme's warm cream
   * makes near-black headings read as harsh, so they carry a deep green there.
   */
  heading: string;
  muted: string;
  accent: string;
  /** Non-text: hairlines and dividers. */
  rule: string;
  /** Non-text: card and panel fill. */
  surface: string;
  /** Non-text: chat bubble fill, a shade lighter than the page. */
  bubble: { color: string; alpha: number };
  /** Non-text: inline code chip fill. */
  codeBg: string;
  /** Non-text: code block fill. */
  preBg: string;
  /** Text drawn on the accent-coloured selection highlight. */
  selectionFg: string;
  /** Non-text: scrollbar thumb. */
  scrollbar: string;
  /** Two ambient washes: [top centre, bottom centre]. */
  glows: readonly { color: string; alpha: number }[];
  scheme: "dark" | "light";
};

export type Palette = {
  label: string;
  /** One-line note on what it feels like. */
  note: string;
  tokens: PaletteTokens;
};

export const PALETTE_NAMES = ["moss", "paper"] as const;

export type PaletteName = (typeof PALETTE_NAMES)[number];

export const palettes: Record<PaletteName, Palette> = {
  moss: {
    label: "Slate",
    note: "Vivid blue on near-black. The default.",
    tokens: {
      bg: "#05070b",
      fg: "#e2e7ec",
      // The dark scheme's headings stay at body ink: at this level of contrast a
      // colour would read as decoration rather than as a title.
      heading: "#e2e7ec",
      muted: "#98a6bd",
      accent: "#74b7ff",
      rule: "rgba(226, 231, 236, 0.09)",
      surface: "rgba(226, 231, 236, 0.015)",
      bubble: { color: "#e2e7ec", alpha: 0.07 },
      codeBg: "rgba(226, 231, 236, 0.08)",
      preBg: "rgba(0, 0, 0, 0.3)",
      selectionFg: "#0b1020",
      scrollbar: "rgba(226, 231, 236, 0.18)",
      glows: [{ color: "#74b7ff", alpha: 0.16 }],
      scheme: "dark",
    },
  },
  paper: {
    label: "Paper",
    note: "Light scheme: warm cream page, warm ink, deep blue accent. Cosy, not clinical.",
    tokens: {
      bg: "#f8f6f1",
      fg: "#2b2823",
      heading: "#1e3a8a",
      muted: "#6b6459",
      accent: "#1d4ed8",
      rule: "rgba(43, 40, 35, 0.13)",
      surface: "rgba(43, 40, 35, 0.02)",
      bubble: { color: "#fffdf8", alpha: 0.8 },
      codeBg: "rgba(43, 40, 35, 0.06)",
      preBg: "rgba(43, 40, 35, 0.04)",
      selectionFg: "#faf7f1",
      scrollbar: "rgba(43, 40, 35, 0.25)",
      glows: [
        { color: "#4e82e8", alpha: 0.20 },
        { color: "#cbb37f", alpha: 0.08 },
      ],
      scheme: "light",
    },
  },
};

/** The dark scheme the site paints by default. */
export const activeDark = palettes.moss.tokens;
/** The light scheme, used when the reader's system asks for light. */
export const activeLight = palettes.paper.tokens;

const toRgba = ({ color, alpha }: { color: string; alpha: number }) => {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Flatten a palette into the custom properties `globals.css` reads. The dev
 * palette panel uses this so switching a scheme in the browser cannot drift
 * from what the stylesheet would have baked in.
 */
export function paletteCssVars(tokens: PaletteTokens): Record<string, string> {
  return {
    "--color-bg": tokens.bg,
    "--color-fg": tokens.fg,
    "--color-heading": tokens.heading,
    "--color-muted": tokens.muted,
    "--color-accent": tokens.accent,
    "--color-rule": tokens.rule,
    "--color-surface": tokens.surface,
    "--color-bubble": toRgba(tokens.bubble),
    "--color-code-bg": tokens.codeBg,
    "--color-pre-bg": tokens.preBg,
    "--color-selection-fg": tokens.selectionFg,
    "--color-scrollbar": tokens.scrollbar,
    "--glow-1": toRgba(tokens.glows[0]),
    "--glow-2": toRgba(tokens.glows[1] ?? tokens.glows[0]),
    "color-scheme": tokens.scheme,
  };
}
