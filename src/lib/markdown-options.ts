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
 */
export const MARKDOWN_OPTIONS = {
  html: false,
  linkify: false,
  typographer: false,
} as const;
