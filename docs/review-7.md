# Site review 7: portfolio-v3 @ 54fba7b (chat suggestions and guidance)

Date: Sat Oct 17, 2026 (America/Toronto). Repo not edited or pushed. The trial key was sourced into env only, then unset. A leak check over /workspace and /tmp found no copies.

## 0. Checks and deploy

- After `npm ci` (lockfile unchanged), every check passes:
  - check:content: clean
  - typecheck: 0
  - lint: 0
  - tests: 274/274
  - next build: 0
  - check:embeddings: fresh (208 chunks, 589610c29027)
  - check:render: PASS, on a fresh `next start -p 3100`
- Live matches HEAD:
  - Text of /, /chat, /projects, /knowledgebase/projects/campus.md and /knowledgebase/experience/terago.md is identical to the local build.
  - Live campus.md has the new `Summary:` and `Limits:` lines.
  - Résumé PDF md5 is the same (86a7acea...).
- Call budget used:
  - Trial key: 1 batch embed and 50 reranks.
  - Live /api/chat: 10 calls, made with browser Origin, Sec-Fetch-Site and Referer headers.
- Artifacts:
  - /workspace/chat-bench/ground7.ts and ground7.json (retrieval for every starter and chip)
  - /workspace/chat-test-3/a1..a10.txt (live transcripts)

## 1. Fixed (since 372e23d)

- **Summaries in the first chunk.** The facts block now carries `Summary:`, plus `Limits:` for projects (src/lib/corpus.ts). For example, the Campus `limits` field states there is no approval gate.
- **Overview pinning for broad questions.** `withCoverageFloor` (src/app/api/chat/lib/context.ts:69) adds the leading facts blocks.
  - "What are Nathan's strongest projects?" (a5) now covers Campus, homelab, AWARE, CareBridge, TeraGo and 3D Western, all with correct figures (27 containers, 58,000 tool calls, 2,559/4,620, 84.2%, 760 cases). The TeraGo and 3D Western details are no longer invented.
- **Banned phrases.** The filter in stream-answer.ts plus rule 19 work: no "production-grade" appeared in 10 answers.
- **Next-step pointer.** Rule 28 exists, and 9 of 10 answers ended with a pointer whose URL is in the record.
- **Starters.** They now say "Nathan" (content/chat.md:7).
- **Solo hacks.** a6 lists exactly AWARE and Animarker, with "no cloud inference".
- **Dashes and leaks.** No em or en dashes reached the client. No phone number, MiMo or DeepSeek.

## 2. Still broken

### 2a. Chips (the core ask). Not handled systematically.

These are live results for 30 generated chips across 10 answers.

| Check | Result |
|---|---|
| Says "Nathan" | 13/30. 17 use he/his, "the team", or no subject |
| Availability or contact chip (the "three jobs" rule, generate-followups.ts:80) | **0/30** |
| False premise or ungrounded | 5. Quotes and fixes below |
| Two topics in one chip | 1 ("MiniCPM at WeFirst") |
| Repeats the question just answered | a4: "What internship is he looking for?" right after the Summer 2027 answer |
| Same chip in 3 of 10 answers | "What is Nathan's role at TeraGo?" |
| Fallback bank served instead of model chips | a4 and a5 (exact TOPIC_RULES strings, with "he") |

The five ungrounded or false-premise chips:

- a6: "What did Nathan's team build at the Cyberdeck hackathon?"
  - Cyberdeck is abandoned (archive group, site.ts:395) and was never a hackathon.
- a9: "What is the team's goal for the Campus project?"
  - Campus is solo (site.ts:130).
- a10: "How did he use MiniCPM at WeFirst?"
  - MiniCPM is AWARE's model (site.ts:190). The club is spelled "WEFirst", and Nathan claims no contributions there.
- a2 and a7: "What did the team build at TeraGo?"
  - TeraGo was an individual internship.

Why it keeps happening (code):

