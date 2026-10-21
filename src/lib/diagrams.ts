/**
 * Flow diagrams, drawn in HTML and CSS instead of box-drawing characters.
 *
 * Drop-in for src/lib/diagrams.ts. A `diagram <name>` fence in a content file
 * renders the entry below with that name (see markdown.ts). The fence keeps its
 * required `alt:` line, which stays the sr-only figcaption, so the knowledge base
 * and the chat still read one plain sentence instead of the art.
 *
 * Every diagram has two placements on one CSS grid: `wide` (the content column
 * is at least 34rem) and `narrow` (phones). Placement is a grid-area string,
 * "row-start / col-start / row-end / col-end". Arrows name their direction in
 * each layout. Styling lives in flow.css and uses only the site's palette
 * tokens, so both schemes and the theme toggle work with no extra code.
 */

type Dir = "right" | "left" | "down";
type Kind = "input" | "step" | "core" | "output";

type FlowNode = {
  type: "node";
  label: string;
  /** A short second line, like "always on" or "20 tools". */
  sub?: string;
  /** Rendered as small chips inside the box, for a group of outputs. */
  chips?: string[];
  kind?: Kind;
  /** Monospace, for identifiers like job statuses. */
  mono?: boolean;
  wide: string;
  narrow: string;
};

type FlowArrow = { type: "arrow"; wide: string; narrow: string; dirWide: Dir; dirNarrow: Dir };

type FlowItem = FlowNode | FlowArrow;

export type FlowDiagram = {
  /** grid-template-columns in each layout. */
  colsWide: string;
  colsNarrow: string;
  items: FlowItem[];
};

const A = "1.75rem"; // arrow column
const N = "minmax(0, 1fr)"; // node column

const node = (label: string, wide: string, narrow: string, extra: Partial<FlowNode> = {}): FlowNode => ({
  type: "node", label, wide, narrow, ...extra,
});
const arrow = (wide: string, dirWide: Dir, narrow: string, dirNarrow: Dir = "down"): FlowArrow => ({
  type: "arrow", wide, narrow, dirWide, dirNarrow,
});

/** A straight left-to-right chain that stacks top to bottom on a phone. */
function chain(nodes: Omit<FlowNode, "type" | "wide" | "narrow">[]): FlowDiagram {
  const items: FlowItem[] = [];
  nodes.forEach((n, i) => {
    const col = i * 2 + 1;
    const row = i * 2 + 1;
    items.push({ type: "node", ...n, wide: `1 / ${col} / 2 / ${col + 1}`, narrow: `${row} / 1 / ${row + 1} / 2` });
    if (i < nodes.length - 1) items.push(arrow(`1 / ${col + 1} / 2 / ${col + 2}`, "right", `${row + 1} / 1 / ${row + 2} / 2`));
  });
  return {
    colsWide: nodes.map(() => N).join(` ${A} `),
    colsNarrow: N,
    items,
  };
}

export const DIAGRAMS: Record<string, FlowDiagram> = {
  /*
   * AWARE. Two lanes meet at the rules engine: perception is always on, and a
   * plain-English command becomes a rule through the LLM. The engine is the
   * only box both lanes point into, and it drives the outputs.
   */
  aware: {
    colsWide: ["minmax(0, 1.3fr)", A, "minmax(0, 0.8fr)", A, "minmax(0, 0.8fr)", A, "minmax(0, 1fr)", A, "minmax(0, 0.9fr)"].join(" "),
    colsNarrow: `${N} ${N}`,
    items: [
      node("camera + mic + sensors", "1 / 1 / 2 / 2", "1 / 1 / 2 / 2", { kind: "input" }),
      arrow("1 / 2 / 2 / 3", "right", "2 / 1 / 3 / 2"),
      node("perception", "1 / 3 / 2 / 6", "3 / 1 / 6 / 2", { sub: "always on" }),
      arrow("1 / 6 / 2 / 7", "right", "6 / 1 / 7 / 2"),

      node("\u201cwhen glass breaks...\u201d", "2 / 1 / 3 / 2", "1 / 2 / 2 / 3", { kind: "input" }),
      arrow("2 / 2 / 3 / 3", "right", "2 / 2 / 3 / 3"),
      node("LLM", "2 / 3 / 3 / 4", "3 / 2 / 4 / 3"),
      arrow("2 / 4 / 3 / 5", "right", "4 / 2 / 5 / 3"),
      node("rule", "2 / 5 / 3 / 6", "5 / 2 / 6 / 3"),
      arrow("2 / 6 / 3 / 7", "right", "6 / 2 / 7 / 3"),

      node("rules engine", "1 / 7 / 3 / 8", "7 / 1 / 8 / 3", { kind: "core", sub: "500 ms" }),
      arrow("1 / 8 / 3 / 9", "right", "8 / 1 / 9 / 3"),
      node("", "1 / 9 / 3 / 10", "9 / 1 / 10 / 3", { kind: "output", chips: ["speaker", "LEDs", "Telegram", "clips"] }),
    ],
  },

  /*
   * Campus. Course files come in along the top row, questions are answered
   * along the bottom row, right to left as in the original, and every write
   * the agent makes drops into the audit log.
   */
  campus: {
    colsWide: [N, A, N, A, N, A, N].join(" "),
    colsNarrow: `${N} ${A} ${N}`,
    items: [
      node("Brightspace", "1 / 1 / 2 / 2", "1 / 1 / 2 / 2", { kind: "input" }),
      arrow("1 / 2 / 2 / 3", "right", "2 / 1 / 3 / 2"),
      node("sync", "1 / 3 / 2 / 4", "3 / 1 / 4 / 2"),
      arrow("1 / 4 / 2 / 5", "right", "4 / 1 / 5 / 2"),
      node("SQLite + files", "1 / 5 / 2 / 6", "5 / 1 / 6 / 2"),
      arrow("1 / 6 / 2 / 7", "right", "6 / 1 / 7 / 2"),
      node("index", "1 / 7 / 2 / 8", "7 / 1 / 8 / 2"),
      arrow("2 / 7 / 3 / 8", "down", "8 / 1 / 9 / 2"),
      node("retrieve", "3 / 7 / 4 / 8", "9 / 1 / 10 / 2"),
      arrow("3 / 6 / 4 / 7", "left", "10 / 1 / 11 / 2"),
      node("agent", "3 / 5 / 4 / 6", "11 / 1 / 12 / 2", { kind: "core", sub: "20 tools" }),
      arrow("3 / 4 / 4 / 5", "left", "12 / 1 / 13 / 2"),
      node("answer", "3 / 3 / 4 / 4", "13 / 1 / 14 / 2", { kind: "output" }),
      arrow("4 / 5 / 5 / 6", "down", "11 / 2 / 12 / 3", "right"),
      node("audit log", "5 / 4 / 6 / 7", "11 / 3 / 12 / 4", { kind: "output", sub: "every write, before and after" }),
    ],
  },

  "terago-email": chain([
    { label: "email", kind: "input" },
    { label: "local LLM", sub: "Ollama", kind: "core" },
    { label: "structured ticket", kind: "output" },
  ]),

  "terago-rf": chain([
    { label: "link type + candidate frequencies", kind: "input" },
    { label: "checks", kind: "core" },
    { label: "shortlist of clear frequencies", kind: "output" },
  ]),
};

