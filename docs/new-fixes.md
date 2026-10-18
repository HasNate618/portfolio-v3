# PR #2 content fix list: portfolio-v3

**Base:** `master` @ `93b4bf8` (fetched Oct 17, 2026, 8:10 AM ET; nothing newer on origin). Line numbers are for that commit. Quoted "current" text is copied verbatim, so the three em dashes in this file all sit inside current-text quotes (M14, C4, L5); none are in new copy.
**Inputs:** blind-recruiter-review-2.md, pr1-verify.md, voice-profile.md, Nathan's Oct 17 facts, the repo, a lexical test run over the chat index, and live link checks.
**Rules:** every item gives the file, the current text and the new text. No em dashes. No invented facts or numbers. Facts only Nathan has are under **Needs Nathan**, each with fallback wording that works without his answer. No MiMo or DeepSeek, no phone number.
**After merging:** rebuild the chat index (`npm run build:embeddings` needs the Cohere key, then `npm run check:embeddings`), and update the three tests listed in H3.

Count: **High 9 · Medium 14 · Low 10 · Chat 8 (3 high, 4 medium, 1 low) · Needs Nathan 3 · Housekeeping 6 (5 applied locally)**

_Updated Oct 17, 8:30 AM ET with Nathan's answers: AWARE and Animarker are the only solo hacks; TeraGo stays one May to Aug 2026 entry with the parser described as working but not deployed (H3); AgntOS (M8) and Cyberdeck (M3) are abandoned and archived; 3D Western gets a figure slot when his benchmark figures arrive (H8)._

---

## HIGH

### H1. AWARE: drop "first solo hack" and "pitched to three teams", and fix "no internet"
Animarker (2023, online) came first and was also solo, so "first solo hack" is wrong. Telegram alerts need the internet, so "no internet" is wrong too. The true claim is no cloud inference. Nathan confirmed on Oct 17 that he built it alone, so "Built solo" stays; only "first" goes.

- `src/data/site.ts` L167 `covers`
  - Current: `My first solo hack, at Hack the 6ix 2026. I pitched it to three teams, but it wasn't a fit for any of them, so I built it alone. It watches a camera, listens for sounds and reads sensors, and you set automations in plain English, like \"when glass breaks after 10pm, alert me.\" A 1B model turns that into a rule, and vision, audio and the LLM all run offline on one $80 board.`
  - New: `Built solo at Hack the 6ix 2026. It watches a camera, listens for sounds and reads sensors, and you set automations in plain English, like \"when glass breaks after 10pm, alert me.\" A 1B model turns that into a rule, plain code checks every rule each 500 ms, and vision, audio and the LLM all run on one $80 board with no cloud inference.`
- `content/projects/aware.md` L5 `description`
  - Current: `My first solo hack: an offline device on an $80 Arduino that sees, hears and follows plain-English rules.`
  - New: `A solo Hack the 6ix build: an $80 Arduino that sees, hears and follows plain-English rules, with every model on the board.`
- `aware.md` L21
  - Current: `- Every model runs on one {{stat:aware.boardCost}} Arduino UNO Q. No cloud, no internet.`
  - New: `- Every model runs on one {{stat:aware.boardCost}} Arduino UNO Q. No cloud inference: the camera and mic are processed on the board, and alerts go out over Telegram.`
- `aware.md` L28
  - Current: `My goal for the edge track: a device where you describe what to watch for in plain English, and everything, including the language model, stays on the board. Camera and mic data never leave the room.`
  - New: `My goal for the edge track: a device where you describe what to watch for in plain English, and every model, including the language model, runs on the board. Nothing goes to a cloud model.`
- `aware.md` L32
  - Current: `It was my first solo hackathon project, so I built every part: ...`
  - New: `I built it solo, so every part is mine: ...` (keep the rest of the line)
- `aware.md` L57
  - Current: `No API costs, and nothing leaves the device.`
  - New: `No API costs, and no camera or mic data goes to a cloud model.`
- `content/resume.md` L55 (and the matching bullet in Resume-improved.tex / the PDF)
  - Current: `- Built an offline home-awareness device running YOLOv8 and YAMNet on a {{stat:aware.boardCost}} Arduino UNO Q with QNN.`
  - New: `- Built an on-device home-awareness system running YOLOv8 and YAMNet on a {{stat:aware.boardCost}} Arduino UNO Q with QNN, with no cloud inference.`

### H2. Hackathon roles: only Animarker and AWARE were solo
Per Nathan, AWARE and Animarker are his only two solo hacks; every other hack had teammates. Four cards say "solo" and three say "my repo". The chat index shows the same `Role:` line, so the chat repeats it.

| File / line | Project | Current | New |
|---|---|---|---|
| site.ts L239 | Gaming and Mental Health Analyzer | `displayRole: "solo"` | `displayRole: "team project"` |
| site.ts L459 | Wasteland | `"solo"` | `"team project"` |
| site.ts L470 | VR ODM Gear Sim | `"solo"` | `"team project"` |
| site.ts L481 | Street Cleaner | `"my repo"` | `"team project"` |
| site.ts L493 | Object-Love-Interface | `"my repo"` | `"team project"` |
| site.ts L504 | Stupid Spotify | `"my repo"` | `"team project"` |
| site.ts L223 | AgenticArmy | `"repo on my GitHub"` | `"team project"` |
| site.ts L548 | Omni-Reality | `"team project, my repo"` | `"team project; the post-event work is mine"` |
| site.ts L571-573 | awards: Street Cleaner, OLI, Stupid Spotify | `role: "Repo owner"` | `role: "Team project"` |
| content/awards.md L25-27 | same three rows | `Repo owner` | `Team project` |
| gaming-mental-health-analyzer.md L9 | frontmatter | `role: "owner"` | `role: "team"` |
| agenticarmy.md L9 | frontmatter | `role: "repo owner"` | `role: "team"` |