- generate-followups.ts:78 still says "Refer to him in third person (he/his/Nathan)". This contradicts :81 ("says Nathan"), and the 0.4-temperature r-plus model follows :78.
- generate-followups.ts:84 still lists "AgntOS" as a spelling example. Abandoned names in the prompt get echoed back as chips.
- Inputs are `chunkSources.slice(0, 6)` file paths (:62) and `aiResponse.slice(0, 600)` (:68). The chip model never sees the text of the sources, so it cannot check whether a chip is grounded.
- route.ts:24 FOLLOWUP_START_CHARS = 400 starts chips before the answer is done, so the chips are based on the first 400 characters.
- `normalizeFollowups` (followup-fallback.ts:199) only dedupes and backfills. It does not check:
  - "Nathan"
  - entity count
  - abandoned projects
  - similarity to the user's question
  - grounding
- The fallback bank itself uses he/his everywhere (TOPIC_RULES and DEFAULT_FOLLOWUPS:119).

### 2b. Starter and fallback grounding (trial key, repo retrieve(30) + rerank(10))

The full table is in ground7.json. The score is the top rerank score. "Answers?" is my reading of whether that top chunk actually answers the question.

Starters:

| Starter | Top source, score | Answers? |
|---|---|---|
| What does Nathan build? | about.md, 0.959 | yes |
| What did Nathan do at his internship? | **experience/mcc.md, 0.957** (part-time IT) | wrong doc. TeraGo only arrives through the coverage floor |
| What's Nathan's proudest project? | about.md>Focus, **0.153** | no. The record never says "proud"; a3 had to infer it from "flagship" |
| Is Nathan looking for a Summer 2027 internship? | about.md>In short, 1.000 | yes, but the a4 answer **omits May 2028** (about.md:29 has it) |

Fallback and default chips: 31 of 46 have their top chunk score at or above 0.5 and answer the question. Failures:

- **Score below 0.5, so no grounded answer:**
  - "How does Rust fit his stack?" (0.001)
  - "Which projects use Rust?" (0.263, skills.md). skills.md:41 lists only **AgntOS (abandoned)** under Rust and omits ferret, so this chip steers toward an abandoned project.
  - "Which languages does Nathan use most?" (0.188)
  - "What backend languages has he used?" (0.088)
  - "What mobile languages has he used?" (0.019; skills.md:43 Kotlin is never retrieved)
  - "What frontend stack does he use?" (0.061, gaming-mental-health tech stack)
  - "What full-stack projects has he built?" (0.097)
  - "How does he secure remote access?" (0.000; homelab.md:22,37 Tailscale never surfaces)
  - "What is in his knowledge base?" (0.014)
  - "What is his strongest technical area?" (0.072; the record ranks nothing, so a10 asserted "applied AI and on-device inference")
  - Rewrites: "What languages does Nathan know?" (0.022), "What tech stack does Nathan use?" (0.196), "How does this portfolio chat work?" (0.075, portfolio-v2 Status)
- **High score but the wrong doc**, which shows the test must check the source and not just the score:
  - "How can I contact Nathan?": chat.md 0.942, whose text has no contact info. about.md>Links is second.
  - "What Android apps has he built?": about.md>Focus 0.892 says "mobile apps" but names none.
  - "What AI tools does his homelab host?": resume.md Campus 0.969. homelab.md is third.
  - "What did Nathan do at his internship?": MCC (see the starters table).
- chat.md (the "Ask about me" page) is indexed as content and wins contact queries. Add it to `NAVIGATION_DOC` (rag.ts:26) or drop it from the corpus.

### 2c. Answer-level issues from live calls

- **Regression: dash filter turns separators into ranges.**
  - a6 shows "**Animarker** to May 2023" and "**AWARE** to Jul 2026".
  - Cause: the date-range rule in sanitize-dashes.ts:42 fires on "<name> [en dash] May 2023". It should require a date *before* the dash too (month/year, dash, month/year). Otherwise use ": " or ", ".
- **Hallucination.**
  - a1: "He co-led the **CareBridge** team". The record says "team project" (site.ts:312), and "co-led" appears only for 3D Western.
- **Caveat dropped.**
  - a2: "Built a working outage-email parser" without "not deployed yet" (site.ts:112 has it).
  - Rule fix: when a summary carries a limit, keep it.
- **Pointer rule 28 not followed.**
  - a10 gives two URLs ("Portfolio: ..." and "Resume PDF: ...").
  - a3 has no URL ("see the Campus project page").
  - a8 repeats the résumé that is already in the list.
  - a1 and a10 use a bolded "**Next step:**" label, which reads as a template.
- **Path gap.** No answer mentions May 2028, including the availability starter. The system prompt has no 2028 at all (rg in system-prompt.ts).
  - Add: "When availability comes up, give Summer 2027 and expected graduation May 2028 together."

