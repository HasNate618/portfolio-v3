/**
 * Authoritative palette.
 *
 * `src/app/globals.css` mirrors these as Tailwind theme colours, and
 * `scripts/check-contrast.mjs` asserts every text pair clears 4.5:1 against
 * `bg`. Keeping the palette as data is what makes contrast testable — a colour
 * that only exists inside a stylesheet cannot be checked.
 *
 * Note on `muted`: the reference design used slate-500 for dates and footers,
 * which is 3.75:1 on this background and fails the floor. `muted` here is a
 * step lighter (5.42:1) so de-emphasised text still passes.
 */
export const tokens = {
  bg: "#18181b",
  fg: "#d4d4d8",
  muted: "#a1a1aa",
  accent: "#5eead4",
  /** Non-text only: hairlines and section dividers. */
  rule: "rgba(226, 232, 240, 0.1)",
} as const;

export type TokenName = keyof typeof tokens;
