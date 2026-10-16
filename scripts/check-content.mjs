#!/usr/bin/env node
/**
 * One-source invariant.
 *
 * A route content file may not restate a figure or a stack list that site.ts can
 * hold. Prose uses `{{stat:<projectId>.<key>}}`; templates use StatRow/StackList.
 * Otherwise the page and the bot surface drift apart on the next edit.
 *
 * Only route files (files with a `route:` frontmatter key) are scanned. Corpus-only
 * files are exempt from this script, not from the rule: they are still served, at
 * /knowledgebase/*.md and into the chat corpus, so a figure restated there drifts just
 * as visibly. The index maps under content/ are where this bites — keep dates, roles
 * and events out of them and let the site.ts facts block carry those.
 *
 * Usage: check-content.mjs [--root <dir>]   (default root: content)
 */
import fs from "node:fs";
import path from "node:path";
import { site } from "../src/data/site.ts";

const rootIndex = process.argv.indexOf("--root");
const ROOT =
  rootIndex !== -1 && process.argv[rootIndex + 1]
    ? process.argv[rootIndex + 1]
    : "content";

const EXEMPT = "<!-- one-source-ok -->";

function walk(dir, prefix = "") {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full, path.posix.join(prefix, entry.name)));
    } else if (entry.name.endsWith(".md")) {
      out.push(path.posix.join(prefix, entry.name));
    }
  }
  return out;
}

function hasRoute(raw) {
  if (!raw.startsWith("---")) return false;
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return false;
  return /^route:/m.test(raw.slice(3, end));
}

function bodyOf(raw) {
  if (!raw.startsWith("---")) return raw;
  const end = raw.indexOf("\n---", 3);
  return end === -1 ? raw : raw.slice(end + 4);
}

/** Values a page must not restate. Short numerics are skipped: "6" would match
 *  inside every 2026 and "27" inside 2026-27. */
function collectStatValues() {
  const values = new Set();
  for (const p of site.projects) for (const s of p.stats) values.add(s.value);
  for (const e of site.experience) for (const s of e.stats ?? []) values.add(s.value);

  return [...values].filter((value) => {
    const digits = value.replace(/\D/g, "");
    const isNumeric = /^\$?[\d,]+$/.test(value);
    return isNumeric ? digits.length >= 3 : value.length >= 3;
  });
}

function collectStackEntries() {
  const entries = new Set();
  for (const p of site.projects) for (const s of p.stack) entries.add(s);
  return [...entries];
}

const STAT_VALUES = collectStatValues();
const STACK_ENTRIES = collectStackEntries();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function statPattern(value) {
  return new RegExp(`(?<![\\w$,.])${escapeRegex(value)}(?![\\w$,.])`);
}

function stackPattern(entry) {
  return new RegExp(`(?<![\\w-])${escapeRegex(entry)}(?![\\w-])`);
}

const STAT_PATTERNS = STAT_VALUES.map((v) => ({ value: v, re: statPattern(v) }));
const STACK_PATTERNS = STACK_ENTRIES.map((v) => ({ value: v, re: stackPattern(v) }));

/**
 * A line is list-shaped when it enumerates the stack: known entries make up most
 * of its words, or it uses list punctuation. A prose sentence that happens to
 * name two technologies ("LMS sync with Playwright ... into SQLite") is
 * legitimate — flagging it trains people to ignore the gate, which is worse than
 * the drift it is meant to catch.
 */
function isStackListShaped(line, hits) {
  if (hits === 0) return false;
  if (line.includes("·")) return true;
  if (/^\s*Stack\s*:/i.test(line)) return true;

  const words = line
    .replace(/[^\p{L}\p{N}+#./ -]/gu, " ")
    .split(/\s+/)
    .filter(Boolean).length;

  return hits >= 2 && words > 0 && hits / words >= 0.4;
}

const failures = [];

for (const rel of walk(ROOT)) {
  const raw = fs.readFileSync(path.join(ROOT, rel), "utf-8");
  if (!hasRoute(raw)) continue;

  const lines = bodyOf(raw).split("\n");

  lines.forEach((line, i) => {
    if (line.includes(EXEMPT)) return;

    for (const { value, re } of STAT_PATTERNS) {
      if (re.test(line)) {
        failures.push({ rel, line: i + 1, kind: "stat", value, text: line.trim() });
      }
    }

    const stackHits = STACK_PATTERNS.filter(({ re }) => re.test(line));
    if (isStackListShaped(line, stackHits.length)) {
      failures.push({
        rel,
        line: i + 1,
        kind: "stack",
        value: stackHits.map((h) => h.value).join(", "),
        text: line.trim(),
      });
    }
  });
}

if (failures.length > 0) {
  console.error(
    `check:content — ${failures.length} restated fact(s) in route files under ${ROOT}/\n`
  );
  for (const f of failures) {
    console.error(`  ${ROOT}/${f.rel}:${f.line}  [${f.kind}: ${f.value}]`);
    console.error(`    ${f.text}`);
  }
  console.error(
    "\nUse {{stat:<projectId>.<key>}} for figures, StatRow/StackList in templates," +
      `\nor ${EXEMPT} on a line that genuinely must name the value.`
  );
  process.exitCode = 1;
} else {
  console.log(`check:content — clean (${ROOT}/)`);
}
