# Repo review 3: portfolio-v3 changes, GitHub pins, AgntOS, case studies

Oct 17, 2026, 9:26 AM ET. `origin/master` is now `0982dc2`, 11 commits after `93b4bf8`. Local clone checked out detached. Nothing edited or pushed.

## 1. What landed from pr2-content-fixes.md

**Checks on 0982dc2:**
- Tests: 183/183 pass. I passed the test files explicitly, because Node 20 doesn't expand the `npm test` glob.
- `next build`: OK.
- `check:render`: PASS, against `next start` on :3100.
- `check:content`: clean.
- `check:embeddings`: fresh (197 chunks, so the index was rebuilt).
- `eslint`: clean.
- `tsc`: one error at `tests/seo.test.tsx:51` that was already on master.

**By item (41):**
- 36 fully applied.
- 2 partly applied: M9 and L9.
- 2 missing: L1 and C5.
- 1 waiting on Nathan: H6.

**By line:** a script compared each item's current text and new text with the new master.
- 132 lines match the new text exactly.
- 7 landed in slightly different wording (an earlier draft's), all fine:
  - Animarker and Lumen are in first person.
  - Auralis says "four of us".
  - The Cyberdeck description differs.
  - H9 went with Option B, "explored".
  - C2's 7c uses the older wording, with a sentence count.
- The homelab tl;dr stats line was moved rather than deleted. That's fine.
- H7: CareBridge's home card title is now plain text instead of getting a route. The home test was changed to match, and a new test checks every home project link resolves. Valid.

**Missing or not applied:**
1. **C5, follow-up fallbacks: nothing applied.** `followup-fallback.ts` is unchanged, so the chat still suggests "What did Nathan build with AgntOS?" (L19, an abandoned project), "Which web projects has he shipped?", three homelab-only questions in the AI rule, `proxmox` in the homelab regex (L48), and the old defaults. This is the most important gap.
2. **M9, mixed person (2 lines):** `omni-reality.md` L5 says "Built with my team" in a third-person doc. `awards.md` L22 says "Team project; I built the Unity mini-games" in a third-person table. (The about.md part, L7, did land.)
3. **L1:** HomeView's `{site.identity.year} at ...` line is unchanged. Optional.
4. **H6:** CareBridge "I built [HIS PART]" is waiting on NN1. The card is now also unlinked (see new issues).
5. **L9:** Whack-A-ML, FLEXFIRE-X and SafeRoute still say `role: "owner"`, waiting on NN4. That's expected.

**Against the settled facts, all clean:**
- MCC is 2025 everywhere.
- TeraGo is one May to Aug 2026 entry, and the parser reads "works end to end, not deployed" in site.ts, experience, terago, local-ai and resume.
- Only AWARE and Animarker carry `solo` with an event.
- AgntOS and Cyberdeck are `abandoned` (site.ts and frontmatter) and in the archive.
- No em dashes in content or site data. The only one in `src/` is a server `console.warn` in `embeddings.ts:107`.
- No phone number, no MiMo or DeepSeek.
- Exactly one "in progress": `campus.md:72`.
- WEMars claims nothing for this term ("Just getting started"). The 2024-25 lines now say "explored" (H9 Option B, so NN5 is answered).

**New issues:**
- **3D Western case study is not integrated.** There's no `route:` on `content/experience/3d-western.md`, no figures in `public/projects/`, and `/experience/[slug]` builds only `terago`.
  - `/workspace/3dw-case-study/integration.patch` no longer applies: `git apply --check` fails on `content/experience/3d-western.md` and `src/data/site.ts:105`, because the H8 wording landed. It needs a rebase onto 0982dc2.
  - The patch's site.ts `stack` adds Qwen3-VL-2B and Shieldstral. Earlier passes treated those names as ones to keep out of the public index, so Nathan should confirm they're fine to publish.
  - The dataset figure is still 4,127 on the site; the case study says 4,620 is final. The "safe, unsafe and grey classes" line in experience.md L28 and 3d-western.md is also slightly off, since the benchmark is binary.
- **CareBridge holds a home slot with no page and no named part.** Honest, but it's the weakest of the four. Either get NN1, or later swap in a project with a case study.
- **C2 7c** adds "2 to 4 sentences, or up to 5 short bullets", next to rule 7, which says "Length is set by the record, not by a target". Tests pass, but the two rules pull against each other. I'd drop the counts.
- `local-ai.md` dropped "set up in his local-llama-setup repo", but site.ts L154 still links "GitHub (llama.cpp setup)". That's fine if intended.
- Off-site copy that contradicts the site:
  - The AWARE README says "all locally, no cloud, no internet required" (Telegram alerts need the internet).
  - The `cyberdeck` repo description says "WIP".
  - The `Street-Cleaner-Game` description says "Submission for TurtleHacks", but Devpost says GameHACKS 1.0.
  - The AgntOS README still pitches it as a live product, including an "AgntOS vs Hermes + NixOS" section arguing for AgntOS.
  - The `nixos-config-public` README says "around 35 services", while the site says 27 hardened containers. This could be containers plus native services; it should say so. That README also never mentions Hermes Agent or the approval flow.
- **Not on the site:**
  - `ferret`: a Rust local-first semantic file search (hybrid vector + FTS5 + filename with RRF). Created Oct 12, 91 commits, 33 test files, `cargo test` with httpmock.
  - `pi-extensions`: TUI extensions for the pi coding agent.

## 2. GitHub pins

**Pinned today**, parsed from the profile HTML (stars and last push from the API):

| # | Repo | Description | Lang | Stars | Last push | README | Topics |
|---|---|---|---|---|---|---|---|
| 1 | Campus | Campus syncs Brightspace into local SQLite and files so you can search, chat, and verify answers against your actual course material. | Python | 1 | Oct 13 | Strong: 288 lines, CI badge, images, MIT | none |
| 2 | AWARE | An edge automation device that sees, hears, and responds to its environment | Python | 0 | Jul 19 | Good: 79 lines, mermaid; but "no internet" and em dashes | none |
| 3 | Glyph | A fully customizable leader-key tool for Windows | C# | 2 | Feb 10 | OK: 111 lines, WinGet install, MIT | none |
| 4 | microsoft/winget-pkgs | Upstream Microsoft manifest repo | n/a | (Microsoft's) | n/a | not his | n/a |
| 5 | AgntOS | An agent-native operating system built on NixOS | Rust | 1 | May 26 | Long, 237 lines; reads as an active product; not archived | none |
| 6 | FLEXFIRE-X | A wrist mounted projectile launcher... | C++ | 0 | Jun 7, 2025 | OK: 93 lines, 6 images | none |

- **#4 isn't his repo.** It's Microsoft's upstream repo, where he added one Glyph manifest; he also has a fork. The stars and activity on the card are Microsoft's.
- None of the pinned repos are private or forks of his own, and none is missing a README.
- **No repo on the account has any topics.**
- `Omni-Reality` and `portfolio-v2` have no description. Omni-Reality's language shows as "Jupyter Notebook".

**Recommended 6, in order** (all public, his own, with a README):
1. **Campus**, the flagship.
   - Description: "Self-hosted study assistant: syncs Brightspace into SQLite and answers from your course files with hybrid retrieval and reranking."
   - Topics: `rag llm-agents hybrid-search reranking sqlite fastapi react python self-hosted brightspace`.
   - Website field: nathanespejo.com/projects/campus.
2. **nixos-config-public**, the homelab.
   - Description: "Two-machine NixOS homelab from one flake. Hermes Agent proposes config changes; nothing applies until I approve."
   - Topics: `nixos nix-flakes homelab self-hosted docker tailscale sops-nix hyprland llm-agents hermes-agent`.
   - Website: nathanespejo.com/projects/homelab.
   - README: add the agent and approval flow, and explain the 35-vs-27 count.
3. **AWARE**.
   - Description: "On-device home awareness on an $80 Arduino UNO Q: YOLOv8, YAMNet and a 1B LLM turn plain-English rules into automations. Solo, Hack the 6ix 2026."
   - Topics: `edge-ai on-device-llm yolov8 yamnet arduino qualcomm llama-cpp home-automation python hackathon`.
   - Website: nathanespejo.com/projects/aware.
   - README: change "no cloud, no internet required" to "no cloud inference; alerts go out over Telegram", and remove the em dashes.
4. **Omni-Reality**.
   - It's his repo (143 of 185 commits), with 109 test files.
   - Description: "Mixed-reality assistant for Quest 3S: SAM 2 highlights, guided steps and life-size furniture. Hack the North 2026 team project; I kept building the spatial system after."
   - Topics: `mixed-reality meta-quest unity sam2 multimodal-llm websockets python json-schema hackathon`.
   - Add `.gitattributes` marking the notebooks `linguist-documentation` so the language shows Python/C#. Name the teammates near the top of the README.
5. **portfolio-v3**.
   - The live site and its RAG chat: 183 tests and content gates.
   - Description: "Source for nathanespejo.com: Next.js 15, typed site data, and a Cohere RAG chat over the same Markdown the site serves."
   - Topics: `nextjs typescript rag cohere portfolio llms-txt`.
   - README: it's 21 lines today. Add what the chat does, how retrieval works, the checks, and a screenshot.
6. **Glyph**.
   - Solo, shipped on WinGet; it's the "beyond AI" evidence.
   - Description: "Leader-key command overlay for Windows, configured in YAML, shipped on WinGet."
   - Topics: `windows productivity keyboard leader-key csharp wpf dotnet winget`.

- **Unpin:** winget-pkgs (not his), AgntOS (abandoned), FLEXFIRE-X (2025 hardware, off-narrative).
- **Alternate:** swap `ferret` in for Glyph once ferret is on the site. It fits the applied-AI story better and replaces AgntOS as the Rust evidence.
- **Skip:**
  - CareBridge: it's a teammate's repo (`liamma06/Spark`), and his part is unknown.
  - 3D Western: no public repo under him, and he's in no orgs.

**Profile README (`HasNate618/hasnate618`, last push Jul 7):**
- The typing banner ("AI Systems Builder; Automation Engineer; Linux + Servers; Hardware + CAD; Unity 3D + XR") spreads him across five identities. Lead with one: "Software engineer building applied AI tools I actually use".
- Add a "Start here" section with Campus, the homelab and AWARE, plus the Summer 2027 line, matching the site.
- Drop the streak and visitor badges; they're noise.
- The icons list Java, which the site deliberately leaves out (a test pins "Java was never in site.skills"). He did write Java once (AidMate, 2024), so keep or drop it on purpose.
- Use no em dashes.

## 3. AgntOS: keep it archived, with the story

- **Repo state:**
  - Not archived on GitHub.
  - Last push May 26, 2026.
  - About 500 KB of Rust, GPL-3.0, 1 star.
  - The README doesn't say WIP. It presents a product direction (".specs/project/VISION.md", "terminal-first dev edition is the current wedge") and argues AgntOS over Hermes + NixOS.
- **On the site today:** an archive card plus a two-paragraph corpus doc (why he stopped), and one origin sentence on the homelab page.
- **Recommendation: keep exactly that.**
  - It's honest, it explains why the homelab exists, and it costs one card.
  - Folding it fully into the homelab page would add a detour to a featured case study, and the sentence already there is enough.
  - Removing it would lose the only place Rust appears on the site, until ferret is added, and break the homelab's `related` link.
- **On GitHub:**
  - Add a status note at the top of the README: "Stopped in May 2026. I switched my machines to NixOS with Hermes Agent instead; that setup is now my homelab."
  - Change the description to "Abandoned: an AI agent for managing NixOS config, which led to my homelab".
  - Archive the repo and unpin it.
  - Otherwise the repo contradicts the site.
- If ferret goes on the site, point `skills.md`'s Rust line at ferret and keep AgntOS only in the archive.

## 4. Case studies (routed today: aware, campus, homelab, terago; 3D Western drafted, not merged)

1. **Omni-Reality.**
   - What exists:
     - His repo, 143 of 185 commits.
     - 109 test files that run offline (`python -m unittest`).
     - Concrete engineering decisions: model output limited to scene ops validated against JSON Schema, placement anchored to capture-time pose, about 5 fps frame streaming only while tracking, headset acknowledgements before speech, and a redacted JSONL ledger with model, latency and token counts.
     - A video, Devpost, and a screenshot.
   - It fits the site's main theme: the model proposes, code validates.
   - Missing:
     - His hackathon-weekend part, separated from the Sep 21-23 post-event work.
     - One measured number (latency or token cost from the ledger).
     - A diagram.
   - It must credit the team clearly.
2. **portfolio-v3 (this site and its chat).**
   - What exists:
     - Typed data projected into both the pages and the RAG corpus.
     - Cohere embed, top 30, rerank to 10, with a navigation-doc penalty.
     - Status, solo/team and first-claim rules in the prompt.
     - 183 tests, plus content, render and embeddings gates.
   - It's strong evidence for both general SWE and applied AI, and a recruiter can try it live.
   - Missing: retrieval or answer-quality evaluation, chat usage numbers, and an architecture figure.
   - Risk: it's meta. A short "How the chat works" page is enough.
3. **ferret** (once it's on the site).
   - What exists:
     - Rust, local-first hybrid search over text, images and PDFs.
     - RRF fusion, filters applied in SQL before ranking.
     - A fake embedder plus httpmock tests: 33 test files, 91 commits.
   - It would also replace AgntOS as the Rust evidence.
   - Missing: everything quantitative (index size, query latency, recall on a small labelled set), screenshots, and a site entry. It's 5 days old, so add it as a project card first.

Not now:
- **Glyph:** solo and shipped, but thin on decisions and numbers; no download count.
- **CareBridge:** teammate's repo, part unknown.
- **AgenticArmy:** team project, archived on the site.
