---
title: "Auralis"
type: project
id: auralis
description: A team-built virtual healthcare assistant with emotion detection and voice interaction.
priority: reference
rank: archive
dates: "Nov 2025"
role: "team"
status: shipped
tags: [ai, full-stack, 3d, health-tech]
related: [index.md, ../awards.md, ../skills.md]
updated: 2026-10-16
---
# Auralis

Virtual 3D healthcare assistant with emotion detection and natural voice interaction for telemedicine. Built with Next.js 16, React 19 and Three.js.

## Status

Built at Hack Western 12, 2025. The prize is listed in [awards](../awards.md).

## Tech Stack

- Next.js 16, React 19
- Three.js (3D avatar rendering)
- face-api.js (real-time emotion detection)
- Google Gemini 2.5 Flash (AI conversations)
- ElevenLabs (TTS/STT)
- FastAPI (backend)
- Cloudflare Pages (deployment)
- Tailwind CSS, Framer Motion

## Description

Auralis is a 3D virtual doctor you talk to by voice. It reads your facial expression while you talk and flags when what you say and how you look don't match.

### Key Features

1. **3D Avatar Doctor**
   - Interactive, lip-synced doctor avatar
   - Customizable appearance
   - Real-time animation

2. **Real-time Emotion Detection**
   - Analyzes facial expressions during consultation
   - Understands patient emotional state
   - Emotion mismatch detection (catches when patients say "I'm fine" while looking distressed)

3. **Intelligent Conversations**
   - Powered by Google Gemini AI
   - Natural, context-aware medical consultations
   - Medical content filtering configured for legitimate discussions

4. **Voice Interaction**
   - Natural speech-to-text and text-to-speech via ElevenLabs

5. **Emotion-Aware Responses**
   - Adjusts its replies to the emotion it detects

6. **Session Insights**
   - Post-consultation summary with emotion timeline
   - Key concerns and recommendations
   - Professional Report PDF Generation

### Challenges Overcome

- **Audio Synchronization**: Coordinating speech recognition, AI responses, and lip-sync animation
- **Emotion Detection Accuracy**: Balancing sensitivity without false positives
- **API Response Times**: Switched to Gemini 2.5 Flash for faster responses
- **Medical Content Filtering**: Configured safety thresholds for legitimate medical discussions
- **Team coordination**: four of us building features in parallel

### What We Learned

- Real-time audio processing and synchronization
- 3D rendering and animation with Three.js
- Prompt engineering for medical AI applications
- Multi-modal AI integration (text, voice, vision)

## Links

- Live Demo: https://stop-googling-symptoms.tech
- Devpost: https://devpost.com/software/docai-evq74t
- GitHub: https://github.com/rickytang666/auralis
