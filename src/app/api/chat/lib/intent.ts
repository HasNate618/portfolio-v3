/**
 * Whether the visitor is hiring.
 *
 * This changes one block of the prompt: a recruiter gets the fit, the Summer 2027
 * internship and the May 2028 graduation tied to their need. The conversation,
 * not the sentence, is the unit: a visitor who says "tell me more" two turns after
 * asking whether Nathan is a fit is still asking about a role, so the last two
 * visitor turns count as well as this one. An assistant turn never counts, or the
 * guidance would feed on its own words.
 */

export type Intent = "recruiter" | "general";

/**
 * `availab`, `recruit` and the accent-free résumé are written as the shapes
 * visitors actually type: "available", "recruiting", "resume".
 *
 * The résumé alternative sits outside the `\b…\b` group: an accented letter is
 * not a `\w`, so a trailing `\b` can never close "résumé" and the pattern went
 * on matching the unaccented spelling only.
 */
const RECRUITER =
  /\b(hir(e|ing)|interns?hips?|fit|role|position|candidate|availab\w*|summer|recruit\w*|cv)\b|r[eé]sum[eé]s?/i;

export function routeIntent(
  message: string,
  history: Array<{ role: string; content: string }>,
): Intent {
  const recent = history
    .filter((entry) => entry.role === "user")
    .slice(-2)
    .map((entry) => entry.content);

  return RECRUITER.test([message, ...recent].join("\n")) ? "recruiter" : "general";
}
