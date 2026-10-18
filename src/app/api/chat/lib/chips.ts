import { QUESTION_BANK, type BankQuestion, type Stage } from "@/data/question-bank";
import { loadQuestionBankEmbeddings, cosineSimilarity } from "./embeddings";

export const CHIP_SIMILARITY_THRESHOLD = 0.35;

const STAGES: Stage[] = ["builds", "proof", "availability", "contact"];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function isSkipped(question: string, options: { question: string; asked?: string[] }): boolean {
  const candidates = [options.question, ...(options.asked ?? [])];
  return candidates.some((candidate) => normalize(candidate) === normalize(question));
}

function fallbackEntry(stage: Stage, options: { question: string; asked?: string[] }): BankQuestion | undefined {
  return QUESTION_BANK.find(
    (entry) => entry.stage === stage && !isSkipped(entry.question, options)
  );
}

interface ScoredCandidate {
  entry: BankQuestion;
  score: number;
  fallback: boolean;
}

export function selectChips(options: {
  queryVector: number[];
  question: string;
  asked?: string[];
}): string[] {
  const bankVectors = loadQuestionBankEmbeddings();
  const vectorById = new Map(bankVectors.map((entry) => [entry.id, entry.embedding]));

  // Find the stage of the question that was just answered, so we can move the
  // conversation to other stages instead of repeating the same one.
  const currentEntry = QUESTION_BANK.find(
    (entry) => normalize(entry.question) === normalize(options.question)
  );
  const currentStage = currentEntry?.stage;

  const scored: ScoredCandidate[] = [];
  for (const stage of STAGES) {
    const candidates = QUESTION_BANK.filter(
      (entry) => entry.stage === stage && !isSkipped(entry.question, options)
    );
    if (candidates.length === 0) continue;

    let best: BankQuestion | undefined;
    let bestScore = -Infinity;
    for (const candidate of candidates) {
      const embedding = vectorById.get(candidate.id);
      if (!embedding) continue;
      const score = cosineSimilarity(options.queryVector, embedding);
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    let chosen = best;
    let usedFallback = false;
    // A NaN score loses every `>` comparison, so `best` can be set while
    // `bestScore` is not finite. Without this guard the threshold never runs.
    if (!chosen || !Number.isFinite(bestScore) || bestScore < CHIP_SIMILARITY_THRESHOLD) {
      chosen = fallbackEntry(stage, options);
      usedFallback = true;
    }

    if (chosen) {
      scored.push({ entry: chosen, score: usedFallback ? 0 : bestScore, fallback: usedFallback });
    }
  }

  // Drop the stage that was just answered so we return three distinct stages.
  const filtered =
    currentStage !== undefined
      ? scored.filter((candidate) => candidate.entry.stage !== currentStage)
      : scored;

  // Sort by score descending, then stage order, and take three.
  const ordered = [...filtered].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return STAGES.indexOf(a.entry.stage) - STAGES.indexOf(b.entry.stage);
  });

  const chosenEntries: BankQuestion[] = [];
  const seenQuestions = new Set<string>();
  for (const candidate of ordered) {
    if (chosenEntries.length >= 3) break;
    if (seenQuestions.has(candidate.entry.question)) continue;
    chosenEntries.push(candidate.entry);
    seenQuestions.add(candidate.entry.question);
  }

  // Fill any remaining slots from the bank, respecting skips.
  if (chosenEntries.length < 3) {
    for (const entry of QUESTION_BANK) {
      if (chosenEntries.length >= 3) break;
      if (isSkipped(entry.question, options)) continue;
      if (chosenEntries.some((chosen) => chosen.question === entry.question)) continue;
      chosenEntries.push(entry);
    }
  }

  return chosenEntries.slice(0, 3).map((entry) => entry.question);
}