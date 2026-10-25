---
title: Omni-Reality
type: project
id: omni-reality
description: A Quest 3S mixed-reality assistant that answers in the room. Built with my team at Hack the North 2026.
dates: "Sep 2026"
role: team
status: shipped
rank: archive
tags: [mixed-reality, multimodal-ai, computer-vision, sam2, spatial-computing, unity, hackathon]
related: [index.md, eyecandy.md, aware.md]
updated: 2026-10-25
---
# Omni-Reality

A mixed-reality assistant for the Meta Quest 3S, built at Hack the North 2026 by Tim Roch, Wahib Barqawi, Zikora Chinedu and Nathan Espejo. It sees the passthrough view, hears the question, and answers in the room.

## What it does

- Highlights the object you mean with a SAM 2 mask that tracks it as you move.
- Guided Mode: a short, stateful plan from one captured frame, with "next", "repeat" and "stop" by voice. Up to three objects and eight steps.
- Layout Mode: six furniture types at approximate real size, moved and resized locally with the controllers.

## How it works

Unity on the Quest sends frames and speech to a Python coordinator over WebSockets. Qwen Omni, through Huawei's sponsored gateway, picks the object or plan. SAM 2 segments and tracks it. Gemini Live handles voice, with captions as a fallback.

The repo also limits model output to scene ops validated against JSON Schema, anchors placement to the pose at capture time, fits generated furniture to a listing's stated size with one uniform scale, acknowledges on the headset before speech, and keeps a redacted audit ledger.

## Credit

Team project: Tim Roch, Wahib Barqawi, Zikora Chinedu and Nathan Espejo. The site screenshot is by Tim Roch.

## Links

- GitHub: https://github.com/HasNate618/Omni-Reality
- Devpost: https://devpost.com/software/omni-reality
- Video: https://www.youtube.com/watch?v=4t_Sjc5_n_U
- Tim Roch's repo with the original write-up: https://github.com/timothyroch/Omni-Reality
