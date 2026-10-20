---
title: TeraGo
type: experience
route: /experience/terago
description: Software Engineering Intern at TeraGo, May to Aug 2026: an email-to-ticket LLM prototype, an RF channel-planning tool, and a documentation assistant.
priority: start-here
tags: [internship, local-llm, rf-planning]
related: [index.md, ../projects/index.md, ../skills.md]
onThisPage: [tl;dr, What I built, How it works, Models and cost, Results, Stack]
id: terago
dates: "May 2026 to Aug 2026"
role: contributor
updated: 2026-10-20
---
# TeraGo

TeraGo is a Canadian provider of managed network and security services for businesses, including fixed wireless access and private 5G networks.

This was internal work, so there's no code or screenshots here, and the details are kept general.

## tl;dr

- A prototype pipeline in Python that uses a locally hosted LLM on Ollama to turn unstructured emails into structured tickets. It works end to end.
- An RF channel-planning tool in Python that shortlists clear frequencies for fixed-wireless links, with a validation test suite.
- An internal RAG assistant that answers engineers' technical questions from company documentation.
- A proposal for a self-hosted LLM platform integrated with internal tools.

## What I built

> **Email-to-ticket prototype.** A locally hosted LLM on Ollama reads each unstructured email, pulls out the key details, and the pipeline creates a structured ticket. It works end to end as a prototype.

> **RF channel-planning tool.** A Python tool that shortlists clear frequencies for point-to-point and point-to-multipoint fixed-wireless links. It has a command-line and a web interface and is backed by a validation test suite.

> **Documentation assistant.** An internal RAG assistant that answers engineers' technical questions from company documentation.

> **Self-hosted LLM proposal.** I researched and proposed a self-hosted LLM platform integrated with internal tools.

## How it works

Email-to-ticket prototype:

```diagram
alt: An email goes to a locally hosted model on Ollama, which pulls out the key details, and a structured ticket is created.
email ─► local LLM (Ollama) ─► structured ticket
```

RF channel-planning tool:

```diagram
alt: A link type and candidate frequencies are checked by the tool, producing a shortlist of clear frequencies.
link type + candidate frequencies ─► checks ─► shortlist of clear frequencies
```

## Models and cost

- The prototype runs a local model on Ollama, so emails are processed locally, with no per-call API cost.

## Results

- Email-to-ticket prototype: working end to end.
- RF channel-planning tool: shipped with a command-line and a web interface, backed by a validation test suite.
- Documentation assistant: deployed for engineers.
