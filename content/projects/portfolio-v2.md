---
title: "Portfolio v2"
type: project
id: portfolio-v2
description: The previous portfolio: a desktop-first site with a 3D ASCII ocean and a RAG chatbot.
priority: reference
rank: archive
dates: "Jun 2026 (approx.) to present"
role: "solo"
status: shipped
tags: [web-development, 3d-graphics, creative-development, portfolio]
related: [index.md, ../skills.md]
updated: 2026-10-16
---
# Portfolio v2

Portfolio v2 is a desktop-first portfolio website built as one continuous 3D ASCII ocean. The background is a tessellated water mesh with real Gerstner vertex displacement, post-processed through a GPU glyph-atlas ASCII shader (Dragonfly / Aniso style).

## Overview

Foreground content renders as normal HTML cards in a liquid-glass style that rise through the ocean surface as you scroll. It is built on Next.js 15, React 19, Three.js and React Three Fiber.

## Status

Live at nathanespejo.com and in active development. Its chatbot answers from this knowledge base with Cohere RAG.

## Tech Stack

- Next.js 15 (App Router)
- React 19, React DOM 19
- TypeScript
- Three.js + React Three Fiber + @react-three/drei
- @react-three/postprocessing + postprocessing (EffectComposer, custom AsciiEffect)
- Lenis (smooth scroll)
- Tempus (unified rAF clock for DOM + WebGL)
- Zustand (shared state management, emergence, cursor, chat mode)
- Framer Motion (post-breach HTML animations)
- Tailwind CSS 4 + CSS modules (liquid glass styling)
- tunnel-rat (DOM ↔ Canvas bridge)
- Cohere AI (RAG chat API)
- @darkroom.engineering/tempus
- Vercel Analytics
- ESLint 9, TypeScript 5

## Links

- GitHub: https://github.com/HasNate618/portfolio-v2
