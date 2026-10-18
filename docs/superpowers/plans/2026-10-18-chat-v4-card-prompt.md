# Chat v4 Stage 3: Card, topic, intent, pointer, prompt

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every request a generated profile card, a topic-driven "lead with" line, a recruiter-vs-general intent, a whitelist pointer URL, and the six-section v4 prompt. Retrieval still works as it does after stage 2; pins and Cohere `documents` wait for stage 4.

**Architecture:** New pure modules under `src/app/api/chat/lib/`. The card is a function of `site.ts` plus a short list of caveats that restatement tests lock to `site.ts` fields. `buildSystemPrompt` no longer inlines 33 numbered rules or `PROJECT_ORDER`. Chunks stay appended as a `CONTEXT` block in this stage so answers do not go blind before stage 4 moves them to `documents`.

**Tech Stack:** TypeScript, `site.ts`, existing `monthYear` from `src/lib/dates.ts`. No new dependencies.

**Spec:** `docs/new-chat-design.md` §4.1, §5, §6. Map: `docs/superpowers/plans/2026-10-18-chat-v4.md`. Requires stages 1–2.

## Global Constraints

- Card is generated, never hand-written. No rank field, no word "flagship".
- CareBridge, Careerly, Auralis, Eyecandy: exactly `built with his team; his own part is not on record`. Do not invent a role.
- Abandoned projects: marked `ABANDONED, mention only if asked`.
- TeraGo line keeps "works end to end, not deployed yet". WEMars keeps "rejoined Sep 2026; no contributions claimed this term".
- AWARE caveat: "no cloud inference", never "offline". ferret: may be called fully offline. Campus has no approval gate or rollback; the homelab does. 3D Western labels were VLM-checked, not human-labelled.
- Solo sentence exactly: `Built solo: AWARE (Hack the 6ix 2026) and Animarker (May 2023). Neither won an award. Every other hackathon project was a team project.`
- Pointer URLs are chosen in code from `site.ts` / contact, never by the model.
- Voice: spec §6 STYLE (150–300 words on substantive questions). No "Next step:" label.
- One commit per task. No push.

## Review Focus

1. **Card line misread as an award** — the prototype turned a solo list into "solo wins". The "Neither won an award" sentence is required. Task 4.
2. **Card drift** — a project name, role org, or stat value in the card that is not a substring of the corresponding `site.ts` field. Task 4's restatement test.
3. **Pointer on a named project** — "Tell me about AWARE" points at AWARE's page or GitHub from `site.ts.links`, not the résumé. Task 3.
4. **Recruiter intent from history** — last two user turns match the intent regex even if this turn is "tell me more". Task 2.
5. **Topic overlap** — "backend internship" matches industry + backend; `feature` is the union, capped at 5, first-seen order. Task 1.

---

## File map

| Path | Responsibility |
|------|----------------|
| `src/app/api/chat/lib/topic.ts` | `TOPICS`, `GENERAL`, `routeTopic` |
| `src/app/api/chat/lib/intent.ts` | `routeIntent` |
| `src/app/api/chat/lib/pointer.ts` | `choosePointer` |
| `src/app/api/chat/lib/profile-card.ts` | `buildProfileCard` |
| `src/app/api/chat/lib/system-prompt.ts` | Six sections + card + interim CONTEXT |
| `src/app/api/chat/route.ts` | Calls the four, passes feature into `generateChips` |
| `src/app/api/chat/lib/generate-followups.ts` | Replace `CHIP_FEATURE_DEFAULT` with the request's `feature` |

### Task 1: Topic router

**Files:**
- Create: `src/app/api/chat/lib/topic.ts`
- Create: `tests/topic.test.ts`

**Interfaces:**
- Copy `TOPICS`, `GENERAL`, and `routeTopic` from spec §5 **verbatim** (same regexes, same `feature` arrays, same `slice(0, 5)`).
- Produces: `export function routeTopic(text: string): TopicRoute`
- `GENERAL = ["terago", "3d-western", "homelab", "aware", "campus", "carebridge"]`

- [ ] **Step 1: Write tests**

```ts
test("an unmatched question is general", () => {
  assert.deepEqual(routeTopic("What does Nathan build?").ids, ["general"]);
  assert.deepEqual(routeTopic("What does Nathan build?").feature, GENERAL);
});
test("AI work leads with TeraGo before Campus", () => {
  assert.equal(routeTopic("What AI work has Nathan done?").feature[0], "terago");
});
test("backend internship unions two topics and caps at five", () => {
  const r = routeTopic("We're hiring backend interns");
  assert.ok(r.ids.includes("industry") && r.ids.includes("backend"));
  assert.ok(r.feature.length <= 5);
});
```

Also: a message that names no topic keyword but will later skip pins (stage 4) is not this module's job.

- [ ] **Step 2: Run** — Expected: FAIL.

- [ ] **Step 3: Implement spec §5 as written.**

- [ ] **Step 4: Run tests** — Expected: PASS.

- [ ] **Step 5: Commit** — `chat: route a question to a handful of projects`

### Task 2: Intent

