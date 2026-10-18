---
title: NixOS homelab
type: project
route: /projects/homelab
description: Two NixOS machines in one flake, run day to day by two Hermes Agent profiles that change the system only by editing its config.
priority: start-here
tags: [nixos, agents, self-hosting, local-ai]
related: [index.md, campus.md, aware.md, agntos.md, ../skills.md, ../local-ai.md]
onThisPage: [tl;dr, Why NixOS, How it fits together, The AI stack, Two agents and two levels of autonomy, Guardrails, What it does day to day, What I learned, What's next, Stack]
id: homelab
dates: "May 2026 to present"
role: solo
status: active
rank: featured
updated: 2026-10-18
---
# NixOS homelab

My laptop (flow) and a home server built from used parts (home) are both defined by one version-controlled Nix flake. Each machine has its own Hermes Agent profile that does most of the day-to-day work on it. Hermes Agent is an open-source AI agent from Nous Research that works through tools and skills it writes and saves for itself. The agents never change a running system by hand. They edit the Nix config, and a change only goes live through a rebuild.

## tl;dr

- One flake defines both machines. The server runs {{stat:homelab.containers}} containers and 10 native NixOS services, reached over my private Tailscale network.
- A Bifrost gateway gives every AI service on the server one endpoint for local and cloud models, including the local models on my laptop's GPU.
- The two agent profiles get different autonomy on purpose. The server profile plans, shows me the full diff and waits for approval. The laptop profile commits directly and asks me to test.
- Five incidents each turned into a guardrail in the config, and any change can be rolled back.

## Why NixOS

I used to run a Debian server with Docker Compose and a separate local AI setup. Both drifted. Packages piled up, manual fixes stacked on each other, and neither machine could be rebuilt from scratch.

NixOS fixes that because the whole system is declared in files. Every package, service, user and firewall rule is written in Nix and kept in git, and a rebuild turns those files into the running system. That matters even more with agents. When an agent's change is a diff, I can read it before it applies, rebuild the same thing later, and undo it in one step if it's wrong.

I first tried to build my own agent just for NixOS config, with its own memory system ([AgntOS](https://github.com/HasNate618/AgntOS)). I got impatient, because I wanted to be on NixOS already, so I moved both machines over and ran Hermes Agent on them instead. It works really well, especially with cloud models and the broad general knowledge they bring.

## How it fits together

Both machines build from the same flake. The server's agent profile runs from the laptop and sends its commands over SSH. Its modules are split by role into AI, access, infrastructure, media and monitoring. Each container is a systemd unit that runs Docker with its flags written out in Nix, so its capabilities, memory limit and ports are part of the reviewed config. 28 of the {{stat:homelab.containers}} containers start from zero Linux capabilities, add back only the ones they name, and block privilege escalation. 19 secrets are encrypted in git with sops-nix and decrypted on the server at boot.

## The AI stack

```figure
src: /projects/homelab-service-inventory.webp
width: 1600
height: 833
alt: Horizontal bar chart of services on the home server by category. AI 16, access 6, infrastructure 6, monitoring 4, media and other 13. Bars are split into hardened containers, other containers and native NixOS services. 28 of the 35 containers start from zero Linux capabilities and block privilege escalation.
caption: What the server runs, counted from the config. Native services are the ones NixOS provides as modules, like PostgreSQL, Forgejo and Immich.
```

AI is the biggest group on the server, and the part I use most:

- **Bifrost** is the gateway. It puts local and cloud models behind one OpenAI-compatible endpoint, so a service never needs to know which model answers. Campus, Open WebUI and trawl all route through it, and I run my own fork of it for session affinity.
- **Local models** run on my laptop's RTX 4060 through a CUDA build of llama.cpp, and Bifrost reaches them over Tailscale. A local 9B model runs at about 20 tokens a second there, while the server's GTX 960 is too old for modern LLMs. Harder work goes to low-cost cloud models.
- **[Campus](campus.md)**, my study assistant, runs here in a hardened container. It syncs my course material, extracts new PDFs overnight and embeds them, so I can ask what's due this week or have it explain a specific slide, with citations.
- **trawl** is an MCP server I built for web search and page reading in one tool. Both agent profiles use it. It searches through Exa, falls back to my own SearXNG and DeGoog, and reads pages with crawl4ai.
- **Brightspace MCP** is the other MCP server. It exposes my courses, assignments, grades and announcements, so a coursework question gets answered from the source instead of from something I pasted in.
- **EmbeddingGemma** gives the GTX 960 a job it can do: local text, image and audio embeddings in one vector space.
- **pdf-parse** replaced a three-container PDF extraction stack with one service built on Cohere Parse and PyMuPDF.

## Two agents and two levels of autonomy

```figure
src: /projects/homelab-change-loop.webp
width: 1600
height: 1037
alt: Two rows of six steps. Homelab profile on the server: plan with the full diff, I approve, edit and dry-build on the server, nixos-safe-rebuild, verify units, containers and endpoints, then commit and push. Flow profile on the laptop: investigate, edit, commit directly with no approval gate, nixos-safe-rebuild, I test, then squash and push. Below, what happens if the rebuild goes wrong for either profile: a wrong host target is refused, a failed build activates nothing, and a bad change can be switched back, booted from the previous generation, or reverted.
caption: Both profiles go through the same rebuild guard. They differ in where I step in.
```

The two profiles are set up differently on purpose. The server holds my data and services that run around the clock, so its profile plans first, shows me the full diff for the whole change and waits for my approval. After the rebuild it checks that the affected units are running and the containers are up, then calls the real endpoints. It never reports "rebuilt" just because the log says so, because a switch can go live with a service still stopped.

The laptop is only mine, and most of its changes are to the desktop, where I can see right away whether they worked. Its profile commits directly, rebuilds and asks me to test, then squashes the work before pushing.

The two profiles never talk to each other. Both machines check out the same config repo, though, and both rebuild through `nixos-safe-rebuild`, a small wrapper that refuses to build a config for a different machine than the one it runs on. A failed build never goes live, and every switch is a new generation I can go back to. Across both machines, the repo has 1,094 commits and 28 of them are reverts.

## Guardrails

```figure
src: /projects/homelab-guardrails.webp
width: 1600
height: 986
alt: Table of five incidents and the guardrails they led to. June 5, server: a security audit found plaintext and hardcoded passwords, so secrets moved to sops-nix. June, server: a dead VPN peer took the server offline until a reboot, so the VPN moved into one isolated container. Server: building the laptop's config on the server ran it out of memory, so nixos-safe-rebuild refuses any target but the current machine. Laptop: Docker auto-prune would have deleted the Windows VM's disk, so auto-prune is off on the laptop. October 12, laptop: a large Nix build exhausted RAM and froze the laptop, so build jobs are capped at 4, with earlyoom and systemd-oomd.
caption: Each fix became config instead of a note to be careful. Incidents and dates come from the agents' own reports; each guardrail is in the public repo.
```

Most of the rules the agents follow came from something going wrong once. The pattern is the same every time: find the cause, then put the fix in the config so it can't happen again by accident. The agents also carry working rules of their own, like checking `git status` before diagnosing anything, never force-pushing, and confirming what exists before deleting anything.

One that wasn't a config mistake, and so isn't in the table above:

> **NIC driver bug.** The onboard network driver dropped to 10 Mbps after link hiccups. A systemd timer now checks link speed and reloads the driver.

## What it does day to day

```figure
src: /projects/homelab-agent-sessions.webp
width: 1564
height: 821
alt: Grouped bar chart of agent sessions per month, June to October 2026. The flow profile on the laptop ran 33 sessions in June, 33 in July, 41 in August, 36 in September and 64 in October. The homelab profile on the server ran 74 in June, 39 in July, 55 in August, 12 in September and 24 in October. Side panel: 411 sessions across both profiles, 138 of them subagent sessions, and 34,673 tool calls.
caption: Counted from each profile's session database on Oct 18, 2026. A session is one row, and a subagent session is one row too.
```

Most days nothing on the server needs me. 13 systemd timers run backups to the NAS, restarts and cleanup. Uptime Kuma watches the services and ntfy pushes an alert when something fails. Vaultwarden holds my passwords, Immich my photos, Nextcloud my files, and Forgejo hosts the git remote for this config.

The agents get asked questions more than anything else. A question usually comes before a change, like how something works or whether an idea is feasible. Hand the server agent a GitHub link to a self-hostable project and it writes the module, adds the Caddy route, wires in what it depends on and rebuilds, using skills it wrote on earlier jobs. Between them the two profiles have run {{stat:homelab.sessions}} sessions since June and made {{stat:homelab.toolCalls}} tool calls. Their {{stat:homelab.skills}} saved skills hold what they have learned about these machines, from Bifrost setup to a routine health scan.

## What I learned

- A declarative system is the right surface for an agent. Its output is a diff, and the build checks that diff before anything changes.
- Autonomy should match what's at stake. The same agent software runs looser on my laptop than on the server that holds my data.
- Guardrails belong in code as well as in the prompt. The server profile is told to rebuild only through the wrapper, and the wrapper enforces the same rule anyway.

## What's next

- Pin every container image to a version, so a rebuild today matches a rebuild next month.
- Add an off-site copy of the backups, which today all live on one NAS.
