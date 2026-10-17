---
title: "CareBridge"
type: project
id: carebridge
description: A team-built rural care platform with patient check-ins, timelines and risk signals for providers.
priority: reference
rank: featured
dates: "Feb 2026"
role: team
status: shipped
tags: [ai, full-stack, healthcare]
related: [index.md, ../awards.md, ../skills.md]
updated: 2026-10-16
---
# CareBridge

A care platform for rural patients and providers, built by a team at Spark 2026. Patients check in by chat or voice, and providers see one timeline with risk signals from those check-ins. Built with React 19, TypeScript, Vite and FastAPI.

## Status

Built at Spark Hackathon 2026. The prize is listed in [awards](../awards.md).

**Credit:** Team project. The canonical repository is owned by a teammate (`liamma06/Spark`), not HasNate618.

## Tech Stack

- React 19, TypeScript, Vite
- FastAPI
- Supabase (database + auth)
- Cohere API (conversational AI)
- ElevenLabs (voice)
- Tailwind CSS
- Zustand (state management)

## What it does

Patients check in by chat or voice. Each conversation becomes a structured summary on a timeline, and providers see every patient in one dashboard, with risk signals flagged from what patients said.

## How it works

A React and TypeScript frontend talks to a FastAPI backend. Supabase stores the data, with row-level security and role-based access. Cohere reads the conversations, ElevenLabs handles voice, and risk flags combine keyword rules with model output.

## Why

A winter storm cut off a regional hospital, and missed referrals and follow-ups turned into emergencies. We picked that one coordination failure and built for it.

## Links

- Devpost: https://devpost.com/software/care-bridge-ai
- GitHub: https://github.com/liamma06/Spark
