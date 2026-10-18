# Site review 5: portfolio-v3 at 0b26d15 (deployed), Oct 17, 2026 ~10:35 AM ET

Range: 7ff8133..0b26d15 (5 commits: 7a827c9 fallback follow-ups, 1749d10 home program line, dbc2328 typecheck, 7d1901c one voice per file, 0b26d15 3DW case study + résumé in-repo). 34 files, +753/-66.
Live site = HEAD (public/Nathan_Espejo_Resume.pdf on www.nathanespejo.com is byte-identical to the repo file).

## Checks run locally (box, Node 20.19)
- check:content: clean
- check:render: PASS (the stale 3100 server was restarted on the new build first)
- typecheck: clean
- tests: 196/196 pass. Note: `npm test` fails on Node 20 ("Could not find tests/**/*.test.ts") because `node --test` globs need Node 22+. Ran the same command with an explicit file list. Add `"engines": {"node": ">=22"}` or an `.nvmrc` with `22`.
- next build: clean
- check:embeddings: fresh (203 chunks, 5655aeefd033)

## Done correctly
- 3D Western case study (content/experience/3d-western.md) matches /workspace/3dw-case-study/3d-western-case-study.md word for word. The only change is the dataset-composition figure's width/height, now 1230x880, which matches the real webp. That is correct.
- All 4 figures render live at /experience/3d-western: <figure>, lazy img with width/height, alt, figcaption, lightbox. All 4 webp files return 200. /experience shows a "Case study →" link for 3D Western (generic getPage link in ExperienceView).
- The figure fence is in src/lib/markdown.ts with tests. Figures go to the chat as caption + alt (chunks.ts keepFigureText). AGENTS.md documents both.
- 3DW facts: 4,620 / 3,818 / 2,559; "co-led two data developers through Jira tickets"; Morrissette "in partnership"; the 84.2% filename caveat and 76.9% image-only are on the case study; "we" kept on v7.
- Résumé moved in: resume/Resume.tex (identical to /workspace/Resume/Resume-improved.tex), build.sh, flake.nix, flake.lock, `npm run build:resume`, resume/build/ gitignored, AGENTS.md "The résumé" section. No round drafts copied.
- Live PDF: 1 page. pdftotext has none of Automated / 4,687 / 215 course files / offline / 4,127 / class-checked / grey classes. Its text is identical to /workspace/Resume/Nathan_Espejo_Resume.pdf (the bytes differ only in build metadata). No phone number. Shows "Aug 2024 - May 2028".
- content/resume.md: TeraGo "works end to end, not yet deployed", 3DW co-led/4,620/binary 84.2%, Campus has no corpus counts, AWARE "no cloud inference".
- C5 is done as specified: 4 new rules at the top, the AgntOS question is gone, proxmox becomes nixos, the Hermes question is first in homelab, the AI rule now points at Campus/TeraGo/AWARE, the hackathon question changed, and DEFAULT_FOLLOWUPS is Campus/TeraGo/contact. New tests/followups.test.ts.
- System prompt 7c no longer has a sentence count.
- M9: omni-reality is now first person throughout (description + body + credit). That breaks with the handoff's "his team", but it is consistent with the other project docs, which are first person, so I accept it. The Lumen awards cell is now "Team project", and lumen.md L17 keeps "I built the Unity mini-games".
- Home line now names the program.
- Rule scans on content/ + site.ts + llms.txt + live HTML: no em dashes in visible copy, no MiMo/DeepSeek, no phone, no WEMars contribution claims (2024-25 "explored" lines only), exactly one "in progress" line (Campus eval), AgntOS and Cyberdeck marked abandoned/archive, the TeraGo parser is present everywhere (site.ts, experience, terago, resume.md, PDF), and AWARE has no "offline" (the homelab VPN-lockout "offline" is unrelated). 4,127 is gone.
- Chat starters (content/chat.md L7) are recruiter-oriented and fine.

## Remaining issues (prioritized)

