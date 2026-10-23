---
title: NixOS homelab
type: project
route: /projects/homelab
description: A two-machine Linux homelab defined in a single repo of Nix/NixOS config, from the services and networking to backups and monitoring.
priority: start-here
tags: [nixos, linux, self-hosting, infrastructure, agents]
related: [index.md, campus.md, aware.md, agntos.md, ../skills.md, ../local-ai.md]
onThisPage: [tl;dr, Why NixOS, The two machines, What the server hosts, Networking and remote access, Storage and backups, Monitoring and upkeep, How changes get made, Guardrails, What I learned, What's next, Stack]
id: homelab
dates: "May 2026 to present"
role: solo
status: active
rank: featured
updated: 2026-10-21
---
# NixOS homelab

My laptop (flow) and a home server I built from used parts (home) are both Linux machines defined in a single repo of Nix/NixOS config. Every package, service, user and firewall rule is written down there, so each machine runs exactly what the config says, and any change is a diff I can read, review and roll back.

## tl;dr

- One Nix flake builds both machines, plus a live USB image that reuses the laptop's desktop modules.
- The server hosts my passwords, photos, files, the git remote for this config and my AI services, all reached through Caddy over my private Tailscale network.
- Daily timers back up the databases and service configs to a NAS, Uptime Kuma watches the services, and ntfy pushes an alert when something fails.
- A Hermes Agent profile on each machine makes changes the way I do, by editing the config and rebuilding, and each thing that broke along the way became a guardrail in the config.

## Why NixOS

I used to run a Debian server with Docker Compose and a separate local AI setup. Both drifted. Packages piled up, manual fixes stacked on each other, and neither machine could be rebuilt from scratch.

NixOS fixes that because the whole system is declared in files. A rebuild turns those files into the running system, a failed build never goes live, and every switch becomes a new generation I can go back to. Since the config lives in git, the history of each machine is the history of the repo, so I can see what changed, when, and why.

## The two machines

- **home**, the server, is built from used desktop parts: an i5-6600K, a GTX 960 and 16 GB of RAM. It's wired, runs around the clock, and holds every service below.
- **flow**, the laptop, is an ASUS ROG Flow X16 with an RTX 4060. It runs my Hyprland desktop and serves local models through a CUDA build of llama.cpp, which the server reaches over Tailscale.

The server's modules are split by role into access, infrastructure, AI, media and monitoring, with one file per service where possible, so adding or removing a service stays a small change in one place.

## What the server hosts

```figure
src: /projects/homelab-service-inventory.webp
width: 1600
height: 833
alt: Horizontal bar chart of services on the home server by category. AI 16, access 6, infrastructure 6, monitoring 4, media and other 13. Bars are split into hardened containers, other containers and native NixOS services. 28 of the 35 containers start from zero Linux capabilities and block privilege escalation.
caption: What the server runs, counted from the config. Native services are the ones NixOS provides as modules, like PostgreSQL, Forgejo and Immich.
```

Most services run in Docker, but each container is a systemd unit with its Docker flags written in Nix, so its capabilities, memory limit and ports are part of the reviewed config instead of a compose file on the side. Most containers start with every Linux capability dropped, add back only the ones they name, and block privilege escalation. Services NixOS already packages well, like PostgreSQL, Forgejo and Immich, run as native modules.

- **Access and files.** Vaultwarden for passwords, Immich for photos, Nextcloud with Collabora for files and documents, FileBrowser for the NAS, and Forgejo, which hosts the git remote for this config.
- **Shared infrastructure.** PostgreSQL and Redis for the services that need them, AdGuard Home for DNS, and a VPN egress container.
- **AI services.** A Bifrost gateway puts local and cloud models behind one OpenAI-compatible endpoint, so Open WebUI, my trawl search server and [Campus](campus.md), the AI agent I built that reads all six of my courses, all call the same place. The GTX 960 is too old for modern LLMs, so it runs EmbeddingGemma for embeddings instead.
- **Media.** Jellyfin, with the media itself on the NAS.

## Networking and remote access

Everything is reached over Tailscale, with Caddy as the reverse proxy in front of every web service, and the firewall only opens SSH, DNS, the web ports and Tailscale. AdGuard Home answers DNS for the house, using encrypted upstream DNS with DNSSEC, and a small split-horizon resolver gives devices on the home network the same service names that work over Tailscale, so the same link works whether I'm home or not.

## Storage and backups

Bulk data lives on a NAS that the server mounts over SMB, including Nextcloud's files, my photos and my media. Daily timers dump PostgreSQL and back up Forgejo, Vaultwarden and the service configs to the NAS, keeping seven days of copies. Secrets are encrypted in git with sops-nix and decrypted on the server at boot, so no password sits in the repo in plain text.

## Monitoring and upkeep

Most days nothing on the server needs me. Uptime Kuma watches the services and ntfy pushes an alert when something fails, Netdata shows live resource use, and Glance is a dashboard for the services. CrowdSec reads the system and Caddy logs for intrusion attempts, and fail2ban rate-limits SSH, which only accepts keys. Systemd timers handle the routine work, like backups, restarts and cleanup, and Nix garbage-collects old generations every week.

> **NIC driver bug.** The onboard network driver dropped to 10 Mbps after link hiccups. A systemd timer now checks link speed and reloads the driver.

## How changes get made

```figure
src: /projects/homelab-change-loop.webp
width: 1600
height: 1037
alt: Two rows of six steps. Homelab profile on the server: plan with the full diff, I approve, edit and dry-build on the server, nixos-safe-rebuild, verify units, containers and endpoints, then commit and push. Flow profile on the laptop: investigate, edit, commit directly with no approval gate, nixos-safe-rebuild, I test, then squash and push. Below, what happens if the rebuild goes wrong for either profile: a wrong host target is refused, a failed build activates nothing, and a bad change can be switched back, booted from the previous generation, or reverted.
caption: Both profiles go through the same rebuild guard. They differ in where I step in.
```

Each machine has its own profile of Hermes Agent, an open-source AI agent from Nous Research, and it changes the system the same way I do, by editing the config and rebuilding. It never changes a running system by hand. The server holds my data, so its profile plans first, shows me the full diff and waits for my approval, then checks that the affected units, containers and endpoints actually came back before it reports success. The laptop is only mine and most of its changes are to the desktop, where I can see right away whether they worked, so its profile commits directly and asks me to test.

Both rebuild through `nixos-safe-rebuild`, a small wrapper that refuses to build a config for a different machine than the one it runs on. Most of what I ask the agents are questions, like how something works or whether an idea is feasible. When I hand the server agent a self-hostable project, it writes the module, adds the Caddy route and rebuilds.

I first started building my own agent just for NixOS config ([AgntOS](https://github.com/HasNate618/AgntOS)), but I wanted to be on NixOS already, so I moved both machines over and ran Hermes Agent on them instead.

## Guardrails

```figure
src: /projects/homelab-guardrails.webp
width: 1600
height: 986
alt: Table of five incidents and the guardrails they led to. June 5, server: a security audit found plaintext and hardcoded passwords, so secrets moved to sops-nix. June, server: a dead VPN peer took the server offline until a reboot, so the VPN moved into one isolated container. Server: building the laptop's config on the server ran it out of memory, so nixos-safe-rebuild refuses any target but the current machine. Laptop: Docker auto-prune would have deleted the Windows VM's disk, so auto-prune is off on the laptop. October 12, laptop: a large Nix build exhausted RAM and froze the laptop, so build jobs are capped at 4, with earlyoom and systemd-oomd.
caption: Each fix became config instead of a note to be careful. Incidents and dates come from the agents' own reports; each guardrail is in the public repo.
```

Most of the rules in this config came from something going wrong once. The pattern is the same every time: find the cause, then put the fix in the config so it can't happen again by accident.

## What I learned

- Declaring the whole system pays off the first time something breaks, because the fix is a diff I can read, keep and roll back instead of a manual change I'd have to remember.
- A declarative system is also the right surface for an agent. Its output is a diff, and the build checks that diff before anything changes.
- Autonomy should match what's at stake, so the same agent software runs looser on my laptop than on the server that holds my data.

## What's next

- Pin every container image to a version, so a rebuild today matches a rebuild next month.
- Add an off-site copy of the backups, which today all live on one NAS.
