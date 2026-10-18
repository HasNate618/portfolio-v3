/**
 * The profile card: everything the chat is allowed to say about Nathan.
 *
 * Generated from site.ts on every request rather than hand-written, because a
 * hand-written card is a second copy of the facts and the two drift. This is what
 * v1 and v2 got wrong.
 *
 * Three rules give it its shape:
 * - Every line is read as a claim, so negatives are stated: "Neither won an award"
 *   is what stops a list of solo projects being read as a list of solo wins.
 * - A line must be a substring or a plain restatement of a site.ts field, so the
 *   card cannot introduce a fact that the pages do not carry.
 * - Caveats stay attached to the work they qualify.
 */

import { awardFor, site } from "@/data/site";
import type { Experience, Project } from "@/data/site";
import { caseStudyHref } from "@/lib/content";
import { monthYear } from "@/lib/dates";
import { siteBaseUrl } from "@/lib/site-url";
import { thirdPerson } from "@/lib/voice";
import { TEAM_NO_ROLE_IDS } from "./chips-validate";

/**
 * The one sentence that must not be paraphrased. The prototype turned the solo
 * list into "solo wins", and a negative has to be said out loud to survive.
 *
 * The list is typed rather than derived, because its two parentheticals are of
 * different kinds: an event for one and a date for the other. What a test pins is
 * the fact the sentence asserts, that the only solo projects which ran at an event
 * and won nothing are those two, so "Neither won an award" cannot become false.
 */
const SOLO =
  "Built solo: AWARE (Hack the 6ix 2026) and Animarker (May 2023). Neither won an award. Every other hackathon project was a team project.";

const CAVEATS = [
  "- AWARE runs every model on the board: there is no cloud inference.",
  "- ferret runs fully offline; nothing leaves the machine.",
  "- Campus has no approval gate and no rollback; the NixOS homelab is the project that gates changes and rolls them back.",
  "- 3D Western's dataset labels were VLM-checked, so its accuracy figures are agreement with those labels, not ground truth.",
];

/** The first sentence of a covers block, which is the card's one line of detail. */
function firstSentence(text: string): string {
  const [first] = text.split(". ");
  return first.endsWith(".") ? first : `${first}.`;
}

/**
 * The page a project's line offers. A case study when one exists, else its own
 * repository, and nothing at all when it has neither: a card URL is a URL the
 * model may repeat, so it has to be one the site really serves.
 */
function pageFor(project: Project): string | null {
  const href = caseStudyHref(project);
  if (href) return `${siteBaseUrl()}${href}`;
  return project.links[0]?.href ?? null;
}

function projectLine(project: Project): string {
  const facts = [
    project.dates,
    thirdPerson(project.displayRole),
    project.event,
    project.displayStatus,
    awardFor(project.name)?.prize,
  ]
    .filter((fact): fact is string => Boolean(fact))
    .join(" | ");

  const marker = project.displayStatus === "abandoned" ? "ABANDONED, mention only if asked: " : "";
  const limit = project.limits ? ` Limit: ${thirdPerson(project.limits)}` : "";
  const page = pageFor(project);

  return `- ${marker}${project.name} (${facts}): ${detailFor(project)}${limit}${
    page ? ` Page: ${page}` : ""
  }`;
}

/**
 * The covers sentence, with the no-role caveat attached.
 *
 * Four projects record no part for the member who wrote them, and some of their
 * covers already ends "built with his team". The two are joined rather than
 * repeated, so the caveat reads as one claim instead of the same claim twice.
 */
function detailFor(project: Project): string {
  const covers = thirdPerson(firstSentence(project.covers));
  if (!(TEAM_NO_ROLE_IDS as readonly string[]).includes(project.id)) return covers;

  const clause = "his own part is not on record.";
  if (/built with his team\.$/i.test(covers)) return `${covers.replace(/\.$/, "")}; ${clause}`;
  return `${covers} Built with his team; ${clause}`;
}

function roleLine(role: Experience): string {
  const summary = role.summary ? `: ${thirdPerson(role.summary)}` : "";
  // The dates already say he rejoined; what the record does not have is a claim
  // about work in the term that has only just started.
  const note = role.id === "wemars" ? " No contributions claimed this term." : "";
  return `- ${role.org}, ${role.role} (${role.dates})${summary}${note}`;
}

function identitySection(): string {
  const { identity } = site;
  const { education } = identity;

  return [
    `- ${identity.name}, ${identity.year}, ${education.degree} at ${education.school} (${monthYear(education.start)} to ${monthYear(education.end)}), graduating ${identity.graduation}.`,
    `- ${education.honors}.`,
    `- Seeking a ${identity.seeking}.`,
    `- Based in ${identity.location}.`,
  ].join("\n");
}

function contactSection(): string {
  return [
    `- Email: ${site.contact.email}`,
    ...site.contact.links.map((link) => `- ${link.label}: ${link.href}`),
  ].join("\n");
}

export function buildProfileCard(): string {
  return [
    "## Identity",
    identitySection(),
    "",
    "## Contact",
    contactSection(),
    "",
    "## Hackathons",
    `- ${site.hackathons.entered} entered, ${site.hackathons.awards} awards.`,
    `- ${SOLO}`,
    "",
    "## Roles",
    site.experience.map(roleLine).join("\n"),
    "",
    "## Projects",
    site.projects.map(projectLine).join("\n"),
    "",
    "## Caveats",
    ...CAVEATS,
  ].join("\n");
}
