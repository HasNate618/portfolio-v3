---
title: "Lumen"
type: project
id: lumen
description: A team-built wellness companion that selects a mini-game from a mood check-in.
priority: reference
rank: archive
dates: "Aug 2025"
role: "team"
status: shipped
tags: [ai, games, mental-health]
related: [index.md, ../awards.md, ../skills.md]
updated: 2026-10-16
---
# Lumen

Built at TerraHacks 2025 with a team of four. You check in on how you feel, Gemini reads it, and Lumen picks a mini-game to match. I built the Unity mini-games.

## Status

Built at TerraHacks 2025. The prize is listed in [awards](../awards.md).

## Tech Stack

- React, TypeScript
- Unity3D, C#
- Gemini API
- Phaser.js
- Node.js
- MongoDB
- Clerk (authentication)
- Framer Motion, GSAP

## Description

Lumen is a mental wellness app. You check in with how you feel through a short guided survey or by journaling freely.

### How It Works

1. User completes emotional check-in or journal entry
2. Gemini analyzes emotional state
3. System offers gentle guidance through personalized minigame
4. Games designed with therapeutic principles to help users feel calmer
5. Early insights indicate potential health issues based on patterns
6. Builds history of emotional trends over time

### Key Features

1. **Emotion Analysis**
   - Gemini interprets nuanced journal inputs
   - Returns emotionally intelligent responses

2. **Personalized Mini-Games**
   - Built in Unity with C#
   - Dynamically adapt to different moods
   - Therapeutic game design principles
   - Embedded in React app with minimal latency

3. **Data Tracking**
   - User emotional history
   - Login frequency and patterns
   - Emotional trend visualization
   - MongoDB for data storage

## Links

- Live Demo: https://llumen.netlify.app/
- Devpost: https://devpost.com/software/lumen-qsgcn4
- GitHub: https://github.com/Dawgsrlife/lumen