- `gaming-mental-health-analyzer.md` L32
  - Current: `A hackathon project that uses machine learning to analyze ...`
  - New: `A Dataquest team project that uses machine learning to analyze ...` (keep the rest)
- Animarker should say it plainly, because it's a nice origin story:
  - `site.ts` L266 `covers`
    - Current: `Android wildlife tracker. A TensorFlow CNN identifies the species and the sighting goes on a map.`
    - New: `My first hackathon, done solo. An Android wildlife tracker: a TensorFlow CNN identifies the species and the sighting goes on a map.`
  - `content/projects/animarker.md` L9: `role: "owner"` → `role: "solo"`
  - `animarker.md` L17
    - Current: `A crowdsourced wildlife tracker using computer vision to identify and map animal sightings worldwide. Built with Kotlin, TensorFlow and Google Maps API.`
    - New: `An Android app that identifies an animal from a photo and puts the sighting on a map. Built with Kotlin, TensorFlow and the Google Maps API. It was my first hackathon, and I did it solo: a small online event that ran over two weeks, where everyone was in high school, me included.`

### H3. TeraGo parser: it works, but it isn't deployed
**Settled:** Nathan shows both TeraGo terms as one entry dated May to Aug 2026, covering all his TeraGo work. That keeps MCC as the only summer 2025 job and stops TeraGo from appearing twice. The parser stays under that entry. "Automated" and "opens Jira issues" read as if it ran in production, so the copy says what's true: it works end to end, TeraGo hasn't deployed it, and they've started revisiting it. No usage numbers, and no dates on the parser itself.

