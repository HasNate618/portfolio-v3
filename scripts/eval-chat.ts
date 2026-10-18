import { config } from "dotenv";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { runChatTurn, type ChatTurnResult, type HistoryEntry } from "../src/app/api/chat/lib/pipeline";
import { MAX_CHIP_WORDS } from "../src/app/api/chat/lib/chips-validate";
import { namePattern, subjectAliases } from "../src/app/api/chat/lib/name-match";
import { pointerWhitelist } from "../src/app/api/chat/lib/pointer";
import { isWhitelisted, urlsIn } from "../src/app/api/chat/lib/answer-checks";
import { BANNED_WORD_PATTERNS } from "../src/lib/banned-words";

/**
 * The accept/reject gate for chat v4.
 *
 * It runs the real pipeline in-process, so it costs no rate limit and measures what a
 * visitor gets rather than what a copy of the code does. It is paced, because a trial
 * key rate-limits, and it exits non-zero when a threshold misses, because a gate that
 * only prints a table is a report.
 */

interface EvalItem {
  id: string;
  q: string;
  broad?: boolean;
  followUpOf?: string;
  mustAny?: string[][];
  mustNot: string[];
}

interface EvalFile {
  seeds: Record<string, string>;
  items: EvalItem[];
}

/** Applied to every answer and every chip, on top of each item's own mustNot. */
const GLOBAL_BANNED = [
  ...BANNED_WORD_PATTERNS.map((entry) => entry.re),
  /production-(grade|ready)/i,
  /cutting-edge/i,
  /passionate/i,
];

const HEDGES = /\b(appears to|seems to|likely|probably|suggests|it is possible that|may have)\b/i;
const DASH = /[\u2013\u2014]/;

/** The questions long enough to have a shape: the length rule applies to these. */
const SUBSTANTIVE = new Set([
  "strongest",
  "ai-work",
  "industry",
  "builds",
  "infra",
  "recruiter-fit",
  "campus-rollback",
  "omni-reality",
  "3d-accuracy",
  "aware-models",
]);

/** A refusal cannot be hedged or pointed: the record does not cover the question. */
const EXEMPT = new Set(["gpa", "injection"]);

const PACING_MS = 5000;

/** A broken fixture must fail with its own message, not a raw SyntaxError. */
function loadEvalFile(): EvalFile {
  const path = fileURLToPath(new URL("../tests/eval/chat-eval.json", import.meta.url));
  try {
    return JSON.parse(readFileSync(path, "utf8")) as EvalFile;
  } catch (error) {
    console.error(`Error: could not read the eval fixture at ${path}`);
    console.error(error);
    process.exit(1);
  }
}

const evalFile = loadEvalFile();

const words = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
};

