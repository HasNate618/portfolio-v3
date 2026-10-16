#!/usr/bin/env node
/**
 * Contrast gate. Every text token must clear WCAG AA (4.5:1) against the page
 * background. Run through tsx, since plain node cannot import a .ts module.
 *
 * Usage: check-contrast.mjs
 */
import { tokens } from "../src/styles/tokens.ts";

function channel(hex, i) {
  return parseInt(hex.slice(i, i + 2), 16) / 255;
}

function relativeLuminance(hex) {
  const [r, g, b] = [channel(hex, 1), channel(hex, 3), channel(hex, 5)].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const MIN = 4.5;
const pairs = [
  ["fg", tokens.fg],
  ["muted", tokens.muted],
  ["accent", tokens.accent],
];

/** Alpha-composite a wash colour over the background, per channel. */
function composite(hex, alpha, over) {
  const mix = (i) =>
    Math.round(alpha * parseInt(hex.slice(i, i + 2), 16) + (1 - alpha) * parseInt(over.slice(i, i + 2), 16));
  return `#${[1, 3, 5].map((i) => mix(i).toString(16).padStart(2, "0")).join("")}`;
}

/*
 * Text sits on top of the ambient washes, so the flat background is not the
 * worst case. Composite every wash over `bg` and test against the lightest one.
 */
const washes = tokens.glows.map((glow) => composite(glow.color, glow.alpha, tokens.bg));
const lightestWash = washes.reduce((a, b) =>
  relativeLuminance(a) >= relativeLuminance(b) ? a : b
);

const surfaces = [
  ["bg", tokens.bg],
  ["wash", lightestWash],
];

const failures = [];

for (const [surfaceName, surface] of surfaces) {
  for (const [name, value] of pairs) {
    const ratio = contrastRatio(value, surface);
    const ok = ratio >= MIN;
    console.log(
      `${ok ? "ok  " : "FAIL"}  ${name.padEnd(7)} ${value}  on ${surfaceName.padEnd(4)} ${surface}  ${ratio.toFixed(2)}:1`
    );
    if (!ok) failures.push({ name, surfaceName, value, ratio });
  }
}

if (failures.length > 0) {
  console.error(`\ncheck:contrast — ${failures.length} pair(s) below ${MIN}:1`);
  for (const f of failures) {
    console.error(`  ${f.name} (${f.value}) on ${f.surfaceName} is ${f.ratio.toFixed(2)}:1`);
  }
  process.exitCode = 1;
} else {
  console.log(`\ncheck:contrast — all pairs >= ${MIN}:1`);
}