- `src/data/site.ts` L104 `summary` (this also takes the LibreChat proposal off the home summary; a proposal isn't a deliverable)
  - Current: `Automated outage ticketing: a local LLM on Ollama reads non-standard provider outage emails and opens Jira issues. Also built Channel Finder, a Python RF tool with a 760-case validation harness that shortlists clear channels from MapInfo spectrum records, plus a Copilot Studio agent and a self-hosted LLM proposal to cut Copilot licensing costs.`
  - New: `Built a working outage-email parser: a local LLM on Ollama reads providers' non-standard outage emails and opens Jira issues. It works end to end, but TeraGo hasn't deployed it yet; they've started revisiting it. Also wrote Channel Finder, a Python tool that shortlists clear RF channels from MapInfo spectrum records, validated on 760 test cases, and deployed a Copilot Studio agent that answers engineers' RF questions.`
- `site.ts` L106 `stack`: keep as is (Python, Ollama, Microsoft Graph, Jira, Copilot Studio, SharePoint, MapInfo data). The parser backs Ollama, Microsoft Graph and Jira.
- `content/experience.md` L17
  - Current: `- Automated outage ticketing in Python: a local LLM on Ollama pulls the details out of non-standard provider outage emails and opens Jira issues, reading mail through Microsoft Graph.`
  - New: `- Built a working outage-email parser in Python: a local LLM on Ollama pulls the details out of non-standard provider outage emails and opens Jira issues, reading mail through Microsoft Graph. It works end to end, but TeraGo hasn't deployed it yet.`
  - L20 (LibreChat proposal) stays on /experience.
- `content/experience/terago.md`
  - L5 `description`: `Software Engineering Intern at TeraGo, May to Aug 2026: automated outage ticketing, Channel Finder and more.` → `Software Engineering Intern at TeraGo, May to Aug 2026: an outage-email parser on a local LLM, Channel Finder, and a Copilot Studio agent.`
  - L23: `- Automated outage ticketing in Python: a local LLM on Ollama reads provider outage emails and opens Jira issues.` → `- An outage-email parser in Python: a local LLM on Ollama reads provider outage emails and opens Jira issues. It works end to end; TeraGo hasn't deployed it yet.`
  - L37: `> **Outage emails to Jira (automated).** Reads the mailbox through Microsoft Graph, has a local LLM on Ollama pull out the key details, and opens a Jira issue.` → `> **Outage emails to Jira (working, not deployed).** Reads the mailbox through Microsoft Graph, has a local LLM on Ollama pull out the key details, and opens a Jira issue. It works end to end, but TeraGo hasn't put it into use yet. They've started revisiting it.`
  - L47 `Outage ticketing:` → `Outage-email parser:` (the diagram stays)
  - L64: `- The outage ticketing runs a local model on Ollama. Emails are processed locally, with no per-call API cost.` → `- The parser runs a local model on Ollama, so emails are processed locally, with no per-call API cost.`
  - Results, after L70, add: `- Outage-email parser: works end to end, not deployed yet.`
  - The LibreChat proposal (L26, L43, L65) stays on this page.
- `content/experience/index.md` L16: `What he built at TeraGo: automated local LLM outage ticketing, Channel Finder, a Copilot Studio agent and the self-hosted LLM proposal.` → `What he built at TeraGo: an outage-email parser on a local LLM (working, not deployed), Channel Finder, a Copilot Studio agent and a self-hosted LLM proposal.`
- `content/local-ai.md`
  - L69: `and in an automation at work.` → `and in an email parser he built at work.`
  - L80 row: `| TeraGo | Ollama automation that extracts details from outage emails and opens Jira issues | Local | May to Aug 2026 |` → `| TeraGo | Ollama parser that extracts details from outage emails and opens Jira issues (working, not deployed) | Local | May to Aug 2026 |`
  - L94 heading: `## TeraGo outage ticketing on Ollama` → `## TeraGo outage-email parser on Ollama`
  - L96: `At TeraGo (May to Aug 2026) he automated outage ticketing in Python: ...` → `At TeraGo (May to Aug 2026) he built an outage-email parser in Python: a local LLM on Ollama extracts the key details from non-standard provider outage emails and the pipeline opens Jira issues. It works end to end, but TeraGo hasn't deployed it yet. Details in [TeraGo](experience/terago.md).`
- Skills stay: Ollama and Microsoft Graph remain in `site.ts` L576 and L580, `skills.md` L25 and L69, and `resume.md` L11 and L17. The parser backs them.
- `content/resume.md` L26, and the same bullet in `Resume-improved.tex`, then rebuild `public/Nathan_Espejo_Resume.pdf`. The live PDF says "Automated outage ticketing".
  - Current: `- Automated outage ticketing for non-standard provider emails: a local LLM on Ollama extracts the key details and the pipeline opens Jira issues through Microsoft Graph.`
  - New: `- Built an outage-email parser: a local LLM (Ollama) extracts the key details from non-standard provider emails and opens Jira issues through Microsoft Graph. Works end to end; not yet deployed.`
- **Tests and checks that pin the old word (update them in the same PR):**
  - `tests/views/resume.test.tsx` L11-12: `test("resume says Automated, not Prototyped", ...)` / `assert.match(html, /Automated outage ticketing/)` → `test("resume describes the outage parser honestly", ...)` / `assert.match(html, /outage-email parser/); assert.match(html, /Jira/); assert.doesNotMatch(html, /Automated/);`
  - `tests/views/case-studies.test.tsx` L63-64: `test("terago describes the outage ticketing as automated", ...)` / `assert.match(terago, /automated/i)` → `test("terago says the parser works but is not deployed", ...)` / `assert.match(terago, /outage-email parser/i); assert.match(terago, /not deployed/i); assert.doesNotMatch(terago, /automated/i);`
  - `scripts/check-render.mjs` L18: `"/resume": "Automated outage ticketing"` → `"/resume": "outage-email parser"`

### H4. MCC: summer 2025
- `src/data/site.ts` L114: `terms: [{ start: "2024-05", end: "2024-08" }], dates: "May 2024 to Aug 2024"` → `terms: [{ start: "2025-05", end: "2025-08" }], dates: "May 2025 to Aug 2025"`
- `content/experience/mcc.md` L7: `dates: "May 2024 to Aug 2024"` → `dates: "May 2025 to Aug 2025"`
- `mcc.md` L15: `from May to Aug 2024.` → `from May to Aug 2025.`
- On-site order: MCC (summer 2025) now ends after WEMars's first term (Apr 2025). If the experience list sorts by `terms`, check it still reads newest first.

### H5. Auralis "Live" link goes to someone else's app
`https://auralis.vercel.app` is a different project, a music app titled "Auralis" ("Listen to music without adds"). The page's URL is the real one; I checked both on Oct 17.
- `site.ts` L291: `{ label: "Live", href: "https://auralis.vercel.app" }` → `{ label: "Live", href: "https://stop-googling-symptoms.tech" }`

### H6. CareBridge home card: give him a part, or credit the team more clearly
This card has one of the four home slots but says nothing about him. If Nathan answers N3, use:
- `site.ts` L298 `covers` new: `Overall 3rd at Spark 2026, with my team. I built [HIS PART]. We started from a winter storm that cut off a regional hospital and led to missed referrals and follow-ups. Patients check in by chat or voice, and providers get one timeline with risk signals pulled from those conversations.`
- **Fallback (no answer):** keep the current card. Hold off on swapping in Omni-Reality, since Nathan decided CareBridge stays on home with team credit. The card is honest as it is; it's just thin.

### H7. CareBridge case study is pasted Devpost copy
It's linked from a home card, so it gets read. Voice and team credit:
- `content/projects/carebridge.md` L17-23: keep as is.
- Replace L35-70 (`## Description` through `### Challenges Overcome`) with:
```
## What it does

Patients check in by chat or voice. Each conversation becomes a structured summary on a timeline, and providers see every patient in one dashboard, with risk signals flagged from what patients said.

## How it works

A React and TypeScript frontend talks to a FastAPI backend. Supabase stores the data, with row-level security and role-based access. Cohere reads the conversations, ElevenLabs handles voice, and risk flags combine keyword rules with model output.

## Why

A winter storm cut off a regional hospital, and missed referrals and follow-ups turned into emergencies. We picked that one coordination failure and built for it.
```
- The CareBridge `/projects/carebridge` link: HomeView L144 links every featured card to `/projects/${project.id}`, but `carebridge.md` has no `route:` key, so in code that link has no page (likely a 404; aware, campus and homelab do have routes). Check with `npm run build`, then either add `route: /projects/carebridge` (plus the `onThisPage` sections the other case studies use) or render the title as plain text when `getPage` returns nothing, the way `caseStudyHref` already does for experience.

### H8. 3D Western: one verb, and say what 84.2% is measured against
- `content/experience.md` L27, `content/experience/3d-western.md` L27, `content/resume.md` L34 (and the PDF): `class-checked by a VLM` → `labelled by a VLM` (site.ts already says "labelled").
- Accuracy line, fallback that's true today:
  - `experience.md` L28 current: `- Benchmarked base vision models on the 2,559 clean renders (safe, unsafe and grey classes) as groundwork for fine-tuning. The best scored 84.2% accuracy.`
  - New: `- Benchmarked base vision models on the 2,559 clean renders (safe, unsafe and grey classes) as groundwork for fine-tuning. The best agreed with the dataset labels on 84.2% of them.`
  - `3d-western.md` L31: same change to the last sentence: `The best agreed with the dataset labels on 84.2% of them.`
  - `site.ts` L108: `the best one was right on 84.2% of 2,559 clean renders.` → `the best one agreed with those labels on 84.2% of 2,559 clean renders.`
  - If Nathan says the labels were hand-checked, use `matched the hand-checked labels on 84.2%` instead.
- **Figure slot (pending):** Nathan is getting rendered figures of the benchmark results. When they arrive, add one to the 3D Western entry: put it in `public/projects/3d-western-benchmark.webp`, add a `## Benchmark` figure to `content/experience/3d-western.md` with alt text that states what's plotted (models, metric, n = 2,559, classes), and consider a `media` field on the experience entry if the home card should show it (the `Experience` type has no `media` today, so that's a small code change). Keep the fallback 84.2% wording until then, and re-check it against the figure's labels.