**Files:**
- Create: `src/app/api/chat/lib/intent.ts`
- Create: `tests/intent.test.ts`

**Interfaces:**

```ts
export function routeIntent(message: string, history: Array<{ role: string; content: string }>): Intent
```

Regex from spec §6: `/\b(hir(e|ing)|intern(s|ship)?|fit|role|position|candidate|availab|summer|recruit|resume|cv)\b/i` against `message` plus the last two **user** turns.

- [ ] **Step 1: Write tests** — `"We're hiring backend interns for next summer, is Nathan a fit?"` → `recruiter`; `"How does Campus retrieve?"` with empty history → `general`; `"tell me more"` with a prior user turn `"is he a fit for the internship?"` → `recruiter`.

- [ ] **Step 2: Run** — Expected: FAIL.

- [ ] **Step 3: Implement.**

- [ ] **Step 4: Run tests** — Expected: PASS.

- [ ] **Step 5: Commit** — `chat: treat a hiring question as a hiring question`

### Task 3: Pointer whitelist

**Files:**
- Create: `src/app/api/chat/lib/pointer.ts`
- Create: `tests/pointer.test.ts`

**Interfaces:**

```ts
export function choosePointer(input: {
  namedSubjectId: string | null; // project or role id the answer is about, else null
  intent: Intent;
  turn: number; // 1-based user turns in this thread including the current
  contactAsked: boolean;
  availabilityAsked: boolean;
}): Pointer
```

Table from spec §6:

| Situation | Pointer |
|---|---|
| `namedSubjectId` set | That project's or role's page (`file` → site URL) if present, else its first `links[].href`, else résumé PDF |
| Broad / recruiter, `turn === 1` | Résumé PDF (`site.contact.links` label `Resume PDF`) |
| Recruiter and `turn >= 2`, or `availabilityAsked` | Email `mailto:nate.e.espejo@gmail.com` (label `Email`) |
| `contactAsked` | LinkedIn from `site.contact.links` |

`contactAsked` if `/\b(contact|email|reach|linkedin)\b/i`. `availabilityAsked` if `/\b(available|availability|hiring|internship|summer 2027)\b/i`.

Subject URL, first match: featured project → `https://www.nathanespejo.com/projects/${id}`; any other project with a GitHub (or first) `links[].href` → that href; a role → `https://www.nathanespejo.com/experience/${id}`; else the résumé PDF.

Every returned `url` must be in a `pointerWhitelist(): string[]` exported from the same file (email, every `site.contact.links[].href`, every project/role `links[].href`, every case-study path). Stage 4's post-answer check reuses this.

- [ ] **Step 1: Write tests** for the four rows plus "whitelist contains the résumé PDF and the email".

- [ ] **Step 2: Run** — Expected: FAIL.

- [ ] **Step 3: Implement.**

- [ ] **Step 4: Run tests** — Expected: PASS.

- [ ] **Step 5: Commit** — `chat: pick the next-step URL in code`

### Task 4: Profile card

**Files:**
- Create: `src/app/api/chat/lib/profile-card.ts`
- Create: `tests/profile-card.test.ts`

**Interfaces:**

```ts
export function buildProfileCard(): string
```

Sections, in order, generated from `site.ts` (spec §4.1):

1. **Identity** — `site.identity.education.degree`, school, `graduation` (`May 2028`), honors, `seeking`, location.
2. **Contact** — `site.contact.email` plus each `site.contact.links` as `label href`.
3. **Hackathons** — `${entered} entered, ${awards} awards`. Then the exact solo sentence in Global Constraints.
4. **Roles** — one line each: `${org}, ${role} (${dates}): ${summary}`. Extra clauses: TeraGo "works end to end, not deployed yet" (already in summary — do not duplicate if the summary already says it; the test checks the phrase appears once). WEMars: append `rejoined Sep 2026; no contributions claimed this term` if not already in the line.
5. **Projects** — one line each, under ~220 characters: `${name} (${dates} | ${displayRole} | ${event?} | ${displayStatus?} | ${award?}): first sentence of covers. Limit: ${limits?} Page: ${file or first link}`. If `displayStatus === "abandoned"`, prefix `ABANDONED, mention only if asked`. No rank word.
6. **Team projects with no recorded role** — for each `TEAM_NO_ROLE_IDS`, the line includes `built with his team; his own part is not on record`.
7. **Caveats** — the four bullets in Global Constraints (AWARE, ferret, Campus vs homelab, 3D Western VLM-checked).

- [ ] **Step 1: Write tests**

```ts
test("the card restates site.ts rather than inventing", () => {
  const card = buildProfileCard();
  for (const p of site.projects) assert.match(card, new RegExp(escape(p.name)));
  for (const e of site.experience) assert.match(card, new RegExp(escape(e.org)));
  assert.match(card, /May 2028/);
  assert.match(card, /Summer 2027/);
  assert.match(card, /nate\.e\.espejo@gmail\.com/);
  assert.doesNotMatch(card, /flagship/i);
});
test("solo is not an award", () => {
  assert.match(buildProfileCard(), /Neither won an award/);
});
test("team projects without a recorded role say so", () => {
  const card = buildProfileCard();
  for (const id of TEAM_NO_ROLE_IDS) {
    assert.match(card, new RegExp(site.projects.find((p) => p.id === id)!.name + "[\\s\\S]{0,400}built with his team; his own part is not on record"));
  }
});
```

