#!/usr/bin/env node
/**
 * Contrast gate. Every text token in every candidate scheme must clear WCAG AA
 * (4.5:1) against that scheme's own background, against the lightest point of
 * its ambient washes, and against a chat bubble fill.
 *
 * Checking the whole registry rather than only the shipped pair means the dev
 * palette panel can never offer an inaccessible option.
 *
 * Run through tsx, since plain node cannot import a .ts module.
 *
 * Usage: check-contrast.mjs
 */
import { PALETTE_NAMES, palettes } from "../src/styles/palettes.ts";

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

/** Alpha-composite a wash colour over the background, per channel. */
function composite(hex, alpha, over) {
  const mix = (i) =>
    Math.round(
      alpha * parseInt(hex.slice(i, i + 2), 16) +
        (1 - alpha) * parseInt(over.slice(i, i + 2), 16)
    );
  return `#${[1, 3, 5].map((i) => mix(i).toString(16).padStart(2, "0")).join("")}`;
}

const MIN = 4.5;
const failures = [];
let checked = 0;

for (const paletteName of PALETTE_NAMES) {
  const { label, tokens } = palettes[paletteName];

  const textTokens = [
    ["fg", tokens.fg],
    ["muted", tokens.muted],
    ["accent", tokens.accent],
  ];

  /*
   * The flat background is not the worst case, because text can sit over a
   * wash. Composite every wash over `bg` and test against the lightest one.
   */
  const washes = tokens.glows.map((glow) => composite(glow.color, glow.alpha, tokens.bg));
  const lightestWash = washes.reduce((a, b) =>
    relativeLuminance(a) >= relativeLuminance(b) ? a : b
  );

  const surfaces = [
    ["bg", tokens.bg],
    ["wash", lightestWash],
    ["bubble", composite(tokens.bubble.color, tokens.bubble.alpha, tokens.bg)],
  ];

  console.log(`\n${label} (${paletteName}, ${tokens.scheme})`);

  for (const [surfaceName, surface] of surfaces) {
    for (const [tokenName, value] of textTokens) {
      const ratio = contrastRatio(value, surface);
      const ok = ratio >= MIN;
      checked += 1;
      console.log(
        `${ok ? "ok  " : "FAIL"}  ${tokenName.padEnd(7)} ${value}  on ${surfaceName.padEnd(4)} ${surface}  ${ratio.toFixed(2)}:1`
      );
      if (!ok) {
        failures.push({ palette: label, tokenName, surfaceName, value, ratio });
      }
    }
  }
}

if (failures.length > 0) {
  console.error(`\ncheck:contrast — ${failures.length} of ${checked} pair(s) below ${MIN}:1`);
  for (const f of failures) {
    console.error(
      `  ${f.palette}: ${f.tokenName} (${f.value}) on ${f.surfaceName} is ${f.ratio.toFixed(2)}:1`
    );
  }
  process.exitCode = 1;
} else {
  console.log(`\ncheck:contrast — all ${checked} pairs across ${PALETTE_NAMES.length} palettes >= ${MIN}:1`);
}
