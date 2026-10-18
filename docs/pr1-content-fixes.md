# PR #1 content fix list

PR: https://github.com/HasNate618/portfolio-v3/pull/1, branch `cursor/apply-portfolio-fixes-46d2` @ 665bf4b. Compiled Oct 17, 2026, 12:45 AM ET. Read-only: nothing was pushed.

Sources: **[C]** my content review (`kb-private/notes/pr1-review.md`), **[R]** the blind recruiter review (`kb-private/notes/blind-recruiter-review.md`), **[N]** Nathan's decisions from Oct 17.
I checked every "Current" against the branch files. Every fact in a replacement comes from the branch content, kb-public or nathan.db (fact ids are cited). No placeholders and no em dashes.

Rules applied:
- Campus loses the "4,687 chunks" stat on home.
- CareBridge stays on home, and Omni-Reality stays in AR and VR.
- Unknown numbers go to the "Needs Nathan's numbers" section, not into the copy.
- **Only one "in progress" line remains on the site:** `content/projects/campus.md` L74, "Retrieval and answer quality: evaluation in progress." It sits in the Campus case study's Results, which the chat also reads.

After applying: some tests check old copy and stats, so update them: `tests/views/home.test.tsx` L14 (4,687), `tests/views/case-study.test.tsx` L22-23 and L54 (4,687, 215), `tests/furniture.test.tsx` L67, and `tests/site.test.ts` "featured cards" if the order changes. Then run `npm run check:content` and rebuild the chat's search index.

---

## 1. First screen

**1. Show the name once.** [C]
`src/components/views/HomeView.tsx` L48
- Current: `<h1 className="text-4xl font-bold tracking-tight text-fg sm:text-5xl">{page.title}</h1>`
- Replace: `<h1 className="sr-only">{page.title}</h1>`
- Why: the sidebar (`SiteHeader.tsx` L70-74) already shows the name at the same size, so it appears twice side by side.

**2. Shorter headline.** [C][R]
`src/data/site.ts` L86
- Current: `headline: "Software engineer building applied AI tools (3rd-year Software Engineering, Western), focused on cost-efficient models with local and self-hosted options",`
- Replace: `headline: "Software engineer building applied AI tools. 3rd-year Software Engineering at Western.",`
- Why: the cheap-model point stays once, in the home intro (item 23).

**3. Put the internship ask first.** [C][R]
`src/components/views/HomeView.tsx` L55-58
- Current (below the intro `<div>`):
  ```
        <p className="mt-6 max-w-[68ch] text-muted">
          {site.identity.year} at {site.identity.education.school}. Looking for a{" "}
          {site.identity.seeking}.
        </p>
  ```
- Replace: move this `<p>` unchanged so it sits directly after the `<h1>` and before the intro `<div>`, and change `text-muted` to `text-fg`. The first visible line becomes: "3rd year (2026-27) at Western University. Looking for a Summer 2027 software engineering or applied AI internship."

**4. New "Right now" line.** [C][R][N]
`content/home.md` L16
- Current: `Right now: using Campus across six courses while I finish its retrieval evaluation, and approving whatever the homelab agents want to change next.`
- Replace: `Right now: using Campus every day across my six courses, and running my homelab, where agents propose config changes and nothing applies until I approve it.`
- Why: this removes an "in progress" mention, and "approving whatever" read as rubber-stamping.

**5. Cut the chat disclaimer from the home intro.** [C]
`content/home.md` L18
- Current: `The chat answers from my public notes. It can be wrong, so trust the pages first.`
- Replace: (delete the line)

## 2. Home project cards

**6. Campus card.** [C][R][N]
`src/data/site.ts` L122
- Current: `covers: "My courses are spread across six Brightspace pages, and I wanted one place to check deadlines, study from slides and test a draft against the brief. Campus syncs them into SQLite and answers from the course files, using a lexical prefilter, embeddings and a cross-encoder reranker. The 20-tool agent logs every change it makes to my notes or due dates, and it runs on any OpenAI-compatible endpoint, local or hosted. Retrieval and answer quality: evaluation in progress.",`
- Replace: `covers: "My courses are spread across six Brightspace pages, so I built one place to check deadlines, study from slides and test a draft against the brief. Campus syncs everything into SQLite and answers from the course files with hybrid retrieval: a lexical prefilter, embeddings and a cross-encoder reranker. Its 20-tool agent logs every change it makes to my notes or due dates, and it runs on any OpenAI-compatible endpoint, local or hosted.",`