### P0. Live chat API is down
`POST https://www.nathanespejo.com/api/chat` returned `500 {"error":"Failed to process request"}` 3 of 3 times, in about 0.25 s. It fails before streaming, in retrieval, rerank or chat-stream setup (src/app/api/chat/route.ts catch at ~L208). Cohere's status page says everything is operational, and the local embedding index is fresh. That points to the deployment: COHERE_API_KEY is missing or wrong in this Vercel deployment's env, the key is over quota, or the model id `command-a-plus-05-2026` / `embed-v5.0-pro` (cohere.ts L6/L37) is rejected. Fix: open the Vercel function logs for "Chat API error:", confirm the key is set for Production, and redeploy. I couldn't verify answers or follow-ups live.

### P1. Exact Campus corpus figures are still public (/projects card, /knowledgebase, chat index)
The /projects Campus card shows "chunks 4,687" and "course files 215". `home: false` only hides them on home. /knowledgebase/projects/campus.md also carries `chunks: 4,687` / `course files: 215`, and so does the chat index. Settled: no chunk count, and the file count only in the case study, dated and approximate (the case study already has "just over 200 of them as of early October 2026").
- src/data/site.ts:136-137: delete both lines:
  `{ key: "chunks", label: "chunks", value: "4,687", home: false },`
  `{ key: "files", label: "course files", value: "215", home: false },`
- Tests to update:
  - tests/site.test.ts:15-16: delete the two asserts.
  - tests/furniture.test.tsx:67: `/4,687/` becomes `/20/` (agent tools).
  - tests/corpus.test.ts:33: `/4,687/` becomes `/308/`.
  - tests/markdown.test.ts:14 and :28: use `{{stat:campus.tests}} tests` with expected `over 308 tests`.
  - Keep home.test L16 and case-study L54 as they are.
- Then `npm run build-embeddings`.

### P1. Graduation date (May 2028) is buried
Currently it is only on /experience ("Aug 2024 to May 2028 (expected)"), /resume ("Aug 2024 to May 2028", no "expected"), the PDF, and about.md L29 (corpus only, /about has no route). Home, the sidebar headline, /now and /chat don't show it. The chat HIGHLIGHTS line renders it as "2024 08 to 2028 05".
- src/components/views/HomeView.tsx:52-53
  - Current: `{site.identity.year} in {site.identity.program} at {site.identity.education.school}. Looking for a{" "}{site.identity.seeking}.`
  - New: `{site.identity.year} in {site.identity.program} at {site.identity.education.school}, graduating {site.identity.graduation}. Looking for a{" "}{site.identity.seeking}.`
  - The home page then reads: "3rd year (2026-27) in Software Engineering at Western University, graduating May 2028. Looking for a Summer 2027 software engineering or applied AI internship."
