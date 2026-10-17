---
title: "FLEXFIRE-X"
type: project
id: flexfire-x
description: A wearable launcher triggered by an EMG muscle sensor, with nine 3D-printed parts.
priority: reference
rank: archive
dates: "2025 (approx.)"
role: "owner"
status: shipped
tags: [hardware, embedded-systems, cad, 3d-printing]
related: [index.md, ../skills.md]
updated: 2026-10-16
---
# FLEXFIRE-X

A wearable, servo-powered arm attachment that extends and fires a spring-loaded projectile using EMG muscle signals, inspired by the arm launchers in Cyberpunk 2077. Built with Arduino Nano RP2040 Connect, EMG Sensor and SG90 Servo Motor.

## Tech Stack

- Arduino Nano RP2040 Connect
- EMG Sensor
- SG90 Servo Motor
- Continuous Servo
- C++
- Blender (3D design)
- 3D Printing (PLA)

## Description

FLEXFIRE-X is a bio-integrated device that mounts on the user's forearm and responds to intuitive muscle movements, inspired by the Projectile Launch System from Cyberpunk 2077.

### How It Works

**Gesture Control:**
- Wrist rotation (palm down) → Barrel extends
- Forearm flexion → Projectile fires

**EMG Signal Detection:**
- Electrodes placed over the flexor carpi radialis muscle
- Muscle signals filtered via moving average for stable results
- Three flexion states:
  - Low Flexion (<50) → Barrel stays retracted
  - Medium Flexion (>50) → Barrel extends
  - High Flexion (>500) → Projectile is launched

### 3D Design

- Nine 3D printed components designed in Blender
- Printed in PLA
- Custom designed rack and pinion gear system
- Mounting bracket for forearm attachment

### Launching Mechanism

1. Rocket inserted into barrel with fins aligning to internal grooves
2. Spring compresses as rocket is pushed in
3. Servo rotates locking rod, holding rocket under tension
4. Servo rotates back, disengaging lock
5. Spring decompresses, launching projectile forward

### Components

| Component | Purpose |
|---|---|
| Arduino Nano RP2040 Connect | Main microcontroller |
| EMG Sensor | Muscle signal detection |
| SG90 Servo Motor | Projectile launch trigger |
| Continuous Servo | Barrel extension/retraction |
| Pen Springs | Launches the projectile |
| 5V Red Laser | Aim assistance |
| 9V Batteries | On-body power management |

## Links

- GitHub: https://github.com/HasNate618/FLEXFIRE-X
- Video Demo: https://youtube.com/shorts/VqzTay1VbeE
