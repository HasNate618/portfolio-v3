/**
 * Which subject a piece of text names.
 *
 * Three modules need this answer: the chip validator (is this chip about a real
 * subject?), the topic router (whose page should the answer end at?) and the
 * coverage floor (did the visitor name a subject, so the pin stays out of the
 * way?). It had been written three times, and only one copy had been fixed for
 * the two ways it is easy to get wrong:
 *
 * - A word boundary only means something on an edge that is a word character.
 *   "Microcomputer Consulting Inc." ends in a period, so a trailing \b made the
 *   whole alias unmatchable and the text looked like it named nothing.
 * - Corpus paths are dashed ("experience/3d-western.md") while display names have
 *   spaces ("3D Western"). Matching only the display name and the de-dashed id
 *   found nothing at all for those projects, so the chip prompt named the wrong
 *   subject and the pointer fell back to the résumé.
 */

import { site } from "@/data/site";

export interface SubjectAlias {
  id: string;
  alias: string;
  /** True when the name is written in capitals, so it must be spelled that way. */
  exactCase: boolean;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** AWARE is a name, not the word "aware". */
function isCapitalisedName(name: string): boolean {
  return name === name.toUpperCase() && /[A-Z]/.test(name);
}

/**
 * `exactCase` is for names that are also ordinary words. In the chip validator a
 * false negative is cheap, because the slot falls back to a template; where the
 * result is shown, "Is Nathan aware of the deadline?" must not end at AWARE's page.
 */
export function namePattern(alias: string, exactCase = false): RegExp {
  const left = /^[A-Za-z0-9]/.test(alias) ? "\\b" : "";
  const right = /[A-Za-z0-9]$/.test(alias) ? "\\b" : "";
  return new RegExp(`${left}${escapeRegExp(alias)}${right}`, exactCase ? "" : "i");
}

/** Every name a subject could be written as: the display name, the id, and both with spaces. */
export function subjectAliases(): SubjectAlias[] {
  const aliases: SubjectAlias[] = [];

  const add = (id: string, name: string): void => {
    /*
     * A name written in capitals is spelled one way. Its lowercase id is a
     * different word entirely: "aware" is an adjective, "AWARE" is the project.
     * So that name gets one alias, in its own case, and no lowercase forms.
     */
    if (isCapitalisedName(name)) {
      aliases.push({ id, alias: name, exactCase: true });
      return;
    }

    for (const alias of [name, id.replace(/-/g, " "), id]) {
      if (!alias.trim()) continue;
      if (aliases.some((entry) => entry.id === id && entry.alias === alias)) continue;
      aliases.push({ id, alias, exactCase: false });
    }
  };

  for (const project of site.projects) add(project.id, project.name);
  for (const role of site.experience) add(role.id, role.org);
  return aliases;
}

/** The subjects a text names, in data order. */
export function namedSubjects(text: string): string[] {
  const found = new Set<string>();
  for (const { id, alias, exactCase } of subjectAliases()) {
    if (namePattern(alias, exactCase).test(text)) found.add(id);
  }
  return [...found];
}

/** The first subject a text names, which is the one a pointer or chip slot should use. */
export function namedSubjectId(text: string): string | null {
  return namedSubjects(text)[0] ?? null;
}

/** True when the text names a project or a role, which is what the coverage floor asks. */
export function namesSubject(text: string): boolean {
  return namedSubjects(text).length > 0;
}
