import { awardFor, getProject, site } from "@/data/site";
import { BANNED_WORD_PATTERNS } from "@/lib/banned-words";
import { namedSubjects } from "./name-match";

/**
 * The four projects whose content says he built them with his team and that his
 * own part is not on record. A chip about them may not carry a team or
 * leadership premise, because the card cannot answer it.
 */
export const TEAM_NO_ROLE_IDS = ["carebridge", "careerly", "auralis", "eyecandy"] as const;

export type ChipSlotName = "deeper" | "adjacent" | "path";

export interface ChipSlot {
  question: string;
  subject: string;
}

export interface ChipSet {
  deeper: ChipSlot;
  adjacent: ChipSlot;
  path: ChipSlot;
}

export type ChipFailureCode =
  | "nathan"
  | "pronoun"
  | "length"
  | "banned"
  | "subject"
  | "names"
  | "adjacent"
  | "award"
  | "solo"
  | "led"
  | "dup";

export interface ChipFailure {
  code: ChipFailureCode;
  /** Which slot failed, added by the pipeline so the regenerate knows where. */
  slot?: ChipSlotName;
}

const MAX_CHIP_WORDS = 14;

const ABANDONED_IDS = new Set(
  site.projects.filter((project) => project.displayStatus === "abandoned").map((project) => project.id),
);

/** True when the visitor named an abandoned project, so a chip about it is fair. */
export function askedAboutAbandoned(message: string): boolean {
  const ids = [...ABANDONED_IDS];
  if (ids.length === 0) return false;
  return new RegExp(`\\b(?:${ids.map(escapeRegExp).join("|")})\\b`, "i").test(message);
}

/** Every subject a chip may be about: the live projects, the roles, and Nathan. */
export function chipSubjectIds(): string[] {
  const projects = site.projects
    .filter((project) => project.displayStatus !== "abandoned")
    .map((project) => project.id);
  const roles = site.experience.map((role) => role.id);
  return [...projects, ...roles, "nathan"];
}

/**
 * Case and separators are not part of a subject, so a question that says
 * "3D Western" is about `3d-western`. Names written in capitals are matched
 * case-sensitively in name-match.ts, so the English word "aware" is not the
 * project: a false negative costs only a template.
 */
