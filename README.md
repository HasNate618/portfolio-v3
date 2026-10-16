# Nathan Espejo — portfolio

Static, text-first multi-page site for nathanespejo.com.

- Pages live under `/` (home), `/projects`, `/projects/:slug`, `/experience`, `/experience/:slug`, `/now`, `/resume`, `/chat`.
- The public knowledge base is served as plain markdown at `/knowledgebase/*.md`; `/llms.txt` is the short index.
- The chat runs a text-only Cohere RAG against the same projected corpus as the knowledge base.

## Develop

```sh
npm install
npm run dev          # http://localhost:3100
npm run build && npm run start
npm run test && npm run lint
npm run check:content && npm run check:contrast && npm run check:embeddings
```

## Source of facts

`src/data/site.ts` is the one source for every figure, stat and project/experience record. `content/` holds the authored copy, and `src/lib/corpus.ts` projects both into the public Markdown surface and the RAG index.
