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

import { site } from "@/data/site";

export interface TopicRoute {
  ids: string[];
  feature: string[];
}

export const TOPICS = [
  { id: "ai",        re: /\b(ai|llm|agent|ml|model|rag|retriev|local|on-device|edge|vision)\b/i,
    feature: ["terago", "3d-western", "aware", "homelab", "campus", "ferret"] },
  { id: "industry",  re: /\b(hir(e|ing)|team|industry|interns?hips?|work experience|job|professional|company)\b/i,
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
export const GENERAL = ["terago", "3d-western", "homelab", "aware", "campus", "carebridge"];

export function routeTopic(text: string): TopicRoute {
  const hit = TOPICS.filter((t) => t.re.test(text));
  if (hit.length === 0) return { ids: ["general"], feature: GENERAL };
  return { ids: hit.map((t) => t.id), feature: [...new Set(hit.flatMap((t) => t.feature))].slice(0, 5) };
}

/** A name as it would appear in a question, escaped for a regex. */
function escapeName(name: string): string {
  return name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * The project or role a question names, if any.
 *
 * `questionNamesSubject` in context.ts asks the same question and answers it with
 * a boolean, for the coverage floor. The pointer needs the id: a question about
 * AWARE should end at AWARE's page, and a question about nothing in particular
 * should end at the résumé. Both the display name and the id form count, so
 * "3d western" finds "3D Western".
 */
export function namedSubjectId(text: string): string | null {
  const subjects = [
    ...site.projects.map((project) => ({
      id: project.id,
      names: [project.name, project.id.replace(/-/g, " ")],
    })),
    ...site.experience.map((role) => ({ id: role.id, names: [role.org, role.id.replace(/-/g, " ")] })),
  ];

  for (const subject of subjects) {
    const named = subject.names.some((name) => new RegExp(`\\b${escapeName(name)}\\b`, "i").test(text));
    if (named) return subject.id;
  }

  return null;
}
