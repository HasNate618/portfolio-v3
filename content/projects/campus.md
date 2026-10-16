---
title: "Campus"
type: project
priority: start-here
rank: flagship
dates: "Aug 2026 to present"
role: "owner"
tags: [local-ai, rag, agents, education-tooling]
related: [index.md, homelab.md, aware.md, ../skills.md, ../local-ai.md]
updated: 2026-10-15
---

# Campus

Self-hosted AI study assistant that syncs Brightspace/D2L courses into local SQLite, then answers questions from those course files with a tool-using agent. Built with Python, FastAPI and SQLite.

## Status

Ongoing since Aug 2026.

## Models

Campus works with any OpenAI-compatible endpoint, so it can point at a local server or a hosted API. How he picks models is covered in [Local and cost-aware AI](../local-ai.md).

## Tech Stack

- Python, FastAPI, SQLite
- Playwright (LMS sync / MFA)
- React, TypeScript, Vite (PWA frontend)
- Docker, NixOS, GitHub Actions
- Embeddings + cross-encoder reranking (hybrid retrieval)

## Description

Campus is an offline-first study system built for personal use. It pulls Brightspace/D2L content into a local SQLite spine and file store with sha256 change detection, so unchanged files are not re-downloaded. Hybrid retrieval combines embedding search, cross-encoder reranking, and a lexical SQL prefilter across 4,687 chunks from 215 course files. Exact phrases that used to score below the semantic cutoff are forced through the lexical path.

A 20-tool agent harness answers course questions, reads files, and can mutate notes or due dates. Every AI write is logged with before/after state in an append-only audit log. The tool loop is bounded. CI runs 308 tests on every push (pytest, frontend type-check, production build).

Used across six courses for deadline lookups, studying from course slides, and reviewing drafts against briefs.

## Links

- GitHub: https://github.com/HasNate618/Campus
