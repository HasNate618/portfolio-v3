/**
 * The one markdown-it configuration.
 *
 * `html: false` is a security property, not a style preference: it is what makes
 * rendering markdown with `dangerouslySetInnerHTML` safe. Raw HTML in the source
 * is escaped rather than parsed, and markdown-it's default link validator drops
 * `javascript:` and other unsafe schemes, so no script can reach the DOM through
 * a content file or a model answer.
 *
 * It lives here, rather than inline at each call site, so the server renderer
 * (`src/lib/markdown.ts`) and the chat transcript cannot drift apart. Flipping
 * `html` to `true` would open an injection path; `tests/markdown.test.ts` fails
 * if that happens.
 *
 * `linkify` is on so the `## Links` lines in content files — and any URL a model
 * writes in an answer — render as anchors rather than inert text. It matches only
 * explicit `http(s)://` and `mailto:` schemes, so a token like `Node.js` or
 * `index.md` stays prose.
 */
export const MARKDOWN_OPTIONS = {
  html: false,
  linkify: true,
  typographer: false,
} as const;
