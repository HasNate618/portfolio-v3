#!/usr/bin/env node

// A port override, because a production server may already own 3100: the checker
// only needs a freshly built one, not that exact port.
const BASE = process.env.CHECK_RENDER_BASE ?? "http://localhost:3100";

async function fetchPath(p) {
  const res = await fetch(BASE + p);
  const body = await res.text();
  return { status: res.status, type: res.headers.get("content-type") ?? "", body };
}

const failures = [];
function pass(cond, label) {
  if (!cond) failures.push(label);
}

const req = { "/": "Awards", "/projects": "AR and VR", "/projects/campus": "lexical",
  "/projects/homelab": "Storage and backups", "/projects/aware": "$80", "/experience/terago": "channel-planning",
  "/experience": "May 2026 to Aug 2026", "/now": "mailto:", "/resume": "working end to end",
  "/chat": "needs JavaScript" };

try {
  // --- production-build assertion (fail loudly if a dev server holds the port) ---
  const homeR = await fetchPath("/");
  if (homeR.body.includes("react-refresh")) {
    console.error("ERROR: response for / contains react-refresh — this is a DEV server. Stop it and use `npm start`.");
    process.exit(2);
  }
  if (homeR.body.includes('"buildId":"development"')) {
    console.error('ERROR: __NEXT_DATA__ reports "buildId":"development" — this is a DEV server.');
    process.exit(2);
  }

  // --- per-route required marker ---
  for (const [p, marker] of Object.entries(req)) {
    const r = (p === "/") ? homeR : await fetchPath(p);
    pass(r.status === 200, `${p}: expected 200, got ${r.status}`);
    pass(r.body.includes(marker), `${p}: missing required marker "${marker}"`);
  }

  // --- KB boundary ---
  const kb = await fetchPath("/knowledgebase/not-a-real-file.md");
  pass(kb.status === 404, "/knowledgebase/not-a-real-file.md: expected 404");

  // --- a retired word must not reach the served surface ---
  for (const p of ["/", "/llms.txt", "/knowledgebase/about.md",
    "/knowledgebase/projects/campus.md", "/knowledgebase/projects/index.md"]) {
    const r = p === "/" ? homeR : await fetchPath(p);
    pass(!/flagship/i.test(r.body), `${p}: contains a word the site has retired`);
    pass(!/^Rank:/m.test(r.body), `${p}: still carries a rank line`);
  }

  // --- llms.txt / robots / sitemap content types and content ---
  const llms = await fetchPath("/llms.txt");
  pass(/text\/markdown/i.test(llms.type), `/llms.txt: expected text/markdown, got ${llms.type}`);
  const robots = await fetchPath("/robots.txt");
  pass(/text\/plain/i.test(robots.type), `/robots.txt: expected text/plain, got ${robots.type}`);
  const likelySitemap = robots.body.includes("sitemap");
  pass(likelySitemap, "/robots.txt: does not mention sitemap");
  const sm = await fetchPath("/sitemap.xml");
  pass(sm.status === 200, "/sitemap.xml: expected 200");
  pass(sm.body.includes("/projects/campus"), "/sitemap.xml: does not list /projects/campus");
} catch (e) {
  console.error("check-render failed to reach the server:", e.message);
  process.exit(2);
}

if (failures.length) {
  console.error("check-render: FAIL");
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log("check-render: PASS — all route/markers verified");