### H9. WEMars /experience page: modest, not weak
He has only just rejoined, so claim nothing new. Drop "looked into" because it reads as "didn't build".
- `content/experience.md` L35-36
  - Current: `- Now: AI and autonomy for the rover. Just getting started.` / `- 2024-25: built wireless camera streaming on ESP32-CAM, and looked into networking to a central hub and computer vision for navigation markers.`
  - New: `- Since Sep 2026: back on the software team, on AI and autonomy for the rover.` / `- 2024-25: built wireless camera streaming for the rover on the ESP32-CAM.`
- `content/experience/wemars.md` L15-21
  - New body:
```
WEMars is Western's Mars rover team. Nathan was on its software team from Sep 2024 to Apr 2025 and rejoined in Sep 2026 to work on AI and autonomy for the rover. The new term has just started.

## 2024-25: camera streaming

- Built wireless camera and video streaming on the ESP32-CAM for the rover.
```
- `experience/index.md` L18: `camera and comms on the earlier term` → `camera streaming in 2024-25`.

---

## MEDIUM

### M1. projects/index.md featured list should match home
`content/projects/index.md` L14-21: rename the heading `## Flagship and featured` and keep only Campus, NixOS homelab, AWARE and CareBridge. Move AgntOS, AgenticArmy and Glyph to the top of `## Other projects`.
- AgntOS and Cyberdeck lines: use the new text in M8 and M3.
- L26 CareBridge (moved up): `- [CareBridge](carebridge.md): The CareBridge rural care platform from Spark 2026 (overall 3rd), built by a team; the repo is a teammate's (liamma06/Spark).`
- L17 homelab: `[Homelab and NixOS](homelab.md)` → `[NixOS homelab](homelab.md)`. Do the same in `content/index.md` L19, `content/skills.md` (every `[Homelab and NixOS]`) and `content/resume.md` L46 (`### Homelab and NixOS` → `### NixOS homelab`).
- `agntos.md` L7 and `agenticarmy.md` L7 say `rank: featured`, but neither is on home. Change both to `rank: archive`, like the other non-home pages.

### M2. Card and page stacks that disagree (checked against the GitHub repos)
- Lumen: the repo is Vite + React + TypeScript, not Next.js. `site.ts` L361 `["Unity", "C#", "MongoDB Atlas", "Next.js"]` → `["Unity", "C#", "React", "TypeScript", "MongoDB Atlas"]`.
- Object-Love-Interface: the repo is Python, C++ and JavaScript. `site.ts` L500 `["ESP32", "Arduino", "Python"]` → `["ESP32", "Arduino", "Python", "Node.js"]`. `other.md` L72 `Built with Python, Node.js and Express.` → `Built with ESP32 boards running Arduino code, plus Python and Node.js.`
- Rubber Band Turret: the repo is C++ only. `site.ts` L417 `["Arduino", "Bluetooth", "Kotlin"]` → `["Arduino", "C++", "Bluetooth", "Android"]`.
- Auralis: `site.ts` L293 `["React", "Three.js", "Cloudflare", "Python"]` → `["Next.js", "Three.js", "face-api.js", "FastAPI"]` (matches the page and his résumé).

### M3. Cyberdeck: abandoned, archived, short
Nathan dropped it. Say so once and keep it short.
- `site.ts` L380: `group: "hardware"` → `group: "archive"`. Add `displayStatus: "abandoned"`.
- `site.ts` L382 `covers`: `Handheld Raspberry Pi 3B that boots straight into a terminal. No desktop, just the terminal.` → `A handheld Raspberry Pi 3B that boots straight into a terminal. I got the terminal setup and a stats screen working and modeled a case in Blender, then dropped it.`
- `site.ts` L384 alt: `Cyberdeck Work-in-Progress Build` → `Cyberdeck parts, before I set the project aside`
- `site.ts` L390 `stack`: `["Raspberry Pi", "Linux", "3D printing"]` → `["Raspberry Pi", "Linux", "Python", "Blender"]`
- `content/projects/cyberdeck.md`: in the frontmatter, set `role: "solo"`, add `status: abandoned`, and keep `rank: archive`. Replace the whole body (L14-86) with:
```
# Cyberdeck

A handheld Linux computer built around a Raspberry Pi 3B that boots straight into a terminal. I dropped it before the build was done.

## What I built

- Power-on autologin into a Wayland kiosk (cage) running foot and tmux, so it lands in a terminal with no desktop.
- A Python script that streams CPU, RAM, temperature and network stats over USB serial to an M5Stack M5GO screen running PlatformIO firmware.
- A setup script that recreates the environment, plus RetroArch for NES, SNES and PS1 games.
- A case modeled in Blender around a 5-inch touchscreen, battery and speaker.

## Status

Abandoned.

## Links

- GitHub: https://github.com/HasNate618/cyberdeck
```
- `content/projects/index.md` L38: `- [Cyberdeck](cyberdeck.md): How the Raspberry Pi cyberdeck is built and boots into a terminal-first setup.` → `- [Cyberdeck](cyberdeck.md): An abandoned Raspberry Pi handheld that boots into a terminal.`
- This goes from 5 chat chunks to about 2.

