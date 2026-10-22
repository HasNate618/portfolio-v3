---
title: Résumé
type: page
route: /resume
description: My résumé as text. The PDF is the one-page version.
priority: reference
tags: [resume]
related: [index.md, ../skills.md]
skills:
  - group: Languages
    items: [Python, TypeScript/JavaScript, Java, C#, C++, Kotlin, SQL, Bash]
  - group: AI/ML
    items: [LLM agents, tool calling, RAG, embeddings and reranking, MCP, VLMs, model evaluation, llama.cpp, Ollama, PyTorch, scikit-learn, pandas, YOLOv8, ONNX, MediaPipe]
  - group: Web & Data
    items: [React, Next.js, Tailwind, Three.js, FastAPI, Node.js, PostgreSQL (Supabase), MySQL, MongoDB]
  - group: Infra
    items: [Nix/NixOS (flakes), Linux, Docker, AWS (EC2, S3), GitHub Actions, Tailscale, Caddy, Git, Jira, Confluence]
  - group: Hardware & 3D
    items: [Arduino, ESP32, Raspberry Pi, Unity (XR), Blender, Onshape, 3D printing]
updated: 2026-10-22
---
# Résumé

## Experience

### 3D Western

- Co-led two data developers on the print-safety dataset and benchmark, tracking work on a GitHub project board.
- Built a labelled dataset from {{stat:3D Western.dataset}} scraped 3D models, rendered in Blender with labels checked by a VLM.
- Benchmarked small vision models as a binary safe-or-flag gate: 84.2% best agreement with VLM-checked labels.
- On the data team since Sep 2025, writing the render scripts and working on the 3D model scraping and the STL rendering pipeline.

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

- Defined a laptop and home server in a single Nix/NixOS repo, so every change can be reviewed and rolled back.
- Self-host passwords, photos, files, a git remote and AI services behind Caddy and Tailscale, with sops-nix secrets.
- Set up daily NAS backups, uptime alerts, intrusion detection with CrowdSec, and split-horizon DNS.
- Run a Hermes Agent per machine that edits only the config, with my approval required on the server.

### AWARE

- Built an on-device home-awareness system running YOLOv8 and YAMNet on a {{stat:aware.boardCost}} Arduino UNO Q with QNN, with no cloud inference.
- Had an on-device LLM compile commands like "when glass breaks after 10pm alert me" into deterministic rules, then checked them every {{stat:aware.ruleTick}} with no LLM in the loop.
