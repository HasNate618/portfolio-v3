# Portfolio v3 Text Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `portfolio-v3` — a static, text-first, multi-page site by migrating the chat RAG pipeline, knowledge base and SEO routes out of `portfolio-v2`, then replacing the WebGL presentation with plain readable pages.

**Architecture:** A new Next.js 15 App Router repo. Pages are statically rendered with their full text in the HTML, so every route reads with JavaScript off; only `/chat` needs JS. Authored prose lives in `content/` as markdown; structured and repeated facts live in `src/data/site.ts`. A runtime corpus projection (`src/lib/corpus.ts`) resolves fact placeholders and strips frontmatter to produce the chat corpus and the `/knowledgebase/*.md` bot surface, so pages, chat and crawlers share one source. Nothing is deleted from v2 — it stays frozen.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, `markdown-it`, `node:test` via `tsx`, Cohere (chat only). No WebGL.

**Spec:** `docs/superpowers/specs/2026-10-15-portfolio-v3-text-design.md`

## Global Constraints

- Next.js 15 App Router, React 19, TypeScript, Tailwind 4. No WebGL: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `postprocessing`, `@darkroom.engineering/tempus`, `zustand`, `framer-motion` must not appear in `package.json`.
- One monospace font. Near-black background, light text, one accent colour.
- Contrast minimum 4.5:1 for **all** text, including muted text, status tags and footer hints.
- Body text 16px minimum. Prose measure capped near 68 characters.
- Nothing moves on its own. Any surviving transition respects `prefers-reduced-motion`.
- Every route except `/chat` renders its full text with JavaScript off.
- Headings: `#` → `<h1>`, `##` → `<h2>`, `###` → `<h3>`. `~/... $` prompt lines are `aria-hidden`. A `~/` prefix inside a heading is `aria-hidden`, so the heading's accessible name is the words as written ("featured"); capitalized labels come from the view's `GROUP_LABELS` map.
- Status tags are plain bracketed words (`[status: in progress]`), never colour alone.
- All links and buttons are real `<a>`/`<button>`, underlined, visible 2px focus ring. A skip link precedes the nav. The current page carries `aria-current="page"`.
- Keyboard hints name only Tab, Enter and Esc, and are hidden on **touch/coarse pointers** (`@media (pointer: coarse)`), not by viewport width.
- Mobile under 640px: one column, nothing scrolls sideways. Verify at 360px.
- **One source per fact:** a route content file may not contain a bare figure or stack list that `site.ts` can hold. Use `{{stat:<projectId>.<key>}}` in prose, `StatRow`/`StackList` in templates.
- `/resume` page copy carries **no phone number**. The shipped PDF does; that difference is accepted.
- Chat is **copy alignment only**: no `Sources:` line, no JS side panel.
- `/knowledgebase/*.md` serves only allowlisted paths; anything else 404s. `private/` sits at the repo root, is gitignored, and is never read by the content loader or the corpus projection.
- Node ≥ 22.18 (type stripping + `--test` glob). `npm test` = `node --import tsx --test "tests/**/*.test.ts" "tests/**/*.test.tsx"`.
- Test files import without file extensions (`from "../src/lib/content"`), because `next build` type-checks `tests/**` and `allowImportingTsExtensions` is off.

## Review Focus

Likely to bite a real user, and not covered by any single task's happy-path test:

1. **JS-off rendering** — a route whose text ends up behind a client component shows an empty page to a crawler.
2. **360px overflow** — a wide awards table or a `<pre>` diagram forces horizontal scroll on a phone.
3. **Fact drift** — a page restates a figure `site.ts` owns and the two diverge on the next edit.
4. **Screen-reader noise** — decorative `~/... $` prompt lines and the heading tilde read aloud.
5. **Muted text contrast** — status tags, footer hints and `[status: ...]` markers shipping below 4.5:1.

---

## File map

| Path | Responsibility |
|------|----------------|
| `content/**/*.md` | Authored prose: route files (with `route:`) and corpus-only files |
| `private/` | Repo root, gitignored, outside build and bot surface |
| `src/data/site.ts` | Facts: identity, experience, awards, skills, projects (group, order, displayRole, displayStatus, dates, links, `stats`, `stack`) |
| `src/lib/content.ts` | Load and parse `content/*.md`: frontmatter, body, route lookup |
| `src/lib/corpus.ts` | Projection: resolve `{{stat:…}}`, strip frontmatter → chat + bot documents |
| `src/lib/markdown.ts` | markdown-it instance: heading ids, heading tilde, status tags, stat placeholders |
| `src/components/**` | Header, footer, furniture, tables |
| `src/app/**` | Routes |
| `src/app/api/chat/**` | RAG pipeline (migrated) |
| `src/styles/tokens.ts` | Palette as data, so contrast is testable |
| `scripts/check-content.mjs` | One-source invariant (route files only) |
| `scripts/check-contrast.mjs` | Every token pair ≥ 4.5:1 |
| `scripts/check-render.mjs` | Consume a running production server; assert every route's copy with JS off |
| `scripts/check-embeddings.mjs` | Corpus hash vs the embeddings cache |
| `tests/fixtures/content/**` | Fixture tree for loader and invariant tests |

---

### Task 1: Scaffold portfolio-v3

**Files:**
- Create: `/home/nate/Projects/portfolio-v3/` (new repo), `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.gitignore`, `public/.gitkeep`, `src/app/{layout,page}.tsx`, `src/app/globals.css`, `docs/superpowers/specs/2026-10-15-portfolio-v3-text-design.md`

**Interfaces:**
- Produces: a repo where `npm run build` and `npm run lint` both exit 0.

- [ ] **Step 1: Create the repo and carry the spec in**

```bash
mkdir -p /home/nate/Projects/portfolio-v3 && cd /home/nate/Projects/portfolio-v3
git init
mkdir -p docs/superpowers/specs docs/superpowers/plans src/app public tests
cp /home/nate/Projects/portfolio-v2/docs/superpowers/specs/2026-10-15-portfolio-v3-text-design.md docs/superpowers/specs/
cp /home/nate/Projects/portfolio-v2/docs/superpowers/plans/2026-10-15-portfolio-v3-text-site.md docs/superpowers/plans/
```

- [ ] **Step 2: Install dependencies, deliberately excluding WebGL**

```bash
npm init -y
npm i next@15 react@19 react-dom@19 cohere-ai dotenv markdown-it @vercel/analytics
npm i -D typescript @types/node @types/react @types/react-dom @types/markdown-it tailwindcss @tailwindcss/postcss tsx eslint@9 eslint-config-next@15 @eslint/eslintrc
```

- [ ] **Step 3: Write `tsconfig.json` with the `@/*` alias**

`next build` type-checks `tests/**`, so the alias must be present and test imports must be extensionless.