### 2d. Open RCA and benchmark items (unchanged at 54fba7b)

- generate-followups.ts:84 AgntOS in the name list
- :78 he/his rule
- :62 paths, not text
- route.ts:24 start at 400 chars
- FOLLOWUP_MODEL r-plus-08-2024 at temperature 0.4 (cohere.ts:9)
- CHAT_MAX_TOKENS 12000 and thinking 5000 (cohere.ts:12-15). The benchmark recommended 2000/1500.
- No repeat-line stop in stream-answer.ts
- No relevance floor in rag.ts

## 3. Design: a question bank as the single source of chips

Principle: a chip is only shown if it is a bank entry that has been tested to retrieve a doc that answers it. The model never writes chip text. At most, it picks bank ids.

### Files
- `src/data/question-bank.ts`: typed bank and selectors. A TS file, not YAML, so tests and the route import it directly.
- `content/chat.md`: change `starters:` to `starterIds:`, or delete it and use `bank.filter(q => q.starter)`. check:content fails if a starter is not in the bank.
- `src/app/api/chat/lib/chips.ts`: `selectChips()` and `validateChip()`. These replace followup-fallback.ts TOPIC_RULES, DEFAULT_FOLLOWUPS and normalizeFollowups.
- `src/app/api/chat/lib/generate-followups.ts`: either delete it (deterministic chips, which also saves one Cohere call per answer), or reduce it to "pick 3 ids from this list".
- `tests/chat/question-bank.test.ts`: offline, runs in CI.
- `scripts/check-question-bank.ts` (`npm run check:bank`): live retrieval, needs a key, run before deploy. My ground7.ts is a working prototype.

### Data shape
```ts
// src/data/question-bank.ts
export type Stage = "builds" | "proof" | "availability" | "contact";
export interface BankQuestion {
  id: string;                 // "campus-retrieval"
  question: string;           // must contain "Nathan", end with "?", < 90 chars
  stage: Stage;               // path: builds -> proof -> availability -> contact
  subject: string | null;     // site.ts project/experience id, or null for general
  sources: string[];          // corpus paths that answer it: ["projects/campus.md", "local-ai.md"]
  answerMustContain: string[];// literal strings present in those sources
  starter?: boolean;
  minScore?: number;          // default 0.5 (rerank, non-navigation top chunk)
}
export const QUESTION_BANK: BankQuestion[] = [
  { id: "builds", stage: "builds", subject: null, starter: true,
    question: "What does Nathan build?", sources: ["about.md"], answerMustContain: ["flagship"] },
  { id: "terago", stage: "proof", subject: "terago", starter: true,
    question: "What did Nathan build at TeraGo?", sources: ["experience/terago.md"],
    answerMustContain: ["Channel Finder", "hasn't deployed"] },          // 1.000 measured
  { id: "flagship", stage: "proof", subject: "campus", starter: true,
    question: "What is Nathan's flagship project?", sources: ["projects/campus.md", "about.md"],
    answerMustContain: ["flagship"] },                                   // replaces "proudest" (0.153); retest
  { id: "availability", stage: "availability", subject: null, starter: true,
    question: "Is Nathan looking for a Summer 2027 internship?", sources: ["about.md"],
    answerMustContain: ["Summer 2027", "May 2028"] },
  { id: "contact", stage: "contact", subject: null,
    question: "How can I contact Nathan?", sources: ["about.md"], answerMustContain: ["nate.e.espejo@gmail.com"] },
  { id: "resume", stage: "contact", subject: null,
    question: "Where is Nathan's résumé?", sources: ["about.md"], answerMustContain: ["Nathan_Espejo_Resume.pdf"] },
  { id: "campus-retrieval", stage: "proof", subject: "campus",
    question: "How does Nathan's Campus rank search results?", sources: ["projects/campus.md", "local-ai.md"],
    answerMustContain: ["cross-encoder"] },
  // ... port the 31 passing fallback questions, rewritten with "Nathan"; drop or fix the 13 failures in 2b
];
```

