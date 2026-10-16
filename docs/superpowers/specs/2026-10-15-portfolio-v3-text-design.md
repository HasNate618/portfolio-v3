# Portfolio v3 — Text Site Design Spec

**Date:** 2026-10-15
**Status:** Draft, ready for approval (reviewed by a fresh planner pass on 2026-10-15)
**Repo:** new (`portfolio-v3`). v2 is frozen and archived.
**Source material:** `tmp/revamp-draft.md` (page-by-page copy and layout), `tmp/site-findings.md`, `tmp/site.ts`, `tmp/knowledgebase/`

---

## Summary

Replace the v2 single-page WebGL experience with a **static, text-first, multi-page site**. A quiet terminal: one monospace font, light text on near-black, real routes, real headings, no motion. Every page reads with JavaScript off; only `/chat` needs it.

v2's ocean, ASCII pass, scroll-to-camera system, breach emergence and liquid-glass cards are not carried over. What carries over is the content and bot layer built on 2026-10-15: the chat RAG pipeline, the knowledge base, `site.ts`, and the SEO routes.

---

## Intent and the why

v2 is a striking demo and a poor document. A plain fetch of the live site returns 10KB of shell with no readable text — no hero copy, no experience, no projects. Bots, screen readers, ATS tools and anyone on a bad connection get nothing. What visitors do see requires WebGL, a scroll-driven camera, and a client render before any words appear.

The goal is a site that is **legible first**: text that arrives in the HTML, navigation that works with the keyboard, and an obvious path from "who is this" to "here is the evidence" to "email him". The terminal styling is a way to make plain text feel deliberate rather than a way to add effects.

The draft's own framing: *"This version is plain text on purpose."*

---

## Goals

- Every page server-rendered with its full text present in the initial HTML, readable with JS off
- Real routes a crawler can crawl and a person can link to (`/projects/campus`, not `#section-4`)
- The four hiring questions answerable in one hop each: what has he built, where has he worked, what is he doing now, where is the PDF
- Accessibility as a hard requirement, not a pass: 4.5:1 contrast, 16px minimum, ~68ch measure, real heading structure, visible 2px focus rings, nothing that moves on its own
- One source per fact, so pages, chat and the bot surface cannot disagree
- Keep the chat RAG, knowledge base and SEO routes already built, rather than rebuilding them

## Non-goals

- Porting any v2 presentation code (ocean, ASCII, emergence, proxies, glass cards, scroll system)
- New 3D, WebGL or canvas work of any kind
- Blog content — `posts.ts` is empty and the draft has no blog route
- Dark/light themes; the draft specifies one near-black palette
- Kokoro TTS, jaw animation, or the ALLMIND orb as a 3D object
- Analytics changes; Vercel Analytics carries over as-is

## Anti-goals

These would make the result a failure even if every page renders:

- **Motion that fights the reader** — auto-playing anything, scroll hijacking, page transitions, animated entrances
- **The CRT costume** — fake typing, blinking cursors, scanlines, glitch effects. The draft forbids these explicitly; they read as costume rather than terminal
- **Colour as the only signal** — status must be plain words (`[status: in progress]`), never a colour alone
- **Custom single-key shortcuts** — they collide with screen readers. Tab, Enter and Esc only
- **Decorative markup pretending to be structure** — the `~/projects $ ls` prompt lines are `aria-hidden` decoration; the real `<h1>` sits under them
- **A fact stated in two files** — this is the failure mode the current v2 already has (bots report TeraGo ended Aug 2026 while the page says "Present")
- **Hidden text duplicating page copy** — the bot surface should be structured data and openly linked documents, not invisible mirrors of the page

---

## Constraints

**Framework.** Keep Next.js 15 App Router. No new framework. This preserves `src/app/api/chat/**` and the six SEO files without a port, and AGENTS.md forbids introducing tooling without a request. A markdown-first framework (Astro, Eleventy) would suit a text site well; that is a real option and was declined here in favour of reusing the chat pipeline.

**Rendering.** Pages statically rendered. `/api/chat` is a streaming POST and cannot be statically exported, so the site keeps a Next server (not `output: 'export'`). Pages must still ship zero client JavaScript for their content.

