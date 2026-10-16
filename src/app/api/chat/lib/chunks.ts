import { getCorpusDocs } from "@/lib/corpus";

const CHUNK_SIZE = 800;

interface Chunk {
  text: string;
  source: string;
  length: number;
}

function splitIntoChunks(text: string, source: string): Chunk[] {
  const chunks: Chunk[] = [];
  const sentences = text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  let currentChunk = "";
  let currentLength = 0;

  for (const sentence of sentences) {
    if (currentLength + sentence.length > CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        source,
        length: currentChunk.length,
      });
      const overlapSentences = currentChunk.split("\n").slice(-2).join("\n");
      currentChunk = overlapSentences + "\n" + sentence;
      currentLength = currentChunk.length;
    } else {
      currentChunk += (currentChunk ? "\n" : "") + sentence;
      currentLength += sentence.length;
    }
  }

  if (currentChunk.trim().length > 50) {
    chunks.push({
      text: currentChunk.trim(),
      source,
      length: currentChunk.length,
    });
  }

  return chunks;
}

/**
 * Indexes the corpus projection rather than walking the filesystem, so the chat
 * sees exactly what /knowledgebase/*.md serves: frontmatter stripped, stat
 * placeholders resolved, and the facts components render already inlined.
 */
export function loadKnowledgebase(): Chunk[] {
  return getCorpusDocs().flatMap((doc) => splitIntoChunks(doc.text, doc.path));
}
