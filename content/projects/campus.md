---
title: Campus
route: /projects/campus
projectId: campus
description: A self-hosted study assistant I built for my own courses.
priority: start-here
tags: [local-ai, rag, agents, education-tooling]
related: [index.md, homelab.md, aware.md, ../skills.md, ../local-ai.md]
onThisPage: [tl;dr, Why I built it, What I built, How it works, Models and cost, Results, Next, Stack]
---

## tl;dr

- Syncs my Brightspace courses into local SQLite and answers questions from the course files.
- Hybrid retrieval over {{stat:campus.chunks}} chunks from {{stat:campus.files}} course files.
- A {{stat:campus.tools}}-tool agent that can also edit my notes and due dates. Every write it makes is logged.
- {{stat:campus.tests}} tests run in CI on every push.
- Works with any OpenAI-compatible endpoint, local or hosted.

## Why I built it

My course material lives in Brightspace, spread across {{stat:campus.courses}} courses and {{stat:campus.files}} files. I wanted one place to look up deadlines, study from the slides, and check a draft against the assignment brief, running on hardware I control.

I also wanted it to update my notes and due dates. That is only useful if I can see exactly what it changed, so every AI write is logged with the before and after.

## What I built

All of it.

- LMS sync with Playwright, MFA login included, into SQLite and a local file store.
- sha256 change detection, so unchanged files are not downloaded again.
- Hybrid retrieval: embedding search, cross-encoder reranking, and a lexical SQL prefilter.
- A fix for exact phrases that scored below the semantic cutoff. They now go through the lexical path.
- A {{stat:campus.tools}}-tool agent that answers questions, reads files, and edits notes or due dates, in a bounded tool loop.
- An append-only audit log with the before and after state of every AI write.
- A React, TypeScript and Vite PWA.
- CI on GitHub Actions: pytest, frontend type-check and a production build on every push.

## How it works

```diagram
alt: Brightspace syncs into SQLite and a local file store. Those files are split into an index of chunks. Retrieval reads the index and feeds an agent with twenty tools, which answers questions and writes every change to an audit log with the before and after state.
Brightspace ─► sync ─► SQLite + files ─► index
                                          │
     answer ◄── agent (20 tools) ◄── retrieve
        │
        └──► audit log (every write, before and after)
```

1. Sync. Playwright signs in and pulls course content. Files with an unchanged sha256 are skipped.
2. Index. Course files are split into chunks.
3. Retrieve. A SQL prefilter catches exact phrases, embedding search finds related chunks, and a cross-encoder reranks them.
4. Answer. The agent picks from its tools to search, read files, or change notes and due dates.
5. Audit. Every write is logged with its before and after state.

## Models and cost

- The agent talks to any OpenAI-compatible endpoint. Same code for a local server or a hosted API, set in config.
- Like the rest of my AI work, I would rather run a low-cost model that fits the job than pay for the biggest one.
- Cost per question: still measuring.

## Results

- I use it across {{stat:campus.courses}} courses for deadline lookups, studying from slides, and checking drafts against briefs.
- {{stat:campus.chunks}} chunks indexed from {{stat:campus.files}} course files.
- {{stat:campus.tests}} tests pass in CI on every push.
- Retrieval and answer quality: evaluation in progress.

## Next

Finish the retrieval and answer evaluation, then post the numbers here.
