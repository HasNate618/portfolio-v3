# Chat v4 Stage 1: D1 corpus, banned words, dash ranges

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the word "flagship" from every served surface and from code, fail the build if it returns, make `May–Aug 2026` read as a date range, and list ferret under Rust.

**Architecture:** A shared `BANNED_WORD_PATTERNS` list drives `npm run check:words`. Rank is renamed `flagship` → `lead` in `site.ts` and dropped from the corpus projection, so retrieval can no longer match on the word. The dash sanitizer's lookbehind accepts a bare month on the left of a range. Embeddings are rebuilt last so the cache cannot smuggle the word back in.

**Tech Stack:** TypeScript, `node:test` via `tsx`, existing `sanitizeDashes`, Cohere embeddings (last task only).

**Spec:** `docs/new-chat-design.md` §4.2, §8 dash paragraph, §4.2 "other corpus changes" (ferret). Map: `docs/superpowers/plans/2026-10-18-chat-v4.md`.

## Global Constraints

- Never write the word "flagship" in new copy, comments, tests, or prompts, except inside `src/lib/banned-words.ts` and `scripts/check-banned-words.mjs` / its test (they must name the word).
- Home page order unchanged: Campus still leads. `leadProject()?.id === "campus"`. Featured remain homelab, AWARE, CareBridge.
- No em or en dashes in site copy. Chat answers still pass through `sanitizeDashes`.
- `docs/new-chat-design.md` keeps the word; `check:words` does not scan the `docs/` tree (see the map).
- Rebuild the chat index with `npm run build-embeddings` after corpus-affecting edits. Never print `COHERE_API_KEY`.
- One commit per task. Gates from the map before each commit. No push.

## Review Focus

1. **Stale embeddings cache** — a D1 content edit with yesterday's cache still contains "flagship" in chunk text and would fail `check:words` and serve the word at `/knowledgebase`. Task 5 rebuilds and asserts `check:words` plus `check:embeddings`.
2. **`May–Aug 2026` inside parentheses** — `Intern (May–Aug 2026)` must become `Intern (May to Aug 2026)`, not `Intern (May: Aug 2026)`. Task 3.
3. **Name-then-month stays a separator** — `**Animarker** – May 2023` must stay `**Animarker**: May 2023`. Task 3.
4. **Question-bank leftover** — `src/data/question-bank.ts:16` still has `"flagship"` until stage 2 deletes the file. Task 2 patches `answerMustContain` to `["20-tool agent"]` so `check:words` can pass this stage.
5. **JS-off knowledgebase** — `/knowledgebase/about.md`, `/knowledgebase/projects/campus.md`, `/knowledgebase/projects/index.md` must not contain `/flagship/i` after the rebuild. Task 5 `check:render`.

---

## File map

| Path | Responsibility |
|------|----------------|
| `src/lib/banned-words.ts` | The list. Importers: checker, later the chip validator |
| `scripts/check-banned-words.mjs` | Walks roots, exits 1 on a hit |
| `tests/check-banned-words.test.ts` | Runs the script against a temp tree |
| `src/data/site.ts` | `ProjectRank`, `rank: "lead"`, `leadProject()` |
| `src/lib/corpus.ts` | No `Rank:` line in any facts block |
| `src/components/views/HomeView.tsx` | `leadProject()` |
| `src/app/api/chat/lib/{system-prompt,context}.ts` | Interim: drop the word; `leadProject` where the flagship was |
| `src/app/api/chat/lib/sanitize-dashes.ts` | Bare-month lookbehind |
| `content/about.md`, `content/projects/{campus,index}.md`, `content/skills.md` | Copy |
| `docs/superpowers/{specs,plans}/2026-10-15-portfolio-v3-text-*.md` | The two lines in spec §4.2 |
| `scripts/check-render.mjs` | Assert no `/flagship/i` on listed routes |

### Task 1: `check:words`

**Files:**
- Create: `src/lib/banned-words.ts`
- Create: `scripts/check-banned-words.mjs`
- Create: `tests/check-banned-words.test.ts`
- Modify: `package.json` scripts: `"check:words": "tsx scripts/check-banned-words.mjs"`
- Modify: `README.md` Checks block (after `check:content`), `AGENTS.md` Commands block

**Interfaces:**
- Produces: `export const BANNED_WORD_PATTERNS: ReadonlyArray<{ word: string; re: RegExp }>` starting as `[{ word: "flagship", re: /\bflagship\b/i }]`.
- Produces: `npm run check:words` exits 1 while "flagship" remains in the tree.

- [ ] **Step 1: Write the failing test**

`tests/check-banned-words.test.ts`: spawn `tsx scripts/check-banned-words.mjs` with a temp `--root` (extend the script to accept `--root` like `check-content.mjs`, defaulting to the repo). Temp dir contains `content/x.md` with the line `Campus is the flagship.` Assert exit code 1 and stdout/stderr includes `flagship`. A second temp dir with no hit asserts exit 0.

