# AGENTS.md

Guide for agentic coding tools working in **portfolio-v3**.

## Quick facts

- **Framework:** Next.js 15 (App Router) + React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Site type:** Static, text-first, multi-page, accessible.

No WebGL (`three`, `@react-three/*`, `postprocessing`, `zustand`, `framer-motion`, `@darkroom.engineering/tempus` must never appear).

## Commands

```bash
npm install
npm run dev          # port 3100
npm run build
npm run lint
npm run typecheck   # tsc over src/ and tests/
npm run test
npm run check:content     # content/index/SEO consistency
npm run check:contrast    # 4.5:1 text contrast
npm run check:embeddings  # embedding cache freshness
npm run check:render      # JS-off served HTML, against a running `npm start`
npm run build-embeddings  # rebuild the chat RAG index
```

`.tsx` tests need `TSX_TSCONFIG_PATH=tsconfig.test.json` (the `test` script sets this).

## Architecture boundaries

| Directory | Owns |
|---|---|
| `content/` | Page copy (Markdown with frontmatter). Edit here, never in JSX. |
| `src/app/` | Routes and the chat API. |
| `src/components/` | DOM components, including the SSR views. |
| `src/data/site.ts` | All figures, stats, project/experience metadata. One source per fact. |
| `src/lib/corpus.ts` | Projection from `content/` + `site.ts` facts into `/knowledgebase/*.md` and the chat RAG index. |
| `src/lib/content.ts` | Page loader: `loadFrom`, `listPages`, `getPage`, frontmatter. |
| `src/lib/markdown.ts` | `renderMarkdown`, `resolveStats`, `slugify`. Markdown-it is required lazily. |

## One-source-of-truth

- Page copy lives in `content/`, never in JSX and never rendered from `knowledgebase/`.
- Numbers/stack links/etc live in `site.ts`. Content files reference them as `{{stat:<id>.<key>}}`; the pipeline resolves them at render time and throws on any unknown key.
- Structured tables/diagrams go through fences: `diagram` (required `alt:`) and `models X` (required `caption:`). Their markup generators are the single source for `<caption>`/`scope="col"`/`aria-hidden`.

A route content file may not contain a bare figure or stack list that `site.ts` can hold.

## Accessibility constraints

- 4.5:1 contrast floor, 16px body, ~68ch measure, 2px focus ring.
- Real headings, `aria-current="page"`, skip link, real `<table>` with captions.
- Nothing animates by itself; `prefers-reduced-motion` honored.
- Every route reads with JS off except `/chat`. `/chat` renders server-side shell plus a `<noscript>` starter list.
- Mobile at 360px must not horizontally scroll.
- Keyboard hints hidden on `@media (pointer: coarse)`.

## Internal links

Always `next/link`. Plain `<a>` only for the skip anchor, `mailto:`, and the mounted files (`/llms.txt`, `/knowledgebase/*.md`, the resume PDF).

## Do not

- Re-add WebGL, motion libraries or client state managers.
- Commit the `tmp/` files.
- Add new tooling without user approval.
- Modify `portfolio-v2` (it is archived).
