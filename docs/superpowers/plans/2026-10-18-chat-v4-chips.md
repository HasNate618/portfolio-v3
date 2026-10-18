# Chat v4 Stage 2: Model-written chips

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the embedding-ranked question bank with a model-written three-slot chip call (deeper, adjacent, path), validated, repaired, regenerated once, then filled from templates.

**Architecture:** `generateFollowups` is rewritten in place so `/api/chat/followups` keeps working. A pure `validateChip` / `repairChip` / `templateChips` pipeline never needs the profile card; it reads `site.ts` for ids, names, solo/team, awards, and abandoned. The bank, its cache, `chips.ts`, and the bank half of `embeddings.ts` are deleted. The client format is unchanged: `<<FOLLOWUPS>>q1|||q2|||q3|||`.

**Tech Stack:** Cohere `command-a-plus-05-2026` with thinking disabled, `temperature: 0.4`, `maxTokens: 300`, `response_format` json_object with fixed keys (not an array; Cohere 400s on `minItems`). `node:test`.

**Spec:** `docs/new-chat-design.md` §7. Map: `docs/superpowers/plans/2026-10-18-chat-v4.md`. Requires stage 1.

## Global Constraints

- Every chip says "Nathan" and never "he" / "his" / "him".
- No question bank. No `selectChips`. No `queryVector` on the chat route.
- Abandoned subjects (`agntos`, `cyberdeck`) are allowed only when the visitor's message already named them.
- `TEAM_NO_ROLE_IDS` (map) cannot take a leadership/role premise. Adjacent cannot equal deeper's subject.
- Starters in `content/chat.md` become the four `STARTERS` from the map. Non-answers emit the first three.
- `formatFollowupsTail` stays. Do not export it from a new file.
- One commit per task. Gates from the map. `npm run build` after the route change. No push.

## Review Focus

1. **Cohere rejects array `minItems`** — schema uses fixed keys `deeper` / `adjacent` / `path`, each `{ question, subject }`. Task 3.
2. **Repair of "his X"** — `"How does his Campus retrieve?"` becomes `"How does Nathan's Campus retrieve?"` and then passes. Task 1.
3. **False award premise** — `"What award did Nathan's AWARE win?"` with subject `aware` fails (AWARE has no `awardFor`). Task 1.
4. **Followups route without docs** — `POST /api/chat/followups` still 200s: `generateChips` with `featureIds = GENERAL` from stage 3 is not available yet, so this stage passes `featureIds: ["terago", "3d-western", "homelab", "aware", "campus", "carebridge"]` as a constant `CHIP_FEATURE_DEFAULT` in `generate-followups.ts`. Stage 3 switches it to `routeTopic`. Task 4.
5. **Bank cache left behind** — `check:embeddings` must not mention the bank after Task 5. A leftover `question-bank-cache.json` is deleted, not ignored.

---

## File map

| Path | Responsibility |
|------|----------------|
| `src/app/api/chat/lib/generate-followups.ts` | Prompt, schema, `generateChips`, `formatFollowupsTail` |
| `src/app/api/chat/lib/chips-validate.ts` | `chipSubjectIds`, `validateChip`, `repairChip`, `templateChips` |
| `src/app/api/chat/lib/followup-fallback.ts` | Keep `isNonAnswer`. Delete `TOPIC_RULES` and `buildFallbackFollowups` / `normalizeFollowups` once templates replace them |
| `src/app/api/chat/route.ts` | After the answer, `generateChips`. No mid-stream kickoff |
| `src/app/api/chat/followups/route.ts` | Same `generateChips` |
| `src/app/api/chat/lib/{rag,embeddings}.ts` | Drop `queryVector` / bank cache |
| `content/chat.md` | Four `STARTERS` |
| Delete | `src/data/question-bank.ts`, `src/data/question-bank-cache.json`, `src/app/api/chat/lib/chips.ts`, `tests/chips.test.ts`, `tests/question-bank.test.ts` |

