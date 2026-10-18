# Chat v4 Stage 4: Retrieval, documents, filters, eval

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retrieve only detail docs, pin by topic instead of the Campus floor, send pins+chunks as Cohere `documents`, add a repeat guard, and gate the whole v4 pipeline with `npm run eval:chat`.

**Architecture:** Extract `runChatTurn` so the eval and the HTTP route share one pipeline. Nav pages and `chat.md` drop out of chat retrieval (they stay in `/api/search`). Topic `feature` ids become `factsBlockFor` pins, skipped when the question names a subject. After the stream, chips run as in stage 2. The eval is in-process, paced, and fails the process on threshold misses.

**Tech Stack:** Existing `embed-v5.0-pro` + `rerank-english-v3.0`. Chat `command-a-plus-05-2026`. `tsx` script. Do not switch to rerank-v4.0-pro.

**Spec:** `docs/new-chat-design.md` §3, §4.3, §4.4, §8, §10. Map: `docs/superpowers/plans/2026-10-18-chat-v4.md`. Requires stages 1–3.

## Global Constraints

- Search (`GET /api/search`) keeps the full index, including nav docs. Only the chat path excludes them.
- Reranker stays `rerank-english-v3.0`. Floor: keep up to 6 chunks with score ≥ 0.10; if top score < 0.30, send at most 2 chunks (broad).
- Pins: `factsBlockFor` of `topic.feature` (3–5 docs). No pins when `namedSubjectId(question)` is set.
- `documents[].data.title` = `${source} > ${section}`. Snippets under 300 words (existing 1200-character chunks are fine).
- `citation_options.mode: "FAST"`. Log citations; do not block on them; do not render them in the UI.
- Thinking budget 1500, `maxTokens` 3000, temperature 0.3. `frequency_penalty` stays 0 in production (map deviation 5).
- `MAX_ANSWER_CHARS = 6000`. Repeat guard aborts if a line of 30+ characters repeats twice, or a 200-character window repeats.
- Eval needs `COHERE_API_KEY`. Pace 5s between questions. Never print the key. Write `eval-out/<date>.json` (gitignored).
- v4 is accepted only if the eval beats the pre-stage-4 baseline on `mustNot` hits and lead-project spread, and meets §10 thresholds.
- One commit per task. `npm run build` after route/pipeline changes. No push.

## Review Focus

1. **Pins bypass the rerank floor** — a pinned facts block must still be sent when every reranked chunk scored < 0.10. Task 2.
2. **Named-subject skip** — "How does AWARE turn English into rules?" must not pin TeraGo. Task 2.
3. **Search still finds `projects/index.md`** — chat excludes it; `/api/search?q=projects` may still return it. Task 1.
4. **Repeat loop** — a 40-character line emitted three times aborts; the chips still flush. Task 4.
5. **Eval threshold on hedges** — item 18 (GPA) and 20 (injection) are exempt from `HEDGES`; item 17 is not. Task 6.

---

## File map

| Path | Responsibility |
|------|----------------|
| `src/app/api/chat/lib/rag.ts` | Detail pool, cosine 40, rerank 8, rank floor |
| `src/app/api/chat/lib/context.ts` | `topicPins` replaces `withCoverageFloor` |
| `src/app/api/chat/lib/pipeline.ts` | Shared `prepareChat` / `runChatTurn` |
| `src/app/api/chat/lib/repeat-guard.ts` | Stream filter |
| `src/app/api/chat/lib/cohere.ts` | Token / thinking / temperature constants |
| `src/app/api/chat/lib/system-prompt.ts` | Drop interim CONTEXT; documents carry the chunks |
| `src/app/api/chat/route.ts` | `documents`, citations log, chips after stream |
| `src/app/api/chat/lib/retrieval-query.ts` | Pronoun → previous subject prefix |
| `scripts/eval-chat.ts`, `tests/eval/chat-eval.json` | The gate |
| `.gitignore` | `eval-out/` |

### Task 1: Detail-only retrieval

**Files:**
- Modify: `src/app/api/chat/lib/rag.ts`
- Modify: `src/app/api/search/route.ts` (keep calling retrieval **without** the chat exclusion; add an options flag)
- Test: `tests/rag.test.ts` (create if missing; otherwise extend)

**Interfaces:**

