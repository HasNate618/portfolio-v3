import { awardFor, getProject, site } from "@/data/site";
import { CHAT_MODEL, CHAT_THINKING_DISABLED, getCohereClient } from "./cohere";
import {
  TEAM_NO_ROLE_IDS,
  chipSubjectIds,
  namedSubjects,
  repairChip,
  templateChips,
  validateChip,
  type ChipFailure,
  type ChipSet,
  type ChipSlot,
  type ChipSlotName,
} from "./chips-validate";

/**
 * The feature list a chip may point at when nothing has routed the question yet.
 * Stage 3 replaces this at the call sites with the topic router's own list.
 */
export const CHIP_FEATURE_DEFAULT = ["terago", "3d-western", "homelab", "aware", "campus", "carebridge"];

export interface GenerateChipsInput {
  userMessage: string;
  answer: string;
  docs: { title: string; firstLine: string }[];
  featureIds: string[];
  asked: string[];
  userAskedAbandoned: boolean;
  pathIndex?: number;
}

export interface ChipInputs {
  answerSubject: string;
  featureIds: string[];
  asked: string[];
  userAskedAbandoned: boolean;
  pathIndex: number;
}

export interface ChipEvaluation {
  /** Three questions: what passed validation, and templates for what did not. */
  questions: string[];
  /** Why a slot was replaced, for the one regenerate. */
  failures: ChipFailure[];
}

/**
 * Three fixed keys, not an array: Cohere rejects `minItems` on arrays
 * (`400 ... non-supported constraint for type: 'array'. constraint: 'minItems'`),
 * and fixed keys also force the three jobs.
 */
const SLOT_SCHEMA = {
  type: "object",
  required: ["question", "subject"],
  properties: {
    question: { type: "string" },
    subject: { type: "string", enum: chipSubjectIds() },
  },
};

export const CHIP_SCHEMA: Record<string, unknown> = {
  type: "object",
  required: ["deeper", "adjacent", "path"],
  properties: { deeper: SLOT_SCHEMA, adjacent: SLOT_SCHEMA, path: SLOT_SCHEMA },
};

/** One line of the card's project and role list, with the flags a premise needs. */
function cardLine(id: string): string | undefined {
  const role = site.experience.find((entry) => entry.id === id);
  if (role) return `- ${id}: ${role.org} (role: ${role.role})`;

  const project = getProject(id);
  if (!project) return undefined;

  const kind = project.displayRole === "solo" ? "solo" : "team";
  const roleNote = (TEAM_NO_ROLE_IDS as readonly string[]).includes(id) ? ", his part is not on record" : "";
  const award = awardFor(project.name) ? "has an award" : "no award";
  return `- ${id}: ${project.name} (${kind}${roleNote}, ${award})`;
}

/**
 * The subject the answer was about, for the adjacency rule and the templates:
 * the first document that names a project or a role, else the topic's first
 * feature, else Nathan.
 */
export function answerSubjectFor(input: Pick<GenerateChipsInput, "docs" | "featureIds">): string {
  for (const doc of input.docs) {
    const id = namedSubjects(doc.title)[0];
    if (id) return id;
  }
  return input.featureIds[0] ?? "nathan";
}

/**
 * Exported so the wording can be tested without a model call. The flags in the
 * card list are what let the model ask about an award or a solo build at all:
 * the validator rejects a premise the card cannot answer.
 */
export function buildChipPrompt(input: GenerateChipsInput, failures: ChipFailure[] = []): string {
  const { userMessage, answer, docs, featureIds, asked } = input;

  const cards = chipSubjectIds()
    .filter((id) => id !== "nathan")
    .map(cardLine)
    .filter((line): line is string => typeof line === "string")
    .join("\n");

  const docLines = docs.slice(0, 6).map((doc) => `- ${doc.title}: ${doc.firstLine}`).join("\n") || "- (none)";
  const askedLines = asked.slice(-6).map((question) => `- ${question}`).join("\n") || "- (none)";
  const failureLines =
    failures.length > 0
      ? `\nThe previous attempt was rejected for these reasons. Fix them and return the JSON again:\n${failures
          .map((failure) => `- ${failure.slot ?? "chip"}: ${failure.code}`)
          .join("\n")}\n`
      : "";

  return `Write the three follow-up questions for a chat about Nathan Espejo's portfolio. Return JSON only.

Visitor asked: ${userMessage}

Nathan's answer:
${answer}
${failureLines}
Documents used:
${docLines}

What the card can answer (id: name (flags)):
${cards}

Questions already asked in this thread:
${askedLines}

Return this JSON shape:
{"deeper": {"question": "...", "subject": "..."}, "adjacent": {"question": "...", "subject": "..."}, "path": {"question": "...", "subject": "..."}}

Rules:
- Every question says "Nathan" and never "he", "his" or "him".
- Under 12 words, one subject each, and each ends with "?".
- deeper: a detail the answer raised but did not explain. Its subject is the answer's main subject, ${answerSubjectFor(input)}.
- adjacent: a different project or role, from ${featureIds.join(", ") || "the card"}, that relates to what the visitor asked. Its subject must differ from the deeper subject.
- path: the next hiring step, rotating through availability, graduation, the résumé and contact.
- Only ask what the answer, the documents or the card can answer. No award, leadership or team-role question unless the card records one.
- Do not ask how an abandoned project works, and only name what the answer, the documents or the card name.
- Do not repeat a question already asked in this thread.`;
}

