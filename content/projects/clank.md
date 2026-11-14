---
title: Clank
type: project
route: /projects/clank
description: A physical-AI experiment where one local 2B vision-language model hears a VR game, sees what it renders, and decides what a simulated humanoid does next.
priority: start-here
tags: [physical-ai, embodied-ai, local-ai, robotics, simulation]
related: [index.md, aware.md, campus.md, ../skills.md, ../local-ai.md]
onThisPage: [tl;dr, Why I built it, What I built, How it works, What I measured, What didn't work, Limits, Next, Stack]
id: clank
dates: "Oct 2026 to present"
role: solo
status: active
updated: 2026-11-14
---
# Clank

## tl;dr

- One local 2B vision-language model, LFM3-Omni-2B, is the brain. It hears the game, sees the frame the game just rendered, remembers the run and decides what to do next.
- The body is a simulated Unitree G1 in MuJoCo. The game sees its head and hands as a player, through OpenXR.
- One task step works end to end: JobBot offers his card, the model decides to take it and finds it, the body reaches, and the game registers the grab.
- The runs are not scored yet, so there is no success rate.
- The whole stack, game included, runs on one GPU in {{stat:clank.vram}} of VRAM.

## Why I built it

I wanted to know how much of a task a small model can carry when nobody hands it state: no object positions, no task list, no goal written by me. Only what it hears and what it sees.

A commercial VR game is a fair test for that. It renders, it has physics, it fails a grab the way a real one fails, and it has no idea anything unusual is driving it. I changed no game files. Either the fingers close on the card or the card stays on the table.

## What I built

It's a solo project. What's mine:

- A Vulkan layer in C and GLSL that copies colour and depth out of the running game, which never exposes them.
- The locator, which turns a noun from the model into a point in metres.
- The turn loop: hearing, the prompt and session memory, reading the verb out of the model's goal, and the checks that refuse a plan the body can't do.
- Every experiment and measurement in the repo's research notes, failures included.

What isn't mine: NVIDIA's GEAR-SONIC whole-body controller and ARDY-G1 motion generator, and Liquid AI's LFM3-Omni-2B. I run all three as published, with no training or fine-tuning. Much of the code was written with a coding agent, and I checked it against the tests and those measurements.

## How it works

```figure
src: /projects/clank-1.webp
width: 2280
height: 1120
alt: Diagram of one turn of Clank's loop. Job Simulator feeds its audio and its colour and depth frames into the brain, one local 2B model, which hears, decides a goal in words with the run's memory, and locates the target in metres. Code reads the skill out of the goal, the simulated G1 moves (ARDY-G1, then SONIC), and its head and hands go back into the game through Monado and OpenXR.
caption: One turn. The model decides what to do; code turns that into a body the game can see.
```

1. Hear. The game's audio goes to a sink only the game feeds. A speech gate cuts out each line, and the model transcribes it in its own call.
2. See. The Vulkan layer leaves a colour image and a depth map in shared memory, at about {{stat:clank.depth}} at the median. RenderDoc took about 16 seconds a frame.
3. Decide. The model gets the newest still and the run so far, and replies with a goal in its own words. Code reads the skill out of that sentence.
4. Locate. Seven more calls find the target: a quadrant, five box reads, then a description that code checks against the noun. Depth turns the pixel into metres.
5. Act. The goal becomes one constraint, hand at the target with both feet planted. ARDY-G1 generates the motion, SONIC tracks it, and the head and hands go into the game's OpenXR session.

The model's part ends at a goal and a located target. It never writes a joint or a pose.

## What I measured

- The generated reach ended {{stat:clank.reach}} from its target on a measured run with the game live.
- On four live stills, a list of six actions got no grabs. Asking the model what it was trying to do got the card on all four. That is why the model states a goal and code picks the verb.
- Searching the whole frame failed: the model collapses image-wide grids toward the centre. The same question about a crop scored 44 of 44 on the tray, so code does the cropping.
- The body loop runs at {{stat:clank.loop}} with the game up, against a 50 Hz design.

## What didn't work

- Picking from a list, as above. It looked like a model-quality problem for a while and was a question-shape problem.
- Telling the model it was wrong. It re-issued the same reach on three stills out of three, so when an action needs a pixel the loop doesn't have, the loop runs the search itself.
- Trusting it with a greeting. It once planned to place a cartridge nobody had asked for. A schema check refused it, and a line that names no task no longer reaches the model.
- The speech gate. Its floor came from a window that included JobBot's loudest line, so it missed a quiet one. The floor now comes from the whole period before the gate opens.

## Limits

- It does one task step. No level is finished, and the body doesn't walk in the game yet.
- The runs are not scored, so there is no success rate. Every run since the generated reach has grabbed the card, but that is my observation, not a measurement.
- The head won't hold a commanded pose, so a target is kept in metres and re-projected every tick instead of remembered as a pixel.
- The torso doesn't turn toward the target, and the clasp threshold is a guess I haven't swept.

## Next

Score the card grab over a fixed number of runs and post the success rate here, then give the loop JobBot's second request, the job cartridge.