```ts
export type RetrieveOptions = { excludeNav?: boolean; topK?: number }
export async function retrieveRelevantChunks(query: string, options?: RetrieveOptions | number): Promise<ScoredChunk[]>
export async function rerankChunks(query: string, chunks: ScoredChunk[], topN?: number): Promise<RerankedChunk[]>
export function applyScoreFloor(chunks: RerankedChunk[]): RerankedChunk[]
```

Chat calls `retrieveRelevantChunks(query, { excludeNav: true, topK: 40 })` then `rerankChunks(query, chunks, 8)` then `applyScoreFloor`.

Exclusion regex: `^(index|projects\/index|experience\/index|projects\/other|chat)\.md$`. Search omits `excludeNav` (current penalty on nav docs may remain for search; chat no longer needs `NAVIGATION_PENALTY` if those docs are gone).

`applyScoreFloor`: drop score < 0.10; take min(6, remaining); if the first remaining score is < 0.30, take min(2, remaining). Empty input → empty output.

- [ ] **Step 1: Tests** — `isNavigationDoc("chat.md") === true`; `applyScoreFloor` with scores `[0.4, 0.2, 0.09]` returns 2 chunks; with all scores `0.2` and 8 chunks returns 2 (broad); with `[0.5, … six more ≥ 0.10]` returns 6.

- [ ] **Step 2: Run** — Expected: FAIL.

- [ ] **Step 3: Implement.** Support the old `topK: number` second arg so search compiles (`typeof options === "number"`).

- [ ] **Step 4: Run tests plus `npm run typecheck`** — Expected: PASS.

- [ ] **Step 5: Commit** — `chat: retrieve detail pages, not the indexes`

### Task 2: Topic pins

**Files:**
- Rewrite: `src/app/api/chat/lib/context.ts`
- Rewrite: `tests/context.test.ts`

**Interfaces:**

```ts
export function topicPins(featureIds: string[]): PromptChunk[]
export function withTopicPins(chunks: PromptChunk[], question: string, featureIds: string[]): PromptChunk[]
```

Delete `withCoverageFloor`, `pinnedChunks`, `leadingDocs`. `topicPins` maps each id through `getProject` / `getExperienceById` → relative `file` → `factsBlockFor`. Cap at 5, skip missing files. `withTopicPins`: if `namedSubjectId(question)` (stage 3) is set, return `chunks`; else append pins whose `source` is not already present.

- [ ] **Step 1: Replace context tests**

```ts
test("an AI question pins TeraGo and does not require Campus", () => {
  const out = withTopicPins([], "What AI work has Nathan done?", routeTopic("What AI work has Nathan done?").feature);
  assert.ok(out.some((c) => c.source === "experience/terago.md"));
});
test("a named subject gets no pins", () => {
  const out = withTopicPins([{ text: "x", source: "projects/aware.md" }], "How does AWARE run models?", ["terago"]);
  assert.equal(out.length, 1);
});
test("pins still fire when retrieval is empty", () => {
  assert.ok(withTopicPins([], "What does Nathan build?", GENERAL).length >= 3);
});
```

- [ ] **Step 2: Run** — Expected: FAIL.

- [ ] **Step 3: Implement.** Route.ts uses `withTopicPins(applyScoreFloor(reranked), trimmedMessage, topic.feature)`.

- [ ] **Step 4: Run tests** — Expected: PASS.

- [ ] **Step 5: Commit** — `chat: pin the topic, not the home page`

### Task 3: `documents` and drop CONTEXT

**Files:**
- Create: `src/app/api/chat/lib/pipeline.ts`
- Modify: `src/app/api/chat/lib/system-prompt.ts` — remove the interim CONTEXT block; `chunks` argument goes away
- Modify: `src/app/api/chat/route.ts` — `chatStream({ documents, citation_options: { mode: "FAST" }, ... })`
- Modify: `tests/system-prompt.test.ts` — CONTEXT assertions become "prompt does not contain Source:"

**Interfaces:**

```ts
export interface PreparedChat {
  systemPrompt: string;
  documents: Array<{ id: string; data: { title: string; snippet: string } }>;
  topic: TopicRoute;
  intent: Intent;
  pointer: Pointer;
}
export function toDocuments(chunks: Array<{ text: string; source: string; section?: string }>): PreparedChat["documents"]
export async function prepareChat(message: string, history: Array<{ role: string; content: string }>): Promise<PreparedChat>
```

`toDocuments`: `id` = source, `title` = `${source} > ${section || "body"}`, `snippet` = text. Dedupe by `id`, pins first.