### Task 1: Validator and repair (pure)

**Files:**
- Create: `src/app/api/chat/lib/chips-validate.ts`
- Create: `tests/chips-validate.test.ts`

**Interfaces:**
- Consumes: `site`, `awardFor`, `BANNED_WORD_PATTERNS`, `TEAM_NO_ROLE_IDS`
- Produces:

```ts
export function chipSubjectIds(): string[]
export function validateChip(input: {
  question: string;
  subject: string;
  slot: ChipSlotName;
  answerSubject: string;
  asked: string[];
  userAskedAbandoned: boolean;
}): ChipFailure[]
export function repairChip(question: string): string
```

`chipSubjectIds()` = live project ids (`displayStatus !== "abandoned"`) + every `site.experience[].id` + `"nathan"`.

`repairChip`: replace leading / in-sentence `\bhis\b` with `Nathan's`, `\bhe\b` with `Nathan`, `\bhim\b` with `Nathan`. Do not touch `this`.

Validator rules (all must produce a `ChipFailure` with a stable `code`):

| code | Rule |
|---|---|
| `nathan` | question matches `/\bNathan\b/` |
| `pronoun` | no `\b(he|his|him)\b`i |
| `length` | word count ≤ 14, ends with `?` |
| `banned` | no `BANNED_WORD_PATTERNS` hit |
| `subject` | `subject` is in `chipSubjectIds()`, or is an abandoned id and `userAskedAbandoned` |
| `names` | at most one `site.ts` project/org name (and aliases: id with dashes→spaces) appears; if any, it equals `subject` unless `subject === "nathan"` |
| `adjacent` | when `slot === "adjacent"`, `subject !== answerSubject` |
| `award` | `/\b(won|award|prize)\b/i` only if `awardFor(name)` exists for that subject |
| `solo` | `/\bsolo\b/i` only if that project's `displayRole === "solo"` |
| `led` | `/\b(team|led|lead)\b/i` on a `TEAM_NO_ROLE_IDS` subject fails; on a solo project fails |
| `dup` | case-insensitive duplicate of `asked` or the current user question (pass current user question in `asked`) |

- [ ] **Step 1: Write the failing tests** covering each code plus: repair then validate on `"How does his Campus retrieve?"` with `subject: "campus"` yields `[]` after repair; AWARE-award fails; AgntOS subject fails unless `userAskedAbandoned`; adjacent subject equal to `answerSubject` fails.

- [ ] **Step 2: Run** `tests/chips-validate.test.ts` — Expected: FAIL (module missing).

- [ ] **Step 3: Implement the three functions.** Names and aliases: `site.projects` `name`+`id`, `site.experience` `org`+`id`. Match with `\b` and case-insensitive.

- [ ] **Step 4: Run tests** — Expected: PASS.

- [ ] **Step 5: Commit** — `chat: validate a chip before it reaches the page`

### Task 2: Templates

**Files:**
- Modify: `src/app/api/chat/lib/chips-validate.ts` (add `templateChips`)
- Test: `tests/chips-validate.test.ts`

**Interfaces:**
- Produces:

```ts
export function templateChips(input: {
  answerSubject: string;
  featureIds: string[];
  asked: string[];
  pathIndex: number;
}): ChipSet
```

Templates, all answerable from `site.ts`:

- deeper: if `answerSubject` is a role id → `What did Nathan build at ${org}?` else if a project id → `How does Nathan's ${name} work?` else `What does Nathan build?`
- adjacent: the same two templates on the next `featureIds` entry whose id ≠ `answerSubject`. Wrap. If none, `What did Nathan build at TeraGo?`
- path: rotate `pathIndex % 4` through `Is Nathan available for a Summer 2027 internship?`, `When does Nathan graduate?`, `Where is Nathan's résumé?`, `How can I contact Nathan?`

Skip any template that is in `asked` (case-insensitive); take the next path line or next feature id.