**7. Campus stats.** [N][R]
`src/data/site.ts` L132-136
- Current:
  ```
          { key: "chunks", label: "chunks from 215 course files", value: "4,687" },
          { key: "tests", label: "tests in CI on every push", value: "308" },
          { key: "courses", label: "courses I use it in", value: "6" },
          { key: "files", label: "course files", value: "215", home: false },
          { key: "tools", label: "agent tools", value: "20", home: false },
  ```
- Replace:
  ```
          { key: "courses", label: "courses, in daily use (I'm the only user)", value: "6" },
          { key: "tests", label: "tests in CI on every push", value: "308" },
          { key: "chunks", label: "chunks", value: "4,687", home: false },
          { key: "files", label: "course files", value: "215", home: false },
          { key: "tools", label: "agent tools", value: "20", home: false },
  ```
- Why keep `chunks` and `files` as data: the résumé page (`content/resume.md` L42) uses them and has to match the PDF. They no longer show on home or in the case study (item 8).

**8. Campus case study: file count dated and approximate, no chunk count.** [N][R]
`content/projects/campus.md`
- L22 current: `- Hybrid retrieval over {{stat:campus.chunks}} chunks from {{stat:campus.files}} course files.`
  - Replace: `- Hybrid retrieval over my course files: just over 200 of them as of early October 2026.`
- L29 current: `My course material lives in Brightspace, spread across {{stat:campus.courses}} courses and {{stat:campus.files}} files. I wanted one place to look up deadlines, study from the slides, and check a draft against the assignment brief, running on hardware I control.`
  - Replace: `My course material lives in Brightspace, spread across {{stat:campus.courses}} courses. I wanted one place to look up deadlines, study from the slides, and check a draft against the assignment brief, running on hardware I control.`
- L72 current: `- {{stat:campus.chunks}} chunks indexed from {{stat:campus.files}} course files.`
  - Replace: `- As of early October 2026 it had synced just over 200 course files. I'm the only user, so that number is my course load, not adoption.`
- L74 stays as it is. It's the one remaining "in progress" line.
- Source: nathan.db fact 84 (215 course files).

**9. AWARE card: softer opener, end on the achievement.** [C][R]
`src/data/site.ts` L166
- Current: `covers: "My first solo hack. I pitched the idea to three teams at Hack the 6ix and none had the background, so I built it alone. It watches a camera, listens for sounds and reads sensors, and you set automations in plain English, like \"when glass breaks after 10pm, alert me.\" A 1B model turns that into a rule, and everything runs offline. Demo video and latency numbers: not posted yet.",`
- Replace: `covers: "My first solo hack, at Hack the 6ix 2026. I pitched it to three teams, but it wasn't a fit for any of them, so I built it alone. It watches a camera, listens for sounds and reads sensors, and you set automations in plain English, like \"when glass breaks after 10pm, alert me.\" A 1B model turns that into a rule, and vision, audio and the LLM all run offline on one $80 board.",`
- Source: kb-public aware.md L19, nathan.db fact 125.

**10. AWARE stats: lead with the engineering, keep the price second.** [R]
`src/data/site.ts` AWARE `stats`
- Current: `{ key: "boardCost", label: "Arduino UNO Q, all inference on board", value: "$80" },`
- Replace:
  ```
          { key: "ruleTick", label: "rule checks, no LLM in that loop", value: "500 ms" },
          { key: "boardCost", label: "Arduino UNO Q, all inference on board", value: "$80" },
  ```
- Source: `content/projects/aware.md` L23, nathan.db fact 112.

**11. AWARE case study: remove the "not posted yet" line.** [C][R][N]
`content/projects/aware.md` L62
- Current: `- Demo video and latency numbers: not posted yet.`
- Replace: (delete the line; the video and latency numbers are in "Needs Nathan's numbers")

