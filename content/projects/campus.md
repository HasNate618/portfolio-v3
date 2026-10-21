---
title: Campus
type: project
route: /projects/campus
description: The AI agent I built that reads all six of my courses, syncing Brightspace into SQLite and logging the before and after of every write it makes.
priority: start-here
tags: [local-ai, rag, agents, education-tooling]
related: [index.md, homelab.md, aware.md, ../skills.md, ../local-ai.md]
onThisPage: [tl;dr, Why I built it, What I built, How it works, Models and cost, Results, Next, Stack]
id: campus
dates: "Aug 2026 to present"
role: solo
status: active
updated: 2026-10-16
---
# Campus

## tl;dr

- Syncs my Brightspace courses into local SQLite and answers questions from the course files.
- Search over my course files that is lexical by default, with embeddings and reranking switched on in config.
- An agent that can also edit my notes and due dates, and every write it makes is logged.
- Backend tests, a frontend type-check and a production build run in CI on every push.
- Works with any OpenAI-compatible endpoint, local or hosted.

## Why I built it

My course material lives in Brightspace, spread across {{stat:campus.courses}} courses. I wanted one place to look up deadlines, study from the slides, and check a draft against the assignment brief, running on hardware I control.

I also wanted it to update my notes and due dates. That is only useful if I can see exactly what it changed, so every AI write is logged with the before and after.

## What I built

It's a solo project, so everything below is mine.

- LMS sync with Playwright, MFA login included, into SQLite and a local file store.
- sha256 change detection, so unchanged files are not downloaded again.
- Search that is lexical by default and needs no extra model, with embedding search and cross-encoder reranking switched on in config, plus a lexical SQL prefilter for exact phrases.
- A fix for exact phrases that scored below the semantic cutoff. They now go through the lexical path.
- An agent that answers questions, reads files, and edits notes or due dates, in a bounded tool loop.
- An append-only audit log with the before and after state of every AI write.
- A React, TypeScript and Vite PWA. <!-- one-source-ok -->
- CI on GitHub Actions: pytest, frontend type-check and a production build on every push.

## How it works

```diagram campus
alt: Brightspace syncs into SQLite and a local file store. Those files are split into an index of chunks. Retrieval reads the index and feeds an agent with twenty tools. The agent answers questions and writes every change to an audit log with the before and after state.
```

1. Sync. Playwright signs in and pulls course content. Files with an unchanged sha256 are skipped.
2. Index. Course files are split into chunks.
3. Retrieve. A SQL prefilter catches exact phrases, embedding search finds related chunks, and a cross-encoder reranks them.
4. Answer. The agent picks from its tools to search, read files, or change notes and due dates.
5. Audit. Every write is logged with its before and after state.

## Models and cost

- The agent talks to any OpenAI-compatible endpoint. Same code for a local server or a hosted API, set in config.

## Results

- I use it across {{stat:campus.courses}} courses for deadline lookups, studying from slides, and checking drafts against briefs.
- As of early October 2026 it had synced just over 200 course files. I'm the only user, so that number is my course load, not adoption.
- {{stat:campus.tests}} backend tests pass in CI on every push.
- Retrieval and answer quality: evaluation in progress.

## Next

Finish the retrieval and answer evaluation, then post the numbers here.
