import { awardFor, getProject, site } from "@/data/site";
import { BANNED_WORD_PATTERNS } from "@/lib/banned-words";

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
}

const MAX_CHIP_WORDS = 14;

const ABANDONED_IDS = new Set(
  site.projects.filter((project) => project.displayStatus === "abandoned").map((project) => project.id),
);

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
 * "3D Western" is about `3d-western`, and a question that says "aware" is about
 * `aware` even when it means the English word. That last direction is the safe
 * one: a rejected chip becomes a template, a wrong chip reaches the page.
 */
function normalizeWords(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A word boundary only makes sense on an edge that is a word character.
 * "Microcomputer Consulting Inc." ends in a period, so a trailing \b would make
 * the whole alias unmatchable and the question look like it named nothing.
 */
function namePattern(alias: string): RegExp {
  const left = /^[A-Za-z0-9]/.test(alias) ? "\\b" : "";
  const right = /[A-Za-z0-9]$/.test(alias) ? "\\b" : "";
  return new RegExp(`${left}${escapeRegExp(alias)}${right}`, "i");
}

/** Every name a chip could use for a project or a role, with its subject id. */
function subjectAliases(): Array<{ id: string; alias: string }> {
  const aliases: Array<{ id: string; alias: string }> = [];
  for (const project of site.projects) {
    aliases.push({ id: project.id, alias: project.name });
    aliases.push({ id: project.id, alias: project.id.replace(/-/g, " ") });
  }
  for (const role of site.experience) {
    aliases.push({ id: role.id, alias: role.org });
    aliases.push({ id: role.id, alias: role.id.replace(/-/g, " ") });
  }
  return aliases.filter((entry) => entry.alias.trim().length > 0);
}

/** The subjects a question names, by project or organisation name. */
export function namedSubjects(question: string): string[] {
  const found = new Set<string>();
  for (const { id, alias } of subjectAliases()) {
    if (namePattern(alias).test(question)) found.add(id);
  }
  return [...found];
}

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

  if (!/\bNathan\b/.test(question)) fail("nathan");
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
