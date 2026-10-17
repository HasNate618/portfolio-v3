import fs from "node:fs";
import path from "node:path";
import { getCorpusDocs } from "@/lib/corpus";
import { readDocMeta, stripFrontmatter, type DocMeta } from "@/lib/content";

const CHUNK_LIMIT = 1200;
const OVERLAP = 150;
const CONTENT_ROOT = path.join(process.cwd(), "content");

export interface Chunk {
  text: string;
  source: string;
  section: string;
  length: number;
}

/**
 * In a figure fence, the image path is for the page. The chat gets the caption
 * and the alt text, which is what the figure says.
 */
function keepFigureText(text: string): string {
  return text.replace(/```figure\n([\s\S]*?)```/g, (_match, body: string) => {
    const caption = /^caption:\s*(.+)$/m.exec(body)?.[1].trim() ?? "";
    const alt = /^alt:\s*(.+)$/m.exec(body)?.[1].trim() ?? "";
    return [caption, alt].filter(Boolean).join(" ");
  });
}

/** In a diagram fence, the picture is for the page. The chat only needs the alt. */
function keepDiagramAlts(text: string): string {
  return keepFigureText(text).replace(/```diagram\n([\s\S]*?)```/g, (_match, body: string) => {
    const alt = /^alt:\s*(.+)$/m.exec(body);
    return alt ? alt[1].trim() : "";
  });
}

function isList(block: string): boolean {
  return /^\s*(?:[-*+]|\d+\.)\s/m.test(block);
}

function isTable(block: string): boolean {
  return /^\s*\|/m.test(block);
}

function splitLongText(text: string, limit: number): string[] {
  const pieces: string[] = [];
  let rest = text.trim();
  while (rest.length > limit) {
    const candidate = rest.slice(0, limit + 1);
    const cut = Math.max(candidate.lastIndexOf(" "), candidate.lastIndexOf("\n"));
    const end = cut > 0 ? cut : limit;
    pieces.push(rest.slice(0, end).trim());
    rest = rest.slice(end).trim();
  }
  if (rest) pieces.push(rest);
  return pieces;
}

function listItems(block: string): string[] {
  const items: string[] = [];
  for (const line of block.split("\n")) {
    if (/^\s*(?:[-*+]|\d+\.)\s/.test(line)) {
      items.push(line.trim());
    } else if (items.length > 0) {
      items[items.length - 1] += `\n${line}`;
    }
  }
  return items;
}

/** Split between rows, repeat the header, and never cut a row in half. */
function tableParts(table: string, limit: number): string[] {
  const rows = table.split("\n").map((line) => line.trim()).filter(Boolean);
  if (rows.length <= 2 || rows.join("\n").length <= limit) return [rows.join("\n")];

  const header = rows.slice(0, 2);
  const parts: string[] = [];
  let current = [...header];

  for (const row of rows.slice(2)) {
    const candidate = [...current, row].join("\n");
    if (candidate.length > limit && current.length > header.length) {
      parts.push(current.join("\n"));
      current = [...header, row];
    } else {
      current.push(row);
    }

    if (current.join("\n").length > limit) {
      throw new Error("a table row is too long to fit in a chunk");
    }
  }

  if (current.length > header.length) parts.push(current.join("\n"));
  return parts;
}

/** Atomic paragraphs, list items and valid table parts. No item or row is cut in half. */
function atomicBlocks(section: string, limit: number): string[] {
  const paras = section.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const blocks: string[] = [];

  for (const para of paras) {
    if (isList(para)) {
      for (const item of listItems(para)) {
        if (item.length > limit) throw new Error("a list item is too long to fit in a chunk");
        blocks.push(item);
      }
    } else if (isTable(para)) {
      blocks.push(...tableParts(para, limit));
    } else {
      blocks.push(...(para.length > limit ? splitLongText(para, limit) : [para]));
    }
  }

  return blocks;
}

function joinedLength(blocks: string[]): number {
  return blocks.join("\n\n").length;
}

/** Pieces within the body limit, overlapping by about 150, never mid-item or mid-row. */
function packSection(section: string, limit: number): string[] {
  if (section.length <= limit) return [section];

  const blocks = atomicBlocks(section, limit);
  if (blocks.length <= 1) return blocks;

  const pieces: string[][] = [];
  let current: string[] = [];

  for (const block of blocks) {
    const nextLength = joinedLength(current) + (current.length ? 2 : 0) + block.length;
    if (current.length > 0 && nextLength > limit) {
      pieces.push(current);
      const overlap: string[] = [];
      let covered = 0;
      for (let i = current.length - 1; i >= 0; i -= 1) {
        const blockLength = current[i].length + (covered > 0 ? 2 : 0);
        if (covered >= OVERLAP) break;
        if (covered > 0 && covered + blockLength > OVERLAP + 40) break;
        if (covered + blockLength + 2 + block.length > limit) break;
        overlap.unshift(current[i]);
        covered += blockLength;
      }
      current = [...overlap, block];
    } else {
      current.push(block);
    }
  }

  if (current.length > 0) pieces.push(current);
  return pieces.map((piece) => piece.join("\n\n"));
}

function metaLine(meta: DocMeta): string {
  const parts = [meta.type, meta.dates, meta.role ? `role: ${meta.role}` : "", meta.status ? `status: ${meta.status}` : ""].filter(
    (part): part is string => Boolean(part)
  );
  return parts.length > 0 ? `(${parts.join(", ")})` : "";
}

function chunkText(title: string, section: string, meta: DocMeta, body: string): string {
  const header = [`${title} > ${section}`, metaLine(meta)].filter(Boolean).join("\n");
  return body ? `${header}\n\n${body}` : header;
}

/**
 * One chunk per section, headed by the document title so a short section still
 * says which project it belongs to. Frontmatter is data for that header, not
 * text to retrieve.
 */
export function splitIntoChunks(text: string, source: string, meta: DocMeta): Chunk[] {
  const prepared = keepDiagramAlts(stripFrontmatter(text)).trim();
  if (!prepared) return [];

  const title = meta.title || source;
  const parts = prepared.split(/^(?=## )/m);
  const chunks: Chunk[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const heading = /^(#{1,2})\s+([^\n]+)\n?/.exec(trimmed);
    const section = heading ? heading[2].trim() : title;
    const body = heading ? trimmed.slice(heading[0].length).trim() : trimmed;
    const header = chunkText(title, section, meta, "");
    const bodyLimit = CHUNK_LIMIT - header.length - 2;
    const pieces = body ? packSection(body, bodyLimit) : [""];

    for (const piece of pieces) {
      const value = chunkText(title, section, meta, piece);
      chunks.push({ text: value, source, section, length: value.length });
    }
  }

  return chunks;
}

/**
 * Indexes the corpus projection rather than walking the filesystem for the
 * words, so the chat sees exactly what /knowledgebase/*.md serves. The file is
 * read only for the frontmatter header.
 */
export function loadKnowledgebase(): Chunk[] {
  return getCorpusDocs().flatMap((doc) => {
    const raw = fs.readFileSync(path.join(CONTENT_ROOT, doc.path), "utf-8");
    return splitIntoChunks(doc.text, doc.path, readDocMeta(raw));
  });
}