- [ ] **Step 1: Write tests** — Campus answer + `featureIds: ["campus","terago","aware"]` + `pathIndex: 0` yields deeper Campus how-it-works, adjacent TeraGo, path Summer 2027. All three pass `validateChip`.

- [ ] **Step 2: Run** — Expected: FAIL (`templateChips` missing).

- [ ] **Step 3: Implement.** Look up `name`/`org` from `site`.

- [ ] **Step 4: Run tests** — Expected: PASS.

- [ ] **Step 5: Commit** — `chat: template chips that the card can already answer`

### Task 3: `generateChips`

**Files:**
- Rewrite: `src/app/api/chat/lib/generate-followups.ts`
- Modify: `tests/followups.test.ts` — drop `TOPIC_RULES` tests; keep `formatFollowupsTail`, `isNonAnswer`, and add prompt tests
- Modify: `src/app/api/chat/lib/followup-fallback.ts` — keep `isNonAnswer` and `DEFAULT_FOLLOWUPS` (set to `STARTERS.slice(0, 3)`). Delete `TOPIC_RULES`, `buildFallbackFollowups`, `normalizeFollowups`

**Interfaces:**
- Consumes: Task 1–2, `getCohereClient`, `CHAT_MODEL`, `CHAT_THINKING_DISABLED`
- Produces:

```ts
export const CHIP_SCHEMA: Record<string, unknown> // json_object schema with required deeper, adjacent, path
export function buildChipPrompt(input: GenerateChipsInput): string
export async function generateChips(input: GenerateChipsInput): Promise<string[]>
export function formatFollowupsTail(followups: string[]): string // unchanged
```

```ts
export interface GenerateChipsInput {
  userMessage: string;
  answer: string;
  docs: { title: string; firstLine: string }[];
  featureIds: string[];
  asked: string[];
  userAskedAbandoned: boolean;
  pathIndex?: number;
}
```

`generateChips` order: one Cohere json call → parse `ChipSet` → `repairChip` each question → `validateChip` each slot → if any fail, one regenerate with the failure list appended to the prompt → still failing slots replaced by `templateChips`. Always return three strings `[deeper, adjacent, path]`. On thrown API error, return `templateChips` only.

Prompt rules: copy spec §7 (Nathan, ≤12 words asked of the model, one subject, three jobs, no award/leadership/team-role unless the card/flags allow — here, pass a compact list of `{id,name,solo,award}` built from `site.ts`, not a card string). Do not mention AgntOS in a spelling list.

Delete `FOLLOWUP_MODEL` from `cohere.ts` if nothing else imports it.

- [ ] **Step 1: Rewrite `tests/followups.test.ts`**

Keep: `isNonAnswer` cases; `formatFollowupsTail(["a?","b?","c?"]) === "a?|||b?|||c?|||"`.
Add: `buildChipPrompt` contains `Nathan`, does not contain `AgntOS`, contains `deeper`, `adjacent`, `path`.
Delete: every `buildFallbackFollowups` / `TOPIC_RULES` / "defaults lead with the flagship" test.
Add: `DEFAULT_FOLLOWUPS` equals the first three `STARTERS`.

- [ ] **Step 2: Run `tests/followups.test.ts`** — Expected: FAIL.

- [ ] **Step 3: Implement prompt, schema, `generateChips`. Do not call Cohere in unit tests.** The generate function is tested by mocking `getCohereClient` only if a test already does that; otherwise tests cover prompt + the repair/validate/template composition with a local fake parser. Add `tests/generate-chips.test.ts` that injects a fake `complete: () => Promise<ChipSet>` if you split that inner function as `applyChipPipeline(raw: ChipSet, input): string[]` — prefer exporting `applyChipPipeline` so the regenerate-then-template order is unit-tested without a key.

- [ ] **Step 4: Run `tests/followups.test.ts tests/chips-validate.test.ts tests/generate-chips.test.ts`** — Expected: PASS.

