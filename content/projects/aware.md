---
title: AWARE
route: /projects/aware
projectId: aware
description: Autonomous Witness And Response Engine. An offline device that sees, hears and reacts to a room.
priority: start-here
tags: [edge-ai, on-device, hackathon]
related: [index.md, campus.md, homelab.md, ../skills.md]
onThisPage: [tl;dr, Why I built it, What I built, How it works, Models and cost, Results, Stack]
---

## tl;dr

- Every model runs on one {{stat:aware.boardCost}} Arduino UNO Q. No cloud, no internet.
- You type a rule like "when glass breaks after 10pm alert me". An on-device LLM turns it into a deterministic rule.
- A rules engine checks every active rule each 500 ms. No LLM in that loop.
- YOLOv8n runs on the board's Adreno GPU through ONNX Runtime QNN.

## Why I built it

My goal for the edge track: a device where you describe what to watch for in plain English, and everything, including the language model, stays on the board. Camera and mic data never leave the room.

## What I built

It was my first solo hackathon project, so I built every part: the perception pipeline, the LLM rule compiler and parser, the rules engine, memory digests, the dashboard, the bridge to the microcontroller, and deployment.

## How it works

```diagram
alt: A camera, microphone and sensors feed an always-on perception pipeline. A plain-English command goes through the on-device language model to become a rule. The rules engine checks every rule every 500 milliseconds and drives a speaker, LEDs, Telegram alerts and video clips.
camera + mic + sensors ─► perception (always on)
                                │
"when glass breaks..." ─► LLM ─► rule ─► rules engine (500 ms)
                                              │
                   speaker · LEDs · Telegram · clips ◄┘
```

1. Perception, always on. YOLOv8n object detection at 2 Hz, plus BlazeFace, MediaPipe pose and hands, and MiDaS depth. YAMNet sorts sounds into 521 classes at 4 Hz. The STM32 microcontroller reads temperature, distance and motion, with Edge Impulse anomaly detection.
2. Reasoning, on demand. The LLM reads your command and calls create_rule() with "when" and "then" fields. A plain parser compiles those into triggers and actions.
3. Rules, every 500 ms. The engine checks each rule against the latest perception data. The LLM is not involved.
4. Action. Piper TTS on a Bluetooth speaker, LEDs, servo or relay control, Telegram alerts, video clips, and live dashboard updates.
5. Memory. Every event goes into SQLite. Every 5 minutes the LLM compresses recent events into a short digest. Ask "what happened today?" and it answers from the log, on the device.

## Models and cost

```models aware
caption: The five models AWARE runs on the board, and what each one does.
```

The LLM only runs when you add a rule, ask a question, or a digest is due. The 500 ms checks are plain code. No API costs, and nothing leaves the device.

## Results

- Built at Hack the 6ix 2026, with all inference on one {{stat:aware.boardCost}} board.
- Demo video and latency numbers: not posted yet.
