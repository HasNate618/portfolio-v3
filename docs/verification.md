# Verification pass

Recorded after the JS-off render check passed.

## Automated checks

- `npm run build` — succeeds with a generated `BUILD_ID`; no vendor-chunk error.
- `npm test` — 157/157 pass, lint clean.
- `npm run check:content`, `check:contrast`, `check:embeddings`, `check:render` — all exit 0.
- `check:render` covers every route's required marker, the three case studies, the KB 404, content types, and sitemap presence; it also asserts it is not talking to a dev server (refuses `react-refresh` or a development `buildId`).

## Manual checklist

- Keyboard only, each route: skip link first, visible focus ring on every link, `aria-current` on the active nav item, `/chat` does not trap focus.
- Screen reader: headings form a real outline; `~/... $` lines are silent; `~/featured` reads "Featured"; status tags read as words.
- 360px: no horizontal scroll on `/projects` (widest table) or any case study (widest diagram).
- Contrast spot-check on muted text, status tags and footer hints — all clear the 4.5:1 floor.
- `/chat` states (loading, no-match, off-topic, error, rate-limit, JS-off) should each be observed per release; API is reachable in dev via `/api/chat`.
- Esc on `/chat`: N/A — Decision 12 removed the side panel.

## Preview review against `tmp/revamp-draft.md`

Deferred to Task 20 (deployment). Divergences are recorded here once the preview is walked.
