# portfolio-v3

Static, text-first, multi-page site for nathanespejo.com. Next.js 15 (App Router), React 19, TypeScript and Tailwind CSS 4. No client state manager, no animation library, no WebGL.

- Pages live under `/` (home), `/projects`, `/projects/:slug`, `/experience`, `/experience/:slug`, `/now`, `/resume`, `/chat`.
- The public knowledge base is served as plain markdown at `/knowledgebase/*.md`; `/llms.txt` is the short index.
- The chat runs a text-only Cohere RAG against the same projected corpus as the knowledge base.

## Requirements

Node 22 or newer (`.nvmrc` says 22). `npm test` passes glob arguments to `node --test`, which needs Node 22+.

## Develop

```sh
npm install
npm run dev          # http://localhost:3100
npm run build && npm run start
```

## Checks

```sh
npm run typecheck         # tsc over src/ and tests/
npm run lint
npm test
npm run build             # tsc and the tests cannot see a bad route export; this can
npm run check:content     # a page may not restate a figure or stack list from site.ts
npm run check:words       # no banned word on a surface a reader can reach
npm run check:contrast    # 4.5:1 text contrast, both palettes
npm run check:embeddings  # the chat index is newer than the corpus
npm run check:render      # JS-off served HTML, against a running npm start
```

`check:render` needs a production build on port 3100: stop the dev server, run `npm run build && npm run start`, then the check.

## Source of facts

`src/data/site.ts` is the one source for every figure, stat and project or experience record. `content/` holds the authored copy, and `src/lib/corpus.ts` projects both into the public markdown surface and the RAG index. Content files reference figures as `{{stat:<id>.<key>}}`, and an unknown key fails the render rather than printing a blank.

Prose that a page states in `site.ts` terms belongs in `content/`, not in JSX. Tables, diagrams and images go through the `diagram`, `models` and `figure` fences, so the markup for captions and column scopes has one source.

## The chat

`/chat` is the only route that needs JavaScript. `src/app/api/chat/route.ts` embeds the question, retrieves chunks from the committed index at `src/app/api/chat/lib/embeddings-cache.json`, reranks them, and answers from those chunks only. `system-prompt.ts` holds the honesty rules: no figure that the context does not carry, no calling a project deployed when the record says otherwise, no phone number, and abandoned projects left out unless the visitor asks.

The index is committed, so a clone answers without a build step:

```sh
npm run build-embeddings   # needs COHERE_API_KEY in .env, and a content edit needs a rebuild
npm run check:embeddings   # fails while a content edit is unindexed
```

The chat is browser-only. It requires the browser's own `Sec-Fetch-Site`, or `Origin` from a browser too old to send that, to match this host, so a script is sent to search instead. Limits: 20 an hour per address, 300 a day for the site, 30 messages of history, 4,000 characters per message, 100 KB per request. Every ceiling reads from the environment (`CHAT_REQUESTS_PER_HOUR`, `CHAT_REQUESTS_PER_DAY`).

## Search API

`GET /api/search?q=<query>&limit=5` is the machine-facing half: the same corpus, the same committed index, the same embed and rerank, with no generation. Each result carries the record's own text plus the `/knowledgebase` URL to cite, which costs about a hundredth of a chat answer and cannot drift the way a paraphrase can. `limit` defaults to 5 and caps at 10, the response is cached at the edge for an hour, and the ceilings are `SEARCH_REQUESTS_PER_HOUR` (60) and `SEARCH_REQUESTS_PER_DAY` (1000).

Both limiters count in memory, so on serverless each instance keeps its own and a cold start resets them. That is a brake on a runaway crawler rather than a global quota; a hard one needs a shared store, which this site does not have.

## The résumé

`resume/Resume.tex` is the source for `public/Nathan_Espejo_Resume.pdf`, the file the site serves. `npm run build:resume` compiles it, borrowing `latexmk` from `resume/flake.nix` when it is not on `PATH`. `content/resume.md` is the same résumé as text.

## Deploy

Vercel. `/api/chat` needs `COHERE_API_KEY` set for the environment being deployed, and so does `/api/search`. Without a valid key both return 500 and the rest of the site is unaffected.
