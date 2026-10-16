---
title: "Software Engineering Intern, TeraGo"
type: experience
priority: start-here
dates: "May 2026 to Aug 2026"
role: "Software Engineering Intern"
tags: [local-llm, automation, rf-planning, microsoft-graph, jira]
related: [index.md, ../local-ai.md, ../skills.md]
updated: 2026-10-15
---

# Software Engineering Intern, TeraGo

Nathan interned at TeraGo in Markham, ON from May to Aug 2026. He built a local LLM prototype for outage tickets, an RF channel tool and a Copilot Studio agent, and proposed a self-hosted LLM platform.

## About TeraGo

TeraGo is a Canadian provider of cloud, colocation, and connectivity services for businesses.

## Outage emails to Jira (prototype)

Providers send outage notices in non-standard formats. Nathan built a Python prototype where a local LLM running on Ollama extracts the key details from each email and the pipeline opens Jira issues, using Microsoft Graph to read the mail.

## Channel Finder

Channel Finder is an explainable RF decision-support tool written in Python. It shortlists clear frequencies for PMP and P2P links by checking candidates against MapInfo spectrum records, and it was validated on 760 test cases. It shipped as both a CLI and a web UI.

## Copilot Studio agent

He deployed a Copilot Studio agent that answers engineers' RF questions from SharePoint documents.

## Self-hosted LLM proposal

He proposed a self-hosted LLM platform (LibreChat with SharePoint and Jira integrations) to cut per-user Copilot licensing costs, with estimated savings over Copilot.

## Stack

Python, Ollama, Microsoft Graph, Jira, Copilot Studio, SharePoint, MapInfo data.
