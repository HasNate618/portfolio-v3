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
npm run check:words       # banned words; the list lives in src/lib/banned-words.ts
npm run check:contrast    # 4.5:1 text contrast
npm run check:embeddings  # embedding cache freshness
npm run check:render      # JS-off served HTML, against a running `npm start`
npm run build-embeddings  # rebuild the chat RAG index (needs COHERE_API_KEY)
npm run build:resume      # compile resume/Resume.tex into public/Nathan_Espejo_Resume.pdf
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
| `resume/` | The résumé source (`Resume.tex`, `flake.nix`, `build.sh`). See below. |

### The résumé

The PDF at `public/Nathan_Espejo_Resume.pdf` is what the site serves, and `resume/Resume.tex` is its only source. Nothing else may edit either file by hand: run `npm run build:resume`, which compiles the `.tex` (borrowing `latexmk` from `resume/flake.nix` when it isn't on PATH) and copies the PDF over `public/`. Build artifacts land in the gitignored `resume/build/`.

The `HasNate618/Resume` repo is archived; it was the build workflow, not the source.

A change to a figure or claim in `resume/Resume.tex` needs the same change in `content/resume.md`, which is the same résumé as text.

## One-source-of-truth

- Page copy lives in `content/`, never in JSX and never rendered from `knowledgebase/`.
- Numbers/stack links/etc live in `site.ts`. Content files reference them as `{{stat:<id>.<key>}}`; the pipeline resolves them at render time and throws on any unknown key.
- Structured tables/diagrams go through fences: `diagram` (required `alt:`), `models X` (required `caption:`) and `figure` (required `src:`, `alt:` and `caption:`; optional `width:`/`height:` so the page does not shift as the image loads). Their markup generators are the single source for `<caption>`/`scope="col"`/`aria-hidden`/`<figcaption>`.
- A `figure` fence's `src:` must be a site path under `public/`. Off-site and protocol-relative paths are refused.

A route content file may not contain a bare figure or stack list that `site.ts` can hold.

## Accessibility constraints

- 4.5:1 contrast floor, 16px body, ~68ch measure, 2px focus ring.
- Real headings, `aria-current="page"`, skip link, real `<table>` with captions.
- Nothing animates by itself; `prefers-reduced-motion` honored.
- Every route reads with JS off except `/chat`. `/chat` renders server-side shell plus a `<noscript>` starter list.
- Mobile at 360px must not horizontally scroll.
- Keyboard hints hidden on `@media (pointer: coarse)`.

## Internal links

Always `next/link`. Plain `<a>` only for the skip anchor, `mailto:`, the mounted files (`/llms.txt`, `/knowledgebase/*.md`, the resume PDF), and a `figure` fence's image links, which point at static assets rather than routes.

## Do not

- Re-add WebGL, motion libraries or client state managers.
- Commit the `tmp/` files.
- Add new tooling without user approval.
- Modify `portfolio-v2` (it is archived).