### Selection (deterministic)
```ts
// src/app/api/chat/lib/chips.ts
import { QUESTION_BANK, type BankQuestion, type Stage } from "@/data/question-bank";
import { site } from "@/data/site";

const NEXT: Record<Stage, Stage> = { builds: "proof", proof: "availability", availability: "contact", contact: "builds" };
const ENTITIES = [...site.projects, ...site.experience].map((x) => ({
  id: x.id, abandoned: (x as any).displayStatus === "abandoned",
  re: new RegExp(`\\b${escape((x as any).name ?? (x as any).org)}\\b`, "i") }));
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/);
const similar = (a: string, b: string) => { const A = new Set(norm(a)), B = new Set(norm(b));
  return [...A].filter((w) => B.has(w)).length / Math.max(1, Math.min(A.size, B.size)) >= 0.7; };

export function entitiesIn(text: string) { return ENTITIES.filter((e) => e.re.test(text)); }

/** Map the turn to a bank entry: exact/similar match, else by subject named in the question. */
export function classify(userMessage: string): BankQuestion | undefined {
  return QUESTION_BANK.find((q) => similar(q.question, userMessage))
    ?? QUESTION_BANK.find((q) => q.subject && entitiesIn(userMessage).some((e) => e.id === q.subject));
}

export function selectChips(userMessage: string, answer: string, usedSources: string[], asked: string[] = []): string[] {
  const current = classify(userMessage);
  const stage = current?.stage ?? "builds";
  const subject = current?.subject ?? entitiesIn(answer)[0]?.id ?? null;
  const skip = (q: BankQuestion) => [userMessage, ...asked].some((a) => similar(a, q.question));
  const pool = QUESTION_BANK.filter((q) => !skip(q));
  const pick = (f: (q: BankQuestion) => boolean) => pool.find((q) => f(q) && !out.includes(q.question));
  const out: string[] = [];
  const deeper  = pick((q) => !!subject && q.subject === subject);                                  // job 1
  if (deeper) out.push(deeper.question);
  const related = pick((q) => q.stage === "proof" && q.subject !== subject
                       && q.sources.some((s) => usedSources.includes(s) || answer.includes(q.subject ?? "\0")));
  const fallbackRelated = pick((q) => q.stage === "proof" && q.subject !== subject);                // job 2
  if (related ?? fallbackRelated) out.push((related ?? fallbackRelated)!.question);
  const next = pick((q) => q.stage === (stage === "proof" || stage === "builds" ? "availability" : NEXT[stage])); // job 3
  if (next) out.push(next.question);
  while (out.length < 3) { const q = pick(() => true); if (!q) break; out.push(q.question); }
  return out.slice(0, 3);
}

/** Only used if a model is still allowed to propose chips: anything that fails is replaced from the bank. */
export function validateChip(q: string, userMessage: string): boolean {
  const ents = entitiesIn(q);
  return q.endsWith("?") && q.length < 90 && /\bNathan\b/.test(q) && !/\b(he|his|him)\b/i.test(q)
    && ents.length <= 1 && !ents.some((e) => e.abandoned) && !/\bteam\b/i.test(q)
    && !similar(q, userMessage) && QUESTION_BANK.some((b) => similar(b.question, q));
}
```
Route change (route.ts:205-227): drop the 400-char early generation. After the stream ends:
```ts
const chips = isNonAnswer(body)
  ? QUESTION_BANK.filter((q) => q.starter).map((q) => q.question).slice(0, 3)
  : selectChips(trimmedMessage, body, context.map((c) => c.source), history.filter((h) => h.role === "user").map((h) => h.content));
```
If model chips are kept, prompt them with the bank (`id: question`, about 50 lines) and the answer, and ask for 3 ids. Then parse the ids against the bank and fill any gaps with `selectChips`. The model can still choose badly, but it cannot invent text.

Stage-aware pointer: the same `classify()` result can feed the rule-28 line. Inject `NEXT STEP: <url>` into the context, chosen from the stage:

| Stage | Pointer |
|---|---|
| builds | flagship case study |
| proof | résumé |
| availability | contact |

The model then copies one URL instead of choosing between several.