- src/data/site.ts:90 (after `program: "Software Engineering",`), add `graduation: "May 2028",`. Add `graduation: string;` to the identity type at site.ts:72. Alternative: derive it from education.end with the monthYear helper in ExperienceView.tsx:11, moved to src/lib.
- src/data/site.ts:86 headline (optional, it's in the sidebar on every page)
  - Current: `"Software engineer building applied AI tools. 3rd-year Software Engineering at Western."`
  - New: `"Software engineer building applied AI tools. 3rd-year Software Engineering at Western, graduating May 2028."`
- src/app/api/chat/lib/system-prompt.ts:19 (the HIGHLIGHTS line prints "2024 08 to 2028 05")
  - New: ``${site.identity.year}, ${site.identity.education.degree} at ${site.identity.education.school} (Aug 2024 to May 2028, expected graduation May 2028)``. Better: build it from monthYear(education.start/end) so it can't drift.
  - Also change L22 `Looking for a ${site.identity.seeking}` to ``Looking for a ${site.identity.seeking}; graduates ${site.identity.graduation}``.
- system-prompt.ts, add after rule 19 (L92):
  `20. For questions about availability, internships or hiring, give both facts: he is looking for a ${site.identity.seeking}, and he graduates in ${site.identity.graduation}.`
  - Add a test in tests/ that `buildSystemPrompt([])` includes "May 2028" and "Summer 2027".
- src/components/views/NowView.tsx:16 (optional)
  - Current: `Looking for a {site.identity.seeking}.`
  - New: `Looking for a {site.identity.seeking}. I graduate in {site.identity.graduation}.`
- src/components/views/ResumeView.tsx:107-108: add ` (expected)` after `{monthYear(education.end)}` to match /experience.
- Starters (content/chat.md L7): no change needed. "What internship is he looking for and how do I reach him?" will surface it once rule 20 is in.
- The résumé PDF already says "Aug 2024 - May 2028". Fine; no change.

### P2. content/experience.md 3D Western bullets contradict the résumé and the case study
- L27
  - Current: `rendered in Blender and labelled by a VLM.`
  - New: `rendered in Blender with labels checked by a VLM.` (The VLM checks scraped folder labels; it doesn't create them.)
- L28
  - Current: `- Benchmarked base vision models on the 2,559 clean renders (safe, unsafe and grey classes) as groundwork for fine-tuning. The best agreed with the dataset labels on 84.2% of them.`
  - New: `- Benchmarked small vision models on the 2,559 clean renders as a binary safe-or-flag gate. The best agreed with the VLM-checked labels on 84.2% with the filename included, 76.9% from the image alone.`
- src/data/site.ts:109 summary
  - Current: `...The best small vision model agreed with those labels on 84.2%.`
  - New: `...The best small vision model agreed with those labels on 84.2% with the filename, 76.9% from the image alone.`
  - This depends on Nathan's open call on 84.2% vs 76.9%. If he drops 84.2%, change it here, in resume.md L35 and in Resume.tex.

### P2. ferret card not added (handoff §3)
`rg -i ferret` finds nothing in the repo. Add an archive card in site.ts using the repo's own description: "Local-first semantic search over text, images and PDFs in Rust: hybrid vector, FTS5 and filename search fused with RRF." Use displayRole "solo", stack ["Rust", "SQLite FTS5", "embeddings"], and no case study.

### P3. Smaller items
- content/experience.md:29, "wrote the scraping and rendering scripts". This is supported by the original record for the 2025-26 developer term, but it reads as if it contradicts the case study's "Teammates wrote the preprocessing pipeline and render scripts". New: `...and wrote the early scraping and rendering scripts.`
- content/resume.md is described as "matching the PDF", but:
  - L17 Tools adds `Cursor, Claude Code`, which the PDF doesn't have.
  - L48-49 homelab bullets differ from the PDF (sops-nix, tool calls, subagents).
  - Experience order is TeraGo first; the PDF has 3D Western first.
  - Either sync it with Resume.tex, or change L5 to `description: My résumé as text. The PDF is the one-page version.`
- PDF metadata: Title and Author are empty. In resume/Resume.tex, add `\hypersetup{pdftitle={Nathan Espejo Resume}, pdfauthor={Nathan Espejo}}`, then run `npm run build:resume`.
- PDF AI skills line still wraps onto a 2nd line ("PyTorch, YOLOv8, ONNX"). This waits on Nathan's pending call to cut one item.
- Em dashes in non-visible strings: resume/build.sh:35,40 and scripts/check-render.mjs:25,29,64 (console output), plus about 20 code comments in src/components. Not user-facing; optionally change `—` to `:` in build.sh.
- src/data/site.ts:194, stale comment `// ── also building ──` above AgntOS (abandoned). Change it to `// ── archive ──`.
- Mobile follow-up rule (followup-fallback.ts, mobile block): "What is SafeRoute?" assumes SafeRoute's status, but solo vs team is still an open question. Harmless; leave it.
- portfolio-v3 README is still 21 lines (handoff §5, not done).

### Not done, needs Nathan's OK or his own action (off-site, unchanged as of now per GitHub API)
- AgntOS: not archived; description is still "An agent-native operating system built on NixOS".
- Cyberdeck: description still "WIP Raspberry Pi 3B Cyberdeck".
- HasNate618/Resume: not archived and has no "Moved to portfolio-v3/resume" README line.
- Omni-Reality: still shows as Jupyter Notebook.
- No topics on any repo.
- AWARE / nixos-config-public / Street Cleaner README fixes: not checked in depth; the descriptions are unchanged.
- Pins and profile README: not checked this round.