function normalizeWords(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Escape a literal so it can be spliced into a regex as-is. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * The subjects a text names, and the pattern that decides it. Both live in
 * name-match.ts now: this module, the topic router and the coverage floor each
 * had their own copy, and only this one had been fixed for dashed corpus paths
 * and names ending in a period.
 */
export { namedSubjects };

/**
 * Null for a chip the page may show, otherwise the reasons it may not. Each code
 * is stable, because the regenerate prompt lists them.
 */
export function validateChip(input: {
  question: string;
  subject: string;
  slot: ChipSlotName;
  answerSubject: string;
  asked: string[];
  userAskedAbandoned: boolean;
}): ChipFailure[] {
  const { question, subject, slot, answerSubject, asked, userAskedAbandoned } = input;
  const failures: ChipFailure[] = [];
  const fail = (code: ChipFailureCode): void => {
    failures.push({ code });
  };

  if (!/\bNathan\b/i.test(question)) fail("nathan");
  if (/\b(he|his|him)\b/i.test(question)) fail("pronoun");

  const trimmed = question.trim();
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  if (words > MAX_CHIP_WORDS || !trimmed.endsWith("?")) fail("length");

  if (BANNED_WORD_PATTERNS.some((entry) => entry.re.test(question))) fail("banned");

  if (!chipSubjectIds().includes(subject) && !(ABANDONED_IDS.has(subject) && userAskedAbandoned)) {
    fail("subject");
  }

  const named = namedSubjects(question);
  if (named.length > 1 || (named.length === 1 && subject !== "nathan" && !named.includes(subject))) {
    fail("names");
  }

  if (slot === "adjacent" && normalizeWords(subject) === normalizeWords(answerSubject)) fail("adjacent");

  // awardFor() matches on the project name, not the id.
  const project = getProject(subject);
  const role = site.experience.find((entry) => entry.id === subject);
  const displayName = project?.name ?? role?.org;
  if (/\b(won|award|prize)\b/i.test(question) && !(displayName && awardFor(displayName))) {
    fail("award");
  }

  if (/\bsolo\b/i.test(question) && project?.displayRole !== "solo") fail("solo");

  if (/\b(team|led|lead)\b/i.test(question)) {
    const roleNotOnRecord = (TEAM_NO_ROLE_IDS as readonly string[]).includes(subject);
    if (roleNotOnRecord || project?.displayRole === "solo") fail("led");
  }

  const key = normalizeWords(question);
  if (asked.some((prior) => normalizeWords(prior) === key)) fail("dup");

  return failures;
}

/**
 * A pronoun is not a premise, only a habit: "How does his Campus retrieve?" is
 * the same question as "How does Nathan's Campus retrieve?".
 */
export function repairChip(question: string): string {
  return question
    .replace(/\bhis\b/gi, "Nathan's")
    .replace(/\bhe\b/gi, "Nathan")
    .replace(/\bhim\b/gi, "Nathan")
    .trim();
}

const GENERAL_DEEPER = "What does Nathan build?";
const DEFAULT_ADJACENT = "What did Nathan build at TeraGo?";

/** The next step in hiring a student, in the order it becomes relevant. */
const PATH_TEMPLATES = [
  "Is Nathan available for a Summer 2027 internship?",
  "When does Nathan graduate?",
  "Where is Nathan's résumé?",
  "How can I contact Nathan?",
];

/** A question the card can answer by construction, for one subject. */
function slotFor(id: string): ChipSlot {
  const role = site.experience.find((entry) => entry.id === id);
  if (role) return { question: `What did Nathan build at ${role.org}?`, subject: id };

  const project = getProject(id);
  if (project) return { question: `How does Nathan's ${project.name} work?`, subject: id };

  return { question: GENERAL_DEEPER, subject: "nathan" };
}

function wasAsked(question: string, asked: string[]): boolean {
  return asked.some((prior) => normalizeWords(prior) === normalizeWords(question));
}

function nextFeatureSlot(answerSubject: string, featureIds: string[], asked: string[]): ChipSlot {
  if (featureIds.length > 0) {
    // From the answered subject, forwards, wrapping: -1 starts at the first.
    const start = featureIds.indexOf(answerSubject);
    for (let step = 1; step <= featureIds.length; step += 1) {
      const id = featureIds[(start + step) % featureIds.length];
      if (id === answerSubject) continue;
      const candidate = slotFor(id);
      if (!wasAsked(candidate.question, asked)) return candidate;
    }
  }
  return { question: DEFAULT_ADJACENT, subject: "terago" };
}

function nextPathSlot(pathIndex: number, asked: string[]): ChipSlot {
  const start = ((pathIndex % PATH_TEMPLATES.length) + PATH_TEMPLATES.length) % PATH_TEMPLATES.length;
  for (let step = 0; step < PATH_TEMPLATES.length; step += 1) {
    const question = PATH_TEMPLATES[(start + step) % PATH_TEMPLATES.length];
    if (!wasAsked(question, asked)) return { question, subject: "nathan" };
  }
  // Every path line has been asked. A repeat beats an empty slot.
  return { question: PATH_TEMPLATES[start], subject: "nathan" };
}

/**
 * The last resort, and the reason the page always shows three questions: every
 * template is answerable from the card alone, so none of them can invent a
 * premise the answer did not have.
 */
export function templateChips(input: {
  answerSubject: string;
  featureIds: string[];
  asked: string[];
  pathIndex: number;
}): ChipSet {
  const { answerSubject, featureIds, asked, pathIndex } = input;

  const primary = slotFor(answerSubject);
  const deeper = wasAsked(primary.question, asked)
    ? { question: GENERAL_DEEPER, subject: "nathan" }
    : primary;

  return {
    deeper,
    adjacent: nextFeatureSlot(answerSubject, featureIds, asked),
    path: nextPathSlot(pathIndex, asked),
  };
}