### M4. Frontmatter `status: in-progress` vs the one in-progress line
The chunk header for every Campus and Homelab section says "status: in-progress", so the chat can call the homelab unfinished.
- `content/projects/homelab.md` L13: `status: in-progress` → `status: active`
- `content/projects/campus.md` L13: `status: in-progress` → `status: active` (it's in daily use; the single "evaluation in progress" line at L72 stays and is the only one).

### M5. Homelab: lead with what he built, and fix the machine count
- `homelab.md` L33: `All of it.` → `I designed and built everything below. The agents edit config inside it, and I review every change before it applies.`
- `homelab.md` L21: `- One version-controlled Nix flake defines two machines: my laptop (flow) and a home server (home), plus a NAS.` → `- One version-controlled Nix flake defines two machines: my laptop (flow) and a home server (home).` (If the NAS matters, N7.)
- `site.ts` L158 sessions stat: add `home: false`, so the home stats read 2 machines and 27 hardened containers. The session count stays on the case study.
- `homelab.md` L24 tl;dr: move it to the end of the list (after the skills line), so the engineering comes first.

### M6. Lumen: drop the Devpost voice
- `lumen.md` L17: `A calming companion that listens, understands, and responds with personalized mini-games tailored to your emotional state. Built with React, TypeScript and Unity3D.` → `Built at TerraHacks 2025 with a team of four. You check in on how you feel, Gemini reads it, and Lumen picks a mini-game to match. I built the Unity mini-games.`
- `lumen.md` L36: `Lumen is a mental wellness companion that listens when no one else does. It invites users to check in ...` → `Lumen is a mental wellness app. You check in ...` (keep the rest of the sentence)
- `lumen.md` L52: delete `- Bridges clinical insight with accessible interface`
- `lumen.md` L60-64: delete the `3. **Beautiful UI**` block and renumber `4.` to `3.`.
- The team of four comes from the repo's package.json author line (Alex Meng, Zikora, Nathan for game development, Vishnu).

### M7. Auralis: drop the Devpost voice
- `auralis.md` L36: `Auralis is an AI-powered virtual doctor that conducts face-to-face video consultations with emotion awareness.` → `Auralis is a 3D virtual doctor you talk to by voice. It reads your facial expression while you talk and flags when what you say and how you look don't match.`
- L57: delete `- Seamless conversation flow`
- L60-61: `- AI adapts communication style based on detected emotions` / `- Empathetic and personalized interactions` → `- Adjusts its replies to the emotion it detects`
- L82: delete `- Healthcare AI must balance accuracy with empathy`
- L74: `- **Team Coordination**: 4 team members working on parallel features` → `- **Team coordination**: four of us building features in parallel`

### M8. AgntOS: the abandoned build that led to the homelab
What it was: an AI system built just for NixOS configuration, with its own memory system, inspired by Hermes Agent and NixOS. Nathan got impatient because he wanted to be on NixOS already, so he switched, ran Hermes Agent on it, and found that works really well, especially with cloud models and their broader general knowledge. The repo backs up "started in Rust": GitHub shows about 500 KB of Rust (a `crates/` workspace) out of roughly 800 KB total, created May 16, 2026, last pushed May 26, 2026. It has 10 chat chunks today, more than any other project, and outranks Campus on "agent" and "Rust" questions. This cuts it to about 2.
- `site.ts` L194-196: `group: "ai", order: 5` → `group: "archive", order: 12`; `displayStatus: "concept"` → `displayStatus: "abandoned"`; `covers` →
  `An AI system just for configuring NixOS, with its own memory, inspired by running Hermes Agent on NixOS. I started it in Rust, then got impatient because I wanted to be on NixOS already. So I switched, ran Hermes on it, and it worked really well. That became my homelab.`
- `site.ts` L198: drop the `agntos-0.webp` "AgntOS Dev VM Running KDE Plasma" media entry (it implies a working system). Keep the banner.
- `content/projects/agntos.md`: in the frontmatter, set `rank: archive`, `role: "solo"`, `status: abandoned`, `related: [index.md, homelab.md]`, and change the `description` to `An AI system for NixOS configuration that I stopped building once Hermes Agent on NixOS did the job.` Replace the whole body (L15-108) with:
```
# AgntOS

An AI system built just for managing NixOS configuration, with its own memory system. The idea came straight from Hermes Agent and NixOS: an agent that proposes config changes, on a system that can roll any of them back. I started building it in Rust in May 2026.

## Why I stopped

I got impatient. I wanted to be on NixOS already, so I switched my machines over and ran Hermes Agent on them instead. That works really well, especially with cloud models and the broader general knowledge they bring. That setup is now my [NixOS homelab](homelab.md).

## Links

- GitHub: https://github.com/HasNate618/AgntOS
```
- `content/projects/homelab.md` L29, at the end of "Why I built it", add: `I started building my own agent for NixOS configuration first (AgntOS), got impatient, and switched to NixOS with Hermes Agent instead. It works really well.` Add `agntos.md` to `related` on L8.
- `content/projects/index.md` L19 (moved out of featured per M1): `- [AgntOS](agntos.md): An AI system for NixOS configuration he stopped building once Hermes Agent on NixOS did the job.`
- `content/skills.md`: remove the AgntOS links from L18 (LLM agents), L19 (Tool calling), L52 (SQLite) and L58 (NixOS). L41 → `- **Rust**: [AgntOS](projects/agntos.md) (abandoned)`.

### M9. Third-person pages a recruiter can reach from a card
Only aware, campus, homelab and terago render as pages; the rest are served at /knowledgebase and to the chat. Make the two that cards link to sound like him:
- `omni-reality.md` L30: `Nathan kept building on his repo from Sep 21 to 23: ...` → `I kept building on my repo from Sep 21 to 23: ...`
- `omni-reality.md` L34: `The repo is Nathan's.` → `The repo is mine.`
- Rule going forward: route pages and project pages use "I"; index, about, skills, awards and experience docs use "Nathan/he". Write that rule in AGENTS.md.

### M10. Omni-Reality card: move the photo credit out of the text
- `site.ts` L549: delete ` Screenshot by Tim Roch.` from `covers` (it's already in the alt text and the Credit section). The last sentence becomes `Built with my team, and I kept going on the spatial system after the event.`

### M11. Projects intro: the team line
`content/projects.md` L14: `Team projects are labelled as team projects, and I only claim the parts I can name.` → `Most of my hackathon projects were team efforts and are labelled that way. Where I can name my part, I say it.`

### M12. about.md: a short block for recruiters (also helps the chat)
Add after L13 in `content/about.md`:
```
## In short

- Looking for: a Summer 2027 software engineering or applied AI internship.
- Program: 3rd-year Software Engineering at Western University, Dean's Honour List 2024 and 2025.
- Roles: Software Engineering Intern at TeraGo; VP of Data/ML at 3D Western.
- Start with: Campus, then the NixOS homelab and AWARE.
- Contact: nate.e.espejo@gmail.com or linkedin.com/in/nathan-espejo.
```

### M13. other.md: date formatting and dated games
- `other.md` L34: `(2024 (approx.).)` → `(2024, approx.)`; L50: `(2023 (approx.).)` → `(2023, approx.)`
- L57, L62, L67: `(undated.)` → `(2024.)`, to match site.ts L515, L527 and L537, which say 2024. Leave the Google Play wording alone, as Nathan asked.
- L67: `The Ultimate Tic Tac Toe experience on Android.` → `Ultimate Tic Tac Toe for Android.`

### M14. Em dashes the public can see
- `src/app/llms.txt/route.ts` L51: `` ` — ${base}${project.file}` `` → `` `: ${base}${project.file}` `` (or ` (${base}${project.file})`)
- `src/app/api/chat/lib/generate-followups.ts` L75-76: see C4.

---

## LOW

- **L1. "Software Engineering" in the first main-column line.** The sidebar headline already says it (SiteHeader L79), so this is optional. `HomeView.tsx` L52: `{site.identity.year} at {site.identity.education.school}.` → `3rd-year Software Engineering at {site.identity.education.school}.` That drops the "(2026-27)" from the line; it's still in /about.
- **L2. TeraGo LibreChat proposal** stays on /experience and terago.md only (H3 takes it off the home summary). `content/experience.md` L20: `- Proposed a self-hosted LLM platform (LibreChat with SharePoint and Jira) to cut per-user Copilot licensing costs.` is fine as is.
- **L3. Animarker, Careerly, SafeRoute, VitalSign, FLEXFIRE-X marketing words.** `careerly.md` L17: `AI-powered virtual job fair built in Unity that makes career exploration fun and inclusive.` → `A virtual job fair in Unity where you walk between booths and talk to AI mentors.` `flexfire-x.md` L17: `..., built to mimic the immersive cyberware experience of Cyberpunk 2077.` → `..., inspired by the arm launchers in Cyberpunk 2077.` `vitalsign.md` L30: `VitalSign is an AI-powered bridge between sign language and speech that doesn't just translate what you say, but how you feel.` → `VitalSign turns sign language into speech and carries the emotion from your face into the voice.` `saferoute.md` L27: `It combines crowdsourced data with intelligent routing to keep users safe.` → `Users report hazards, and the app routes around them.`
- **L4. Other.md OLI line.** `L72`: `... so you can interact with them in an immersive, real-life setting.` → `... so you can talk to everyday objects.`
- **L5. site.ts code comment em dash** (L14 `the flagship — and so`): not visible on the site, but it's in the repo Nathan shares. → `the flagship, and so`.
- **L6. Stupid Spotify GitHub link case.** site.ts L510 `Stupid-Spotify` vs other.md L83 `stupid-spotify`. Both resolve; use `Stupid-Spotify` in both.
- **L7. about.md L25 "Hermes Agent profiles (an AI agent from Nous Research)".** → `Next come a NixOS homelab where AI agents propose config changes that I approve, and the on-device AWARE build.` (one fewer agent name up front)
- **L8. now.md L17** `Both NixOS machines run 24/7. The agents make config changes, and I approve each one.` → `Both NixOS machines run 24/7. Agents propose config changes, and nothing applies until I approve it.` (matches home)
- **L9. Glyph frontmatter** `role: "owner"` → `role: "solo"` (same for whack-a-ml, flexfire-x, saferoute, portfolio-v2, cyberdeck, agntos). "owner" in the chat header reads like repo ownership, which is the thing we're removing elsewhere.
- **L10. Home awards line.** HomeView L189: `mostly with teams.` → `all with teams.` All eight award projects (Careerly, Auralis, Lumen, Eyecandy, CareBridge, Street Cleaner, Object-Love-Interface, Stupid Spotify) were team projects, per Nathan's Oct 17 note.

---

## CHAT

How the chat works: the query is embedded with Cohere (embed-v5), the top 30 chunks by cosine similarity are reranked to 10, and index docs get a 0.5 penalty. I couldn't run the real path without the Cohere key. Instead I ran a BM25 keyword test over the 203 indexed chunks (`embeddings-cache.json`) with 13 recruiter questions. What it showed:
- **The stale facts are all in the index:** MCC "May 2024" (mcc.md), "Automated" (5 docs: experience, experience/index, terago, local-ai, resume), "first solo" and "no internet" (aware), `Role: solo` on Gaming Analyzer, "Repo owner" (awards), "looked into" (WEMars x2), "class-checked" (3 docs), "status: in-progress" headers (campus, homelab), and the wrong auralis.vercel.app URL. They're all fixed by H1-H9 and M3-M4, plus a rebuild.
- **Nothing private turned up:** no phone pattern, MiMo, DeepSeek, Qwen3, Shieldstral, or family context.
- "Is the TeraGo parser in production?" pulls local-ai, terago and experience chunks that all say "automated" today, so the bot would overstate it. H3 rewords it to "works end to end, not deployed".
- "Has he done solo hackathons?" pulls awards plus aware's "first solo hackathon project". H1 and H2 fix that.
- No chunk answers "how do I contact him" in plain words. The system prompt carries the contact line (rule 9), and M12 adds one to about.md.
- AgntOS has 10 chunks, the most of any project, so it can outrank Campus on "agent" and "Rust" questions. M8 cuts it to about 2 (abandoned concept), and M3 cuts Cyberdeck from 5 to about 2.

### C1 (high). Starter chips: questions a recruiter asks first
`content/chat.md` L7 `starters`:
- Current: `[What is Campus and how does its retrieval work?, How does Nathan keep model costs low?, What did Nathan build at TeraGo?, How do the Hermes Agent profiles change his homelab safely?, What kind of internship is Nathan looking for in Summer 2027?]`
- New (still five, so `tests/views/chat.test.tsx` "all five starters" holds):
  `[What are Nathan's strongest projects?, What did Nathan build at TeraGo and 3D Western?, How does Campus answer from his course files?, What software engineering work has he done beyond AI?, What internship is he looking for and how do I reach him?]`
- Why: one chip for "best work" (it lands on Campus, homelab, AWARE and CareBridge via rule 13), one for both roles, one deep dive on the flagship, one for the general SWE track, and contact. The Hermes and cost questions are good second questions; they move to the fallback follow-ups (C5).

### C2 (high). System prompt: shape, evidence and status words
`src/app/api/chat/lib/system-prompt.ts`
- L48: `Be warm and friendly. Talk like a helpful person, not a robot. Greet briefly when the conversation starts, but don't be overbearing.` → `Be warm and friendly. Talk like a helpful person, not a robot. Skip greetings and answer first.` (this conflicts with L42 "No spoken preamble" today)
- Insert after L79 (rule 7b):
```
7c. Default shape: 2 to 4 sentences, or up to 5 short bullets. Lead with what Nathan built and the evidence CONTEXT gives (a technology, a number, a result), then stop. Go longer only when the visitor asks for detail.
```
- Replace rule 13 (L85) with:
```
13. For broad questions (his strongest work, what he has built, whether he fits a role), draw first from his roles at TeraGo and 3D Western and the home-page projects, in this order: ${PROJECT_ORDER}. Leave abandoned projects (AgntOS, Cyberdeck) and the hackathon archive out unless the visitor asks about them.
```
- Add after rule 18 (L90):
```
19. Status words are facts. Say a project is deployed, in production, live, used by others or finished only when CONTEXT says so. If CONTEXT says something works but was not deployed, say exactly that.
20. Solo and team are facts. Call a project solo only when its Role in CONTEXT says solo, and never call anything his "first" unless CONTEXT says so.
21. If someone asks whether Nathan fits a role, answer with the matching evidence from CONTEXT and point them to his email. Do not rate him or promise anything for him.
22. There is no phone number in the record. Never give one; offer the email and LinkedIn instead.
```

### C3 (high). Rebuild the index after the content PR
Run `npm run build:embeddings` (needs COHERE_API_KEY), then `npm run check:embeddings`. Until then the chat keeps serving the old copy, even after the pages change.

### C4 (medium). Follow-up generator prompt: no em dashes, recruiter-shaped
`src/app/api/chat/lib/generate-followups.ts` L75-76:
- Current: `- About Nathan's projects, skills, or experience — refer to him in third person (he/his/Nathan)` / `- Never ask about the chatbot or "you" — e.g. "What languages does Nathan know?" not "What languages do you know?"`
- New:
```
- About Nathan's projects, skills, or experience. Refer to him in third person (he/his/Nathan)
- Never ask about the chatbot or "you". For example, "What languages does Nathan know?", not "What languages do you know?"
- Prefer what a recruiter would ask next: what he built, how it works, what came of it, or how to contact him
- On team projects, ask what the team built, not what he personally built
- Never use em dashes
```

### C5 (medium). Fallback follow-ups: stale and off-message
`src/app/api/chat/lib/followup-fallback.ts`. The rules are tried in order, so new ones go at the top of `TOPIC_RULES`:
```
{ test: /\bcampus|retrieval|brightspace|course\b/i,
  questions: ["How does Campus rank search results?", "How is Campus tested?", "What does the Campus agent log?"] },
{ test: /\bterago|internship|3d western|experience|role\b/i,
  questions: ["What is Channel Finder?", "What did he lead at 3D Western?", "What internship is he looking for?"] },
{ test: /\baware|edge|arduino|on-device\b/i,
  questions: ["How does AWARE turn English into rules?", "Which models run on AWARE's board?", "How does Nathan keep model costs low?"] },
{ test: /\bcontact|hire|email|resume|résumé\b/i,
  questions: ["How can I contact Nathan?", "Where is his résumé?", "What internship is he looking for?"] },
```
- Rust rule: `"What did Nathan build with AgntOS?"` → `"How is his homelab defined in Nix?"` (AgntOS is abandoned)
- Web rule: `"Which web projects has he shipped?"` → `"What has he built with React and FastAPI?"`
- AI rule (currently all homelab): → `["How does Campus retrieve answers?", "What did he build at TeraGo?", "How does AWARE run models on-device?"]`
- Homelab rule regex: `proxmox` → `nixos` (he doesn't use Proxmox). Add `"How do his Hermes Agent profiles change config safely?"` as its first question.
- Mobile rule: `"What is Street-Cleaner?"` → `"What is Animarker?"`; `"What mobile features did he design?"` → `"What is SafeRoute?"` (the old one asks for a personal role on team work)
- Hackathon rule: `"What was his best AI hackathon project?"` → `"What did he build at Hack the 6ix?"`
- `DEFAULT_FOLLOWUPS` → `["What is Campus?", "What did he build at TeraGo?", "How can I contact Nathan?"]`

### C6 (medium). Chat corpus header says "owner"
`src/app/api/chat/lib/chunks.ts` `metaLine` prints `role: owner` from frontmatter on most solo projects. L9 fixes the data. No code change needed.

### C7 (medium). HOW YOU WORK: shorter
`system-prompt.ts` L57: `give a clear ~150-word explanation` → `give a clear explanation in about 80 words`. A recruiter who asks how the chat works wants the gist.

### C8 (low). Intro line
`content/chat.md` L12: `Hi! I'm Nathan's AI assistant. Ask me about his projects, experience or what he is looking for.` → `Hi! I'm Nathan's AI assistant. Ask about his projects, his internship and club roles, or how to reach him. I answer from his public notes.`

---

## Needs Nathan (each has a fallback already written above)

1. **Your part on CareBridge, Careerly, Auralis and Eyecandy** (one line each, such as the screen, endpoint or pipeline). *Fallback:* "Team project".
2. **3D Western 84.2%:** were the VLM labels hand-checked at all, and is it OK to publish? *Fallback in use:* "agreed with the dataset labels on 84.2%".
3. **AWARE extras (optional):** a demo video link or one measured number (FPS or command-to-rule time), and whether video clips are sent over Telegram too. *Fallback:* no number; "alerts go out over Telegram". Also optional: does the homelab NAS belong in the machine count (M5)?

Settled Oct 17, so don't ask again (recorded in `kb-private/notes/settled-facts.md` and nathan.db): AWARE solo and Animarker solo are his only two solo hacks; TeraGo is shown as one May to Aug 2026 entry covering both terms, by design, with the parser in it; AgntOS and Cyberdeck were abandoned; MCC is summer 2025 and is the only summer 2025 job shown.

Still optional from before: TeraGo outcomes (Channel Finder's pass rate and what it replaced; Copilot agent users) and a Campus retrieval number. The site reads honestly without them.

---

## Housekeeping (outside the repo)

Applied Oct 17. Backups: `kb-public-prev4/` and `nathan.db.bak-20261017` (first pass), `kb-public-prev5/` and `nathan.db.bak-20261017b` (second pass), `kb-public-prev6/` and `nathan.db.bak-20261017c` (this pass).
1. kb-public, TeraGo: the parser is in `experience/terago.md`, `local-ai.md` and `experience/index.md`, worded as "works end to end, but TeraGo hasn't deployed it yet; they've started revisiting it". It's undated, under the single May to Aug 2026 entry. Ollama and Microsoft Graph stay in `skills.md`.
2. kb-public `projects/index.md`: CareBridge "prototype" → "platform"; the AgntOS and Cyberdeck lines now say abandoned. `projects/aware.md`: "no internet" and "first solo hackathon project" → "no cloud inference" and "built it solo".
3. kb-public `animarker.md` role → solo; `gaming-mental-health-analyzer.md` role → team. `agntos.md` is rewritten with the real story (an AI system for NixOS config, impatience, switched to Hermes on NixOS). `cyberdeck.md` is now a short abandoned entry. The `homelab.md` link line and the `skills.md` AgntOS links are updated. MCC was already 2025.
4. nathan.db: Omni-Reality `showcase = yes` (projects row, hackathons row 22, fact 79); MCC row → 2025-05 to 2025-08; facts 125-130 cover solo hacks, the parser's status, MCC and Google Play; fact 131 is the single-entry TeraGo decision; fact 132 is the AgntOS story; fact 133 is Cyberdeck abandoned; fact 134 says 3D Western figures are pending. FTS rebuilt.
5. `kb-private/notes/settled-facts.md`: Nathan's answers in one place, so we never re-ask.

Not applied (Nathan's repos):
6. Resume repo: in `Resume-improved.tex`, change the TeraGo bullet to the H3 wording ("Works end to end; not yet deployed"), fix the AWARE "offline" bullet (H1) and the 3D Western "class-checked" bullet (H8), then rebuild `public/Nathan_Espejo_Resume.pdf`. Keep the single May to Aug 2026 TeraGo entry.
