/**
 * Which work a question is about.
 *
 * A broad question has no subject of its own: "what has Nathan built?" embeds
 * closer to the pages that enumerate projects than to any single project, which
 * is how a broad answer leads with whichever project retrieval happened to rank
 * first. The topic gives those questions a feature list to lead with, so the
 * order comes from the question rather than from a vector.
 *
 * This only decides what to lead with. A question that names a project or a role
 * keeps the context retrieval chose for it.
 */

export interface TopicRoute {
  ids: string[];
  feature: string[];
}

export const TOPICS = [
  { id: "ai",        re: /\b(ai|llm|agent\w*|ml|model\w*|rag|retriev\w*|local|on-device|edge|vision)\b/i,
    feature: ["campus", "ferret", "aware", "homelab", "terago", "3d-western"] },
  { id: "industry",  re: /\b(hir(e|ing)|team|industry|intern(?:ship)?s?|work experience|job|professional|company)\b/i,
    feature: ["terago", "3d-western", "carebridge", "omni-reality"] },
  { id: "hackathon", re: /\b(hackathon|award|won|win|prize)\b/i,
    feature: ["awards", "aware", "omni-reality", "carebridge"] },
  { id: "infra",     re: /\b(infra|devops|linux|nix|server|homelab|docker|deploy|ci)\b/i,
    feature: ["homelab", "3d-western", "campus"] },
  { id: "backend",   re: /\b(backend|api|database|python|fastapi|sql)\b/i,
    feature: ["terago", "campus", "ferret", "carebridge"] },
  { id: "xr",        re: /\b(xr|vr|ar|unity|quest|game|3d)\b/i,
    feature: ["omni-reality", "eyecandy", "vr-odm-gear-sim", "lumen"] },
] as const;

/**
 * What a question with no topic keywords leads with. The industry roles lead,
 * because a visitor who asked nothing in particular is most often hiring.
 */
export const GENERAL = ["campus", "homelab", "aware", "carebridge", "3d-western", "terago"];

export function routeTopic(text: string): TopicRoute {
  const hit = TOPICS.filter((t) => t.re.test(text));
  if (hit.length === 0) return { ids: ["general"], feature: GENERAL };
  return { ids: hit.map((t) => t.id), feature: [...new Set(hit.flatMap((t) => t.feature))].slice(0, 5) };
}