**Assets.** The draft's pages carry almost no imagery — case studies may take a demo clip, and `/experience/terago` deliberately has none because the work is internal. Do not re-introduce the v2 card imagery.

**Accessibility.** The draft's style section is a specification, and the builder must treat it as such: monospace throughout; 4.5:1 minimum for all text; body 16px minimum; prose capped near 68 characters; `#` lines are the `<h1>`, `##` lines are `<h2>`, `###` lines are `<h3>`; the tilde in `## ~/featured` is decorative and `aria-hidden`, so the heading's accessible name is the words as written ("featured") — capitalized display labels come from the view's label map, not from heading text; all links and buttons are real `<a>`/`<button>` elements, underlined, with a 2px focus ring; a skip link precedes the nav; the current page carries `aria-current="page"`; the keyboard-hint footer names only Tab, Enter and Esc and is hidden on touch screens.

**Mobile.** One column under 640px. Box borders collapse to a single top rule so nothing scrolls sideways. Number rows and tables stack.

**Reduced motion.** Nothing moves on its own anywhere, so `prefers-reduced-motion` has little to disable — but any transition that survives (focus rings, the chat panel) must respect it.

---

## Decisions already made

Recorded as decided, not as proposals:

1. **v3 is a new repository.** v2 is frozen and becomes an artifact; it is listed as a project card on v3. (Yours)
2. **Page copy lives in separate content files**, not in JSX and not rendered in place from `knowledgebase/`. (Yours)
3. **The draft's copy, tone and page structure are the spec.** The draft is not a starting point to be re-imagined. (Yours)
4. **The hidden-text fallback stays facts-only.** Built 2026-10-15: name, seeking, links, project names, pointers — no prose mirroring the page. (Yours)

## Calls I made — check these

1. **No separate knowledge-base repo.** I proposed one last and then reversed: with v2 frozen there is exactly one consumer of the KB, so a third repo would be speculative structure. The KB is vendored inside v3 as `content/`, with a `private/` split and a documented seam so it can be extracted if a second consumer ever appears. *(Reversal of my own earlier suggestion.)*
2. **`content/` is authored markdown, and the corpus is a runtime projection of it.** One authored tree. `src/lib/corpus.ts` reads it, substitutes fact placeholders from `site.ts`, strips frontmatter, and returns the documents that the chat indexer and `/knowledgebase/*.md` both serve. Nothing is generated on disk, so there is no stale copy and no drift. Detail in the content model below.
   *(Corrected during plan review: the earlier version said `content/` "doubles as the bot surface" with no projection. That was unsatisfiable — route files must render figures from `site.ts`, while the corpus needs those figures as text. A projection reconciles the two.)*
3. **Keep `/knowledgebase/*.md` as a public URL** even though the pages themselves are now readable. It is already built, already referenced by `site.ts` and the sitemap, and gives agents a token-efficient path. It becomes derived rather than authored.
4. **Keep Tailwind 4** for styling. It is already a dependency, so this adds no tooling. v2's liquid-glass CSS modules do not carry.
5. **`content/` markdown with frontmatter, not MDX.** The draft needs headings, lists, tables, blockquote asides and preformatted diagrams — all plain markdown. MDX would invite logic into prose and pull a heavier toolchain for no gain in this design.
6. **Mobile navigation uses native `<details>`.** JS-off navigation is a requirement, so `[menu]` cannot be a JS disclosure. `<details>`/`<summary>` needs no JavaScript and is keyboard and screen-reader native, satisfying both requirements with no duplicate nav block.
7. **Layout rules are CSS borders; literal box-drawing glyphs appear only inside diagram blocks.** Glyphs cannot wrap, break the "nothing scrolls sideways" requirement at 360px, and bleed into screen-reader output. The titled edge of the Campus card becomes a CSS border with its title as a heading inside it. Losing the exact glyph art is the accepted trade; it survives inside `<pre>` diagrams, which carry text alternatives.
8. **Stats and stack lists become `site.ts` fields** (`stats`, `stack` per project). They repeat across up to four pages, so prose is the one place they cannot live.
9. **The ~26-project inventory and its seven groups get a data home**, with per-project role labels (`solo`, `intern`, `repo on my GitHub`) and display order. Group membership is data, not prose.
10. **`/resume` gets a documented exception to the one-source rule for skills grouping.** The draft's résumé shows four groups where `site.ts` has seven. `/resume` must match the PDF, and the PDF's grouping is a résumé convention, so that grouping lives in the résumé's frontmatter. See the résumé note under Resolved during review.
11. **Followups are kept, sharing one component with the empty-state starters** — one mechanism, two placements. The alternative was two competing suggest-a-question widgets.
12. **A JS side panel for chat is out of scope for v1.** It would put a focus-trapped overlay on every route. The header offers a link to `/chat` instead.
13. **One custom markdown construct, no MDX** — the inline status-tag transform described in the content model. Everything else is frontmatter or `site.ts`.

