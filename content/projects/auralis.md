---
title: "Auralis"
type: project
priority: reference
rank: other
dates: "Nov 2025"
role: "team"
tags: [ai, full-stack, 3d, health-tech]
related: [index.md, ../awards.md, ../skills.md]
updated: 2026-10-15
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

Auralis is an AI-powered virtual doctor that conducts face-to-face video consultations with emotion awareness.

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
   - Seamless conversation flow

5. **Emotion-Aware Responses**
   - AI adapts communication style based on detected emotions
   - Empathetic and personalized interactions

6. **Session Insights**
   - Post-consultation summary with emotion timeline
   - Key concerns and recommendations
   - Professional Report PDF Generation

### Challenges Overcome

- **Audio Synchronization**: Coordinating speech recognition, AI responses, and lip-sync animation
- **Emotion Detection Accuracy**: Balancing sensitivity without false positives
- **API Response Times**: Switched to Gemini 2.5 Flash for faster responses
- **Medical Content Filtering**: Configured safety thresholds for legitimate medical discussions
- **Team Coordination**: 4 team members working on parallel features

### What We Learned

- Real-time audio processing and synchronization
- 3D rendering and animation with Three.js
- Prompt engineering for medical AI applications
- Multi-modal AI integration (text, voice, vision)
- Healthcare AI must balance accuracy with empathy

## Links

- Live Demo: https://stop-googling-symptoms.tech
- Devpost: https://devpost.com/software/docai-evq74t
- GitHub: https://github.com/rickytang666/auralis
