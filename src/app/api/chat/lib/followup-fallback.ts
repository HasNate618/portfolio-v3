interface FollowupRule {
  test: RegExp;
  questions: string[];
}

const TOPIC_RULES: FollowupRule[] = [
  {
    test: /\bcampus|retrieval|brightspace|course\b/i,
    questions: [
      "How does Campus rank search results?",
      "How is Campus tested?",
      "What does the Campus agent log?",
    ],
  },
  {
    test: /\bterago|internship|3d western|experience|role\b/i,
    questions: [
      "What is Channel Finder?",
      "What did he lead at 3D Western?",
      "What internship is he looking for?",
    ],
  },
  {
    test: /\baware|edge|arduino|on-device\b/i,
    questions: [
      "How does AWARE turn English into rules?",
      "Which models run on AWARE's board?",
      "How does Nathan keep model costs low?",
    ],
  },
  {
    test: /\bcontact|hire|email|resume|résumé\b/i,
    questions: [
      "How can I contact Nathan?",
      "Where is his résumé?",
      "What internship is he looking for?",
    ],
  },
  {
    test: /\bagenticarmy|agentic army|multi-agent\b/i,
    questions: [
      "How does AgenticArmy coordinate agents?",
      "What tech stack powers AgenticArmy?",
      "What problem does AgenticArmy solve?",
    ],
  },
  {
    test: /\brust\b/i,
    questions: [
      "Which projects use Rust?",
      "How is his homelab defined in Nix?",
      "How does Rust fit his stack?",
    ],
  },
  {
    test: /\blanguage|programming|typescript|python|kotlin\b/i,
    questions: [
      "Which languages does Nathan use most?",
      "What backend languages has he used?",
      "What mobile languages has he used?",
    ],
  },
  {
    test: /\bweb\b|frontend|react|next\.?js\b/i,
    questions: [
      "What has he built with React and FastAPI?",
      "What frontend stack does he use?",
      "What full-stack projects has he built?",
    ],
  },
  {
    test: /\bai\b|llm|rag|machine learning|agent\b/i,
    questions: [
      "How does Campus retrieve answers?",
      "What did he build at TeraGo?",
      "How does AWARE run models on-device?",
    ],
  },
  {
    test: /\bhomelab|infra|docker|nixos|linux\b/i,
    questions: [
      "How do his Hermes Agent profiles change config safely?",
      "What services run on his homelab?",
      "How does he secure remote access?",
      "What AI tools does his homelab host?",
    ],
  },
  {
    test: /\bmobile|android|kotlin\b/i,
    questions: [
      "What Android apps has he built?",
      "What is Animarker?",
      "What is SafeRoute?",
    ],
  },
  {
    test: /\bhackathon|award|win\b/i,
    questions: [
      "Which hackathons has he won?",
      "What did he build at Hack the 6ix?",
      "What awards has he received?",
    ],
  },
  {
    test: /\bhow (do|does) you work\b|rag\b|pipeline\b/i,
    questions: [
      "What AI projects has Nathan built?",
      "What is in his knowledge base?",
      "What is his strongest technical area?",
    ],
  },
];

const DEFAULT_FOLLOWUPS = [
  "What is Campus?",
  "What did he build at TeraGo?",
  "How can I contact Nathan?",
];

const AI_DIRECTED = /\b(you|your|chatbot|assistant)\b/i;

const FOLLOWUP_REWRITES: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bWhat (programming )?languages do you know\??/i, replacement: "What languages does Nathan know?" },
  { pattern: /\bWhat (tech|technologies) do you use\??/i, replacement: "What tech stack does Nathan use?" },
  { pattern: /\bWhat (projects|work) have you (done|built)\??/i, replacement: "What projects has Nathan built?" },
  { pattern: /\bWhat skills do you have\??/i, replacement: "What skills does Nathan have?" },
  { pattern: /\bWhat is your (background|experience)\??/i, replacement: "What is Nathan's background?" },
  { pattern: /\bHow do you work\??/i, replacement: "How does this portfolio chat work?" },
];

function rewriteFollowupQuestion(question: string): string {
  const q = question.trim();
  for (const { pattern, replacement } of FOLLOWUP_REWRITES) {
    if (pattern.test(q)) {
      return replacement;
    }
  }
  return q;
}

function isValidFollowup(question: string): boolean {
  const q = question.trim();
  if (!q.endsWith("?") || q.length >= 120) return false;
  if (AI_DIRECTED.test(q)) return false;
  return true;
}

function uniqueQuestions(questions: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const question of questions) {
    const trimmed = rewriteFollowupQuestion(question);
    if (!isValidFollowup(trimmed) || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

/** Deterministic follow-ups when model generation fails. */
export function buildFallbackFollowups(userMessage: string, aiResponse: string): string[] {
  const context = `${userMessage}\n${aiResponse}`;
  const picked: string[] = [];

  for (const rule of TOPIC_RULES) {
    if (!rule.test.test(context)) continue;
    for (const q of rule.questions) {
      picked.push(q);
      if (picked.length >= 3) return uniqueQuestions(picked).slice(0, 3);
    }
  }

  for (const q of DEFAULT_FOLLOWUPS) {
    picked.push(q);
    if (picked.length >= 3) break;
  }

  return uniqueQuestions(picked).slice(0, 3);
}

export function normalizeFollowups(
  candidates: string[],
  userMessage: string,
  aiResponse: string,
): string[] {
  const valid = uniqueQuestions(candidates);

  if (valid.length >= 3) return valid.slice(0, 3);

  const fallback = buildFallbackFollowups(userMessage, aiResponse);
  return uniqueQuestions([...valid, ...fallback]).slice(0, 3);
}