---

## Architecture

### Routes

| Route | Source | JS required |
|---|---|---|
| `/` | `content/home.md` + `site.ts` | no |
| `/projects` | `content/projects.md` + `site.ts` | no |
| `/projects/campus` | `content/projects/campus.md` + `site.ts` | no |
| `/projects/homelab` | `content/projects/homelab.md` + `site.ts` | no |
| `/projects/aware` | `content/projects/aware.md` + `site.ts` | no |
| `/experience` | `content/experience.md` + `site.ts` | no |
| `/experience/terago` | `content/experience/terago.md` + `site.ts` | no |
| `/now` | `content/now.md` + `site.ts` | no |
| `/resume` | `content/resume.md` + `site.ts` | no |
| `/chat` | `content/chat.md` + chat client | **yes** |

Bot surface, all carried from the 2026-10-15 work:

| Route | Note |
|---|---|
| `/llms.txt` | Index map, generated from `site.ts` |
| `/robots.txt` | Allows AI crawlers, disallows `/api/` |
| `/sitemap.xml` | Generated from the route table |
| `/knowledgebase/*.md` | Served from `content/`, derived |
| `/api/chat`, `/api/chat/followups` | Carried unchanged |

Case studies are four, matching the draft: Campus, Homelab, AWARE, TeraGo. `site.ts` currently marks AgntOS, AgenticArmy and Glyph as featured but the draft places them under "also building" with no case study — the builder should follow the draft and leave `site.ts` project tiers to be re-checked (see open items).

### Content model — the crux

The invariant: **every fact has exactly one home.**

| Kind of thing | Home | Examples |
|---|---|---|
| Structured facts | `src/data/site.ts` | dates, roles, links, award prizes, skill groups, hackathon counts, project identity |
| Repeated numbers | `src/data/site.ts` | `stats` per project (`4,687 chunks`, `308 tests`, `472 sessions`, `760 test cases`), `stack` per project. These repeat across up to four pages, so they are the most drift-prone facts on the site and must not be prose |
| Authored prose | `content/*.md` | why a project exists, how it works, what broke |

Content files **reference** facts by id and never restate them. A case study's meta row (`Aug 2026 to now · active · solo`) renders from `site.projects["campus"]`, not from text typed into the markdown. This is what stops the two-copies problem recurring — the same class of bug that currently has bot-facing data saying "Aug 2026" while the v2 page says "Present".

The boundary rule for the builder: **a `content/*.md` file may not contain a bare number or stack list that `site.ts` can hold.** If a page shows a count, a date, a role or a tech list, it renders it from `site.ts`.

### How a fact reaches prose

Two of the draft's sentences need a figure *inside* a line of text — "Hybrid retrieval over 4,687 chunks from 215 course files". Those use a placeholder, which is the only other custom inline construct v3 has:

```markdown
Hybrid retrieval over {{stat:campus.chunks}} chunks from {{stat:campus.files}} course files.
```

Both consumers resolve it from `site.ts`: the page renderer substitutes the value inline, and so does the corpus projection. The literal never appears in a content file, which is what makes the one-source check satisfiable. `Stack` sections are not markdown at all — they render through a `StackList` component reading `site.ts`.

### Content pipeline mechanics