**12. CareBridge card: lead with the result, say "team" once.** [C] (the recruiter's suggestion to swap in Omni-Reality was rejected per [N])
`src/data/site.ts` L296
- Current: `covers: "A team build at Spark 2026. We started from how a winter storm that cut off a regional hospital led to missed referrals and follow-ups. Patients check in by chat or voice, and providers get one timeline with risk signals pulled from those conversations. Built as a team; the repo is my teammate's.",`
- Replace: `covers: "Overall 3rd at Spark 2026, built with my team. We started from a winter storm that cut off a regional hospital and led to missed referrals and follow-ups. Patients check in by chat or voice, and providers get one timeline with risk signals pulled from those conversations.",`
- L304 current: `stats: [{ key: "place", label: "overall, Spark 2026", value: "3rd" }],`
  - Replace: `stats: [],` (the award badge already shows 3rd place)
- Credit still shows through `displayRole: "team project"` and the "GitHub (teammate's repo)" link.

**13. Homelab card: say what Hermes is, end with the fix.** [C][R]
`src/data/site.ts` L147
- Current: `covers: "My laptop and a home server built from used parts run from one NixOS flake. Hermes Agent profiles make the config changes, but every change waits for my approval and can roll back to the last good build. One bug I won't forget: a VPN set as the server's default route. When the peer died, the whole machine went dark until I reset it by hand.",`
- Replace: `covers: "My laptop and a home server built from used parts run from one NixOS flake. Hermes Agent, from Nous Research, proposes the config changes, but nothing applies until I approve it, and a failed build rolls back to the last good one. One bug I won't forget: I set a WireGuard VPN as the server's default route, the peer died, and the whole machine went dark until I reset it by hand. Now the VPN lives inside the one container that needs it.",`
- Source: kb-public homelab.md L15 and L55, `content/projects/homelab.md` L60, nathan.db fact 27.

**14. Homelab stats: about his engineering more than agent activity.** [R][C]
`src/data/site.ts` homelab `stats`
- Current:
  ```
          { key: "containers", label: "hardened containers", value: "27" },
          { key: "sessions", label: "agent sessions since June 2026", value: "472" },
          { key: "skills", label: "agent skills in git", value: "191" },
          { key: "toolCalls", label: "tool calls", value: "58,000", home: false },
  ```
- Replace:
  ```
          { key: "machines", label: "machines, one NixOS flake", value: "2" },
          { key: "containers", label: "hardened containers", value: "27" },
          { key: "sessions", label: "agent sessions since June 2026", value: "472" },
          { key: "skills", label: "agent skills in git", value: "191", home: false },
          { key: "toolCalls", label: "tool calls", value: "58,000", home: false },
  ```
- Why keep sessions on home: it's the one agent number that shows daily use. Skills and tool calls stay in the case study.

## 3. Experience

**15. TeraGo summary: tighter, real facts only.** [C][R]
`src/data/site.ts` L104
- Current: `summary: "Automated outage ticketing: a local LLM on Ollama reads non-standard provider outage emails and opens Jira issues. Also built Channel Finder, an RF tool that shortlists clear channels from MapInfo spectrum records and was validated on 760 test cases, plus a Copilot Studio agent and a self-hosted LibreChat proposal to cut Copilot licensing costs.",`
- Replace: `summary: "Automated outage ticketing: a local LLM on Ollama reads non-standard provider outage emails and opens Jira issues. Also built Channel Finder, a Python RF tool with a 760-case validation harness that shortlists clear channels from MapInfo spectrum records, plus a Copilot Studio agent and a self-hosted LLM proposal to cut Copilot licensing costs.",`
- Source: nathan.db facts 70, 121, 126.

**16. TeraGo: replace "estimated savings" with what's actually known.** [R]
`content/experience.md` L20
- Current: `- Proposed a self-hosted LLM platform (LibreChat with SharePoint and Jira) with estimated savings over Copilot.`
- Replace: `- Proposed a self-hosted LLM platform (LibreChat with SharePoint and Jira) to cut per-user Copilot licensing costs.`

**17. Delete the developer note on /experience.** [R]
`content/experience.md` L13
- Current: `Roles newest first. Dates, titles and locations come from the site data rather than from this file, so there is one place to correct them.`
- Replace: `Roles newest first.`

**18. 3D Western: consistent count, a real benchmark result, "was promoted".** [R][C]
`src/data/site.ts` L108
- Current: `summary: "Started on the Dockerized print pipeline, then got promoted to VP and led two developers building the print-approval dataset: 4,127 scraped models rendered in Blender and class-checked by a VLM, then used to benchmark base vision models. Ran alongside my TeraGo internship.",`
- Replace: `summary: "Started on the Dockerized print pipeline, then was promoted to VP and led two developers building the print-approval dataset: 4,127 scraped 3D models, rendered in Blender and labelled by a VLM. We used it to benchmark base vision models, and the best one was right on 84.2% of 2,559 clean renders. Ran alongside my TeraGo internship.",`
- Stat on the same entry, current: `stats: [{ key: "dataset", label: "labelled frames", value: "4,127" }] },`
  - Replace: `stats: [{ key: "dataset", label: "scraped 3D models", value: "4,127" }] },`
- `content/experience/3d-western.md` L31 current: `He benchmarked base vision models on the clean dataset, with safe, unsafe and grey classes, as groundwork for future fine-tuning.`
  - Replace: `He benchmarked base vision models on the 2,559 clean renders, with safe, unsafe and grey classes, as groundwork for future fine-tuning. The best scored 84.2% accuracy.`
- Source: nathan.db facts 55, 56, 57, 62. Ask Nathan whether 3D Western is fine with the 84.2% being public.

**19. WEMars: drop "just starting".** [N]
`src/data/site.ts` L111
- Current: `summary: "Western's Mars rover team. Rejoined in Sep 2026 on AI and autonomy, just starting. In 2024-25 I built wireless ESP32-CAM streaming." },`
- Replace: `summary: "Western's Mars rover team. I rejoined in Sep 2026 to work on AI and autonomy. In 2024-25 I built wireless ESP32-CAM streaming." },`

## 4. Awards

**20. Stop listing other people's repos as his role.** [R]
`src/data/site.ts` L564-567 (and the matching rows in `content/awards.md`)
- Current → Replace:
  - `role: "Team member (repo: she11fish/careerly)"` → `role: "Team project"`
  - `role: "Team member (repo: rickytang666/auralis)"` → `role: "Team project"`
  - `role: "Team member, built the Unity mini-games (repo: Dawgsrlife/lumen)"` → `role: "Team project; I built the Unity mini-games"`
  - `role: "Team member (repo: Duck-luv-pie/eyecandy)"` → `role: "Team project"`
  - `role: "Team project (repo: liamma06/Spark)"` → `role: "Team project"`
- The repo links stay on each project's own entry. If Nathan names his part (see Needs), replace "Team project" with "Team project; I built …".

## 5. Projects page

**21. Intro and team-credit line.** [C][R]
`content/projects.md`
- L12 current: `Most of my recent work is applied AI: agents, retrieval, and models picked for cost. Before that it was hardware, games and mobile apps, a lot of them built at hackathons.`
  - Replace: `Most of my recent work is applied AI: agents, retrieval, and models picked for cost. I also build desktop tools, hardware and mobile apps, a lot of them at hackathons.`
- L14 current: `Team projects are marked as team projects. Where I can't point to my exact part, they live in the archive.`
  - Replace: `Team projects are labelled as team projects, and I only claim the parts I can name.`
- Why: the old L14 contradicted CareBridge, Auralis and Eyecandy all sitting outside the archive.

**22. Archive label and group order.** [C]
- `src/components/views/ProjectsView.tsx` L66 and L116 current: `Archive: older and smaller builds, and team hacks where I can&apos;t name my part`
  - Replace: `Archive: earlier builds, small games and team hackathon projects`
- `ProjectsView.tsx` L27 current: `const OPEN_GROUPS: ProjectGroup[] = ["featured", "ai", "hardware", "xr", "tools"];`
  - Replace: `const OPEN_GROUPS: ProjectGroup[] = ["featured", "ai", "tools", "hardware", "xr"];`
- `content/projects.md` frontmatter current: `onThisPage: [Case studies, AI and LLM, Hardware and embedded, AR and VR, Tools and apps, Archive, Hackathon awards]`
  - Replace: `onThisPage: [Case studies, AI and LLM, Tools and apps, Hardware and embedded, AR and VR, Archive, Hackathon awards]`

## 6. Repetition and remaining "in progress" lines

**23. Use the cheap-model line once, on home.** [R]
- `content/projects/campus.md` L66 current: `- Like the rest of my AI work, I would rather run a low-cost model that fits the job than pay for the biggest one.`
  - Replace: (delete)
- `content/projects/homelab.md` L67 current: `- The agents mostly run on low-cost hosted models picked per task, not the most capable and most expensive one.`
  - Replace: `- The agents mostly run on low-cost hosted models, picked per task.`

**24. Remove the other "not done yet" lines.** [R][N]
- `content/projects/campus.md` L67 current: `- Cost per question: still measuring.` → delete
- `content/projects/homelab.md` L70 current: `- Monthly API spend: still collecting a full month of data.` → delete
- `content/now.md` L16 current: `- Campus. Still building it, and using it across {{stat:campus.courses}} courses. The evaluation is in progress.`
  - Replace: `- Campus. Using it every day across {{stat:campus.courses}} courses.`
- `content/now.md` L5 current: `description: What I'm working on this term: Campus, its retrieval evaluation, and my homelab.`
  - Replace: `description: What I'm working on this term: Campus and my homelab.`

**25. AgntOS: "concept", not "work in progress".** [R][N]
- `src/data/site.ts` L193 current: `dates: "2026", displayRole: "solo", displayStatus: "work in progress",`
  - Replace: `dates: "2026", displayRole: "solo", displayStatus: "concept",`
- `src/data/site.ts` L194 current: `covers: "Still a concept: a NixOS system run by an LLM agent. Every change is proposed, approved, applied with nixos-rebuild, logged, and reversible. Mostly Rust.",`
  - Replace: `covers: "A concept for a NixOS system run by an LLM agent. Every change is proposed, approved, applied with nixos-rebuild, logged, and reversible. Mostly Rust.",`
- `content/projects/agntos.md` L25 current: `Work in progress (concept).`
  - Replace: `Concept.`

**26. Cyberdeck: drop the in-progress label.** [N]
- `src/data/site.ts` L379 current: `dates: "2026", displayRole: "solo", displayStatus: "in progress",`
  - Replace: `dates: "2026", displayRole: "solo",`
- `content/projects/cyberdeck.md` L19-21 current: `## Status` / (blank) / `Work in Progress`
  - Replace: (delete the three lines)
- `content/projects/cyberdeck.md` L10 current: `status: in-progress`
  - Replace: (delete the line; `status` is optional in the schema)
- Ask Nathan whether it's finished or on hold (see Needs). If it's on hold, the card can say "Paused." without counting as an in-progress line.

## 7. Older copy that reads like a Devpost pitch or overclaims

**27. CareBridge case study.** [R]
`content/projects/carebridge.md`
- L17 current: `AI healthcare platform connecting rural patients and providers with intelligent check-ins and risk tracking. Built with React 19, TypeScript and Vite.`
  - Replace: `A care platform for rural patients and providers, built by a team at Spark 2026. Patients check in by chat or voice, and providers see one timeline with risk signals from those check-ins. Built with React 19, TypeScript, Vite and FastAPI.`
- L41 current (second sentence of the paragraph): `We wanted to build a solution that actively closes the loop on care.`
  - Replace: `The goal was to catch missed follow-ups before they turned into emergencies.`

**28. AgntOS: claims a senior reviewer would push back on.** [R]
`content/projects/agntos.md`
- L64 current: `The agent never touches arbitrary user configuration, clean contract, no side effects.`
  - Replace: `The agent never touches arbitrary user configuration.`
- L77 current: `- **Rust** over Python (too slow for CLI latency) or Go (lacks type safety for audit/config schemas). Rust's type system ensures serde roundtrips are compile-time checked and file path traversal is blocked at the type level.`
  - Replace: `- **Rust** over Python (too slow for CLI latency) or Go. Typed serde structs mean the audit and config schemas are checked at compile time.`
- L79 current: `- **No plugin system / MCP**. Pi-inspired read/write/edit/bash primitives replace dozens of specialized tools. Need an API? run_bash + curl. New file format? run_bash + jq/yq/python3.`
  - Replace: `- **No plugin system / MCP**. A few read/write/edit/bash primitives replace dozens of specialized tools. Need an API? run_bash + curl. New file format? run_bash + jq/yq/python3.`

## 8. Nits

**29. Homelab title.** [R]
- `src/data/site.ts` L145 `name: "Homelab and Hermes Agent"`, `content/projects/homelab.md` L2 `title: Homelab and Hermes Agent` and L17 `# Homelab and Hermes Agent`
  - Replace all three with: `NixOS homelab`
- Why: the old title reads as if he built Hermes Agent. Item 13 now says who makes it.

**30. "All of it."** [R]
`content/projects/campus.md` L35
- Current: `All of it.`
- Replace: `It's a solo project, so everything below is mine.`

**31. Visible credit for Tim's screenshot.** [C]
`src/data/site.ts` L547, Omni-Reality `covers`
- Current ending: `…Built with my team, and I kept going on the spatial system after the event.",`
- Replace ending: `…Built with my team, and I kept going on the spatial system after the event. Screenshot by Tim Roch.",`

---

## Needs Nathan's numbers

Nothing below is in the copy. Each one adds a line when he answers.

1. **TeraGo outage ticketing:** how long did it run, and roughly how many outage emails or tickets did it handle? Of the tickets you checked, how many needed no manual edits?
2. **TeraGo Channel Finder:** what were the 760 test cases checked against (past link requests, engineer picks)? What was the pass or match rate?
3. **TeraGo Copilot Studio agent:** how many engineers used it?
4. **TeraGo LibreChat proposal:** what was the estimated saving (dollars per year, for how many users)? It's already approved as public (fact 121), but no figure is recorded.
5. **3D Western labels:** were any of the VLM labels checked by hand, and how many? The 84.2% is measured against VLM-verified labels (facts 56, 57), so a human spot-check count matters. Is 3D Western OK with the number being public?
6. **Campus evaluation:** when it's done, the score (for example, the right source in the top 5 for X of Y questions). That number replaces the one remaining "in progress" line. Also the cost per question, if you want it back.
7. **AWARE:** a demo video link and any measured latency (for example, time from a sound to an alert).
8. **Homelab:** monthly API spend, once you have a full month.

Other answers needed (not numbers):

9. **CareBridge:** what part did you build? One line goes on the card when you say.
10. **Careerly, Auralis and Eyecandy:** your part on each, and team size, for the awards role column.
11. **AgenticArmy** ("repo on my GitHub"), **Street Cleaner, Object-Love-Interface and Stupid Spotify** ("my repo"): solo or team? If team, how many people, and what was your part?
12. **Cyberdeck:** finished, on hold, or still being built?

---

## Dropped items and why

- **Recruiter #4: feature Omni-Reality instead of CareBridge.** Nathan decided against it. CareBridge stays on home (item 12), and Omni-Reality stays in AR and VR.
- **Recruiter's TeraGo copy with brackets** ("In production since [month]; handled [N] notices…", "[X]%", "[N] engineers", "$[X]/year"). These are placeholders, so they moved to "Needs Nathan's numbers" 1-4.
- **Recruiter's Campus eval line "34/40 questions…" and AWARE "Demo: [video link]".** Also placeholders. They moved to Needs 6 and 7.
- **Recruiter's home intro that leads with the TeraGo pipeline.** The Experience section right below already opens with TeraGo. Nathan also rates TeraGo below his own projects (nathan.db fact 21), so the intro stays about how he builds, with the ask moved to the top (item 3).
- **Recruiter's "Right now: evaluating Campus's retrieval…" and "moving more of my homelab behind approve-then-rebuild."** The first would be a second "in progress" line. The second implies parts of the homelab skip approval, which the KB contradicts.
- **Recruiter's homelab stat "every agent change approved by me, auto-rolled back on a failed build".** That's a sentence, not a number. Item 13 now says it in the card text.
- **Recruiter's AWARE opener "nobody wanted to take on edge hardware".** The reason it gives isn't in the record. Item 9 uses a neutral version of what Nathan wrote in his past application.
- **My review's headline "…mostly on cheap or self-hosted models".** It would repeat the cheap-model line (recruiter's point). Replaced by item 2.
- **My review's Campus home stats (215 course files as a home stat).** Superseded by Nathan's decision (items 7-8).
- **Converting 3D Western and Omni-Reality KB pages to first person.** These are knowledge-base documents for the chat, written in third person by convention across `content/`. They aren't rendered pages, and changing one or two would make the KB inconsistent.
- **The "typed site data, which is prepended" notes in `content/projects/index.md` L12 and `content/experience/index.md` L12.** These are navigation docs for the chat and aren't linked from any page. The one visitors do see, on /experience, is fixed in item 17.
- **Trimming the skills list** (face-api.js, MCP, VLMs). Which skills to keep is Nathan's call, and it isn't a fix to this PR's copy.
- **Templated case-study sections** (tl;dr / Why / What / How / Models and cost / Results). That's a structural rewrite, out of scope for a content-fix pass.
- **The Glyph and AgenticArmy pitch-style lines** ("Non-intrusive popup interface", "Anticipates coding agent disagreements…"). These are on lower-traffic pages and were left for a later pass. CareBridge was fixed (item 27) because it's linked from home.
- **My review's nit about model names** (Qwen Omni and others in Omni-Reality and the AWARE table). It's project tech, not his own model choices, so nothing changes.
- **Parked code and SEO items** (stale chat search index, possible missing og.png on pages other than home). Out of scope for content. Still worth doing before merge.