`prepareChat` does: retrieval query → retrieve/rerank/floor → topic pins → card/prompt/pointer/intent.

Route `startChatStream` uses `prepared.systemPrompt` and `prepared.documents`. Log `message.citations` length on the non-stream summary if the SDK yields it; for the stream, log nothing per-delta. Eval reads citations from `runChatTurn` (Task 6) via non-stream `v2.chat` when `EVAL_NONSTREAM=1`, otherwise skips the citation share metric.

Also: `buildRetrievalQuery` — when the new message matches `/\b(it|that|this|those|these)\b/i` and `namedSubjectId(message)` is null, prefix `"${previousSubject}: "` where `previousSubject` is `namedSubjectId(lastUser + lastAssistant)` or the last assistant's first bold name. Test: after an AWARE answer, "What models does it run?" → query contains `AWARE`.

- [ ] **Step 1: Tests for `toDocuments` (pin order, dedupe) and the pronoun prefix in `tests/retrieval-query.test.ts` (create).** Prompt test: no `CONTEXT`, card still present.

- [ ] **Step 2: Run** — Expected: FAIL.

- [ ] **Step 3: Implement pipeline, slim the prompt, wire the route. `npm run build`.**

- [ ] **Step 4: Gates including `npm run build`** — Expected: PASS.

- [ ] **Step 5: Commit** — `chat: send the record as documents`

### Task 4: Repeat guard and settings

**Files:**
- Create: `src/app/api/chat/lib/repeat-guard.ts`
- Modify: `src/app/api/chat/lib/stream-answer.ts` — compose `RepeatGuard` after `DashFilter` and before `BannedPhraseFilter`; `MAX_ANSWER_CHARS = 6000`
- Modify: `src/app/api/chat/lib/cohere.ts` — `CHAT_MAX_TOKENS = 3000`; thinking `tokenBudget: 1500`; export `CHAT_TEMPERATURE = 0.3`
- Modify: route to pass `temperature: CHAT_TEMPERATURE`
- Test: `tests/repeat-guard.test.ts`, `tests/stream-answer.test.ts`

**Interfaces:**

```ts
export class RepeatGuard {
  push(text: string): string  // may truncate at the second repeat
  flush(): string
  get aborted(): boolean
}
```

Abort when any line of ≥30 characters occurs three times (the third starts the abort), or when a 200-character window occurs twice. On abort, drop the repeating tail and stop consuming the model stream (`streamAnswer` treats abort like truncation: `truncated: true`).

- [ ] **Step 1: Tests** — three identical 40-char lines → output contains the line twice, `aborted === true`; a 200-char block repeated → aborted; normal prose → not aborted.

- [ ] **Step 2: Run** — Expected: FAIL.

- [ ] **Step 3: Implement and compose in `streamAnswer`. Change the constants.**

- [ ] **Step 4: Run `tests/repeat-guard.test.ts tests/stream-answer.test.ts tests/sanitize-dashes.test.ts`** — Expected: PASS.

- [ ] **Step 5: Commit** — `chat: stop a looping answer`

### Task 5: Post-answer checks (log only)

**Files:**
- Create: `src/app/api/chat/lib/answer-checks.ts`
- Create: `tests/answer-checks.test.ts`
- Modify: `pipeline.ts` / route to `console.info("[chat-check]", json)` — never throw

**Interfaces:**

```ts
export function answerChecks(input: {
  text: string;
  card: string;
  documents: Array<{ snippet: string }>;
  whitelist: string[];
}): { numbersMissing: string[]; urlsMissing: string[]; pointerUrls: number }
```

Numbers: match `/\d[\d,]*(?:\.\d+)?%?/g` in the answer; each must appear in `card + documents`. URLs: `https?:\/\/\S+` and `mailto:\S+` must be in `whitelist` (`pointerWhitelist()`). `pointerUrls` = count of whitelist URLs in the last paragraph.

- [ ] **Step 1: Tests** — `"84.2%"` with that string in the card → `numbersMissing` empty; `"99.9%"` → missing; a random github URL → `urlsMissing`; last paragraph with one résumé URL → `pointerUrls === 1`.

- [ ] **Step 2: Run** — Expected: FAIL.

- [ ] **Step 3: Implement. Log only.**

- [ ] **Step 4: Run tests** — Expected: PASS.

- [ ] **Step 5: Commit** — `chat: log numbers and URLs the record cannot back`

