---
title: Beacon
type: project
route: /projects/beacon
description: A chest-worn Raspberry Pi 5 on QNX 8.0 that homes a wearer to a named item by sound, built so perception can fail without the guidance deadline slipping.
priority: start-here
tags: [embedded, qnx, real-time, accessibility, on-device, hackathon]
related: [index.md, aware.md, clank.md, ../skills.md]
onThisPage: [tl;dr, Why QNX, What I built, How it works, What I measured, What didn't work, Limits]
id: beacon
dates: "Nov 2026"
role: perception, team of five
status: prototype
updated: 2026-11-24
---
# Beacon

A chest-worn Raspberry Pi 5 that runs QNX and answers where a thing is. The wearer asks for something they have already seen this session, walks on the spoken bearing, and hears ticks that speed up and pan as their hand reaches the object, then a tone when it is close. The team built it at Hack Western 13. I owned perception.

## tl;dr

- Perception and guidance are separate processes pinned to separate cores. Guidance owns the speaker and keeps its {{stat:beacon.deadline}} deadline whether or not a model answers.
- When the detector dies, guidance holds the last cue, then says it lost the target. It never invents a distance.
- I wrote the perception side: camera capture, YOLOE-26n detection, metric depth, the relay into shared memory, and the design doc the repo builds against.
- 1,500 guidance periods, none missed, on the run where the relay was killed and restarted.
- A sighted team built it, and no blind or low-vision wearer has tested it. It supplements a cane; it does not detect obstacles, stairs or traffic.

## Why QNX

A model that hangs on a general-purpose Linux delays the beeps by hundreds of milliseconds and reports nothing, so the wearer follows a cue that stopped being true. That is the whole reason for this board and this OS: put the sound in a process a model cannot starve, and measure it against a deadline.

The contract is one sentence. Perception may fail. Guidance may not.

`guided` is the only process that opens the audio device, so nothing else can make noise. It reads the newest perception record from shared memory and never waits on a model. When perception stops, the cue holds for a moment, then says it lost the target. A guessed metre would be worse than the silence it replaces, because someone walking on a wrong distance is being told something false about the world.

## What I built

Five processes share one contract. Mine are the two that turn a camera into a named point in metres, the pipe between them, and the document they all build against:

- `percept`, the perception process: YOLOE-26n detection over a baked noun list, Depth Anything V2 metric depth, MediaPipe hands, unprojection from pixel and depth to metres, and depth-backed visual odometry.
- `camd`, capture: frames from the C270 through QNX's Sensor Framework into a frame ring.
- `ingest`, the relay: perception records from UDP into the seqlocked, newest-wins shared memory that guidance reads.
- `percept/ort_capi.py`: the image ships the ONNX Runtime shared library with no Python binding, and OpenCV's loader segfaults on the depth model, so this calls the C API through ctypes with 415 members generated in declaration order.
- `docs/nathans-revision.md`: the product, geometry and process contract. The repo treats it as the design source of truth, including what not to claim.

124 commits, more than anyone else on the team of five.

Both pictures are from the laptop dashboard, which a teammate built and ran beside the table so a judge could watch what the wearer hears. My part of it is the camera panel: the colour frame and the same moment as a depth map, with the detection box drawn on both.

## How it works

```diagram beacon
alt: Frames from the chest camera go into perception, which writes detection and depth into shared memory. The guidance process reads the newest record and drives speech, stereo ticks and a tone. A second row shows the failure the design is for: perception killed mid-run, the cue holds the last known place, then it says it lost the target.
```

1. Capture. `beacon_grab` leaves the newest frame in a ring, so perception always works on the latest one rather than a queue of stale ones.
2. Perceive. Detection and depth run on the CPU through ONNX Runtime. Both are far too slow to sit inside a control loop, and neither has to be: the cue is directional.
3. Publish. `ingest` writes the newest record into shared memory under a sequence lock. A reader gets the last complete record or nothing. It never blocks.
4. Guide. `guided` runs {{stat:beacon.deadline}} on core 0 at a real-time priority, and turns that point into speech, stereo ticks and a tone.
5. Supervise. `supervisor` starts the children with their scheduler settings, watches a 50 ms heartbeat and restarts a dead child.

## What I measured

- The full chain on the Pi with real detection and depth, fed a recorded clip: 1,500 guidance periods, none missed, worst lateness 4.7 ms, p95 1.9 ms.
- `ingest` killed mid-run: guidance said it lost the target and held its deadline for 1,800 loops with none missed.
- A new `ingest` started without touching `guided`: the cue came back, 2,100 loops, none missed, p95 2.05 ms.
- `guided` killed under the supervisor: the fault is logged and it respawns in about 100 ms with no reboot.
- Detection warm at 320 px takes {{stat:beacon.detect}} a frame and depth takes {{stat:beacon.depth}}, which is exactly why guidance reads memory instead of calling a model.

## What didn't work

- The microphone, which is the part I would put in front of QNX. The C270 mic captures nothing on this image, so I wrote a UAC1 driver against `sys/usbdi.h`: it claims the audio interface, selects alt 4 at 48 kHz, opens the isochronous IN pipe, unmutes the feature unit, sets the sample rate, and every control request is ACKed. Zero packets arrive, across both of QNX's isochronous APIs, every alt setting, a VBUS power cycle and a reboot.
- The same driver with a flag streams the camera's video endpoint and receives real frames, and that is the control that matters. At the controller, the audio ring is well formed with real isochronous TRBs and the dequeue never advances one. The completions the driver reports are simulated by its own software path. This stack schedules microframe-period isochronous transfers in hardware and simulates the 1 ms ones in software. No user-space fix exists, so it needs a driver package update, and the demo sends a request as a record instead of speech.
- Hand tracking. The MediaPipe binding fails on this image, so the reach cue has only run on recorded input, never on live hand position.
- Runmasks. The image takes a single CPU or all of them and returns EINVAL for anything between, so perception pins one core and the log records the kernel's readback instead of the mask we asked for.
- The depth scale. Never checked against a tape measure, so nothing in the cue is a distance in metres.

## Limits

- No blind or low-vision wearer has used it. The team is sighted, and testing with wearers is the next step.
- The measured chain fed the Pi a recorded clip. Live frames reach perception, but the kill beat is rehearsed on replay.
- Six nouns: bottle, can, keys, phone, box, mouse. Asking to be walked back to where you came from is designed and not in the demo.
- It supplements a cane. It does not detect obstacles, stairs or traffic, and it cannot find something it has not seen this session.