Page templates, not prose, own the components: meta row, stat row, link row, on-this-page nav and diagram block all render from frontmatter and `site.ts`. A case study's meta row is a template that reads `site.projects[projectId]`.

Two things genuinely appear inline in the draft and need a convention:

- **Status tags** — `### AgntOS   [status: work in progress]`. Keep the literal bracketed form in markdown and transform it with a small remark inline pass into a styled `<span>`, so the authoring format stays plain markdown. The transform is the only custom markdown syntax v3 has.
- **Diagrams** — already fenced code blocks in the draft. Keep them as `<pre>` with a text alternative. No diagram library.

Everything else that looked like an inline component is page furniture and moves to frontmatter or `site.ts`. This is why v3 does not need MDX: there is exactly one custom inline construct, and it is a text pattern rather than a component call.

Frontmatter per content file, roughly:

```yaml
title: "Campus"
route: "/projects/campus"
prompt: "~/projects/campus $ cat README"   # aria-hidden decoration
description: "..."                        # meta description, feeds llms.txt
projectId: campus                         # pulls facts from site.ts
status: null                              # or a plain-words status tag
onThisPage: [tl;dr, why, how-it-works, models-and-cost, results, stack]
```

The authored tree holds two kinds of file. **Route files** are published as pages and also served as `/knowledgebase/*.md`. **Non-route files** — `about.md`, `local-ai.md`, `awards.md`, `skills.md`, `index.md` — have no page and exist for the chat corpus and bot surface only. Both live in `content/`; only route files appear in the sitemap, so nothing is published twice as HTML.

Private material (job-application notes, anything with a phone number) lives in `private/`, outside the build and outside the bot surface. The draft draws the same line: "No kb-private, no phone number."

### Chat

Carried over from v2: `src/app/api/chat/` (12 files) — retrieval, Cohere rerank, rate limiting, followups, system prompt — plus `src/lib/tts/stream-delimiters`, which the route imports for followup framing. The pipeline is reusable. The system prompt is not.

Required changes:

- The indexer's source path moves from `knowledgebase/` to `content/`
- Embeddings are rebuilt against the new corpus (`npm run build-embeddings`), creating a build-order dependency: content → embeddings → deploy
- **The system prompt must be rewritten.** Rule 13 hardcodes a project priority order that **omits Campus entirely** and leads with Homelab, AgntOS and AWARE — directly contradicting the new positioning, where Campus is the flagship. The same prompt also describes the interface as "The ALLMIND mask … renders in React Three Fiber / Three.js", which will not exist in v3. This is the one file where "carried over" is wrong
- **The `Sources:` line does not exist yet.** `reranked[].source` is used server-side for followups but never reaches the client, and the route streams plain text with no structure for it. Adding it is a change to the streaming protocol
- **Off-topic and no-match already work, with different copy.** System-prompt rule 4 returns "The record has nothing on that…" and rule 11 returns "This channel covers Nathan's work and record only." The draft words these differently, so this is copy alignment rather than new backend logic
- `/chat` is the canonical chat surface and works as a plain page. With JS off the form is inert, so the page must say so and point to the projects, experience and résumé pages and `/llms.txt`
- Followups are kept and rendered under an answer, sharing one component with the empty-state starters

### Bot surface and SEO

`/llms.txt`, `robots.txt`, `sitemap.xml`, JSON-LD (`Person` + `WebSite`) and the facts-only `sr-only` fallback all carry from the 2026-10-15 work and derive from `site.ts`.

One simplification the text architecture allows: because pages now contain their real text in the HTML, the `sr-only` fallback matters far less than it did on v2. It can shrink to identity, seeking, contact and pointers, or be dropped. The builder should keep it small; the pages themselves are now the content. JSON-LD is the safest structured surface and should be kept.

### Repository layout

```
portfolio-v3/
  content/                 # authored markdown: route files + non-route files for chat/bots
    home.md
    projects.md
    projects/{campus,homelab,aware}.md
    experience.md
    experience/terago.md
    now.md
    resume.md
    chat.md
  private/                 # excluded from build and bot surface
  src/
    app/                   # routes from the table above
    app/api/chat/          # carried from v2
    components/            # presentation components
    data/site.ts           # structured facts
    lib/site-url.ts
  public/                  # resume PDF, minimal assets
  docs/superpowers/specs/  # this document
```

