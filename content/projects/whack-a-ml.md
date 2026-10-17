---
title: "Whack-A-ML"
type: project
id: whack-a-ml
description: A reinforcement learning agent that trains a simulated robotic arm to strike targets in Unity.
priority: reference
rank: archive
dates: "Jan 2026 (approx.)"
role: "owner"
status: shipped
tags: [ai, reinforcement-learning, unity, robotics-simulation]
related: [index.md, ../skills.md]
updated: 2026-10-16
---
# Whack-A-ML

Reinforcement learning agent training a robotic arm to strike targets in Unity using PPO and curriculum learning. Built with PyTorch, Unity3D and C#.

## Tech Stack

- PyTorch
- Unity3D
- C#
- PPO (Proximal Policy Optimization)
- ML-Agents

## Description

Whack-A-ML is a machine learning project that trains an AI agent to control a robotic arm in a Unity simulation environment. The agent learns to strike targets using reinforcement learning techniques.

### Technical Details

**Reinforcement Learning:**
- PPO (Proximal Policy Optimization) algorithm
- Curriculum learning for progressive difficulty
- Continuous action space for arm control

**Unity Environment:**
- Simulated robotic arm physics
- Target generation and positioning
- Reward system design
- Observation space definition

**Training Process:**
- Agent learns through trial and error
- Reward shaping encourages desired behavior
- Curriculum gradually increases difficulty
- Model checkpoints saved during training

### Architecture

- **Unity Side**: Environment setup, physics simulation, visual rendering
- **Python Side**: PyTorch model, PPO implementation, training loop
- **Communication**: ML-Agents toolkit for Unity-Python bridge

## Links

- GitHub: https://github.com/HasNate618/Whack-A-ML
