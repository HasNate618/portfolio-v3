---
title: "CareBridge"
type: project
priority: reference
rank: other
dates: "Feb 2026"
role: "team contributor"
tags: [ai, full-stack, healthcare]
related: [index.md, ../awards.md, ../skills.md]
updated: 2026-10-15
---

# CareBridge

AI healthcare platform connecting rural patients and providers with intelligent check-ins and risk tracking. Built with React 19, TypeScript and Vite.

## Status

Built at Spark Hackathon 2026. The prize is listed in [awards](../awards.md).

**Nathan's role:** Team contributor. The canonical repository is owned by a teammate (`liamma06/Spark`), not HasNate618.

## Tech Stack

- React 19, TypeScript, Vite
- FastAPI
- Supabase (database + auth)
- Cohere API (conversational AI)
- ElevenLabs (voice)
- Tailwind CSS
- Zustand (state management)

## Description

CareBridge AI is a healthcare coordination platform designed for rural communities, inspired by real consequences of broken care coordination.

### Inspiration

A winter storm that cut off access to a regional hospital exposed ongoing problems: missed referrals, fragmented communication, and lack of systematic follow-up escalating into preventable emergencies. We wanted to build a solution that actively closes the loop on care.

### What It Does

**For Patients:**
- AI-powered care companion for health check-ins and symptom reporting
- Conversational interactions that generate structured health summaries
- Low-friction, private way to report concerns without travel
- Ongoing engagement supporting follow-up rather than one-off interactions

**For Providers:**
- Unified dashboard showing all patients and their current status
- Chronological patient timeline tracking symptoms, alerts, and interactions
- Risk signals surfaced from patient conversations to flag potential escalation
- Clear visibility into patient history for continuity of care

### Architecture

- **Frontend**: React with TypeScript, Tailwind CSS, Zustand state management
- **Backend**: FastAPI serving REST endpoints
- **Database**: Supabase with Row Level Security and role-based access control
- **AI Layer**: Cohere for conversational analysis, ElevenLabs for voice
- **Risk Assessment**: Keyword-based and AI-assisted risk assessment

### Challenges Overcome

- **Trust and Privacy**: Designing for small communities where privacy concerns prevent engagement
- **Data Modeling**: Turning unstructured conversations into clean, chronological timelines
- **Scope Management**: Focusing on one core coordination failure within time limits
- **UI Layout**: Handling dynamic timelines without breaking layout

## Links

- Devpost: https://devpost.com/software/care-bridge-ai
- GitHub: https://github.com/liamma06/Spark