---

## What carries over from v2

Copied once at setup, then owned by v3:

- `src/app/api/chat/**` (12 files) — the RAG pipeline
- `src/lib/tts/stream-delimiters`
- `src/data/site.ts`, `src/lib/site-url.ts`
- `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/llms.txt/route.ts`, `src/app/knowledgebase/[...slug]/route.ts`
- `src/components/SeoJsonLd.tsx`, `src/components/SeoFallback.tsx`
- `tmp/knowledgebase/**` → `content/`
- `public/Nathan_Espejo_Resume.pdf`, `site.webmanifest`, icons

## What does not migrate

Nothing is deleted. v2 stays intact and frozen, and v3 is built by migrating what it needs into a new repo. These parts are simply not carried across:

- `src/scene/` (280K), `src/scroll/` (32K), `src/components/sections/` (88K), `src/stores/` (20K)
- Dependencies: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `postprocessing`, `@darkroom.engineering/tempus`, `zustand`, `framer-motion`
- `src/data/projects.ts` as a 26-project store, `project-groups.json`, `project-display.ts`. **Correction:** the draft's `/projects` page is not shorter — it is a full inventory of roughly 26 projects in seven new groups (featured 4, also-building 3, then AI and ML, hackathon team projects, hardware, web and mobile, games). The grouping, order and per-project role labels (`solo`, `intern`, `repo on my GitHub`) are part of the data model and need a home, either as fields in `site.ts` or a sibling `src/data/projects.ts`
- AGENTS.md as written; it describes the ocean architecture and must be rewritten for a text site

---

## Migration and cutover

1. Create `portfolio-v3`, carry over the list above, scaffold routes
2. Author `content/` from the draft; fill `site.ts` from `tmp/site.ts`
3. Rebuild embeddings against `content/`
4. Verify the accessibility and verification checklists below
5. Deploy as a Vercel preview; compare against the draft page by page
6. Cut the domain over to v3
7. Archive v2

v2's chatbot stays live at the current domain until step 6, at which point it stops mattering. Nothing in v2 is updated during the build — the KB moves forward in v3 only. This is the accepted cost of the new repo, and it is bounded by the cutover.

---

## Edge cases

- **Chat with JS off.** `/chat` must render its intro, disclaimer, starter questions as plain text, and the JS-off notice. The form is inert without JS; the notice must say so and point to the projects, experience and resume pages and `/llms.txt`
- **Long lists stacking.** `/projects` has an awards table, four grouped project sections and a collapsed games list. Tables stack to cards under 640px; `<details>` needs a real summary and keyboard support
- **The collapsed games list.** `<details>` is native and keyboard-accessible; do not build a JS disclosure
- **Content/fact mismatch.** If a content file restates a fact that lives in `site.ts`, that is a bug. The builder should prefer rendering from `site.ts` whenever a page shows a date, role, link or count
- **Embeddings staleness.** Editing `content/` without rebuilding embeddings leaves chat answering from old text — the same failure v2 has today. The build should make this hard to miss
- **`/resume` and the PDF disagreeing.** `/resume` carries authored copy; the PDF is a placeholder for now. The two will not match until a replacement PDF arrives, and there is no LaTeX-derived pipeline to keep them in step — syncing them is manual and accepted. Once a real PDF exists, the page's text should be checked against it once
- **Print.** `/resume` needs a print stylesheet so it prints like the PDF

---

## Verification

- `npm run build` and `npm run lint` pass; `lens_diagnostics` reports no blocking findings
- **JS off**: every route except `/chat` renders its full text and is navigable. Verify by fetching each route with `curl` and confirming the page's actual copy appears in the HTML
- **Bot surface**: `/llms.txt`, `/robots.txt`, `/sitemap.xml` return correct content types; `/knowledgebase/*.md` serves from `content/` and 404s anything outside the allowlist; JSON-LD parses
- **Contrast**: every text/background pair measured at 4.5:1 or better
- **Keyboard**: skip link first, logical tab order, visible 2px focus ring everywhere, `aria-current="page"` on the active nav item, `/chat` closable with Esc
- **Screen reader**: headings form a real outline; the `~/... $` prompt lines are silent; `## ~/featured` reads "Featured"; status tags read as words
- **Mobile at 360px**: one column, no horizontal scroll, tables stacked
- **Chat**: each state in the draft observed — loading, no-match, off-topic, error, rate limit, JS off
- **Cross-check**: no date, role or link on any page disagrees with `site.ts`

