---
title: Experience
type: page
route: /experience
description: Software engineering internship at TeraGo, VP of Data/ML at 3D Western, and student team roles.
priority: start-here
tags: [experience]
related: [index.md, ../skills.md]
updated: 2026-10-16
---
# Experience

Roles newest first.

## TeraGo

- Built a working outage-email parser in Python: a local LLM on Ollama pulls the details out of non-standard provider outage emails and opens Jira issues, reading mail through Microsoft Graph. It works end to end, but TeraGo hasn't deployed it yet.
- Wrote Channel Finder, a Python tool that shortlists clear RF channels from MapInfo spectrum records. Validated on {{stat:TeraGo.testCases}} test cases, shipped as a CLI and a web UI.
- Deployed a Copilot Studio agent that answers engineers' RF questions from SharePoint documents.
- Proposed a self-hosted LLM platform (LibreChat with SharePoint and Jira) to cut per-user Copilot licensing costs.

## 3D Western

3D Western is a student club that does free 3D printing in Western's makerspace.

- As VP (May to Aug 2026, alongside TeraGo), co-led two data developers through Jira tickets and PR review on the club's print-approval dataset and benchmark.
- Built a labelled dataset from {{stat:3D Western.dataset}} scraped 3D models, rendered in Blender and labelled by a VLM.
- Benchmarked base vision models on the 2,559 clean renders (safe, unsafe and grey classes) as groundwork for fine-tuning. The best agreed with the dataset labels on 84.2% of them.
- As Software Developer (Sep 2025 to Apr 2026), worked on the Dockerized print pipeline (slicing, orientation, supports, printability checks) and wrote the scraping and rendering scripts.

## WEMars

Western's Mars rover team.

- Since Sep 2026: back on the software team, on AI and autonomy for the rover. Just getting started.
- 2024-25: built wireless camera streaming for the rover on the ESP32-CAM, and explored networking to a central hub and computer vision for navigation markers.

## WEFirst Robotics

- Programmed the swerve drive to turn Xbox controller input into omnidirectional motion.
- Tuned closed-loop control for wheel heading and drive speed in autonomous and teleop modes.
- Assembled and wired the drivetrain: CAN bus, motor controllers and encoder calibration.

## Microcomputer Consulting Inc.

- Set up and deployed Windows workstations for client organizations.
