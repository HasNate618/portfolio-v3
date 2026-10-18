# Implementer handoff 4: portfolio-v3 (after the 3D Western case study PR)

Repo: HasNate618/portfolio-v3, master. Settled facts: no em dashes, no phone number, no MiMo or DeepSeek, MCC is summer 2025, one TeraGo entry dated May to Aug 2026 (the parser works end to end but isn't deployed), AWARE and Animarker are the only solo hacks, AgntOS and Cyberdeck are abandoned, no WEMars contributions.

## 1. Move the résumé into portfolio-v3

The source of truth is the PDF at `public/Nathan_Espejo_Resume.pdf`. The HasNate618/Resume repo is only a build workflow.

- Add `resume/Resume.tex` (and `resume/resume.cls` or any other included files it needs). Nathan's agent will send the corrected `.tex`; use that file, not the stale `Resume.tex` in the Resume repo.
- Port the build from `HasNate618/Resume/render_resume.sh` and `flake.nix` into `resume/build.sh` (or an `npm run build:resume` script). It compiles the `.tex` and copies the result to `public/Nathan_Espejo_Resume.pdf`.
- Optional: add a CI check that fails if `public/Nathan_Espejo_Resume.pdf` is older than `resume/Resume.tex`, or just document the step in AGENTS.md.
- Don't copy the round drafts, old PDFs or the editing-workflow files.
- After merge, Nathan archives HasNate618/Resume with a README line: "Moved to portfolio-v3/resume."
- `content/resume.md` should stay consistent with the new PDF (TeraGo wording, AWARE "no cloud inference", 3D Western 4,620, no Campus corpus counts).

## 2. Leftover fix-list items

- **C5, chat fallback follow-ups** (`src/app/api/chat/lib/followup-fallback.ts`):
  - L19: remove "What did Nathan build with AgntOS?" (AgntOS is abandoned).
  - L48: remove `proxmox` from the homelab regex (he doesn't use it).
  - L42-52: the homelab questions are all about AI. Mix in a non-AI one, such as how agent changes are approved and rolled back.
  - Rework the default list (around L82) so it points at Campus, AWARE, TeraGo and 3D Western, not only the homelab.
  - Keep the counts the tests expect. The exact replacement text is in C5 of `pr2-content-fixes.md` (attached), lines 747-799.
- **M9, mixed person in third-person docs:**
  - `content/projects/omni-reality.md` L5: "Built with my team" becomes "Built with his team".
  - `content/awards.md` L22: "I built the Unity mini-games" becomes "Nathan built the Unity mini-games".
- **System prompt:** rule 7c's sentence-count target conflicts with rule 7 ("Length is set by the record"). Drop the count from 7c.
- Rebuild the chat index after merge: `npm run build-embeddings`.

## 3. New project card: ferret

`HasNate618/ferret` (Rust, local-first semantic file search, 91 commits, 33 test files) isn't on the site. Add an archive or tier-2 project card with a short, accurate description taken from its README. Claim nothing the README doesn't support, and give it no case study yet.

## 4. Off-site repos (Nathan's other repos; only if he OKs editing them)

- **AWARE README:** "no internet required" becomes "no cloud inference" (alerts go out over Telegram).
- **cyberdeck:** remove "WIP" from the description and add "Abandoned".
- **Street Cleaner:** the README says TurtleHacks but Devpost says GameHACKS 1.0. Confirm with Nathan, then fix.
- **AgntOS:**
  - Add a top note: "Stopped in May 2026. I switched to NixOS with Hermes Agent instead; see nixos-config-public."
  - Start the description with "Abandoned:".
  - Archive the repo.
- **nixos-config-public README:** replace "around 35 services" with the site's count (27 containers) or no number, and mention the Hermes Agent profile per host.
- **Omni-Reality:** add a description, and a `.gitattributes` with `*.ipynb linguist-vendored` so GitHub stops showing it as Jupyter Notebook.
- **Topics:** add 3 to 5 topics to each pinned repo (suggestions are in Nathan's repo-review-3 notes).

## 5. GitHub profile (Nathan does these himself in the GitHub UI)

- Pins, in order: Campus, nixos-config-public, AWARE, Omni-Reality, portfolio-v3, Glyph. Unpin microsoft/winget-pkgs, AgntOS and FLEXFIRE-X.
- Profile README: replace `HasNate618/HasNate618/README.md` with the draft Nathan has. It has one identity line, a "Start here" section, a Summer 2027 line, and no streak or visitor badges.
- portfolio-v3 README: it's only 21 lines. Expand it with what the site is, the stack, how the chat works (typed data, retrieval, honesty rules), how to run it, and the test and check commands.

## Done when

- Tests pass, `check:content`, `check:render` and `next build` are clean, and the embeddings are rebuilt.
- `pdftotext public/Nathan_Espejo_Resume.pdf` contains none of these: "Automated", "4,687", "215 course files", "offline", "4,127", "class-checked", "grey classes".
