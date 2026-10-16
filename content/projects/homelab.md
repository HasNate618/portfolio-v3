---
title: "Homelab and NixOS"
type: project
priority: start-here
rank: featured
dates: "May 2026 to present"
role: "owner"
tags: [nixos, self-hosting, local-ai, agents, infrastructure]
related: [index.md, campus.md, agntos.md, ../skills.md, ../local-ai.md]
updated: 2026-10-15
---

# Homelab

Nathan runs a declarative NixOS homelab: 27 hardened Docker containers plus native services, all managed from a single version-controlled Nix flake. The same flake manages two machines: `flow`, his Hyprland laptop, and `home`, a home server built from used consumer hardware, with a NAS for storage.

## Overview

The entire platform is reproducible from config alone; a bad change means booting the previous NixOS generation, not hours of manual recovery. This project merges and supersedes his earlier work: a Debian Docker Compose homelab and a containerized "Local AI Platform." Both suffered from config drift, so he migrated everything to NixOS, one service at a time, and unified them into a single declarative system.

## Architecture

Services are organized into NixOS modules by role: infrastructure, access, media, AI, and monitoring. Every service sits behind Caddy as a reverse proxy and is only reachable over his private Tailscale mesh.

## Self-hosted AI stack

The homelab hosts a full local AI platform: Open WebUI for chat with RAG knowledge bases, Bifrost as a unified LLM gateway routing between local and cloud models, crawl4ai for web extraction, DeGoog for private search, and Whisper for speech-to-text.

Two custom MCP servers extend the agents:

- **trawl**: combines DeGoog search with crawl4ai extraction into one MCP endpoint, so agents can search the web and read full pages through a single tool. Python, httpx, Dockerized.
- **Brightspace MCP**: exposes his university's D2L Brightspace LMS (courses, assignments, grades, announcements) over MCP. Uses Playwright to scrape data with no public API, running headless with Xvfb in Docker.

## Hermes Agent profiles

Hermes Agent is an AI agent from Nous Research that works through tools and saved skills.

- He runs one Hermes Agent profile per host: the flow profile works on the laptop and the homelab profile reaches the server over SSH. Both make changes as edits to the NixOS config.
- Every change is gated behind his approval and a `nixos-safe-rebuild` guard, with rollback to the last good build.
- 472 sessions and 58,000 tool calls since June 2026, with subagents taking larger investigations.
- A git-versioned library of 191 agent skills, pruned weekly by a curator that keeps backups of removed skills.

## llama.cpp on flow

The flow laptop runs llama.cpp for local GGUF models, set up in his local-llama-setup repo, and both Hermes Agent profiles can use it as a provider. Which models he uses where is covered in [Local and cost-aware AI](../local-ai.md).

## Security

- Container hardening: containers run with dropped capabilities, `no-new-privileges`, and resource limits.
- Network: services are private to the Tailscale mesh, not exposed to the internet.
- Secrets: encrypted in git with sops-nix, decrypted at boot to tmpfs.

## Real problems solved

- **VPN lockout**: a WireGuard VPN as the default route blackholed the whole server when the peer died, requiring a physical reset. Fixed by scoping the VPN into a single container that only the service needing it shares, so one failure cannot take down the machine.
- **NIC driver bug**: the onboard network driver dropped to 10 Mbps after link disturbances. A systemd timer checks link speed and reloads the driver when it drops.

## Monitoring and current state

Uptime Kuma checks every service each minute, Netdata tracks real-time metrics, and ntfy pushes alerts. Everything runs 24/7.

## Tech stack

NixOS, Nix flakes, Docker, Tailscale, Caddy, sops-nix, Open WebUI, Bifrost, MCP servers, Python, Playwright.

## Links

- GitHub (public NixOS config): https://github.com/HasNate618/nixos-config-public
- GitHub (llama.cpp setup): https://github.com/HasNate618/local-llama-setup
