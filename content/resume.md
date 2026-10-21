---
title: Résumé
type: page
route: /resume
description: My résumé as text. The PDF is the one-page version.
priority: reference
tags: [resume]
related: [index.md, ../skills.md]
skills:
  - group: AI
    items: [LLM agents, tool calling, RAG, embeddings and reranking, MCP, VLMs, model evaluation, llama.cpp, Ollama, PyTorch, YOLOv8, ONNX]
  - group: Languages
    items: [Python, TypeScript, C#, C++, SQL, Bash]
  - group: Web & Infra
    items: [React, FastAPI, Next.js, NixOS, Linux, Docker, Tailscale, Caddy, Git, GitHub Actions]
  - group: Tools
    items: [Hermes Agent, Blender]
updated: 2026-10-16
---
# Résumé

## Experience

### 3D Western

- Co-led two data developers on the print-safety dataset and benchmark, tracking work on a GitHub project board.
- Built a labelled dataset from {{stat:3D Western.dataset}} scraped 3D models, rendered in Blender with labels checked by a VLM.
- Benchmarked small vision models as a binary safe-or-flag gate: 84.2% best agreement with VLM-checked labels.

### TeraGo

- Built a prototype pipeline that uses a locally hosted LLM (Ollama) to turn unstructured emails into structured tickets, working end to end.
- Built a Python RF channel-planning tool with a command-line and web interface that shortlists clear frequencies for fixed-wireless links, with a validation test suite.
- Deployed an internal RAG assistant that answers engineers' technical questions from company documentation.
- Researched and proposed a self-hosted LLM platform integrated with internal tools.

## Projects

### Campus

- Built an AI agent that reads all {{stat:campus.courses}} of my courses, syncing them from the LMS into SQLite with Playwright and running on any OpenAI-compatible endpoint, local or hosted.
- Designed search over course files that is lexical by default with optional embeddings and reranking, and added a lexical SQL prefilter for exact phrases that scored below the semantic cutoff.
- Wrote a {{stat:campus.tools}}-tool agent harness with an audit log for every AI write and a bounded tool loop, with {{stat:campus.tests}} backend tests in CI.
- Use it across {{stat:campus.courses}} courses for deadline lookups, studying from course slides, and reviewing drafts against briefs.

### NixOS homelab

- Defined a laptop and home server entirely in version-controlled NixOS config ({{stat:homelab.containers}} containers, Tailscale-only access, sops-nix secrets), so every change is a reviewable, reversible diff.
- Run one Hermes Agent profile per host that makes changes as config edits, over {{stat:homelab.sessions}} sessions since June, with subagents taking larger investigations.
- Gave each machine's agent its own level of autonomy: the server agent waits for approval on a full diff, the laptop agent commits and asks me to test, and both rebuild through a host-checked guard with generation rollback.
- Grew a git-versioned library of {{stat:homelab.skills}} agent skills on low-cost models, pruned weekly by a curator that keeps backups of removed skills.

### AWARE

- Built an on-device home-awareness system running YOLOv8 and YAMNet on a {{stat:aware.boardCost}} Arduino UNO Q with QNN, with no cloud inference.
- Had an on-device LLM compile commands like "when glass breaks after 10pm alert me" into deterministic rules, then checked them every {{stat:aware.ruleTick}} with no LLM in the loop.
