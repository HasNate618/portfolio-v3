---
title: "Cyberdeck"
type: project
id: cyberdeck
description: An abandoned Raspberry Pi handheld that boots straight into a terminal, with a stats screen over USB serial.
priority: reference
rank: archive
dates: "2026 (approx.)"
role: "solo"
status: abandoned
tags: [hardware, linux, embedded-systems]
related: [index.md, ../skills.md]
updated: 2026-10-16
---
# Cyberdeck

A handheld Linux computer built around a Raspberry Pi 3B that boots straight into a terminal. I dropped it before the build was done.

## What I built

- Power-on autologin into a Wayland kiosk (cage) running foot and tmux, so it lands in a terminal with no desktop.
- A Python script that streams CPU, RAM, temperature and network stats over USB serial to an M5Stack M5GO screen running PlatformIO firmware.
- A setup script that recreates the environment, plus RetroArch for NES, SNES and PS1 games.
- A case modeled in Blender around a 5-inch touchscreen, battery and speaker.

## Status

Abandoned.

## Links

- GitHub: https://github.com/HasNate618/cyberdeck
