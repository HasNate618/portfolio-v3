---
title: "AgenticArmy"
type: project
priority: reference
rank: featured
dates: "Mar 2026"
role: "repo owner"
tags: [agentic-coding, full-stack, ai-systems]
related: [index.md, ../skills.md]
updated: 2026-10-15
---

# AgenticArmy

Human-in-the-loop multi-agent coding workflow with a VS Code extension and FastAPI backend for planning, coordination, conflict analysis, and QA. Built with TypeScript, JavaScript and Python.

## Tech Stack

- TypeScript, JavaScript
- Python, FastAPI
- VS Code Extension API
- Moorcheh SDK (agent memory)
- RailTown (agent orchestration)
- Gemini API

## Description

AgenticArmy answers a practical question: how do you run multiple "coder agents" in parallel without them constantly conflicting, duplicating work, or losing context?

### Workflow

1. **Human provides goal** - High-level process, success metrics
2. **Planning agent runs** - Finds ways the goal can be implemented
3. **Human approves/denies plan** - If denied, return to step 2
4. **Task coordinator agent runs** - Splits tasks among agents
5. **Conflict analysis agent runs** - Assigns conflict scores based on likelihood of overwriting each other's work
6. **Coding agents run** - Tasks completed in isolated environments
7. **Merge agent runs** - Merges individual agent commits
8. **QA agent runs** - Tests code for functionality

### Key Features

- **Conflict Analysis**: Anticipates coding agent disagreements before they happen
- **Human-in-the-Loop**: Human intervention only for goal setting and plan approval
- **Similarity Scoring**: Calculates possibility of code overlap for reliable merges
- **State Machine**: Supports loopbacks (plan rejection, conflict risk too high, merge failure, QA failure)
- **Simulation Mode**: For local/UI testing without burning LLM quota

### Architecture

**VS Code Extension:**
- Collects goal and settings
- Calls backend endpoints
- Polls job status and renders logs + results

**FastAPI Backend:**
- Owns job lifecycle + HITL gates
- Runs phases: planner → coordinator → conflict analysis → coders → merge → QA
- Exposes stable API contract

### Job Statuses
`initializing → planning → awaiting_plan_approval → coordinating → analyzing_conflicts → coding → merging → verifying → review_ready → done|failed`

## Links

- Devpost: https://devpost.com/software/agenticarmy
- GitHub: https://github.com/HasNate618/genai-genesis-2026
