---
title: TeraGo
type: experience
route: /experience/terago
description: Software Engineering Intern at TeraGo, May to Aug 2026: automated outage ticketing, Channel Finder and more.
priority: start-here
tags: [internship, local-llm, rf-planning]
related: [index.md, ../projects/index.md, ../skills.md]
onThisPage: [tl;dr, The problems, What I built, How it works, Models and cost, Results, Stack]
id: terago
dates: "May 2026 to Aug 2026"
role: contributor
updated: 2026-10-16
---
# TeraGo

TeraGo is a Canadian provider of cloud, colocation and connectivity services for businesses.

This was internal work, so there's no code or screenshots here.

## tl;dr

- Automated outage ticketing in Python: a local LLM on Ollama reads provider outage emails and opens Jira issues.
- Channel Finder, an RF tool that shortlists clear channels, validated on {{stat:TeraGo.testCases}} test cases.
- A Copilot Studio agent that answers engineers' RF questions from SharePoint documents.
- A proposal for a self-hosted LLM platform to cut per-user Copilot licensing costs.

## The problems

- Providers send outage notices in non-standard formats.
- Picking a clear frequency for a PMP or P2P link means checking candidates against MapInfo spectrum records.
- The answers to engineers' RF questions sit in SharePoint documents.
- Copilot is licensed per user.

## What I built

> **Outage emails to Jira (automated).** Reads the mailbox through Microsoft Graph, has a local LLM on Ollama pull out the key details, and opens a Jira issue.

> **Channel Finder.** An explainable RF decision-support tool in Python. It checks candidate frequencies against MapInfo spectrum records and shortlists clear ones for PMP and P2P links. Shipped as a CLI and a web UI.

> **Copilot Studio agent.** Answers engineers' RF questions from SharePoint documents.

> **Self-hosted LLM proposal.** LibreChat with SharePoint and Jira integrations, to cut per-user Copilot licensing costs.

## How it works

Outage ticketing:

```diagram
alt: The mailbox is read through Microsoft Graph, a local model on Ollama pulls out the key details, and a Jira issue is opened.
mailbox ─► Microsoft Graph ─► local LLM (Ollama) ─► Jira issue
```

Channel Finder:

```diagram
alt: A link type and candidate frequencies are checked against MapInfo spectrum records, producing a shortlist of clear frequencies.
link type + candidates ─► check against spectrum records
                       ─► shortlist of clear frequencies
```

## Models and cost

- The outage ticketing runs a local model on Ollama. Emails are processed locally, with no per-call API cost.
- The LibreChat proposal moves chat to a self-hosted platform instead of per-user Copilot licences.

## Results

- Channel Finder validated on {{stat:TeraGo.testCases}} test cases, shipped as a CLI and a web UI.
- Copilot Studio agent deployed for engineers.
