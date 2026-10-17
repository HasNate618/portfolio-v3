---
title: "Glyph"
type: project
id: glyph
description: A leader-key command overlay for Windows with discoverable actions and per-app bindings.
priority: reference
rank: featured
dates: "Jan 2026 (approx.)"
role: "owner"
status: shipped
tags: [developer-tools, desktop-software, productivity]
related: [index.md, ../skills.md]
updated: 2026-10-16
---
# Glyph

Leader-key command overlay for Windows with discoverable actions, per-app bindings, and custom themes. Built with C#, .NET and WPF.

## Tech Stack

- C#, .NET
- WPF (Windows Presentation Foundation)
- YAML (configuration)
- WinGet (distribution)

## Description

Glyph is a productivity tool that brings Vim-style leader key functionality to Windows applications. It provides a discoverable command overlay that adapts to the currently active application.

### Key Features

1. **Leader-Key Activation**
   - Press leader key to open command overlay
   - Context-aware based on active application
   - Non-intrusive popup interface

2. **Per-App Bindings**
   - Different command sets for different applications
   - Automatic context detection
   - Customizable per-application configurations

3. **Discoverable Actions**
   - Visual overlay shows available commands
   - No need to memorize complex shortcuts
   - Contextual help system

4. **Custom Themes**
   - User-customizable appearance
   - YAML-based configuration
   - Extensible theme system

### Architecture

- **Frontend**: WPF overlay window
- **Backend**: Windows API hooks for application detection
- **Config**: YAML files for bindings and themes
- **Distribution**: WinGet package manager

## Links

- GitHub: https://github.com/HasNate618/Glyph