function readSlot(value: unknown): ChipSlot | null {
  if (!value || typeof value !== "object") return null;
  const { question, subject } = value as { question?: unknown; subject?: unknown };
  if (typeof question !== "string" || typeof subject !== "string") return null;
  return { question: question.trim(), subject: subject.trim() };
}

function parseChipSet(text: string): ChipSet | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const deeper = readSlot(parsed.deeper);
    const adjacent = readSlot(parsed.adjacent);
    const path = readSlot(parsed.path);
    if (!deeper || !adjacent || !path) return null;
    return { deeper, adjacent, path };
  } catch {
    return null;
  }
}

/**
 * Repair, then validate, then template: the order matters, because the repair is
 * what saves the shapes the model actually writes, and the template is only for
 * what is still wrong afterwards.
 */
export function applyChipPipeline(raw: ChipSet, input: ChipInputs): ChipEvaluation {
  const fallback = templateChips(input);
  const slots: ChipSlotName[] = ["deeper", "adjacent", "path"];
  const accepted = new Map<ChipSlotName, string>();
  const failures: ChipFailure[] = [];

  for (const slot of slots) {
    const chip = raw[slot];
    const question = repairChip(chip.question);
    const slotFailures = validateChip({
      question,
      subject: chip.subject,
      slot,
      answerSubject: input.answerSubject,
      asked: input.asked,
      userAskedAbandoned: input.userAskedAbandoned,
    }).map((failure) => ({ ...failure, slot }));

    // The spec asks for both: adjacent differs from the answer's subject and
    // from the subject the deeper chip chose.
    if (slot === "adjacent" && chip.subject === raw.deeper.subject) {
      slotFailures.push({ code: "adjacent", slot });
    }

    if (slotFailures.length === 0) accepted.set(slot, question);
    else failures.push(...slotFailures);
  }

  return {
    questions: slots.map((slot) => accepted.get(slot) ?? fallback[slot].question),
    failures,
  };
}

function questionsOf(set: ChipSet): string[] {
  return [set.deeper.question, set.adjacent.question, set.path.question];
}

async function requestChipSet(prompt: string): Promise<ChipSet | null> {
  const cohere = getCohereClient();
  const response = await cohere.v2.chat({
    model: CHAT_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    maxTokens: 300,
    thinking: CHAT_THINKING_DISABLED,
    responseFormat: { type: "json_object", jsonSchema: CHIP_SCHEMA },
  });

  const text = response.message.content?.find((entry) => entry.type === "text")?.text ?? "";
  return parseChipSet(text);
}

/**
 * Write the three follow-up questions with the chat model, once, then once more
 * with the failures attached. Anything still rejected becomes a template, so
 * the page always shows three questions that can be answered.
 */
export async function generateChips(input: GenerateChipsInput): Promise<string[]> {
  const pipelineInput: ChipInputs = {
    answerSubject: answerSubjectFor(input),
    featureIds: input.featureIds,
    asked: input.asked,
    userAskedAbandoned: input.userAskedAbandoned,
    pathIndex: input.pathIndex ?? input.asked.length,
  };

  try {
    const first = await requestChipSet(buildChipPrompt(input));
    if (first) {
      const evaluation = applyChipPipeline(first, pipelineInput);
      if (evaluation.failures.length === 0) return evaluation.questions;

      const second = await requestChipSet(buildChipPrompt(input, evaluation.failures));
      if (second) return applyChipPipeline(second, pipelineInput).questions;
      return evaluation.questions;
    }
  } catch (error) {
    console.warn("[chips] generation failed, using templates:", error);
  }

  return questionsOf(templateChips(pipelineInput));
}

/**
 * The questions as the client parses them: `|||`-separated, trailing separator
 * included. Sent separately from the delimiter that precedes them, because the
 * delimiter goes out as soon as the answer is written while the questions may
 * still be a second away.
 */
export function formatFollowupsTail(followups: string[]): string {
  return `${followups.join("|||")}|||`;
}
