---
title: "AWARE"
type: project
priority: reference
rank: featured
dates: "Jul 2026"
role: "repo owner"
tags: [edge-ai, embedded-systems, computer-vision, audio-classification, iot]
related: [index.md, campus.md, ../skills.md, ../local-ai.md]
updated: 2026-10-15
---

# AWARE (Autonomous Witness And Response Engine)

AWARE is an edge automation device that sees, hears, and responds to its physical environment. Users type natural-language commands like "when glass breaks after 10pm alert me" into a local web dashboard, and an on-device LLM turns them into deterministic rules for a real-time rules engine.

## Overview

Everything runs locally on one $80 Arduino UNO Q, with no cloud and no internet required. It was built at Hack the 6ix 2026 in the Qualcomm "Build at the Edge" track.

## Tech Stack

- Python 3.12 (FastAPI, asyncio, WebSockets)
- YOLOv8n (ONNX, GPU-accelerated via QNN), real-time object detection
- MiniCPM5-1B (GGUF, Q4_K_M), natural language understanding + memory queries
- YAMNet (ONNX), sound event classification (521 classes)
- Whisper-tiny, speech-to-text
- Piper TTS, neural text-to-speech
- Arduino UNO Q board: Qualcomm Adreno 702 GPU (ONNX Runtime QNN EP + OpenCL preprocessing)
- STM32U585 Cortex-M33 MCU (real-time sensor processing)
- msgpack-rpc over arduino-router (MPU↔MCU bridge)
- SQLite (aiosqlite, WAL mode), event log + summary storage
- Docker + docker-compose (deployment)
- systemd (service management on board)
- ruff, mypy, pytest (code quality)

## Architecture

AWARE uses a three-layer architecture:

1. **Perception Layer** (always running): Camera → YOLOv8n object detection (2Hz) + BlazeFace face detection + MediaPipe pose/hands + MiDaS depth estimation. Mic → YAMNet audio classification (4Hz). MCU sensors (temp, distance, accelerometer) → Edge Impulse anomaly detection.

2. **Reasoning Layer** (on demand): LLM accepts natural language, calls `create_rule()` with plain English "when"/"then" fields. A deterministic NL-Parser compiles those into structured triggers and actions. The rules engine checks all active rules against incoming perception data every 500ms, and the LLM is not involved at runtime.

3. **Action Layer** (on trigger): Bluetooth speaker (Piper TTS), LED array (NeoPixel/PWM via MCU), servo/relay control, Telegram notifications, video clip recording, WebSocket dashboard updates.

## Memory System

Every perception event is logged to SQLite with timestamps and context. A background task every 5 minutes compresses recent events into LLM-generated narrative digests. Users ask natural-language questions ("what happened today?") via the dashboard or API, and the LLM queries the event log and summaries to answer, all on-device.

## Links

- GitHub: https://github.com/HasNate618/AWARE
- Devpost: https://devpost.com/software/a-w-a-r-e-autonomous-witness-and-response-engine
