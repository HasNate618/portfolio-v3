---
title: "Local and cost-aware AI"
type: hub
priority: start-here
dates: "Apr 2026 (approx.) to present"
tags: [local-ai, inference, models, cost]
related: [about.md, projects/aware.md, projects/campus.md, projects/homelab.md, experience/terago.md]
updated: 2026-10-15
---

# Local and cost-aware AI

Most of Nathan's AI work runs on hosted API models, and he deliberately picks low-cost, efficient ones matched to each task, the way a company would, rather than paying for maximum capability. He also runs models locally where the job calls for it: on an edge board, on his laptop, and in a work prototype.

## Where models run

| Where | What runs | Hosted or local | When |
|---|---|---|---|
| Campus | Any OpenAI-compatible endpoint for the agent; embedding search and cross-encoder reranking for retrieval | Either, by config | Aug 2026 to present |
| Homelab (Hermes Agent profiles) | Low-cost hosted API models picked per task, plus llama.cpp as a local provider | Mostly hosted | Jun 2026 to present |
| flow laptop | llama.cpp serving local GGUF models, set up in his local-llama-setup repo | Local | Apr 2026 (approx.) to present |
| Homelab server | Open WebUI, a Bifrost gateway that routes between local and cloud models, Whisper speech-to-text | Mixed | May 2026 to present |
| AWARE | YOLOv8n, YAMNet, Whisper-tiny, Piper TTS and a small GGUF LLM on an Arduino UNO Q | Local, on-device | Jul 2026 |
| TeraGo | Ollama prototype that extracts details from outage emails | Local | May to Aug 2026 |

## AWARE on-device

Built at Hack the 6ix 2026, AWARE runs every model on one $80 Arduino UNO Q, using the board's Adreno GPU through ONNX Runtime QNN. The LLM only turns plain-English commands into rules through a `create_rule()` call; a deterministic parser compiles them, and a rules engine checks them every 500 ms without the LLM. Details in [AWARE](projects/aware.md).

## llama.cpp on flow

His flow laptop runs llama.cpp for local GGUF models. Both Hermes Agent profiles can use it as a provider alongside hosted APIs. Details in [Homelab](projects/homelab.md).

## Campus, endpoint-agnostic

Campus talks to any OpenAI-compatible endpoint, so the same code runs against a local server or a hosted API. Retrieval combines embedding search, cross-encoder reranking and a lexical SQL prefilter. Details in [Campus](projects/campus.md).

## TeraGo Ollama prototype

At TeraGo (May to Aug 2026) he built a Python prototype where a local LLM on Ollama extracts the key details from non-standard provider outage emails and the pipeline opens Jira issues. Details in [TeraGo](experience/terago.md).
