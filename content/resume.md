---
title: Résumé
type: page
route: /resume
description: My résumé as text, matching the PDF.
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
    items: [Cursor, Claude Code, Hermes Agent, Microsoft Graph, Copilot Studio, Jira, SharePoint, Blender]
updated: 2026-10-16
---
# Résumé

## Experience

### TeraGo

- Built outage ticketing for non-standard provider emails: a local LLM (Ollama) extracts the key details and opens Jira issues through Microsoft Graph; works end to end, not yet deployed.
- Wrote Channel Finder, a Python tool that finds clear RF channels in MapInfo data, validated on {{stat:TeraGo.testCases}} test cases.
- Deployed a Copilot Studio agent that answers engineers' RF questions from SharePoint documents.
- Proposed a self-hosted LLM platform (LibreChat with SharePoint and Jira) to cut per-user Copilot licensing costs.

### 3D Western

- Co-led two data developers through Jira tickets and PR review on the print-approval dataset and benchmark.
- Built a labelled dataset from {{stat:3D Western.dataset}} scraped 3D models, rendered in Blender with labels checked by a VLM.
- Benchmarked small vision models as a binary safe-or-flag gate: 84.2% best agreement with VLM-checked labels.

## Projects

### Campus

- Built a self-hosted AI study assistant that syncs my LMS courses into SQLite with Playwright and runs on any OpenAI-compatible endpoint, local or hosted.
- Designed hybrid retrieval over course files with embedding search, cross-encoder reranking and a lexical SQL prefilter. Fixed exact phrases that scored below the semantic cutoff.
- Wrote a {{stat:campus.tools}}-tool agent harness with an audit log for every AI write and a bounded tool loop, with {{stat:campus.tests}} tests in CI.
- Use it across {{stat:campus.courses}} courses for deadline lookups, studying from course slides, and reviewing drafts against briefs.

### NixOS homelab

- Defined a laptop and home server entirely in version-controlled NixOS config ({{stat:homelab.containers}} hardened containers, Tailscale-only access, sops-nix secrets), so every change is a reviewable, reversible diff.
- Run one Hermes Agent profile per host that makes changes as config edits, over {{stat:homelab.sessions}} sessions and {{stat:homelab.toolCalls}} tool calls since June, with subagents taking larger investigations.
- Gated agent changes behind my approval and a nixos-safe-rebuild guard, with rollback to the last good build.
- Grew a git-versioned library of {{stat:homelab.skills}} agent skills on low-cost models, pruned weekly by a curator that keeps backups of removed skills.

### AWARE

- Built an on-device home-awareness system running YOLOv8 and YAMNet on a {{stat:aware.boardCost}} Arduino UNO Q with QNN, with no cloud inference.
- Had an on-device LLM compile commands like "when glass breaks after 10pm alert me" into deterministic rules, then checked them every {{stat:aware.ruleTick}} with no LLM in the loop.
