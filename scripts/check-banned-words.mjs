#!/usr/bin/env node
/**
 * Banned words, as a build gate.
 *
 * The word list lives in `src/lib/banned-words.ts` so the chip validator rejects
 * the same words this fails on. The `docs/` tree is deliberately not scanned:
 * a design document has to be able to name the word it bans, and the two
 * superpowers files that said "flagship" are listed individually below.
 *
 * Usage: check-banned-words.mjs [--root <dir-or-file>]   (default: the served tree)
 */
import fs from "node:fs";
import path from "node:path";
import { BANNED_WORD_PATTERNS } from "../src/lib/banned-words.ts";

/** Everything a reader can reach, plus the code and tests that produce it. */
const ROOTS = [
  "content",
  "src",
  "public",
  "tests",
  "scripts",
  "README.md",
  "docs/superpowers/specs/2026-10-15-portfolio-v3-text-design.md",
  "docs/superpowers/plans/2026-10-15-portfolio-v3-text-site.md",
];

/** Files that have to name a banned word to do their job. */
const SKIP = new Set([
  "src/lib/banned-words.ts",
  "scripts/check-banned-words.mjs",
  "scripts/check-render.mjs",
  "tests/check-banned-words.test.ts",
]);

const PUBLISHED = /\.(md|mdx|ts|tsx|mjs|js|json|txt|yml|yaml)$/;

const rootIndex = process.argv.indexOf("--root");
const override = rootIndex === -1 ? null : process.argv[rootIndex + 1];

function files(entry) {
  if (!fs.existsSync(entry)) return [];
  if (fs.statSync(entry).isFile()) return [entry];
  const out = [];
  for (const child of fs.readdirSync(entry, { withFileTypes: true })) {
    if (child.name === "node_modules" || child.name.startsWith(".")) continue;
    out.push(...files(path.join(entry, child.name)));
  }
  return out;
}

const hits = [];
for (const root of override ? [override] : ROOTS) {
  for (const file of files(root)) {
    if (!PUBLISHED.test(file)) continue;
    const key = file.split(path.sep).join("/");
    if (SKIP.has(key)) continue;
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      for (const banned of BANNED_WORD_PATTERNS) {
        if (banned.re.test(line)) {
          hits.push(`${key}:${index + 1} [${banned.word}] ${line.trim().slice(0, 120)}`);
        }
      }
    });
  }
}

if (hits.length) {
  console.error(`check:words: ${hits.length} banned word(s)\n  ` + hits.join("\n  "));
  process.exit(1);
}
console.log("check:words: clean");
