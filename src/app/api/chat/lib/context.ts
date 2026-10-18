import { getExperienceById, getProject } from "@/data/site";
import { factsBlockFor } from "@/lib/corpus";
import { namedSubjectId } from "./name-match";

/**
 * Topic pins.
 *
 * The coverage floor used to append the home page's leading project, its featured
 * projects and its on-resume roles whenever the reranked chunks held no project or
 * role at all. That fired on the wrong questions: it pinned Campus for a question
 * about AI work, because Campus is what the home page leads with, and it stood
 * aside only when the question happened to name something.
 *
 * The topic router already knows what the question is about, so its feature ids
 * become the pin list. An AI question pins the AI work. A question that names a
 * project or a role pins nothing, because retrieval chose that context on purpose
 * and a pin would push the named subject out of its own answer.
 */

export interface PromptChunk {
  text: string;
  source: string;
}

/** The profile card already carries every project and role; the pins add detail. */
const MAX_PINS = 5;

function relative(file: string | undefined): string | null {
  const prefix = "/knowledgebase/";
  return file?.startsWith(prefix) ? file.slice(prefix.length) : null;
}

/** The detail doc a topic id points at, or null when that id has no page. */
function fileForId(id: string): string | null {
  const project = getProject(id);
  if (project) return relative(project.file);

  const role = getExperienceById(id);
  return relative(role?.file);
}

export function topicPins(featureIds: string[]): PromptChunk[] {
  const chunks: PromptChunk[] = [];
  const seen = new Set<string>();

  for (const id of featureIds) {
    if (chunks.length >= MAX_PINS) break;

    const source = fileForId(id);
    if (!source || seen.has(source)) continue;

    // A topic id can name something the corpus does not hold, and an empty chunk
    // would reach the model as a document with no content.
    const text = factsBlockFor(source);
    if (!text) continue;

    seen.add(source);
    chunks.push({ source, text });
  }

  return chunks;
}

export function withTopicPins(
  chunks: PromptChunk[],
  question: string,
  featureIds: string[],
): PromptChunk[] {
  // A question that names a project or a role is specific: retrieval's context wins.
  if (namedSubjectId(question)) return chunks;

  const present = new Set(chunks.map((chunk) => chunk.source));
  return [...chunks, ...topicPins(featureIds).filter((pin) => !present.has(pin.source))];
}
