---
title: NixOS homelab
type: project
route: /projects/homelab
description: Two NixOS machines in one flake, with AI agents that change the config only after I approve.
priority: start-here
tags: [nixos, agents, self-hosting]
related: [index.md, campus.md, aware.md, ../skills.md]
onThisPage: [tl;dr, Why I built it, What I built, How it works, Models and cost, Results, Stack]
id: homelab
dates: "May 2026 to present"
role: solo
status: in-progress
rank: featured
updated: 2026-10-16
---
# NixOS homelab

## tl;dr

- One version-controlled Nix flake defines two machines: my laptop (flow) and a home server (home), plus a NAS.
- {{stat:homelab.containers}} hardened Docker containers and native services, reachable only over Tailscale.
- One Hermes Agent profile per machine. Agents change the config, I approve, and a safe-rebuild guard applies it.
- {{stat:homelab.sessions}} agent sessions and {{stat:homelab.toolCalls}} tool calls since June 2026.
- A git-versioned library of {{stat:homelab.skills}} agent skills.

## Why I built it

I used to run a Debian Docker Compose homelab and a separate local AI setup. Both drifted from their config over time. Once AI agents were making changes, I needed every change to be a diff I could read first and undo later.

## What I built

All of it.

- Moved both old setups to NixOS one service at a time, into one flake.
- Split services into modules by role: infrastructure, access, media, AI and monitoring.
- Put every service behind Caddy, reachable only over my private Tailscale network.
- Hardened containers: dropped capabilities, no-new-privileges, resource limits.
- Secrets encrypted in git with sops-nix, decrypted at boot to tmpfs.
- A self-hosted AI stack: Open WebUI, a Bifrost gateway between local and cloud models, crawl4ai, DeGoog search and Whisper.
- Two MCP servers. trawl does web search and page reading in one tool. Brightspace MCP exposes my courses, assignments, grades and announcements.
- A Hermes Agent profile per host, behind a nixos-safe-rebuild guard.
- llama.cpp on the laptop as a local model provider.

## How it works

Hermes Agent is an AI agent from Nous Research that works through tools and saved skills.

```diagram
alt: I ask an agent for a change. The agent edits the NixOS config and never touches the running system by hand. I approve, a safe-rebuild guard applies it, and if the build fails it rolls back to the last good build.
me: "change X" ─► agent edits NixOS config ─► I approve
                                                │
       live ◄── nixos-safe-rebuild ◄────────────┘
                     │
                     └── fails? roll back to last good build
```

1. I ask an agent for a change. The flow profile works on the laptop. The homelab profile reaches the server over SSH.
2. The agent edits the config. It never changes the running system by hand.
3. I approve. nixos-safe-rebuild applies it and rolls back if the build fails.
4. If a bad change gets through anyway, I boot the previous NixOS generation.
5. Subagents take the bigger investigations. A weekly curator prunes the skill library and backs up what it removes.
6. Uptime Kuma checks every service each minute, Netdata tracks metrics, and ntfy sends alerts.

## Models and cost

- The agents mostly run on low-cost hosted models, picked per task.
- llama.cpp on the laptop serves local GGUF models, and both agent profiles can use it.
- Bifrost routes between local and cloud models from one endpoint.

## Results

- {{stat:homelab.sessions}} agent sessions and {{stat:homelab.toolCalls}} tool calls since June 2026.
- {{stat:homelab.skills}} agent skills, versioned in git.
- {{stat:homelab.containers}} hardened containers, all private to Tailscale.

Two things that broke, and what I did:

> **VPN lockout.** A WireGuard default route took the whole server offline when the VPN peer died. Fixing it needed a physical reset. Now the VPN lives in one container, shared only by the service that needs it.

> **NIC driver bug.** The onboard network driver dropped to 10 Mbps after link hiccups. A systemd timer now checks link speed and reloads the driver.