/** The subject named earliest in the text, which is the one the answer leads with. */
function firstNamedSubject(text: string): string | null {
  let best: { id: string; at: number } | null = null;

  for (const { id, alias, exactCase } of subjectAliases()) {
    const match = namePattern(alias, exactCase).exec(text);
    if (!match) continue;
    if (!best || match.index < best.at) best = { id, at: match.index };
  }

  return best?.id ?? null;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

interface Answer {
  id: string;
  text: string;
  result: ChatTurnResult;
}

function checkItem(item: EvalItem, answer: Answer) {
  const misses: string[] = [];
  const mustNotHits: string[] = [];
  const bannedHits: string[] = [];

  for (const group of item.mustAny ?? []) {
    if (!group.some((pattern) => new RegExp(pattern, "i").test(answer.text))) {
      misses.push(group.join(" | "));
    }
  }

  for (const pattern of item.mustNot) {
    if (new RegExp(pattern, "i").test(answer.text)) mustNotHits.push(pattern);
  }

  for (const pattern of GLOBAL_BANNED) {
    if (pattern.test(answer.text)) bannedHits.push(String(pattern));
  }

  // Chips are held to the same bans, and to the shape a chip has to have.
  const chipProblems: string[] = [];
  for (const [index, chip] of answer.result.chips.entries()) {
    if (!/\bNathan\b/i.test(chip)) chipProblems.push(`chip ${index + 1} does not name Nathan: ${chip}`);
    else if (!chip.trim().endsWith("?")) chipProblems.push(`chip ${index + 1} is not a question: ${chip}`);
    else if (words(chip) > MAX_CHIP_WORDS) chipProblems.push(`chip ${index + 1} is too long: ${chip}`);
    for (const pattern of GLOBAL_BANNED) {
      if (pattern.test(chip)) chipProblems.push(`chip ${index + 1} matches ${pattern}: ${chip}`);
    }
  }

  return { misses, mustNotHits, bannedHits, chipProblems };
}

async function main(): Promise<void> {
  // Without this the script cannot see .env, and its own key check then fails with a
  // message that reads like the key is missing.
  config();

  if (process.argv.includes("--schema-only")) {
    console.log(`eval schema ok: ${evalFile.items.length} items, ${Object.keys(evalFile.seeds).length} seeds`);
    return;
  }

  if (!process.env.COHERE_API_KEY) {
    console.error("Error: COHERE_API_KEY not found in environment or .env file");
    process.exit(1);
  }

  const answers: Answer[] = [];
  const seedHistory = new Map<string, HistoryEntry[]>();

  /*
   * A partial run for checking one fix. It is not a gate: thresholds computed over a
   * subset are meaningless, so they are printed and not enforced.
   */
  const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
  const only = onlyArg
    ? new Set(onlyArg.slice("--only=".length).split(",").map((id) => id.trim()))
    : null;
  const items = only ? evalFile.items.filter((item) => only.has(item.id)) : evalFile.items;
  const partial = only !== null;

  if (partial && items.length === 0) {
    console.error(`Error: --only matched no item of: ${evalFile.items.map((item) => item.id).join(", ")}`);
    process.exit(1);
  }

  for (const [index, item] of items.entries()) {
    if (index > 0) await sleep(PACING_MS);

    let history: HistoryEntry[] = [];
    if (item.followUpOf) {
      if (!seedHistory.has(item.followUpOf)) {
        const seedQuestion = evalFile.seeds[item.followUpOf];
        const seed = await runChatTurn(seedQuestion, []);
        seedHistory.set(item.followUpOf, [
          { role: "user", content: seedQuestion },
          { role: "assistant", content: seed.text },
        ]);
      }
      history = seedHistory.get(item.followUpOf) ?? [];
    }

    process.stdout.write(`[${index + 1}/${items.length}] ${item.id} ... `);
    const result = await runChatTurn(item.q, history);
    answers.push({ id: item.id, text: result.text, result });
    console.log(`${words(result.text)} words, ${result.latencyMs} ms`);
  }

  // ---- scoring ----------------------------------------------------------------

  let mustAnyTotal = 0;
  let mustAnyHit = 0;
  const mismatches: string[] = [];
  const mustNotHits: string[] = [];
  const bannedHits: string[] = [];
  const chipProblems: string[] = [];
  const dashHits: string[] = [];
  const hedgeHits: string[] = [];
  const lengths: Array<{ id: string; words: number }> = [];
  const lengthsOutOfRange: string[] = [];
  let pointerOk = 0;
  let pointerTotal = 0;
  const latencies: number[] = [];
  const tokens: number[] = [];
  const firstNamed: string[] = [];
  let chipsModel = 0;
  let chipsRepaired = 0;
  let chipsTemplate = 0;
  const pathSlotMissing: string[] = [];

  for (const answer of answers) {
    const item = evalFile.items.find((entry) => entry.id === answer.id)!;
    const checks = checkItem(item, answer);

    mustAnyTotal += (item.mustAny ?? []).length;
    mustAnyHit += (item.mustAny ?? []).length - checks.misses.length;
    for (const miss of checks.misses) mismatches.push(`${item.id}: ${miss}`);
    for (const hit of checks.mustNotHits) mustNotHits.push(`${item.id}: ${hit}`);
    for (const hit of checks.bannedHits) bannedHits.push(`${item.id}: ${hit}`);
    for (const problem of checks.chipProblems) chipProblems.push(`${item.id}: ${problem}`);

    if (DASH.test(answer.text)) dashHits.push(item.id);
    if (!EXEMPT.has(item.id) && HEDGES.test(answer.text)) hedgeHits.push(item.id);

    if (SUBSTANTIVE.has(item.id)) {
      const count = words(answer.text);
      lengths.push({ id: item.id, words: count });
      if (count < 110 || count > 360) lengthsOutOfRange.push(`${item.id}: ${count}`);
    }

    if (!EXEMPT.has(item.id)) {
      pointerTotal += 1;
      const lastParagraph = answer.text.trim().split(/\n\s*\n/).pop() ?? "";
      const whitelist = pointerWhitelist();
      const found = urlsIn(lastParagraph).filter((url) => isWhitelisted(url, whitelist)).length;
      if (found === 1) pointerOk += 1;
    }

    if (item.broad) {
      const named = firstNamedSubject(answer.text);
      if (named) firstNamed.push(named);
    }

    for (const source of answer.result.chipSources) {
      if (source === "model") chipsModel += 1;
      else if (source === "repaired") chipsRepaired += 1;
      else chipsTemplate += 1;
    }
    if (answer.result.chips.length !== 3) pathSlotMissing.push(`${item.id}: ${answer.result.chips.length} chips`);

    latencies.push(answer.result.latencyMs);
    if (answer.result.usage) tokens.push(answer.result.usage.inputTokens + answer.result.usage.outputTokens);
  }

  const mustAnyRecall = mustAnyTotal === 0 ? 0 : mustAnyHit / mustAnyTotal;
  const chipTotal = chipsModel + chipsRepaired + chipsTemplate;
  const chipAcceptRate = chipTotal === 0 ? 0 : chipsModel / chipTotal;
  const pointerRate = pointerTotal === 0 ? 0 : pointerOk / pointerTotal;
  const spread = new Set(firstNamed).size;
  const substantiveWords = lengths.map((entry) => entry.words);

  const thresholds: Array<{ name: string; value: string; pass: boolean }> = [
    { name: "mustAny recall", value: `${(mustAnyRecall * 100).toFixed(1)}%`, pass: mustAnyRecall >= 0.95 },
    {
      name: "mustNot + banned hits",
      value: String(mustNotHits.length + bannedHits.length),
      pass: mustNotHits.length + bannedHits.length === 0,
    },
    { name: "dashes", value: String(dashHits.length), pass: dashHits.length === 0 },
    { name: "hedges", value: String(hedgeHits.length), pass: hedgeHits.length === 0 },
    {
      name: "length median (substantive)",
      value: String(median(substantiveWords)),
      pass: median(substantiveWords) >= 150 && median(substantiveWords) <= 300,
    },
    {
      name: "length in 110-360",
      value: `${lengthsOutOfRange.length} out`,
      pass: lengthsOutOfRange.length === 0,
    },
    { name: "one pointer URL", value: `${(pointerRate * 100).toFixed(0)}%`, pass: pointerRate >= 0.9 },
    { name: "lead spread (broad)", value: `${spread} distinct`, pass: spread >= 3 },
    {
      name: "chip accept rate",
      value: `${(chipAcceptRate * 100).toFixed(1)}%`,
      pass: chipAcceptRate >= 0.7,
    },
    { name: "chips well formed", value: `${chipProblems.length} bad`, pass: chipProblems.length === 0 },
    { name: "path slot present", value: `${pathSlotMissing.length} missing`, pass: pathSlotMissing.length === 0 },
  ];

  console.log(partial ? "\n--- thresholds (partial run, not gated) ---" : "\n--- thresholds ---");
  for (const threshold of thresholds) {
    console.log(`${threshold.pass ? "PASS" : "FAIL"}  ${threshold.name}: ${threshold.value}`);
  }

  console.log("\n--- logged, not gated ---");
  console.log(`median latency: ${median(latencies)} ms`);
  console.log(`median tokens (in+out): ${median(tokens)}`);
  console.log(`chips model/repaired/template: ${chipsModel}/${chipsRepaired}/${chipsTemplate}`);
  console.log(`citations total: ${answers.reduce((sum, a) => sum + a.result.citations, 0)}`);

  for (const [label, list] of [
    ["mustAny misses", mismatches],
    ["mustNot hits", mustNotHits],
    ["banned hits", bannedHits],
    ["hedges", hedgeHits],
    ["dashes", dashHits],
    ["length out of range", lengthsOutOfRange],
    ["chip problems", chipProblems],
    ["path slot missing", pathSlotMissing],
  ] as Array<[string, string[]]>) {
    if (list.length > 0) console.log(`\n${label}:\n  ${list.join("\n  ")}`);
  }

  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  mkdirSync("eval-out", { recursive: true });
  const outFile = `eval-out/${stamp}.json`;
  writeFileSync(
    outFile,
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        thresholds,
        lengths,
        firstNamed,
        answers: answers.map((answer) => ({
          id: answer.id,
          text: answer.text,
          chips: answer.result.chips,
          chipSources: answer.result.chipSources,
          citations: answer.result.citations,
          usage: answer.result.usage,
          latencyMs: answer.result.latencyMs,
        })),
      },
      null,
      2,
    ),
  );
  console.log(`\nwrote ${outFile}`);

  if (partial) {
    console.log("\npartial run: thresholds not gated");
    return;
  }

  if (thresholds.some((threshold) => !threshold.pass)) {
    console.error("\neval:chat FAILED");
    process.exit(1);
  }
  console.log("\neval:chat PASSED");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