/**
 * AgenticArmy's job statuses are a long straight line, so they wrap as a row
 * of chips instead of sitting on a grid. The one human gate is highlighted.
 */
export const STATUS_CHAINS: Record<string, { label: string; gate?: boolean; end?: string[] }[]> = {
  "agenticarmy-status": [
    { label: "initializing" },
    { label: "planning" },
    { label: "awaiting_plan_approval", gate: true },
    { label: "coordinating" },
    { label: "analyzing_conflicts" },
    { label: "coding" },
    { label: "merging" },
    { label: "verifying" },
    { label: "review_ready" },
    { label: "", end: ["done", "failed"] },
  ],
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ARROW_SVG =
  '<svg viewBox="0 0 24 12" width="24" height="12" aria-hidden="true" focusable="false">' +
  '<path d="M1 6h19" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
  '<path d="M16 1.5 22.5 6 16 10.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
  "</svg>";

function renderItem(item: FlowItem): string {
  const area = `--w:${item.wide};--n:${item.narrow}`;
  if (item.type === "arrow") {
    return `<div class="flow-arrow" data-w="${item.dirWide}" data-n="${item.dirNarrow}" style="${area}">${ARROW_SVG}</div>`;
  }
  const kind = item.kind ?? "step";
  const label = item.label ? `<span class="flow-label${item.mono ? " flow-mono" : ""}">${esc(item.label)}</span>` : "";
  const sub = item.sub ? `<span class="flow-sub">${esc(item.sub)}</span>` : "";
  const chips = item.chips
    ? `<span class="flow-chips">${item.chips.map((c) => `<span class="flow-chip">${esc(c)}</span>`).join("")}</span>`
    : "";
  return `<div class="flow-node flow-${kind}" style="${area}">${label}${sub}${chips}</div>`;
}

/** The visual only. markdown.ts wraps it in the figure and adds the sr-only caption. */
export function diagramHtml(name: string): string {
  const flow = DIAGRAMS[name];
  if (flow) {
    return [
      `<div class="flow" aria-hidden="true">`,
      `<div class="flow-grid" style="--cols-w:${flow.colsWide};--cols-n:${flow.colsNarrow}">`,
      flow.items.map(renderItem).join(""),
      "</div></div>",
    ].join("");
  }

  const statuses = STATUS_CHAINS[name];
  if (statuses) {
    const parts = statuses.map((s, i) => {
      const box = s.end
        ? `<span class="flow-node flow-output flow-status flow-end">${s.end.map((e) => `<span class="flow-mono">${esc(e)}</span>`).join('<span class="flow-or">or</span>')}</span>`
        : `<span class="flow-node ${s.gate ? "flow-core" : "flow-step"} flow-status"><span class="flow-mono">${esc(s.label)}</span>${s.gate ? '<span class="flow-sub">human approves the plan</span>' : ""}</span>`;
      const next = i < statuses.length - 1 ? `<span class="flow-arrow flow-inline">${ARROW_SVG}</span>` : "";
      return `<span class="flow-step-wrap">${box}${next}</span>`;
    });
    return `<div class="flow" aria-hidden="true"><div class="flow-wrap">${parts.join("")}</div></div>`;
  }

  throw new Error(`unknown diagram: ${name}`);
}