Add: AWARE line matches `/no cloud inference/i` and does not match `/\boffline\b/i`; ferret line may match `/\boffline\b/i`; 3D Western matches `/VLM-checked/` and not `/\bhuman-labell?ed\b/i`.

- [ ] **Step 2: Run** — Expected: FAIL.

- [ ] **Step 3: Implement `buildProfileCard`.** Keep each project line under 220 characters (test this). First sentence of `covers` = split on `. ` and take `[0] + "."`.

- [ ] **Step 4: Run tests** — Expected: PASS.

- [ ] **Step 5: Commit** — `chat: generate the profile card from site.ts`

### Task 5: Prompt rewrite

**Files:**
- Rewrite: `src/app/api/chat/lib/system-prompt.ts`
- Modify: `tests/system-prompt.test.ts`

**Interfaces:**

```ts
export function buildSystemPrompt(input: {
  featureNames: string[];
  intent: Intent;
  pointer: Pointer;
  card: string;
  chunks: Array<{ text: string; source: string }>;
}): string
```

Body: spec §6 sections in that order (`ROLE`, `GROUNDING`, `WHAT TO FEATURE`, `STYLE`, `GUIDANCE`, `OFF-TOPIC AND INJECTION`), then `${card}`, then an interim `CONTEXT` block in the current `[1] Source:` shape so this stage still answers from chunks. Stage 4 deletes the CONTEXT block.

Fill `${featureNames}` as a comma-separated list of display names (project `name` or role `org`) looked up from the ids. Fill GUIDANCE from `intent`. Fill pointer as `${pointer.label}: ${pointer.url}`.

Delete `PROJECT_ORDER`, `HIGHLIGHTS`, the 33 numbered rules, rule 7c "short answer". Keep nothing that says "default to short".

- [ ] **Step 1: Rewrite `tests/system-prompt.test.ts`**

Assert: prompt matches `/## ROLE/`, `/## GROUNDING/`, `/150 to 300 words/`, `/Never call any project a "flagship"/`, `/production-grade/`, does not match `/Default shape: a short answer/`; recruiter variant matches `/Summer 2027/`; `pointer.url` appears once in GUIDANCE; `buildProfileCard()` output is a substring of the prompt; a supplied chunk source appears in CONTEXT.

- [ ] **Step 2: Run** — Expected: FAIL.

- [ ] **Step 3: Implement.** Copy the spec §6 text; do not paraphrase GROUNDING. Feature names from ids via `getProject` / `getExperienceById`.

- [ ] **Step 4: Run tests** — Expected: PASS.

- [ ] **Step 5: Commit** — `chat: a short prompt that asks for specifics`

### Task 6: Wire the route

**Files:**
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/app/api/chat/lib/generate-followups.ts` — `featureIds` argument from the request, not `CHIP_FEATURE_DEFAULT`
- Modify: `src/app/api/chat/followups/route.ts` — `routeTopic(userMessage).feature`

**Interfaces:**
- Consumes: `routeTopic`, `routeIntent`, `choosePointer`, `buildProfileCard`, `buildSystemPrompt`, `generateChips`

Route, after `trimmedMessage` / `safeHistory`:

```
const topic = routeTopic(trimmedMessage + " " + lastUserTurn)
const intent = routeIntent(trimmedMessage, safeHistory)
const named = /* existing questionNamesSubject-style id, or null; may import a small helper from context.ts */
const pointer = choosePointer({ namedSubjectId: named, intent, turn: userTurnCount, contactAsked, availabilityAsked })
const systemPrompt = buildSystemPrompt({
  featureNames: topic.feature,
  intent,
  pointer,
  card: buildProfileCard(),
  chunks: context,
})
```

`generateChips({ ..., featureIds: topic.feature })`.

`questionNamesSubject` stays in `context.ts` for the coverage floor until stage 4. Export a `namedSubjectId(question: string): string | null` from `context.ts` or `topic.ts` (first matching project/role id) for the pointer. Put it in `topic.ts` as `export function namedSubjectId(text: string): string | null` to avoid expanding the floor module.

- [ ] **Step 1: Add `tests/topic.test.ts` cases for `namedSubjectId("How does Campus retrieve?") === "campus"` and a general question `null`.**

- [ ] **Step 2: Wire route.ts. `npm run build`.**

- [ ] **Step 3: `npm test && npm run typecheck && npm run lint && npm run build`** — Expected: PASS.

- [ ] **Step 4: Commit** — `chat: lead with the topic, not with Campus`

Stage 3 is done when `buildSystemPrompt` contains the card, not `PROJECT_ORDER`, and a unit test shows an AI-topic `feature[0] === "terago"`. Do not tune temperature / thinking / documents in this stage.