- [ ] **Step 2: Run it to make sure it fails**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test tests/check-banned-words.test.ts`
Expected: FAIL (`check-banned-words.mjs` not found).

- [ ] **Step 3: Implement `src/lib/banned-words.ts` and `scripts/check-banned-words.mjs`**

Roots (when `--root` is omitted): `content`, `src`, `public`, `tests`, `scripts`, `README.md`, `docs/superpowers/specs/2026-10-15-portfolio-v3-text-design.md`, `docs/superpowers/plans/2026-10-15-portfolio-v3-text-site.md`. Extensions: `md|mdx|ts|tsx|mjs|js|json|txt|yml|yaml`. Skip: `scripts/check-banned-words.mjs`, `tests/check-banned-words.test.ts`, `src/lib/banned-words.ts`. Skip `node_modules` and dotfiles. Print `check:words: N banned word(s)` then each `file:line [word] snippet`, exit 1; else `check:words: clean`.

- [ ] **Step 4: Run the unit test (pass) and `npm run check:words` (fail on the real tree)**

Expected: unit test PASS. `npm run check:words` exits 1 with hits that include `content/about.md:33`, `src/data/site.ts:17`, `src/lib/corpus.ts:28`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/banned-words.ts scripts/check-banned-words.mjs tests/check-banned-words.test.ts package.json README.md AGENTS.md
git commit -m "$(cat <<'EOF'
chat: fail the build when flagship appears

EOF
)"
```

`check:words` red on master is expected until Task 2. Do not add it to a required CI-style bundle yet if that would block later tasks; keep it invocable. Task 5 wires it next to `check:content` as a required gate.

### Task 2: Rename rank and strip the word

**Files:**
- Modify: `src/data/site.ts` (comment 14–15, type 17, comment 56, `rank: "lead"` at campus, `leadProject` at 611–612)
- Modify: `src/lib/corpus.ts:25-29` — delete the five rank lines (flagship **and** featured). No `Rank:` line reaches any corpus doc
- Modify: `src/components/views/HomeView.tsx:2,30` — `leadProject`
- Modify: `src/app/api/chat/lib/system-prompt.ts:1,11` — `[...featuredProjects()]` only (v4 deletes `PROJECT_ORDER` in stage 3; this is the interim)
- Modify: `src/app/api/chat/lib/context.ts:1,14,45,50` — `leadProject()?.file`; comments say "the project the home page leads with", never "flagship"
- Modify: `content/about.md:33` to the spec's replacement (keep the rest of the paragraph: the Local and cost-aware AI sentence)
- Modify: `content/projects/campus.md:14` — delete `rank: flagship`
- Modify: `content/projects/index.md:14` — `## Featured`
- Modify: `src/data/question-bank.ts:16` — `answerMustContain: ["20-tool agent"]`
- Modify: `tests/corpus.test.ts:59-60`, `tests/site.test.ts:6,119-120,130-133`, `tests/context.test.ts:49,65,100`, `tests/followups.test.ts:35`, `tests/sanitize-dashes.test.ts:10,51`
- Modify: `docs/superpowers/specs/2026-10-15-portfolio-v3-text-design.md:192` and `docs/superpowers/plans/2026-10-15-portfolio-v3-text-site.md:1399` per spec §4.2

**Interfaces:**
- Consumes: `BANNED_WORD_PATTERNS`
- Produces: `export type ProjectRank = "lead" | "featured"`; `export function leadProject(): Project | undefined`
- Produces: `flagshipProject` gone. Grep for `flagshipProject` must be empty.

- [ ] **Step 1: Write the failing tests** (titles and assertions from spec §4.2)

```ts
test("no rank or lead label reaches the corpus", () => {
  assert.doesNotMatch(getCorpusDoc("projects/campus.md")!.text, /^Rank:/m);
  assert.doesNotMatch(getCorpusDoc("projects/homelab.md")!.text, /^Rank:/m);
});

test("the lead project is explicit data, not a hardcoded id in a view", () => {
  assert.equal(leadProject()?.id, "campus");
});

test("every ranked project exists and exactly one is the lead", () => {
  const ranked = site.projects.filter((p) => p.rank);
  assert.equal(ranked.filter((p) => p.rank === "lead").length, 1);
  assert.equal(ranked.length, 4, "campus (lead) plus three featured");
});
```

Replace the two sanitize-dashes fixtures that currently say "flagship" with `"**Campus** \u2013 his study assistant"` → `"**Campus**: his study assistant"`. Rename the followups test to `"the defaults lead with Campus"` (body unchanged until stage 2).

- [ ] **Step 2: Run the renamed tests to verify they fail**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test tests/corpus.test.ts tests/site.test.ts`
Expected: FAIL (`leadProject` is not exported; Campus facts still contain `Rank: flagship project`).

- [ ] **Step 3: Apply the table in spec §4.2**

Exact about.md replacement:

`His main projects are Campus, a self-hosted study assistant; a NixOS homelab where AI agents propose config changes that he approves; and AWARE, an on-device build. His industry work is at TeraGo and 3D Western.`

Keep the existing following sentence about Local and cost-aware AI.

- [ ] **Step 4: Run tests and `npm run check:words`**

Expected: unit tests PASS. `check:words` still fails on `src/app/api/chat/lib/embeddings-cache.json` only (or is clean if the cache happens not to store the word as a whole token — if it is already clean, skip nothing; Task 5 still rebuilds).

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
content: Campus leads; nothing is a flagship

EOF
)"
```