```json
{
  "compilerOptions": {
    "target": "ES2022", "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true, "skipLibCheck": true, "strict": true, "noEmit": true,
    "esModuleInterop": true, "module": "esnext", "moduleResolution": "bundler",
    "resolveJsonModule": true, "isolatedModules": true, "jsx": "preserve",
    "incremental": true, "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Write `eslint.config.mjs`**

Without it, ESLint 9 errors and Task 19's `npm run lint` gate cannot pass.

```js
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });
export default [
  { ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
```

The `ignores` block is required: in ESLint 9 flat config `.next` is linted by default after a build, so without it the `build && lint` gate lints generated bundles and fails.

- [ ] **Step 5: Add scripts and `.gitignore`**

```json
"dev": "next dev",
"build": "next build",
"start": "next start",
"lint": "eslint",
"test": "node --import tsx --test \"tests/**/*.test.ts\" \"tests/**/*.test.tsx\"",
"build-embeddings": "tsx scripts/build-embeddings.mjs",
"check:content": "tsx scripts/check-content.mjs",
"check:contrast": "tsx scripts/check-contrast.mjs",
"check:render": "node scripts/check-render.mjs",
"check:embeddings": "tsx scripts/check-embeddings.mjs"
```

`check:content` and `check:embeddings` run through `tsx` because they import `src/data/site.ts` and `src/lib/corpus.ts`, which use the `@/` alias and extensionless specifiers that plain `node` cannot resolve. `check:render` stays on `node` because it only makes HTTP requests.

`.gitignore` must include `node_modules`, `.next`, `.env`, `private/`, `*.tsbuildinfo`.

- [ ] **Step 6: Add the app shell and the config files the build needs**

`src/app/layout.tsx` renders `<html lang="en">`, `<body>`, and `<Analytics />` from `@vercel/analytics/next` (a spec non-goal says analytics carries over). `src/app/page.tsx` renders `<main><h1>Nathan Espejo</h1></main>`. `globals.css` imports Tailwind.

These files are listed in **Files** and must actually be written — without `postcss.config.mjs`, Tailwind 4 never processes, every utility is a no-op, and `sr-only` in `SeoFallback` renders as visible text, which breaks the hidden-fallback design.

```js
// postcss.config.mjs
export default { plugins: ["@tailwindcss/postcss"] };
```

```ts
// next.config.ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
export default nextConfig;
```

Also create `public/.gitkeep` (Task 2 copies into `public/`) and `tests/smoke.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

test("the test runner is wired up", () => {
  assert.equal(1 + 1, 2);
});
```

The smoke test exists so `npm test` reports a non-zero count from the start; a glob matching nothing does not reliably fail, which would make every later test gate meaningless.

- [ ] **Step 7: Verify**

Run: `npm run build && npm run lint && npm test`
Expected: build and lint exit 0; `npm test` reports **1 passing test** (the smoke test).

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: scaffold portfolio-v3 with spec and plan"
```

---

### Task 2: Migrate the shared layer

**Files:**
- Create: `content/**` (from `portfolio-v2/knowledgebase/**`), `src/app/api/chat/**`, `src/lib/tts/stream-delimiters.ts`, `src/lib/site-url.ts`, `src/data/site.ts`, `src/app/{robots.ts,sitemap.ts}`, `src/app/llms.txt/route.ts`, `src/app/knowledgebase/[...slug]/route.ts`, `src/components/{SeoJsonLd,SeoFallback}.tsx`, `scripts/build-embeddings.mjs`, `.env.example`
- Modify: `src/app/api/chat/lib/chunks.ts`
- Test: `tests/corpus-path.test.ts`

**Interfaces:**
- Produces: `loadKnowledgebase()` reads `content/`. `/llms.txt`, `/robots.txt`, `/sitemap.xml`, `/knowledgebase/*.md`, `/api/chat` respond.

- [ ] **Step 1: Copy the shared layer, creating every destination first**

```bash
SRC=/home/nate/Projects/portfolio-v2
DST=/home/nate/Projects/portfolio-v3
mkdir -p $DST/content $DST/public $DST/scripts $DST/src/app/api $DST/src/lib $DST/src/data $DST/src/components
cp -r $SRC/knowledgebase/. $DST/content/
cp -r $SRC/src/app/api/chat $DST/src/app/api/
cp -r $SRC/src/lib/tts $DST/src/lib/
cp $SRC/src/lib/site-url.ts $DST/src/lib/
cp $SRC/src/data/site.ts $DST/src/data/
cp $SRC/src/app/robots.ts $SRC/src/app/sitemap.ts $DST/src/app/
cp -r $SRC/src/app/llms.txt $SRC/src/app/knowledgebase $DST/src/app/
cp $SRC/src/components/SeoJsonLd.tsx $SRC/src/components/SeoFallback.tsx $DST/src/components/
cp $SRC/scripts/build-embeddings.mjs $DST/scripts/
cp $SRC/public/Nathan_Espejo_Resume.pdf $SRC/public/site.webmanifest $DST/public/
cp $SRC/public/android-chrome-192x192.png $SRC/public/android-chrome-512x512.png $DST/public/
cp $SRC/public/apple-touch-icon.png $DST/public/
cp $SRC/src/app/favicon.ico $SRC/src/app/icon.png $DST/src/app/
cp /home/nate/Downloads/resume.pdf $DST/public/Nathan_Espejo_Resume.pdf
grep -o '^[A-Z_]*' $SRC/.env | sed 's/$/=/' > $DST/.env.example
```

Deliberately **not** copied: `public/*.png` project screenshots (54 files the spec says not to re-introduce), `.env` (secrets), and anything under `src/scene`, `src/scroll`, `src/stores`, `src/components/sections`.

- [ ] **Step 2: Write the failing test**

`chunks.ts` records `source` **relative to the corpus root**, so the assertion must be positive — a `startsWith("knowledgebase/")` check would pass before and after the repoint.

```ts
// tests/corpus-path.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadKnowledgebase } from "../src/app/api/chat/lib/chunks";

test("the indexer reads the content/ tree", () => {
  const chunks = loadKnowledgebase();
  assert.ok(chunks.length > 0, "corpus is empty");
  assert.ok(
    chunks.some((c) => c.source === "projects/campus.md"),
    "expected a source relative to the corpus root"
  );
  assert.ok(!chunks.some((c) => c.source.startsWith("knowledgebase/")));
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL — `ENOENT`, because v3 has no `knowledgebase/` directory.

- [ ] **Step 4: Repoint the loader**

In `src/app/api/chat/lib/chunks.ts`, change `path.join(process.cwd(), "knowledgebase")` to `path.join(process.cwd(), "content")`.

- [ ] **Step 5: Verify the test and the bot surface**

Run: `npm test`
Expected: PASS.

```bash
npm run build
(npx next start -p 3100 &) ; sleep 3
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' http://localhost:3100/llms.txt
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3100/knowledgebase/projects/campus.md
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3100/knowledgebase/not-a-real-file.md
curl -s -o /dev/null -w '%{http_code}\n' --path-as-is http://localhost:3100/knowledgebase/../../package.json
pkill -f "[n]ext start"
```

Expected: `200 text/markdown`, `200`, `404`, and `400` — Next rejects the malformed path before the handler's guard runs, so **400 is correct here, not 404**. Port 3100 is used because 3000 is occupied on this machine by an unrelated server.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: migrate chat pipeline, knowledge base and SEO routes"
```

---

### Task 3: Extend `site.ts` with the facts pages need

**Files:**
- Modify: `src/data/site.ts`
- Test: `tests/site.test.ts`

**Interfaces:**
- Produces:
  - `type ProjectStat = { key: string; label: string; value: string }`
  - `type ModelRow = { name: string; job: string; runtime: string }`
  - `type ProjectGroup = "featured" | "also-building" | "ai-ml" | "team" | "hardware" | "web-mobile" | "games"`
  - `projects[]` gains `group: ProjectGroup`, `order: number`, `displayRole: string`, `displayStatus?: string`, `stats: ProjectStat[]`, `stack: string[]`, `models?: ModelRow[]`
  - `experience[]` gains `stats?: ProjectStat[]`
  - `tier` is **removed**. Consumers move to `highlightProjects()`.
  - `highlightProjects(): Project[]` — group `featured` or `also-building`, sorted by `order`. This is what `llms.txt` and `SeoFallback` use, so the bot surface and `/projects` cannot disagree.
  - `getProject(id): Project | undefined`, `getExperience(org): Experience | undefined`

- [ ] **Step 1: Write the failing test**

```ts
// tests/site.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { site, highlightProjects, getProject } from "../src/data/site";

test("Campus carries the figures the draft states", () => {
  const stats = Object.fromEntries(getProject("campus")!.stats.map((s) => [s.key, s.value]));
  assert.equal(stats.chunks, "4,687");
  assert.equal(stats.files, "215");
  assert.equal(stats.tests, "308");
  assert.equal(stats.courses, "6");
  assert.ok(getProject("campus")!.stack.includes("FastAPI"));
});

test("Homelab carries the figures the draft states", () => {
  const stats = Object.fromEntries(getProject("homelab")!.stats.map((s) => [s.key, s.value]));
  assert.equal(stats.sessions, "472");
  assert.equal(stats.toolCalls, "58,000");
  assert.equal(stats.skills, "191");
  assert.equal(stats.containers, "27");
});

test("TeraGo keeps its corrected dates and the 760-case figure", () => {
  assert.equal(site.experience.find((e) => e.org === "TeraGo")!.dates, "May 2026 to Aug 2026");
  assert.ok(getProject("terago")!.stats.some((s) => s.value === "760"));
});

test("every project has a group, order, role and unique stat keys", () => {
  for (const p of site.projects) {
    assert.ok(p.group, `${p.id} missing group`);
    assert.equal(typeof p.order, "number", `${p.id} missing order`);
    assert.ok(p.displayRole, `${p.id} missing displayRole`);
    const keys = p.stats.map((s) => s.key);
    assert.equal(new Set(keys).size, keys.length, `${p.id} has duplicate stat keys`);
  }
});

test("no project still carries tier, and highlights derive from group", () => {
  for (const p of site.projects) assert.ok(!("tier" in p), `${p.id} still has tier`);
  const ids = highlightProjects().map((p) => p.id);
  assert.ok(ids.includes("campus"));
  assert.ok(!ids.includes("wasteland"), "a games project must not be a highlight");
});

test("every display group has at least one project", () => {
  const groups: ProjectGroup[] = [
    "featured", "also-building", "ai-ml", "team", "hardware", "web-mobile", "games",
  ];
  for (const g of groups) {
    assert.ok(site.projects.some((p) => p.group === g), `group ${g} is empty`);
  }
});

test("terago exists as a project with a named stat key", () => {
  const terago = getProject("terago")!;
  assert.ok(terago, "terago must be in site.projects as well as site.experience");
  assert.ok(terago.stats.some((s) => s.key === "testCases" && s.value === "760"));
});

test("aware carries the rows its model table renders", () => {
  const models = getProject("aware")!.models ?? [];
  assert.ok(models.some((m) => m.name === "YOLOv8n"));
});

test("experience carries the 3D Western dataset figure", () => {
  const stats = site.experience.find((e) => e.org === "3D Western")!.stats ?? [];
  assert.ok(stats.some((s) => s.value === "4,127"));
});

test("displayStatus is a plain word, never a colour", () => {
  assert.equal(getProject("homelab")!.displayStatus, "running 24/7");
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL — `stats` is undefined.

- [ ] **Step 3: Extend the types and transcribe the data**

Transcribe every figure from `tmp/revamp-draft.md` into keyed `stats`. Do not invent values: a project the draft gives no figure for gets `stats: []`. Remove `tier` and add `group`/`order` from the draft's `/projects` grouping.

This step also builds the **full inventory** — roughly 29 entries across all seven groups, not the six v2 carried. A group with no entries is a bug, and the test above enforces it. Specific requirements:

- **TeraGo needs a `projects` entry as well as its `experience` entry**, with `stats: [{ key: "testCases", label: "test cases", value: "760" }]`. Tasks 13 and 14 reference `{{stat:terago.testCases}}`.
- **AWARE needs `models: [{ name, job, runtime }]`** for its table.
- **`4,127` (the 3D Western dataset)** repeats in the draft's `/experience` bullet and its `/resume` line, so `site.experience[]` carries `stats` too — otherwise the one-source invariant is unenforceable for it.

**Leave the `knowledgebase` allowlist array in place.** It still has three importers — `src/app/sitemap.ts`, `src/app/llms.txt/route.ts`, and the KB route — and deleting it here breaks the build until Task 18 repoints them. Task 18 deletes it.

- [ ] **Step 4: Repoint the two `tier` consumers**

`src/app/llms.txt/route.ts` and `src/components/SeoFallback.tsx` both filter on `tier`; switch both to `highlightProjects()`.

- [ ] **Step 5: Run the test to confirm it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/data/site.ts src/app/llms.txt/route.ts src/components/SeoFallback.tsx tests/site.test.ts
git commit -m "feat: project groups, stats, stacks and status in site data"
```

---

### Task 4: Content loader

**Files:**
- Create: `src/lib/content.ts`, `tests/fixtures/content/{home.md,projects/campus.md,local-ai.md}`
- Test: `tests/content.test.ts`

**Interfaces:**
- Produces:
  - `type Page = { slug: string; route: string; title: string; prompt: string; description: string; priority: "start-here" | "reference"; projectId?: string; experienceOrg?: string; onThisPage: string[]; body: string }`
    `priority` replaces the ordering the deleted `knowledgebase` array used to carry, and `/llms.txt` orders by it (Task 18). There is deliberately no `status` on `Page` — status lives in `site.projects[].displayStatus` so it has one home.
  - `listPages(): Page[]` — **all** route files, sorted by `NAV_ORDER` then `order`
  - `getPage(route: string): Page | undefined`
  - `listCorpusFiles(): string[]` — every `content/**/*.md` path relative to `content/`, including route files
  - `NAV_ORDER = ["/projects", "/experience", "/now", "/resume"]`

Tests run against **fixtures**, not the real tree — the real route files are authored in Tasks 10–15, so asserting on them here would be unreachable.

- [ ] **Step 1: Write the failing test**

```ts
// tests/content.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadFrom, listCorpusFilesFrom } from "../src/lib/content";

const FIXTURES = "tests/fixtures/content";

test("route files parse with frontmatter", () => {
  const pages = loadFrom(FIXTURES);
  assert.equal(pages.length, 2);
  assert.ok(pages.every((p) => p.route.startsWith("/")));
  assert.ok(pages.every((p) => p.title.length > 0));
});

test("a file without a route is corpus-only", () => {
  const pages = loadFrom(FIXTURES);
  assert.ok(!pages.some((p) => p.slug === "local-ai"));
  assert.ok(listCorpusFilesFrom(FIXTURES).includes("local-ai.md"));
});

test("slugs are paths relative to content, so index files do not collide", () => {
  const slugs = listCorpusFilesFrom(FIXTURES);
  assert.ok(slugs.includes("index.md"), "the fixture set must contain a root index");
  assert.ok(slugs.includes("projects/index.md"), "and a nested one");
  assert.equal(new Set(slugs).size, slugs.length);
});

test("getPage returns undefined for an unknown route", () => {
  assert.equal(loadFrom(FIXTURES).find((p) => p.route === "/nope"), undefined);
});

test("frontmatter is separated from the body", () => {
  const page = loadFrom(FIXTURES).find((p) => p.route === "/")!;
  assert.ok(!page.body.includes("title:"));
  assert.ok(page.body.length > 0);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL — cannot find module `src/lib/content`.

- [ ] **Step 3: Create the fixtures**

Three small files exercising the shapes: `home.md` (`route: /`, with `prompt`/`description`/`priority`/`onThisPage`), `projects/campus.md` (`route: /projects/campus`, `projectId: campus`), and `local-ai.md` (no `route`).

Add `index.md` and `projects/index.md` so the collision test above is not vacuous — those two are what make path-relative slugs necessary.

`loadFrom(FIXTURES)` therefore returns **2** pages (only `home.md` and `projects/campus.md` carry a `route:`). Task 15 adds a `skills` block to `home.md` rather than a new file, so this count stays 2.

- [ ] **Step 4: Implement the loader**

`src/lib/content.ts` exports `loadFrom(root)` and `listCorpusFilesFrom(root)`; the public `listPages()` / `getPage()` / `listCorpusFiles()` wrap them against `content/`. Parse frontmatter as flat scalars plus one inline array (no new dependency). Slug is the path relative to the root with `.md` stripped. Files under `private/` are never read, since the loader only walks `content/`.

- [ ] **Step 5: Run the test to confirm it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/content.ts tests/fixtures tests/content.test.ts
git commit -m "feat: content loader with fixture tests"
```

---

### Task 5: Markdown pipeline

**Files:**
- Create: `src/lib/markdown.ts`
- Test: `tests/markdown.test.ts`

**Interfaces:**
- Produces: `renderMarkdown(md: string, opts?: { ids?: boolean }): string`
  - `#`/`##`/`###` → `<h1>`/`<h2>`/`<h3>` with a slugified `id`
  - a leading `~/` inside a heading → wrapped in `<span aria-hidden="true">`
  - `[status: X]` → `<span class="status-tag">[status: X]</span>`
  - `{{stat:<projectId>.<key>}}` → the value from `site.ts`
  - an unknown `{{stat:…}}` key throws (loud, not silently blank)
- Also produces `resolveStats(text: string): string` — the same substitution without markdown rendering. `src/lib/corpus.ts` (Task 6) consumes it, so it must be exported here.
- Tables are **not** markdown. The awards table and AWARE's model table are components (Task 9) reading `site.ts`, which is how `<caption>` and `scope="col"` are guaranteed.

- [ ] **Step 1: Write the failing test**

```ts
// tests/markdown.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown, resolveStats } from "../src/lib/markdown";

test("headings map to h1, h2 and h3 with ids", () => {
  assert.match(renderMarkdown("# A"), /<h1 id="a"/);
  assert.match(renderMarkdown("## Why I built it"), /<h2 id="why-i-built-it"/);
  assert.match(renderMarkdown("### C"), /<h3 id="c"/);
});

test("the tilde in a heading is hidden from assistive tech", () => {
  const html = renderMarkdown("## ~/featured");
  assert.match(html, /<h2 id="featured"/);
  assert.match(html, /aria-hidden="true">~\/</);
  assert.match(html, />featured</);
});

test("status tags survive as plain words", () => {
  const html = renderMarkdown("### AgntOS   [status: work in progress]");
  assert.match(html, /\[status: work in progress\]/);
  assert.match(html, /class="status-tag"/);
});

test("stat placeholders resolve from site data", () => {
  assert.match(renderMarkdown("over {{stat:campus.chunks}} chunks"), /over 4,687 chunks/);
});

test("an unknown stat key throws rather than rendering blank", () => {
  assert.throws(() => renderMarkdown("{{stat:campus.nope}}"), /unknown stat/);
});

test("lists and inline code render", () => {
  assert.match(renderMarkdown("- one"), /<li>one<\/li>/);
  assert.match(renderMarkdown("use `nix`"), /<code>nix<\/code>/);
});

test("resolveStats substitutes without rendering markdown", () => {
  assert.equal(resolveStats("over {{stat:campus.chunks}} chunks"), "over 4,687 chunks");
  assert.ok(
    !resolveStats("**bold** {{stat:campus.tests}}").includes("<strong>"),
    "resolveStats must return plain text, not HTML"
  );
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL — cannot find module `src/lib/markdown`.

- [ ] **Step 3: Implement the pipeline**

A `markdown-it` instance with `html: false`. Override the heading-open rule to inject the slug id and wrap a leading `~/` in the aria-hidden span. Add inline rules for status tags and stat placeholders. Page content links to other pages by **route** (`/projects/campus`); the `.md` rewriting that the KB route does applies only to the bot view, so this renderer needs no link rewriting.

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/markdown.ts tests/markdown.test.ts
git commit -m "feat: markdown pipeline with heading ids and fact placeholders"
```

---

### Task 6: Corpus projection and the one-source check

**Files:**
- Create: `src/lib/corpus.ts`, `scripts/check-content.mjs`
- Modify: `src/app/api/chat/lib/chunks.ts`, `src/app/knowledgebase/[...slug]/route.ts`
- Test: `tests/corpus.test.ts`

**Interfaces:**
- Produces:
  - `getCorpusDocs(): { path: string; text: string }[]` — every `content/**/*.md`, frontmatter stripped, `{{stat:…}}` resolved to plain text, a facts block prepended for route files, relative `.md` links rewritten to `/knowledgebase/…`
  - `getCorpusDoc(path: string): { path: string; text: string } | undefined` — exact-string lookup, no normalization
- `chunks.ts` indexes `getCorpusDocs()` instead of walking the filesystem.
- The KB route serves `getCorpusDoc()`, so a served document never opens with a YAML block and only allowlisted paths resolve.

- [ ] **Step 1: Write the failing test**

```ts
// tests/corpus.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { getCorpusDocs, getCorpusDoc } from "../src/lib/corpus";

test("no served document leaks frontmatter", () => {
  for (const doc of getCorpusDocs()) {
    assert.ok(!doc.text.startsWith("---"), `${doc.path} starts with frontmatter`);
    assert.ok(!/^title:/m.test(doc.text), `${doc.path} contains frontmatter keys`);
  }
});

test("relative .md links become absolute knowledgebase URLs", () => {
  const campus = getCorpusDoc("projects/campus.md")!;
  assert.ok(!/\]\(\.\.?\//.test(campus.text), "relative link survived projection");
});

test("stat placeholders never survive into the corpus", () => {
  for (const doc of getCorpusDocs()) {
    assert.ok(!doc.text.includes("{{stat:"), `${doc.path} has an unresolved placeholder`);
  }
});

test("a route document keeps the facts only components render", () => {
  const campus = getCorpusDoc("projects/campus.md")!;
  assert.match(campus.text, /Aug 2026/, "dates must survive projection");
  assert.match(campus.text, /FastAPI/, "stack must survive projection");
  assert.match(campus.text, /4,687/, "stats must survive projection");
});

test("lookup is exact, not normalized", () => {
  assert.equal(getCorpusDoc("projects/../about.md"), undefined);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL — cannot find module `src/lib/corpus`.

- [ ] **Step 3: Implement the projection and repoint both consumers**

`src/lib/corpus.ts` reuses `resolveStats` from `src/lib/markdown.ts` and the link rewrite already proven in the KB route.

**It must also prepend a facts block to each route file.** Components render dates, role, status, links, `stats` and `stack`, so a projection that only strips frontmatter and substitutes placeholders would serve a Campus document with no dates and no tech stack — losing metadata the v2 KB carried and contradicting the architecture claim that pages, chat and crawlers share one source. Build the block from `site.ts` for any page with a `projectId` or `experienceOrg`.

Repoint `chunks.ts` and the route handler to it, and delete the handler's filesystem walk plus its traversal guard (the allowlist is now in-memory). `getCorpusDoc` must do an **exact-string lookup with no path normalization** — normalizing would let `/knowledgebase/projects/../about.md` serve an allowlisted document under a non-canonical URL.

- [ ] **Step 4: Write the one-source check**

`scripts/check-content.mjs` scans **route files only** (files with a `route:` frontmatter key) for any `site.ts` stat value or stack list that `site.ts` can hold. It takes an optional `--root <dir>` argument, defaulting to `content/`, so the invariant can be tested against fixtures. Matching is on token boundaries, and numeric values shorter than 3 characters are skipped — otherwise `"6"` matches inside every `2026` and `"27"` inside `2026-27`.

**Stack entries are only flagged in list-shaped lines** — a line containing two or more stack entries, or using `·` or comma separators. Prose that names a single technology ("Moved both old setups to NixOS", "behind Caddy") is legitimate and must not fail the gate, or the check is unsatisfiable for the copy Tasks 11–15 author. An inline `<!-- one-source-ok -->` comment exempts any line the author judges necessary.

- [ ] **Step 5: Verify the check fails on a seeded violation and passes clean**

```bash
cp tests/fixtures/content/projects/campus.md /tmp/campus.bak
printf '\nSee the 4,687 chunks.\n' >> tests/fixtures/content/projects/campus.md
# point the check at the fixture root for this verification only
node scripts/check-content.mjs --root tests/fixtures/content; echo "exit=$?"
cp /tmp/campus.bak tests/fixtures/content/projects/campus.md
node scripts/check-content.mjs --root tests/fixtures/content; echo "exit=$?"
```

Expected: first run non-zero naming the file and `4,687`; second run exit 0.

- [ ] **Step 6: Verify against the real tree and commit**

Run: `npm run check:content`
Expected: exit 0 — at this stage there are no route files yet, so it passes trivially and becomes meaningful as Tasks 10–15 land.

```bash
git add src/lib/corpus.ts scripts/check-content.mjs src/app/api/chat/lib/chunks.ts "src/app/knowledgebase/[...slug]/route.ts" tests/corpus.test.ts
git commit -m "feat: corpus projection and one-source invariant check"
```

---

### Task 7: Terminal styling foundation

**Files:**
- Create: `src/styles/tokens.ts`, `scripts/check-contrast.mjs`
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Test: `scripts/check-contrast.mjs`

**Interfaces:**
- Produces: `export const tokens = { bg, fg, muted, accent, rule }` — the single source for both CSS variables and the contrast check. Run through `tsx`, since plain `node` cannot import a `.ts` module.

- [ ] **Step 1: Write the contrast check**

Implement WCAG relative luminance and contrast ratio; assert `fg/bg`, `muted/bg` and `accent/bg` are each `>= 4.5`; exit non-zero listing any failing pair.

- [ ] **Step 2: Verify it fails with no tokens**

Run: `npm run check:contrast`
Expected: FAIL — cannot find module `src/styles/tokens`.

- [ ] **Step 3: Define the palette and the primitives**

Pick values that pass. Write them into `globals.css` as custom properties, with a comment that `src/styles/tokens.ts` is authoritative. Set one monospace stack on `body`, 16px minimum, `max-width: 68ch` on prose. Add `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` and a `prefers-reduced-motion` block zeroing transitions.

Also define the **rule primitive**: section dividers are `border-top` on a block element, never box-drawing characters. A titled card edge is a bordered block whose title is a real heading inside it. Box-drawing glyphs appear only inside `Diagram`'s `<pre>`.

- [ ] **Step 4: Verify it passes**

Run: `npm run check:contrast`
Expected: exit 0, all three pairs ≥ 4.5.

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens.ts src/app/globals.css src/app/layout.tsx scripts/check-contrast.mjs
git commit -m "feat: terminal styling foundation with testable contrast"
```

---

### Task 8: Header, footer and navigation

**Files:**
- Create: `src/components/{SiteHeader,SiteFooter,PromptLine,StatusTag}.tsx`
- Modify: `src/app/layout.tsx`
- Test: `tests/chrome.test.tsx`

**Interfaces:**
- `PromptLine({ children })` → `<p aria-hidden="true">`
- `StatusTag({ children })` → `<span class="status-tag">[status: …]</span>`, sharing the class the markdown transform emits
- `SiteHeader({ current }: { current: string })` → skip link, name link, nav from `NAV_ORDER` plus "ask about me", active item `aria-current="page"`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/chrome.test.tsx
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteHeader } from "../src/components/SiteHeader";
import { PromptLine } from "../src/components/PromptLine";

test("skip link comes before the nav", () => {
  const html = renderToStaticMarkup(<SiteHeader current="/projects" />);
  assert.ok(html.indexOf("Skip to content") < html.indexOf("<nav"));
});

test("the current page is marked", () => {
  const html = renderToStaticMarkup(<SiteHeader current="/projects" />);
  assert.match(html, /aria-current="page"/);
});

test("prompt lines are hidden from assistive tech", () => {
  const html = renderToStaticMarkup(<PromptLine>{"~/projects $ ls"}</PromptLine>);
  assert.match(html, /aria-hidden="true"/);
});

test("mobile nav needs no JavaScript", () => {
  const html = renderToStaticMarkup(<SiteHeader current="/" />);
  assert.match(html, /<details/);
  assert.match(html, /<summary/);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL — cannot find module `SiteHeader`.

- [ ] **Step 3: Implement the chrome**

Nav order: projects, experience, now, résumé, then "ask about me" rendered lighter. Mobile under 640px: name plus a native `<details><summary>menu</summary>`. Footer: a CSS top rule, name and location, contact links, then keyboard hints naming only Tab, Enter and Esc, hidden via `@media (pointer: coarse)` so they are absent on touch devices rather than merely narrow ones.

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SiteHeader.tsx src/components/SiteFooter.tsx src/components/PromptLine.tsx src/components/StatusTag.tsx src/app/layout.tsx tests/chrome.test.tsx
git commit -m "feat: accessible header, footer and navigation"
```

---

### Task 9: Page furniture and tables

**Files:**
- Create: `src/components/{ProjectMetaRow,ExperienceMetaRow,StatRow,StackList,LinkRow,OnThisPage,Diagram,AwardsTable,ModelTable}.tsx`
- Test: `tests/furniture.test.tsx`

**Interfaces:**
- `ProjectMetaRow({ projectId })` reads dates, `displayStatus` and `displayRole` from `site.ts`, and renders "present" as "now"
- `ExperienceMetaRow({ org })` reads `site.experience` — TeraGo's meta row is experience data, not project data
- `StatRow({ projectId })` renders `stats` as a `<dl>`
- `StackList({ projectId })` renders `stack`
- `LinkRow({ projectId })` renders links
- `OnThisPage({ items })` renders anchors matching the heading ids `renderMarkdown` emits
- `Diagram({ children, alt })` renders `<pre>` plus a visually hidden text alternative
- `AwardsTable()` and `ModelTable({ rows })` render real `<table>` with `<caption>` and `scope="col"`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/furniture.test.tsx
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ProjectMetaRow } from "../src/components/ProjectMetaRow";
import { StackList } from "../src/components/StackList";
import { AwardsTable } from "../src/components/AwardsTable";

test("ProjectMetaRow takes facts from site.ts, not props", () => {
  const html = renderToStaticMarkup(<ProjectMetaRow projectId="campus" />);
  assert.match(html, /Aug 2026 to now/);
  assert.match(html, /solo/);
});

test("'present' is rendered as 'now'", () => {
  const html = renderToStaticMarkup(<ProjectMetaRow projectId="campus" />);
  assert.doesNotMatch(html, /present/i);
});

test("StackList renders from site.ts", () => {
  const html = renderToStaticMarkup(<StackList projectId="campus" />);
  assert.match(html, /FastAPI/);
});

test("the awards table has a caption and scoped headers", () => {
  const html = renderToStaticMarkup(<AwardsTable />);
  assert.match(html, /<caption/);
  assert.match(html, /scope="col"/);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL — cannot find module `ProjectMetaRow`.

- [ ] **Step 3: Implement the components**

`ProjectMetaRow` maps the literal `"present"` in `dates` to `"now"` — the drift the spec cites as its motivating bug. Tables are components, which is what makes `<caption>`/`scope="col"` achievable without a custom markdown table renderer.

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components tests/furniture.test.tsx
git commit -m "feat: page furniture and accessible tables"
```

---

### Task 10: Home page

**Files:**
- Create: `src/components/views/HomeView.tsx`, `src/app/page.tsx`, `content/home.md`
- Test: `tests/views/home.test.tsx`

**Interfaces:**
- Consumes: `getPage("/")`, `site.identity`, `ProjectMetaRow`, `StatRow`, `LinkRow`, `StackList`
- Produces: `HomeView({ page }: { page: Page })` — the testable unit. `src/app/page.tsx` is a thin sync wrapper: `export default function Page() { return <HomeView page={getPage("/")!} /> }`

Pages are tested through view components, not by calling the page: a page that later becomes `async` would return a Promise and `renderToStaticMarkup` would throw, and the served-HTML gate is Task 20's job anyway.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/views/home.test.tsx
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeView } from "../../src/components/views/HomeView";
import { getPage } from "../../src/lib/content";

const html = renderToStaticMarkup(<HomeView page={getPage("/")!} />);

test("home renders identity, seeking and the Campus card", () => {
  assert.match(html, /Nathan Espejo/);
  assert.match(html, /Summer 2027 applied AI engineering internship/);
  assert.match(html, /Campus/);
  assert.match(html, /4,687/);
  assert.match(html, /308/);
});

test("home has exactly one h1", () => {
  assert.equal(html.match(/<h1/g)?.length, 1);
});
```

The `seeking` assertion uses the full string from `site.ts:34` — "engineering" included.

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL — cannot find module `HomeView`.

- [ ] **Step 3: Build the view and author `content/home.md`**

Follow the draft: `whoami` prompt line, `<h1>`, pitch, status, four buttons, the intro paragraph, the Campus card, `~/featured`, `~/experience`, `~/ask`. Figures come from `StatRow` or `{{stat:…}}`, never typed into the markdown.

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm test && npm run check:content`
Expected: PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/views/HomeView.tsx src/app/page.tsx content/home.md tests/views/home.test.tsx
git commit -m "feat: home page"
```

---

### Task 11: Projects index

**Files:**
- Create: `src/components/views/ProjectsView.tsx`, `src/app/projects/page.tsx`, `content/projects.md`
- Test: `tests/views/projects.test.tsx`

**Interfaces:**
- Consumes: `site.projects` grouped by `group` and sorted by `order`; `AwardsTable`; `site.hackathons`
- Produces: `ProjectsView({ page }: { page: Page })` and `GROUP_LABELS: Record<ProjectGroup, string>` — `also-building` → "Also building", `ai-ml` → "AI and ML", and so on. The draft's headings are lowercase slugs (`## ~/also-building`), so capitalized display labels must come from this map, not from heading text.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/views/projects.test.tsx
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ProjectsView } from "../../src/components/views/ProjectsView";
import { getPage } from "../../src/lib/content";

const html = renderToStaticMarkup(<ProjectsView page={getPage("/projects")!} />);

test("projects renders every group label", () => {
  for (const h of [
    "Featured", "Also building", "AI and ML", "Hackathon team projects",
    "Hardware", "Web and mobile", "Games and smaller builds", "Awards",
  ]) {
    assert.ok(html.includes(h), `missing ${h}`);
  }
});

test("the TeraGo row shows its figure via StatRow, not prose", () => {
  assert.match(html, /760/);
});

test("the games list is a native disclosure", () => {
  assert.match(html, /<details/);
  assert.match(html, /<summary/);
});

test("the awards table is captioned and scoped", () => {
  assert.match(html, /<caption/);
  assert.match(html, /scope="col"/);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL — cannot find module `ProjectsView`.

- [ ] **Step 3: Build the view and author `content/projects.md`**

Featured, also-building, the awards table, grouped other projects, then the collapsed games list in `<details>`. Group headings render from `GROUP_LABELS`, not from the markdown, so they are capitalized and stable. The intro sets the applied-AI focus and the honesty rule about team work before any credit appears.

The TeraGo row renders `760` through `StatRow`. The draft shows no figure on that row, so this is a deliberate divergence — **record it in the spec's "Resolved during review" section**, which is where the plan's other divergences from the draft are tracked. The spec has no Review Focus section; that heading lives in this plan.

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm test && npm run check:content`
Expected: PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/views/ProjectsView.tsx src/app/projects/page.tsx content/projects.md tests/views/projects.test.tsx
git commit -m "feat: projects index"
```

---

### Task 12: Case study template and Campus

**Files:**
- Create: `src/components/CaseStudy.tsx`, `src/app/projects/[slug]/page.tsx`, `content/projects/campus.md`
- Test: `tests/views/case-study.test.tsx`

**Interfaces:**
- Produces: `CaseStudy({ page, backHref, backLabel, nextHref, nextLabel }: { page: Page; backHref: string; backLabel: string; nextHref?: string; nextLabel?: string })`
  - Back and next links are **props**, so TeraGo can point at `/experience` while the project case studies point at `/projects`
  - The meta row is chosen by the page: `page.experienceOrg` renders `ExperienceMetaRow`, otherwise `ProjectMetaRow`. This is what makes `/experience/terago` show an experience meta row
  - `generateStaticParams()` returns every route file under `/projects/` **only** — this is a single-segment route and cannot carry `/experience/terago`, which Task 13 gives its own `[slug]` route
  - `OnThisPage` takes the page's `onThisPage` entries and derives anchors with the **same slugify** `renderMarkdown` uses for heading ids, so `"Why I built it"` → `#why-i-built-it`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/views/case-study.test.tsx
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { CaseStudy } from "../../src/components/CaseStudy";
import { getPage } from "../../src/lib/content";

const page = getPage("/projects/campus")!;
const html = renderToStaticMarkup(
  <CaseStudy page={page} backHref="/projects" backLabel="all projects" nextHref="/projects/homelab" nextLabel="Homelab" />
);

test("Campus renders its sections and figures", () => {
  for (const h of ["tl;dr", "Why I built it", "How it works", "Models and cost", "Results", "Stack"]) {
    assert.ok(html.includes(h), `missing ${h}`);
  }
  assert.match(html, /4,687/);
  assert.match(html, /215/);
});

test("the on-this-page list links to real heading ids", () => {
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(html.includes(`id="${m[1]}"`), `dangling anchor ${m[1]}`);
  }
});

test("the meta row shows 'now', never 'present'", () => {
  assert.doesNotMatch(html, /present/i);
});

test("back and next links are parameterized", () => {
  assert.match(html, /href="\/projects"/);
  assert.match(html, /href="\/projects\/homelab"/);
});
```

The `present` assertion is case-insensitive. A capital-P regex would pass while the page still read "present" — the exact drift the spec exists to prevent.

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL — cannot find module `CaseStudy`.

- [ ] **Step 3: Implement the template, then author Campus**

Sections: tl;dr, Why I built it, What I built, How it works, Models and cost, Results, Next, Stack. The flow diagram goes through `Diagram`. Stack renders through `StackList`. No figure is typed into the markdown. `OnThisPage` items must cover every heading the draft lists, including "what I built" and "next".

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm test && npm run check:content`
Expected: PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/CaseStudy.tsx "src/app/projects/[slug]/page.tsx" content/projects/campus.md tests/views/case-study.test.tsx
git commit -m "feat: case study template and Campus"
```

---

### Task 13: Homelab, AWARE and TeraGo case studies

**Files:**
- Create: `content/projects/{homelab,aware}.md`, `content/experience/terago.md`, `src/app/experience/[slug]/page.tsx`
- Test: `tests/views/case-studies.test.tsx`

**Interfaces:**
- Consumes: `CaseStudy` unchanged; TeraGo passes `backHref="/experience"`, `backLabel="experience"`
- Produces: `/experience/terago` served by its own dynamic route

- [ ] **Step 1: Write the failing test**

```tsx
// tests/views/case-studies.test.tsx
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { CaseStudy } from "../../src/components/CaseStudy";
import { getPage } from "../../src/lib/content";

test("homelab carries its own figures via StatRow", () => {
  const html = renderToStaticMarkup(
    <CaseStudy page={getPage("/projects/homelab")!} backHref="/projects" backLabel="all projects" />
  );
  for (const v of ["472", "58,000", "191", "27"]) assert.ok(html.includes(v), `missing ${v}`);
});

test("aware renders a captioned model table", () => {
  const html = renderToStaticMarkup(
    <CaseStudy page={getPage("/projects/aware")!} backHref="/projects" backLabel="all projects" />
  );
  assert.match(html, /<caption/);
  assert.match(html, /YOLOv8n/);
});

test("terago states it is internal work and links back to experience", () => {
  const html = renderToStaticMarkup(
    <CaseStudy page={getPage("/experience/terago")!} backHref="/experience" backLabel="experience" />
  );
  assert.match(html, /no code or screenshots/i);
  assert.match(html, /href="\/experience"/);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL — `getPage` returns undefined for these routes.

- [ ] **Step 3: Author the three files and add the experience dynamic route**

Transcribe faithfully from the draft, including Homelab's two "what broke" asides as blockquotes and AWARE's model table through `ModelTable`. TeraGo keeps the honest scope words ("prototype", "proposal"). Every figure goes through `StatRow` or `{{stat:…}}` — transcribing the draft's numbers as prose would fail `check:content`.

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm test && npm run check:content`
Expected: PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add content/projects/homelab.md content/projects/aware.md content/experience/terago.md "src/app/experience/[slug]/page.tsx" tests/views/case-studies.test.tsx
git commit -m "feat: homelab, aware and terago case studies"
```

---

### Task 14: Experience and Now

**Files:**
- Create: `src/components/views/{ExperienceView,NowView}.tsx`, `src/app/{experience,now}/page.tsx`, `content/{experience,now}.md`
- Test: `tests/views/experience.test.tsx`

**Interfaces:**
- Consumes: `site.experience` via `ExperienceMetaRow` (so dates render from one place), `site.identity.education`, `site.hackathons`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/views/experience.test.tsx
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ExperienceView } from "../../src/components/views/ExperienceView";
import { NowView } from "../../src/components/views/NowView";
import { getPage } from "../../src/lib/content";

const html = renderToStaticMarkup(<ExperienceView page={getPage("/experience")!} />);

test("experience renders dates from site.ts verbatim", () => {
  assert.match(html, /May 2026 to Aug 2026/);
  assert.match(html, /Sep 2025 to Aug 2026/);
  assert.doesNotMatch(html, /present/i);
});

test("experience covers all five roles", () => {
  for (const org of ["TeraGo", "3D Western", "WEMars", "WEFirst", "Microcomputer"]) {
    assert.ok(html.includes(org), `missing ${org}`);
  }
});

test("now ends with the ask and a mailto link", () => {
  const now = renderToStaticMarkup(<NowView page={getPage("/now")!} />);
  assert.match(now, /mailto:nate\.e\.espejo@gmail\.com/);
});
```

Dates are asserted in `site.ts`'s own form (`May 2026 to Aug 2026`). The draft's shorter "May to Aug 2026" would require either a formatter no task defines or typing the date into prose, which breaks the one-source rule.

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL — cannot find module `ExperienceView`.

- [ ] **Step 3: Build both views and author both content files**

Experience: role blocks newest first, each a heading, an `ExperienceMetaRow` and 2–4 bullets, with the TeraGo block linking to its case study; then Education; then the hackathon line linking to the awards table. Now: five short bullets ending with the ask and the email link.

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm test && npm run check:content`
Expected: PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/views/ExperienceView.tsx src/components/views/NowView.tsx src/app/experience/page.tsx src/app/now/page.tsx content/experience.md content/now.md tests/views/experience.test.tsx
git commit -m "feat: experience and now pages"
```

---

### Task 15: Résumé page

**Files:**
- Create: `src/components/views/ResumeView.tsx`, `content/resume.md`, `src/styles/print.css`
- Modify: `src/app/resume/page.tsx` (the route, to import the print stylesheet), `src/lib/content.ts` (skills frontmatter)
- Test: `tests/views/resume.test.tsx`

**Interfaces:**
- Extends `Page` with `skills?: { group: string; items: string[] }[]` — the résumé's four-group layout is the documented exception to the one-source rule, and its shape must be pinned here rather than guessed.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/views/resume.test.tsx
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ResumeView } from "../../src/components/views/ResumeView";
import { getPage } from "../../src/lib/content";

const html = renderToStaticMarkup(<ResumeView page={getPage("/resume")!} />);

test("resume says Automated, not Prototyped", () => {
  assert.match(html, /Automated outage ticketing/);
  assert.doesNotMatch(html, /Prototyped/);
});

test("resume carries no phone number", () => {
  assert.doesNotMatch(html, /416-825-7510/);
  assert.doesNotMatch(html, /\b\d{3}-\d{3}-\d{4}\b/);
});

test("the PDF link precedes the body content", () => {
  assert.ok(html.indexOf("Nathan_Espejo_Resume.pdf") < html.indexOf("Education"));
});

test("skills use the résumé's four groups", () => {
  for (const g of ["AI", "Languages", "Web &amp; Infra", "Tools"]) {
    assert.ok(html.includes(g), `missing ${g}`);
  }
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL — cannot find module `ResumeView`.

- [ ] **Step 3: Extend the loader for skills, then build the view**

Add `skills` parsing to `src/lib/content.ts` and cover it in `tests/content.test.ts` by **extending the existing `tests/fixtures/content/home.md`** with a `skills:` block — adding a new fixture file would break Task 4's `loadFrom(FIXTURES).length === 2` assertion. Pin the grammar in the loader: a block list of `- group: <name>` followed by `  items: [a, b, c]`. Sections in the PDF's order: Education, Experience, Projects, Hackathon Awards, Technical Skills — using the draft's text, with "Automated outage ticketing" restored and the skills bullet's model names removed. Import `print.css` from the route so `@media print` actually applies.

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm test && npm run check:content`
Expected: PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/views/ResumeView.tsx src/app/resume/page.tsx content/resume.md src/styles/print.css src/lib/content.ts tests/views/resume.test.tsx tests/content.test.ts
git commit -m "feat: resume page with print stylesheet"
```

---

### Task 16: Chat page

**Files:**
- Create: `src/components/views/ChatView.tsx`, `src/app/chat/ChatPanel.tsx`, `src/app/chat/page.tsx`, `content/chat.md`
- Test: `tests/views/chat.test.tsx`

**Interfaces:**
- Produces: `ChatView({ page }: { page: Page })` server-rendered with all static text; `ChatPanel` is the only `"use client"` component
- Followups arriving behind the existing delimiter render through the same component as the empty-state starters

- [ ] **Step 1: Write the failing test**

```tsx
// tests/views/chat.test.tsx
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ChatView } from "../../src/components/views/ChatView";
import { getPage } from "../../src/lib/content";

const html = renderToStaticMarkup(<ChatView page={getPage("/chat")!} />);

test("chat renders starters and the JS-off notice in the HTML", () => {
  assert.match(html, /What is Campus and how does its retrieval work\?/);
  assert.match(html, /needs JavaScript/);
  assert.match(html, /\/llms\.txt/);
});

test("chat states its limits and carries no phone number", () => {
  assert.match(html, /can be wrong/i);
  assert.doesNotMatch(html, /\b\d{3}-\d{3}-\d{4}\b/);
});

test("no Sources line is rendered", () => {
  assert.doesNotMatch(html, />Sources:/);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL — cannot find module `ChatView`.

- [ ] **Step 3: Build the view and the panel**

The page shell is server-rendered with intro, disclaimer, five starter questions and the JS-off notice, so it reads with JS off. `ChatPanel` handles the message list, input, send, and the loading / no-match / off-topic / error / rate-limit states against the streamed response. Styled as a terminal transcript. No side panel, no `Sources:` line.

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/views/ChatView.tsx src/app/chat/ChatPanel.tsx src/app/chat/page.tsx content/chat.md tests/views/chat.test.tsx
git commit -m "feat: TUI-style chat page"
```

---

### Task 17: Chat system prompt and embeddings

**Files:**
- Modify: `src/app/api/chat/lib/system-prompt.ts`, `src/app/api/chat/lib/embeddings.ts`, `scripts/build-embeddings.mjs`
- Create: `scripts/check-embeddings.mjs`
- Test: `tests/system-prompt.test.ts`

**Interfaces:**
- Produces: `buildSystemPrompt(chunks)` whose project order derives from `site.projects` sorted by `order`, Campus first
- The embeddings cache records a `contentHash` of the projected corpus, and `check-embeddings.mjs` recomputes it and fails on mismatch

Freshness is a hash, not an mtime: git does not preserve mtimes, so a clone or CI checkout makes every file equally new and an mtime comparison becomes a coin flip. It also lives in a check script rather than `npm test`, so the unit suite does not depend on `build-embeddings` having run last.

- [ ] **Step 1: Write the failing test**

```ts
// tests/system-prompt.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSystemPrompt } from "../src/app/api/chat/lib/system-prompt";

const prompt = buildSystemPrompt([
  { text: "Campus is a study assistant.", source: "projects/campus.md" },
]);

test("Campus leads the project order", () => {
  const order = prompt.slice(prompt.indexOf("Order:"));
  assert.ok(order.includes("Campus"), "Campus must appear in the priority list");
  assert.ok(order.indexOf("Campus") < order.indexOf("Homelab"));
});

test("no stale v2 interface description survives", () => {
  assert.doesNotMatch(prompt, /React Three Fiber|ALLMIND mask|Three\.js/);
  assert.doesNotMatch(prompt, /Prototyped/);
});

test("resume highlights do not contradict site.ts", () => {
  assert.doesNotMatch(prompt, /Summer 2025/, "TeraGo was May-Aug 2026");
  assert.doesNotMatch(prompt, /3D Western \(current\)/, "3D Western ended Aug 2026");
  assert.match(prompt, /May 2026 to Aug 2026/);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL — Campus absent from the order list.

- [ ] **Step 3: Rewrite the prompt**

Rebuild the order from `site.projects` sorted by `order`, Campus first. Replace the Blender/R3F paragraph with a description of the text site and the projected corpus. Align the off-topic and no-match wording to the draft, keeping rules 4 and 11 as the mechanism.

**Rebuild `RESUME HIGHLIGHTS` from `site.experience` and `site.identity`.** The migrated file says "Software Engineering Intern at TeraGo (Summer 2025)" and "Software Developer at 3D Western (current)", both of which contradict `site.ts` — TeraGo ran May–Aug 2026 and 3D Western ended Aug 2026 with a VP of Data/ML title. This is the drift the spec exists to prevent, and the test above pins it.

- [ ] **Step 4: Add the content hash and the check script**

`build-embeddings.mjs` hashes the projected corpus and stores it alongside the vectors — the hash is written in `src/app/api/chat/lib/embeddings.ts`, since the script only calls into it. `check-embeddings.mjs` recomputes and exits non-zero on mismatch with the message "run npm run build-embeddings".

- [ ] **Step 5: Rebuild embeddings and confirm chat answers from the new corpus**

```bash
printf 'COHERE_API_KEY=%s\n' "$(grep -oP '(?<=COHERE_API_KEY=).*' /home/nate/Projects/portfolio-v2/.env)" > .env
npm run build-embeddings
npm run check:embeddings
npm run build
(npx next start -p 3100 &) ; sleep 3
curl -s -X POST localhost:3100/api/chat -H 'Content-Type: application/json' \
  -d '{"message":"What is Nathans flagship project?"}' | head -c 300
pkill -f "[n]ext start"
```

Expected: embeddings report a chunk count over the projected corpus; `check:embeddings` exits 0; the answer names Campus. `.env` is gitignored — never commit it.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/chat/lib/system-prompt.ts src/app/api/chat/lib/embeddings.ts scripts/build-embeddings.mjs scripts/check-embeddings.mjs src/app/api/chat/lib/embeddings-cache.json tests/system-prompt.test.ts
git commit -m "feat: rewrite chat system prompt and pin embeddings to the corpus"
```

---

### Task 18: Bot surface and SEO

**Files:**
- Modify: `src/app/llms.txt/route.ts`, `src/app/sitemap.ts`, `src/app/knowledgebase/[...slug]/route.ts`, `src/components/{SeoJsonLd,SeoFallback}.tsx`, `src/app/layout.tsx`
- Test: `tests/seo.test.ts`

**Interfaces:**
- Consumes: `listPages()` (all route files) and `getCorpusDocs()` (allowlist)
- Produces: a sitemap containing every route file's route plus every `/knowledgebase/*.md` URL; `/llms.txt` ordered start-here first

- [ ] **Step 1: Write the failing test**

```ts
// tests/seo.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import sitemap from "../src/app/sitemap";
import { listPages } from "../src/lib/content";
import { getCorpusDocs } from "../src/lib/corpus";

test("every route file appears in the sitemap", () => {
  const urls = sitemap().map((e) => new URL(e.url).pathname);
  for (const page of listPages()) assert.ok(urls.includes(page.route), `missing ${page.route}`);
});

test("every published corpus document appears in the sitemap", () => {
  const urls = sitemap().map((e) => new URL(e.url).pathname);
  for (const doc of getCorpusDocs()) {
    assert.ok(urls.includes(`/knowledgebase/${doc.path}`), `missing ${doc.path}`);
  }
});

test("the sitemap is not scoped to nav items", () => {
  const urls = sitemap().map((e) => new URL(e.url).pathname);
  assert.ok(urls.includes("/chat"), "chat is missing");
  assert.ok(urls.some((u) => u.startsWith("/projects/")), "case studies are missing");
});
```

`listPages()` returns **all** route files; nav order is a separate `NAV_ORDER`. Scoping it to nav would silently drop `/chat` and every case study from the sitemap.

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL — the sitemap still reads the old allowlist array.

- [ ] **Step 3: Repoint the bot surface**

Sitemap from `listPages()` plus `getCorpusDocs()`. `/llms.txt` orders by the page's `priority` frontmatter (start-here first), gains the new routes, and uses `highlightProjects()`. The KB handler serves `getCorpusDoc()` and 404s anything not in `getCorpusDocs()`.

**Delete the `knowledgebase` allowlist array from `src/data/site.ts` here**, not in Task 3 — this is the step where its three importers (`sitemap.ts`, `llms.txt/route.ts`, the KB route) are all repointed, so the build never breaks in between.

Confirm JSON-LD still emits `Person` and `WebSite`, and keep `SeoFallback` small — the pages now carry their own text.

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/llms.txt/route.ts src/app/sitemap.ts "src/app/knowledgebase/[...slug]/route.ts" src/components/SeoJsonLd.tsx src/components/SeoFallback.tsx src/app/layout.tsx tests/seo.test.ts
git commit -m "feat: point the bot surface at the projected corpus"
```

---

### Task 19: JS-off render check and verification

**Files:**
- Create: `scripts/check-render.mjs`, `docs/verification.md`
- Test: the script itself

**Interfaces:**
- Consumes: a production build
- Produces: `npm run check:render` asserting each route's required marker in the served HTML with no JavaScript executed

- [ ] **Step 1: Write the render check**

Build first, then start the server on a free port and **poll for readiness** before fetching. Backgrounding `npm run build && npm start` in one command backgrounds the build too, so the fetches run against nothing.

```bash
npm run build
(npx next start -p 3100 &)
for i in $(seq 1 40); do curl -sf -o /dev/null http://localhost:3100/ && break; sleep 0.5; done
npm run check:render
pkill -f "[n]ext start"
```

Assert one required substring per route: `/` contains `4,687`; `/projects` contains `Awards`; `/projects/campus` contains `lexical`; `/projects/homelab`, `/projects/aware` and `/experience/terago` each contain a figure unique to them; `/experience` contains `May 2026 to Aug 2026`; `/now` contains `mailto:`; `/resume` contains `Automated outage ticketing`; `/chat` contains `needs JavaScript`. Also assert `/knowledgebase/not-a-real-file.md` returns 404, `/llms.txt` returns `text/markdown`, `/robots.txt` returns `text/plain` and names the sitemap, and `/sitemap.xml` returns XML containing `/projects/campus`. Exit non-zero listing every failure.

`check-render.mjs` **consumes `http://localhost:3100`** and does not spawn its own server — the step above starts one. If it spawned its own it would collide on the port.

It **must first assert it is talking to a production build** and fail loudly if it is not. This is not hypothetical: during implementation a leftover `next dev -p 3100` from an earlier session held the port, so every `npm start` failed to bind and exited, and every request silently hit the dev server instead. `npm start` does not error when the port is taken, and a dev server serves the same components, so the checks all passed while grading development output — including a spurious `500` on `/knowledgebase/*.md` from a stale dev chunk that production does not have. Two cheap signals, both observed here: a dev response contains `react-refresh`, and its `__NEXT_DATA__` carries `"buildId":"development"`. Refuse to run if either is present, and report that the port is held by another server.

Before starting the server in Step 1, confirm the port is free (`ss -ltnp | grep 3100`) rather than assuming it is.

Every case study gets a page-level check here — the unit tests exercise `CaseStudy` with a supplied page, so a route that fails to build or 404s would otherwise pass everything.

- [ ] **Step 2: Run it and fix what it finds**

Run the sequence from Step 1.
Expected: exit 0. A route that fails almost always has its text behind a client component — move it into the server view.

- [ ] **Step 3: Run the remaining checks**

```bash
npm run lint && npm test && npm run check:content && npm run check:contrast && npm run check:embeddings
```

Expected: all exit 0, and `npm test` reports a non-zero test count.

- [ ] **Step 4: Manual checklist, recorded in `docs/verification.md`**

- Keyboard only, each route: skip link first, visible focus ring on every link, `aria-current` on the active nav item, `/chat` does not trap focus.
- Screen reader: headings form a real outline; `~/... $` lines are silent; `~/featured` reads "Featured"; status tags read as words.
- **360px**: no horizontal scroll on `/projects` (widest table) or any case study (widest diagram).
- Contrast spot-check on muted text, status tags and footer hints.
- Chat: loading, no-match, off-topic, error, rate-limit and JS-off states each observed.
- Esc on `/chat`: not applicable — Decision 12 removed the side panel, so record it as N/A rather than unimplemented.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-render.mjs docs/verification.md
git commit -m "test: JS-off render check and recorded verification pass"
```

---

### Task 20: Domain cutover

**Files:** none (deployment only)

**Interfaces:** consumes everything above.

- [ ] **Step 1: Create the Vercel project and deploy a preview**

Set `COHERE_API_KEY` in the v3 project. Deploy without touching the production domain.

- [ ] **Step 2: Compare the preview against the draft, page by page**

Walk each route against `tmp/revamp-draft.md` and record any divergence in `docs/verification.md`.

- [ ] **Step 3: Point the domain at v3**

Update the domain, then confirm `/`, `/llms.txt`, `/robots.txt`, `/sitemap.xml` and `/knowledgebase/index.md` resolve on the real domain.

- [ ] **Step 4: Commit any recorded divergence**

```bash
git add docs/verification.md && git commit -m "docs: record preview review against the draft"
```

---

### Task 21: v3 documentation and v2 archival

**Files:**
- Create: `AGENTS.md`, `README.md`

- [ ] **Step 1: Write v3's AGENTS.md and README**

AGENTS.md describes the text architecture: the one-source-of-facts invariant and `{{stat:…}}` placeholders, `content/` as the authored tree with `src/lib/corpus.ts` projecting it, the check scripts, and the accessibility constraints. It must not mention the ocean, emergence or WebGL.

- [ ] **Step 2: Archive v2**

Mark the `portfolio-v2` repo archived/read-only. Do not delete it and do not modify its contents.

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md README.md
git commit -m "docs: v3 agent guide and readme"
```