### Task 6: Eval harness and the 20 cases

**Files:**
- Create: `tests/eval/chat-eval.json`
- Create: `scripts/eval-chat.ts`
- Create: `src/app/api/chat/lib/pipeline.ts` `runChatTurn` if Task 3 did not: `export async function runChatTurn(message: string, history: History[]): Promise<{ text: string; chips: string[]; docs: PreparedChat["documents"]; latencyMs: number }>`
- Modify: `package.json` `"eval:chat": "tsx scripts/eval-chat.ts"`
- Modify: `.gitignore` — `eval-out/`
- Modify: `README.md` / `AGENTS.md` — document `eval:chat` as needing the key, not part of the default check list

**Interfaces:**
- JSON items: `{ id, q, broad?, followUpOf?, mustAny: string[][], mustNot: string[] }`
- The 20 ids and expectations: spec §10 items 1–20. Item 19 is two turns (`followUpOf: "aware-intro"`). Item 20 is the injection.
- Global: `GLOBAL_BANNED` and `HEDGES` from spec §10.

Scoring (fail process on miss):

| Metric | Threshold |
|---|---|
| `mustAny` recall | ≥ 0.95 |
| `mustNot` + `GLOBAL_BANNED` hits | 0 |
| dashes `[\u2013\u2014]` | 0 |
| `HEDGES` on non-exempt items (not 18, 20) | 0 |
| Length on substantive ids `{strongest, ai-work, industry, builds, infra, recruiter-fit, campus-rollback, omni-reality, 3d-accuracy, aware-models}` | median 150–300 words; none outside 110–360 |
| Exactly one whitelist URL in the last paragraph | ≥ 90% of non-refusal items |
| Lead-project spread across 4 broad ids | ≥ 3 distinct first-named projects/roles |
| Chips passing validator before repair | ≥ 70% (log `repaired` vs `raw`) |
| Chips after pipeline | 100% `validateChip` clean |
| Path slot present | 100% (third chip is the path question, i.e. `generateChips` order) |

Script: load dotenv, refuse to run without `COHERE_API_KEY`, sleep 5000ms between items, write `eval-out/YYYY-MM-DDTHHMM.json` and print a table. Exit 1 on a failed threshold.

- [ ] **Step 1: Write `chat-eval.json` with all 20 items.** Unit-test the JSON in `tests/eval-schema.test.ts`: length 20, every item has `mustAny` or is item 18/20, every `mustNot` is a string.

- [ ] **Step 2: Run that schema test** — Expected: FAIL until the JSON exists, then PASS.

- [ ] **Step 3: Implement `runChatTurn` (non-stream `v2.chat` + `generateChips`) and `scripts/eval-chat.ts`.** Do not call Cohere in `tests/eval-schema.test.ts`.

- [ ] **Step 4: `npx tsx scripts/eval-chat.ts --help` or a dry-run flag `--schema-only` that loads JSON and exits 0.** Full run is Task 7.

- [ ] **Step 5: Commit** — `chat: a 20-question eval that can fail the build`

### Task 7: Run the eval and accept or revert retrieval

- [ ] **Step 1: Baseline (optional if `eval-out/baseline.json` does not exist).** If stage 3 is already on the tree, this run **is** the v4-without-new-rerank baseline. Save it as `eval-out/baseline.json`.

- [ ] **Step 2: `npm run eval:chat`** against the stage-4 pipeline. Costs ~61 Cohere calls. Do not paste answer bodies into the commit; paste the threshold table into the commit message body or `eval-out/` (gitignored) only.

- [ ] **Step 3: Compare to spec §10 and to baseline `mustNot` + lead-project spread.** If thresholds fail, fix the owning module (card wording, pin list, prompt hedge list) in a follow-up commit in this stage — do not silently lower thresholds.

- [ ] **Step 4: Full gates** (`npm test`, typecheck, lint, build, check:content, check:words, check:embeddings). `eval:chat` is not required on every later commit; it is required for this stage to be called done.

- [ ] **Step 5: Commit any eval-driven fixes.** If the run passed with no code changes, do not create an empty commit; stage 4 is done when the saved `eval-out/*.json` on disk (not in git) shows the thresholds green.

Stage 4 is done when `npm run eval:chat` exits 0, lead-project spread ≥ 3, `mustNot` is 0, and `/api/search` still returns hits for a nav-backed query. v4 is not done before that exit code.