### Task 3: Month-only date ranges

**Files:**
- Modify: `src/app/api/chat/lib/sanitize-dashes.ts` (`DATE_BEFORE`)
- Test: `tests/sanitize-dashes.test.ts`

**Interfaces:**
- Consumes: existing `sanitizeDashes(text: string, atLineStart?: boolean): string`
- Produces: the same function. `DATE_BEFORE` becomes `(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?(?:\s+\d{4})?|\d{4}`

- [ ] **Step 1: Write the failing tests**

```ts
test("a month range without a year on the left is still a range", () => {
  assert.equal(sanitizeDashes("May\u2013Aug 2026"), "May to Aug 2026");
  assert.equal(sanitizeDashes("Intern (May\u2013Aug 2026)"), "Intern (May to Aug 2026)");
  assert.equal(sanitizeDashes("2024\u20132028"), "2024 to 2028");
});
```

Keep the existing Animarker test. Add `"fast\u2014and cheap"` → `"fast, and cheap"` if it is not already covered.

- [ ] **Step 2: Run it to make sure it fails**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test tests/sanitize-dashes.test.ts`
Expected: FAIL (`May: Aug 2026`).

- [ ] **Step 3: Change `DATE_BEFORE` only**

Do not loosen the lookahead. A proper noun on the left still fails the lookbehind, so Animarker stays a colon.

- [ ] **Step 4: Run tests** — Expected: PASS, including Animarker.

- [ ] **Step 5: Commit** — `chat: a dash between two months is a range`

### Task 4: ferret under Rust

**Files:**
- Modify: `content/skills.md:41`

**Interfaces:** none.

- [ ] **Step 1: Write the failing assertion in `tests/content.test.ts`** (or extend an existing skills test if one lists languages)

```ts
test("the Rust line names the live project first", () => {
  const skills = fs.readFileSync("content/skills.md", "utf8");
  const line = skills.split("\n").find((l) => l.startsWith("- **Rust**"));
  assert.match(line!, /ferret/);
  assert.match(line!, /AgntOS/);
});
```

If `tests/content.test.ts` is the wrong home, put it in `tests/site.test.ts`. One test.

- [ ] **Step 2: Run it** — Expected: FAIL (line is `- **Rust**: [AgntOS](projects/agntos.md) (abandoned)`).

- [ ] **Step 3: Replace the line with** `- **Rust**: [ferret](projects/ferret.md), [AgntOS](projects/agntos.md) (abandoned)`

- [ ] **Step 4: Run the test** — Expected: PASS.

- [ ] **Step 5: Commit** — `content(skills): ferret is the live Rust project`

### Task 5: Rebuild index and close the gate

**Files:**
- Modify: `scripts/check-render.mjs` — after existing assertions, fetch `/`, `/llms.txt`, and `/knowledgebase/about.md`, `/knowledgebase/projects/campus.md`, `/knowledgebase/projects/index.md`. `pass(!/flagship/i.test(body), \`${path}: contains flagship\`)`. There is no `/llms-full.txt` route; do not add one.
- Modify: `README.md` / `AGENTS.md` if Task 1 did not already list `check:words` as a required check
- Rebuild: `src/app/api/chat/lib/embeddings-cache.json` via `npm run build-embeddings`

**Interfaces:**
- Consumes: Task 1 checker, Task 2 corpus
- Produces: `check:words: clean` on the real tree, including the embeddings cache

- [ ] **Step 1: Run `npm run check:words`** and note remaining hits. The only acceptable remaining hit is the embeddings cache.

- [ ] **Step 2: `npm run build-embeddings`** (needs `COHERE_API_KEY` from `.env`; never print it). Then `npm run check:embeddings` and `npm run check:words`. Expected: both clean.

- [ ] **Step 3: Add the `check:render` assertions.** Do not run `check:render` if a `npm run dev` already owns 3100; record that it needs a later `npm start` pass. If 3100 is free: `npm run build && npm run start` then `npm run check:render`.

- [ ] **Step 4: Full gates**

```bash
npm test && npm run typecheck && npm run lint && npm run check:content && npm run check:words && npm run check:embeddings
```

Expected: all green.

- [ ] **Step 5: Commit the cache, checker wiring, and render assertions** — `chat: rebuild the index without the flagship line`

Stage 1 is done when `git grep -i flagship` (tracked files, excluding `docs/new-chat-design.md`, `src/lib/banned-words.ts`, `scripts/check-banned-words.mjs`, `tests/check-banned-words.test.ts`) is empty, and `leadProject()?.id === "campus"`.
