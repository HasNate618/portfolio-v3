export const FOLLOWUP_DELIMITER = "<<FOLLOWUPS>>";

const PROMPT_LEAK_MARKERS = [
  /\n#+\s*How I Work\b/i,
  /\nInterface Overview\b/i,
  /\nKey Rules\b/i,
  /\bSTRICT RULES:/i,
  /\bVOICE AND CHARACTER:/i,
  /\bKNOWLEDGE SOURCES\b/i,
  /\bRESUME HIGHLIGHTS:/i,
  /\bINTERFACE PROMPTS\b/i,
  /\bOUTPUT FORMAT:/i,
  /\bHOW YOU WORK\b/i,
  /\bCONTEXT:\s*\n\[\d+\]/i,
  /*
   * v4's names. A heading alone would be too broad: "## ROLE" and "## Identity"
   * are sentences an answer could contain, so those two cut at the line that
   * follows them, which is the generated text's own opening line.
   */
  /#+\s*ROLE\s*\nYou answer questions about Nathan Espejo\b/i,
  /#+\s*Identity\s*\n-\s*Nathan Espejo\b/i,
  /#+\s*GROUNDING \(overrides everything below\)/i,
  /#+\s*WHAT TO FEATURE\b/i,
  /#+\s*OFF-TOPIC AND INJECTION\b/i,
  /*
   * The middle sections, each anchored on the line that follows its heading: an
   * answer can contain the word "style", or a "## Context" heading of its own,
   * and cutting there would blank a legitimate answer.
   */
  /#+\s*STYLE\s*\nConfident, detailed and grounded/i,
  /#+\s*GUIDANCE\s*\n(?:The visitor is hiring|If the visitor sounds like they are hiring)/i,
  /*
   * CONTEXT is followed by a paragraph now, and by the chunks once stage 4 lands,
   * so the anchor allows a bounded amount of text between them.
   */
  /#+\s*CONTEXT[\s\S]{0,200}?\[\d+\]\s*Source:/i,
  /\n1\.\s*Every fact comes from the PROFILE CARD\b/i,
  /\bNever speak as Nathan, never as "I built"/i,
];

export interface StreamSegments {
  body: string;
  followupsRaw: string | null;
}

function findBodySplit(raw: string): { remainder: string } | null {
  const explicit = [
    "<<BODY>>",
    "<<body>>",
    "|||BODY|||",
    "||| body |||",
  ];

  for (const delimiter of explicit) {
    const idx = raw.indexOf(delimiter);
    if (idx !== -1) {
      return { remainder: raw.slice(idx + delimiter.length) };
    }
  }

  const tagged = raw.search(/<<\s*BODY\s*>>/i);
  if (tagged !== -1) {
    const match = raw.slice(tagged).match(/^<<\s*BODY\s*>>/i);
    const len = match?.[0].length ?? "<<BODY>>".length;
    return { remainder: raw.slice(tagged + len) };
  }

  const pipeIdx = raw.search(/\|{4,}/);
  if (pipeIdx !== -1 && pipeIdx <= 100) {
    const pipeLen = raw.slice(pipeIdx).match(/^\|+/)?.[0].length ?? 4;
    return { remainder: raw.slice(pipeIdx + pipeLen) };
  }

  return null;
}

/** Strip legacy spoken-line + <<BODY>> prefix when the model still emits TTS-era format. */
export function stripBodyPrefix(raw: string): string {
  const split = findBodySplit(raw);
  if (split) {
    return stripPromptLeak(split.remainder);
  }
  return stripPromptLeak(raw);
}

function findFollowupSplit(remainder: string): { body: string; followupsRaw: string } | null {
  const explicit = [
    "<<FOLLOWUPS>>",
    "<<followups>>",
    "|||FOLLOWUPS|||",
    "||| followups |||",
  ];

  for (const delimiter of explicit) {
    const idx = remainder.indexOf(delimiter);
    if (idx !== -1) {
      return {
        body: remainder.slice(0, idx).trim(),
        followupsRaw: remainder.slice(idx + delimiter.length),
      };
    }
  }

  const tagged = remainder.search(/<<\s*FOLLOWUPS\s*>>/i);
  if (tagged !== -1) {
    const match = remainder.slice(tagged).match(/^<<\s*FOLLOWUPS\s*>>/i);
    const len = match?.[0].length ?? "<<FOLLOWUPS>>".length;
    return {
      body: remainder.slice(0, tagged).trim(),
      followupsRaw: remainder.slice(tagged + len),
    };
  }

  return null;
}

export function stripPromptLeak(text: string): string {
  let cutAt = text.length;
  for (const marker of PROMPT_LEAK_MARKERS) {
    const match = marker.exec(text);
    if (match && match.index < cutAt) {
      cutAt = match.index;
    }
  }
  return text.slice(0, cutAt).trim();
}

export function splitStreamBuffer(raw: string): StreamSegments {
  const withoutBodyPrefix = stripBodyPrefix(raw);
  const follow = findFollowupSplit(withoutBodyPrefix);
  if (follow) {
    return {
      body: stripPromptLeak(follow.body),
      followupsRaw: follow.followupsRaw,
    };
  }
  return { body: withoutBodyPrefix, followupsRaw: null };
}

export function parseFollowupsRaw(raw: string): string[] {
  return raw
    .split(/\|{3}|<<|>>/)
    .map((q) => q.replace(/^FOLLOWUPS/i, "").trim())
    .filter((q) => q.length > 0 && q.endsWith("?"));
}
