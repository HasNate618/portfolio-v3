/**
 * The one URL an answer ends with.
 *
 * Chosen here, never by the model: this is the last thing a hiring visitor reads,
 * and a model that can write a URL can invent one. The order follows the visitor's
 * path, what Nathan builds, then the best proof, then availability, then contact,
 * and every URL offered is one the site really has.
 */

import { getExperienceById, getProject, site } from "@/data/site";
import { caseStudyHref, getPage } from "@/lib/content";
import { siteBaseUrl } from "@/lib/site-url";
import type { Intent } from "./intent";

export interface Pointer {
  label: string;
  url: string;
}

export interface ChoosePointerInput {
  /** The project or role the answer is about, else null. */
  namedSubjectId: string | null;
  intent: Intent;
  /** 1-based visitor turns in this thread, including the current one. */
  turn: number;
  contactAsked: boolean;
  availabilityAsked: boolean;
}

const EMAIL_URL = `mailto:${site.contact.email}`;

/** A contact link by label, or null if site.ts stops carrying that label. */
function contactUrl(label: string): string | null {
  return site.contact.links.find((link) => link.label === label)?.href ?? null;
}

const RESUME_POINTER: Pointer = {
  label: "Resume PDF",
  url: contactUrl("Resume PDF") ?? EMAIL_URL,
};

const EMAIL_POINTER: Pointer = { label: "Email", url: EMAIL_URL };

const LINKEDIN_POINTER: Pointer = {
  label: "LinkedIn",
  url: contactUrl("LinkedIn") ?? EMAIL_URL,
};

/**
 * The page for the subject the answer is about. A project without a case study
 * points at its own repository, and a role without a page at nothing, which sends
 * the caller to the résumé: this is the one row that must never point at a 404.
 */
function subjectPointer(id: string): Pointer | null {
  const project = getProject(id);
  if (project) {
    const href = caseStudyHref(project);
    if (href) return { label: `${project.name} case study`, url: `${siteBaseUrl()}${href}` };
    const link = project.links[0];
    if (link) return { label: link.label, url: link.href };
    return null;
  }

  const role = getExperienceById(id);
  if (role) {
    const href = `/experience/${role.id}`;
    if (getPage(href)) return { label: `${role.org} case study`, url: `${siteBaseUrl()}${href}` };
  }

  return null;
}

export function choosePointer(input: ChoosePointerInput): Pointer {
  const { namedSubjectId, intent, turn, contactAsked, availabilityAsked } = input;

  if (namedSubjectId) return subjectPointer(namedSubjectId) ?? RESUME_POINTER;

  /*
   * Availability is checked before the first-turn rule, not after: the spec's
   * table ties "availabilityAsked" to the email without a turn, and "is he
   * available?" in the first message is exactly the case it exists for.
   */
  if (availabilityAsked) return EMAIL_POINTER;
  if (intent === "recruiter" && turn >= 2) return EMAIL_POINTER;
  if (contactAsked) return LINKEDIN_POINTER;

  return RESUME_POINTER;
}

/** True when the visitor asked how to reach him. */
export function contactAsked(text: string): boolean {
  return /\b(contact|email|reach|linkedin)\b/i.test(text);
}

/** True when the visitor asked whether he is available. */
export function availabilityAsked(text: string): boolean {
  return /\b(available|availability|hiring|intern(?:ship)?s?|summer 2027)\b/i.test(text);
}

/**
 * Every URL the chat may offer. Stage 4 checks the answer's URL against this, and
 * a test walks every pointer combination to prove none can leave it.
 */
export function pointerWhitelist(): string[] {
  const urls = new Set<string>([EMAIL_URL, site.contact.email, ...site.contact.links.map((link) => link.href)]);

  for (const project of site.projects) {
    const href = caseStudyHref(project);
    if (href) urls.add(`${siteBaseUrl()}${href}`);
    for (const link of project.links) urls.add(link.href);
  }

  for (const role of site.experience) {
    const href = `/experience/${role.id}`;
    if (getPage(href)) urls.add(`${siteBaseUrl()}${href}`);
  }

  return [...urls];
}