---

## Open items — these are yours

Content, not code:

1. **Cost figure.** One real number (monthly homelab API spend, or cost per Campus question). Replaces both `[status: measuring]` and `[status: in progress]` under Models and cost
2. **Campus evaluation.** Retrieval and answer numbers, ideally before/after the exact-phrase fix, plus latency
3. **Campus demo clip.** ~20s, muted, captioned, plus real poster alt text
4. **Campus models.** Which LLM, embedding model and reranker you run — optional, only if you want them named
5. **AWARE demo and latency.** Video URL, detection fps on the UNO Q, rule-compile time
6. **WEMars.** First concrete autonomy task, then drop `[status: just started]`
7. **Campus this term** — for the Now page
8. **TeraGo.** Channel Finder pass rate on the 760 cases, the savings estimate if shareable, what you are allowed to publish, and what happened to the prototype and proposal after you left
9. **Team credits.** Your part on Careerly, Auralis, Eyecandy, CareBridge, VitalSign, NowAndThen, AgenticArmy. Until supplied, they show as team projects with no role claimed
10. **MCC dates.** The KB says May–Aug 2025; you previously said summer 2024. Confirm
11. **Provide a replacement résumé PDF.** v3 ships a placeholder until it arrives. It must exclude the phone number
12. **Diagrams.** Optional SVG versions of the three text diagrams, each with a text alternative

---

## Resolved during review

**Résumé copy.** `/resume` uses the PDF's wording, with one correction from the owner:

- **"Automated outage ticketing"** — correct as the PDF has it. The pipeline worked and was used. The draft's "Prototyped" was wrong and is rejected.
- **Model names stripped from the skills bullet** — the draft's edit stands, so no "MiMo, DeepSeek Flash". This is the only remaining difference from the PDF; if it should match instead, say so.

The page is therefore authored copy: the draft's text with "Prototyped" reverted to "Automated".

**Résumé PDF: `~/Downloads/resume.pdf` is final.** It is copied in as `public/Nathan_Espejo_Resume.pdf`, replacing the stale file currently deployed. No external repo and no LaTeX workflow — `~/Projects/Resume/` is not referenced by v3.

It contains the phone number `416-825-7510`. That number is already public in the deployed PDF, so this adds no new exposure, but it does stay public. The `/resume` **page** follows the draft and carries no phone number, so page and PDF differ by that one line.

**Draft provenance, checked.** The draft was not written by the owner, so it was verified against today's knowledge base: every signature figure in it appears there (4,687 · 215 · 308 · 472 · 58,000 · 191 · 27 · 760 · 4,127 · $80), as do "8 awards across 22 hackathons" and the corrected Aug 2026 dates. The draft is usable as the content source. Its only divergence was the résumé, handled above. The `site-copy/`, `kb-public/` and `kb-private/` folders it names are not needed.

**One deliberate divergence from the draft on `/projects`.** The draft's TeraGo row shows no figure; the page renders `760 test cases` through `StatRow`, because the figure is already in `site.ts` and the row is otherwise the thinnest of the four featured entries.

**Chat scope settled: copy alignment only.** Align the off-topic and no-match wording to the draft and rewrite the stale system prompt. The `Sources:` line is out of scope for v1.

---

## Not blocking after all

**The draft's missing sources are moot.** `site-copy/`, `kb-public/`, `kb-private/` and `/workspace/portfolio-kb` do not exist on this machine, but the draft's content matches today's knowledge base on every signature figure, so nothing is actually missing.

The `tmp/` working files do not need committing. The draft's content is carried into v3 as `content/`, which is what matters; the untracked originals can stay where they are.