### Tests
```ts
// tests/chat/question-bank.test.ts  (offline, CI)
import { test } from "node:test"; import assert from "node:assert/strict";
import { QUESTION_BANK } from "@/data/question-bank";
import { getCorpusDocs } from "@/lib/corpus";
import { entitiesIn, selectChips, validateChip } from "@/app/api/chat/lib/chips";
import { site } from "@/data/site";

const docs = new Map(getCorpusDocs().map((d) => [d.rel, d.text]));   // text includes facts block
test("ids unique", () => assert.equal(new Set(QUESTION_BANK.map((q) => q.id)).size, QUESTION_BANK.length));
for (const q of QUESTION_BANK) test(`bank: ${q.id}`, () => {
  assert.match(q.question, /\bNathan\b/); assert.doesNotMatch(q.question, /\b(he|his|him)\b/i);
  assert.ok(q.question.endsWith("?") && q.question.length < 90);
  const ents = entitiesIn(q.question);
  assert.ok(ents.length <= 1, "one topic"); assert.ok(!ents.some((e) => e.abandoned), "no abandoned projects");
  const text = q.sources.map((s) => { assert.ok(docs.has(s), `missing source ${s}`); return docs.get(s)!; }).join("\n");
  for (const must of q.answerMustContain) assert.ok(text.includes(must), `${q.id}: "${must}" not in sources`);
});
test("every stage has 2+ entries", () => { for (const s of ["builds","proof","availability","contact"])
  assert.ok(QUESTION_BANK.filter((q) => q.stage === s).length >= 2, s); });
test("starters come from the bank", () => { /* parse content/chat.md starterIds, assert each id exists */ });
test("selectChips: 3 bank questions, never the asked one, includes availability or contact for proof turns", () => {
  const c = selectChips("What did Nathan build at TeraGo?", "…Channel Finder…", ["experience/terago.md"]);
  assert.equal(c.length, 3);
  assert.ok(c.every((x) => QUESTION_BANK.some((q) => q.question === x)));
  assert.ok(!c.includes("What did Nathan build at TeraGo?"));
  assert.ok(c.some((x) => QUESTION_BANK.find((q) => q.question === x)!.stage !== "proof"));
});
test("validator rejects the live failures", () => {
  for (const bad of ["What did Nathan's team build at the Cyberdeck hackathon?", "How did he use MiniCPM at WeFirst?",
                     "What is the team's goal for the Campus project?", "What internship is he looking for?"])
    assert.equal(validateChip(bad, "x"), false, bad);
});
```
```ts
// scripts/check-question-bank.ts  (npm run check:bank; needs COHERE_API_KEY; ~1 embed + N reranks, paced 6.5s for trial keys)
// For each bank entry: batch-embed all questions once, cosine top 30, rerankChunks(q, top30, 10),
// take the top non-navigation chunk, then assert:
//   q.sources.includes(top.source)  AND  top.score >= (q.minScore ?? 0.5)
// Print a table and exit 1 on any failure. Score alone is not enough: "How can I contact Nathan?"
// scores 0.942 on chat.md, which has no contact info.
```

### Content fixes the bank test would force (from 2b)
- skills.md:41: add ferret under Rust, or drop the Rust chips.
- Languages: add a one-line "Most used: Python, TypeScript, ..." to the top of skills.md so language questions retrieve. Otherwise drop those chips.
- Add chat.md to NAVIGATION_DOC (rag.ts:26), or exclude it from the corpus.
- Starter changes:
  - "What did Nathan do at his internship?" becomes "What did Nathan build at TeraGo?"
  - "What's Nathan's proudest project?" becomes "What is Nathan's flagship project?" (retest)
- Drop these chips (the record has no grounded answer):
  - "What is in his knowledge base?"
  - "What is his strongest technical area?"
  - "How does this portfolio chat work?" (only portfolio-v2 docs exist)
  - "How does he secure remote access?" (Tailscale is in homelab.md but never surfaces). A rephrase such as "How does Nathan keep homelab services private?" is untested.

## 4. Priority list
1. Move chips to the bank: `question-bank.ts` and `chips.ts`, plus the offline test and `check:bank`. This fixes all of 2a.
2. Fix the sanitize-dashes date-range rule (regression in 2c).
3. System prompt changes:
   - Availability answers state Summer 2027 together with May 2028.
   - Keep the limits a summary states ("not deployed yet").
   - No roles beyond what the record says (CareBridge "co-led").
   - Exactly one URL in the pointer, with no "Next step:" label.
4. Content fixes from 2b (skills.md Rust and languages, chat.md demotion, starter swaps).
5. Remaining benchmark items: token caps 2000/1500, repeat-line stop, and a relevance floor.