- [ ] **Step 5: Commit** — `chat: write the chips with the model again`

### Task 4: Wire the route and starters

**Files:**
- Modify: `src/app/api/chat/route.ts` — remove `selectChips`, `QUESTION_BANK`, `queryVector`. After `streamAnswer`, non-answer → `DEFAULT_FOLLOWUPS`; else `await generateChips({...})`. No 400-char kickoff, no `FOLLOWUP_START_CHARS`, no `withinFollowupBudget`
- Modify: `src/app/api/chat/followups/route.ts` — `generateChips` with `docs: []`, `featureIds: CHIP_FEATURE_DEFAULT`, `asked: []`
- Modify: `src/app/api/chat/lib/rag.ts` — `retrieveRelevantChunks` returns `ScoredChunk[]` again (drop `RetrievedChunks.queryVector`). Update `src/app/api/search/route.ts` to stop destructuring `{ chunks }` if the return is already the array
- Modify: `content/chat.md` frontmatter `starters:` to the four `STARTERS`
- Modify: any test that reads chat starters (`tests/views/chat.test.tsx`)

**Interfaces:**
- Consumes: `generateChips`, `isNonAnswer`, `DEFAULT_FOLLOWUPS`, `formatFollowupsTail`
- `CHIP_FEATURE_DEFAULT = ["terago", "3d-western", "homelab", "aware", "campus", "carebridge"]` (same as spec `GENERAL`; stage 3 replaces call sites with `routeTopic(...).feature`)

`userAskedAbandoned`: true when the user message matches `/\b(agntos|cyberdeck)\b/i`.

`pathIndex`: `asked.length` (stable rotation per thread length).

- [ ] **Step 1: Extend `tests/views/chat.test.tsx`** (or the existing starters test) so the four `STARTERS` appear in the rendered `/chat` noscript/starter list. Run to see it fail on "proudest" / "internship".

- [ ] **Step 2: Implement the route and `content/chat.md`.**

- [ ] **Step 3: `npm run build`** (route changed) then `npm test` `npm run typecheck`. Expected: PASS. Failures from still-imported `chips.ts` / bank are Task 5.

- [ ] **Step 4: Commit** — `chat: ask the model for the next three questions`

### Task 5: Delete the bank

**Files:**
- Delete: `src/data/question-bank.ts`, `src/data/question-bank-cache.json`, `src/app/api/chat/lib/chips.ts`, `tests/chips.test.ts`, `tests/question-bank.test.ts`
- Modify: `src/app/api/chat/lib/embeddings.ts` — remove `QUESTION_BANK`, `BANK_CACHE_PATH`, `questionBankContentHash`, `readBankCacheHash`, `loadQuestionBankEmbeddings`, and the bank-building branch
- Modify: `scripts/build-embeddings.mjs` and `scripts/check-embeddings.mjs` — corpus cache only. Success line no longer mentions `bank`
- Grep: `question-bank`, `selectChips`, `queryVector`, `CHIP_SIMILARITY` must be empty under `src/` and `tests/` and `scripts/`

**Interfaces:**
- Produces: `retrieveRelevantChunks(query, topK?): Promise<ScoredChunk[]>`
- Produces: `check:embeddings — fresh (N chunks, hash)` with no bank clause

- [ ] **Step 1: Delete the files. Fix the compile errors the tests show.**

- [ ] **Step 2: Run `npm test && npm run typecheck && npm run lint && npm run build && npm run check:embeddings`**

Expected: PASS. `check:embeddings` does not need a rebuild unless you touched corpus text (you should not have).

- [ ] **Step 3: Commit** — `chat: drop the question bank`

Stage 2 is done when a local `POST /api/chat` (browser headers) returns `<<FOLLOWUPS>>` with three `?`-ending lines that each contain `Nathan`, and `src/data/question-bank.ts` does not exist.
