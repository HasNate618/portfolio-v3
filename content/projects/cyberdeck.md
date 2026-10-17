---
title: "Cyberdeck"
type: project
id: cyberdeck
description: A handheld Raspberry Pi cyberdeck with a terminal-first boot flow and custom 3D-printed case.
priority: reference
rank: archive
dates: "2026 (approx.)"
role: "owner"
status: in-progress
tags: [hardware, linux, embedded-systems]
related: [index.md, ../skills.md]
updated: 2026-10-16
---
# Cyberdeck

Custom handheld Linux cyberdeck built around a Raspberry Pi 3B with a terminal-first boot flow, modular hardware, and a custom 3D-printed case. Built with Raspberry Pi 3B, DietPi and Linux.

## Status

Work in Progress

## Tech Stack

- Raspberry Pi 3B
- DietPi (lightweight Debian OS)
- Linux, Bash
- PlatformIO
- Python
- Blender (case design)
- foot + cage (Wayland) + tmux
- RetroArch

## Description

The cyberdeck is a portable, self-contained computing unit designed for terminal work, retro gaming, and general tinkering on the go. No desktop environment, just the terminal, the way it should be.

### Hardware

| Component | Details |
|---|---|
| **SBC** | Raspberry Pi 3B |
| **Display** | 5-inch HDMI touchscreen |
| **Stats display** | M5Stack M5GO Core1 (USB serial) |
| **Battery** | Rechargeable with USB output to charge phones |
| **Power** | Inline power switch |
| **Audio** | 4Ω 3W speaker + Bluetooth speaker support |
| **Prototyping** | Mini breadboard with exposed Raspberry Pi GPIO |
| **Case** | Custom design, modeled in Blender (WIP) |

### Software Stack

- **OS**: DietPi, extremely lightweight Debian OS
- **Terminal**: foot + cage (Wayland) + tmux
- **Boot**: Autologin straight to terminal on boot
- **Stats**: PlatformIO firmware for M5GO Core1
- **Stats Sender**: Python script streaming system stats over USB serial
- **Gaming**: RetroArch (NES, SNES, PS1)

### Boot Experience

On power-on, tty1 autologs in as dietpi and immediately launches a Wayland kiosk session:

```
cage (Wayland kiosk) -> foot (terminal) -> tmux session "main"
                                             window 0: fastfetch, then bash
                                             window 1: CoreSerial stats sender (background)
```

No login prompt, no desktop, no MOTD, just the terminal.

### Key Features

1. **Terminal-First Design**
   - No desktop environment overhead
   - Optimized for keyboard-driven workflows
   - tmux for session management

2. **Live Stats Display**
   - M5GO Core1 renders CPU, RAM, temperature, network stats
   - Retro UI on built-in LCD
   - Data streamed over USB serial at 115200 baud

3. **Reproducible Setup**
   - Single script recreates entire environment
   - Documented configuration
   - Version controlled

## Links

- GitHub: https://github.com/HasNate618/cyberdeck
