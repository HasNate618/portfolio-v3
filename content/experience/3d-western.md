---
title: 3D Western
type: experience
route: /experience/3d-western
description: "VP of Data/ML at 3D Western: a VLM-checked dataset of 3D models and a benchmark of small vision models to screen print uploads."
priority: start-here
tags: [vlm, datasets, blender, model-evaluation, team]
related: [index.md, ../projects/index.md, ../skills.md]
onThisPage: [tl;dr, The team and my role, Building the dataset, Benchmarking small vision models, Shieldstral vs Qwen, Handoff, What I'd do next, Stack]
id: 3d-western
dates: "Sep 2025 to Aug 2026"
role: "VP of Data/ML (promoted from Software Developer)"
updated: 2026-10-17
---
# 3D Western

3D Western is a student club at Western University that runs free makerspaces for students, in partnership with Morrissette Entrepreneurship. I joined as a Software Developer in Sep 2025 and was promoted to VP of Data/ML for May to Aug 2026, alongside my TeraGo internship. The club was building a print service where students submit jobs through its website, and anyone can upload an STL, so it needed a classifier to stop explicit or weapon-like models.

## tl;dr

- There was no labelled set of 3D models to choose one with, so the data team built one. Teammates wrote the preprocessing pipeline and render scripts. I got them working together, rendered and verified the full set, and fixed the bugs that broke the run: 2,559 clean labelled models from {{stat:3D Western.dataset}} scraped files.
- Our best small local model, Qwen3-VL-2B with the binary_v7 prompt, matched the labels on 84.2% of models with the filename included, and still missed about 21% of what it should flag. Our best image-only number is 76.9%, from the earlier v6 prompt. It isn't ready to ship.
- I built the eval that ruled out Shieldstral, a 3B safety model. Reviewing the pipeline, I noticed it only verified labels we already had, while real uploads arrive unlabelled, so we turned toward classification. I handed off a smoke-tested multi-model benchmark for a cluster run.

## The team and my role

Alongside the frontend, backend and infrastructure teams, the data team was two VPs and two developers. The other VP was also VP of Backend, so I ended up running most of the day-to-day: reviewing PRs, testing changes locally and getting them merged. It was my first dev team outside two-day hackathons, run on Jira tickets and a kanban board, and I liked working that way.

## Building the dataset

A teammate's pipeline drops exact duplicates by SHA-256 hash (802), renders each model in Blender, has a cloud VLM check each render against its scraped folder label, and exports the matches. The scraped folders were safe, unsafe and grey. Unsafe held only nudity, and grey held the other categories we'd want to stop: in the clean set, guns, knives, swords and gestures. For a print gate, both count as "flag".

```figure
src: /projects/3d-western-verification-funnel.webp
width: 1600
height: 693
alt: Two charts. Left, a funnel: 4,620 STL files discovered, 3,818 unique after removing 802 duplicates, and 2,559 in the clean dataset. Right, stacked bars: of the 3,818 checked, 735 were label mismatches and 522 were uncertain. The clean 2,559 split into 1,091 safe, 336 unsafe and 1,132 grey.
caption: From 4,620 scraped files to 2,559 clean ones. 1,259 went to review: 735 mismatches, 522 uncertain, and 2 matches that didn't make the export.
```

My part:

- I reviewed the branch against its ticket. It met all five acceptance criteria, but every render failed: it asked for Blender's EEVEE_NEXT engine, which doesn't exist in Blender 5.1.1. I switched it to WORKBENCH, which I'd measured at about 3 times faster per view than the Cycles setup in the render scripts.
- I merged it with a teammate's new render branch. It merged cleanly, then broke in four places, which I fixed: the manifest was never written, so contact sheets failed; the preset flag was ignored; grid layouts never cleaned up their tiles; and the contact-sheet glob looked for the wrong filenames.
- I added parallel workers, a resolution flag and output renaming to the batch renderer, then rendered the set with zero failures. Each model became one labelled 768×568 contact sheet of six 256×256 views, about 258 Gemini image tokens, against about 1,032 for the same sheet with 800 px views.
- I ran the full verification of 3,818 models. The VLM kept matching the "grey" label to the grey clay of the render, so I made the prompt say labels describe the content. Results were only saved at the end, so one restart cost about 50 minutes of calls; I added per-sample saves and resume.

That first review is also where I noted the pipeline only checks models against labels they already have. Real uploads have none, so production has to classify. I rewrote the production prompt as a classifier around a teammate's taxonomy prompt, the best in a 1,440-call prompt evaluation.

```figure
src: /projects/3d-western-dataset-composition.webp
width: 1230
height: 880
alt: Donut chart of the 2,559-sample benchmark set. Safe 42.6%, guns 33.0%, nudity 13.1%, swords 5.7%, knives 4.2%, gestures 1.4%. Counted as a binary task, 57% is unsafe.
caption: The 2,559-model benchmark set. Unsafe is the nudity folder and grey is guns, knives, swords and gestures. Both count as flag, so 1,468 of the 2,559 (57%) should be flagged.
```

## Benchmarking small vision models

We wanted a model small enough for the club to run itself, starting with Qwen3-VL-2B. The data team iterated on prompts on a 30-sample dev set, where v5 peaked at 90%. With so few samples, the versions that count are v6 and the later v7, run on all 2,559 clean models.

Every number below is agreement with folder labels a cloud VLM confirmed, so the clean set leans toward models a VLM already recognizes. Prompts and thresholds were chosen on this same set too, with no held-out split, so I'd read all of them as optimistic.

```figure
src: /projects/3d-western-dashboard.webp
width: 1600
height: 1149
alt: Dashboard for Qwen3-VL-2B with the binary_v6 prompt on 2,559 samples. Accuracy 80.6%, safe precision 69.9%, false positive rate 4.2%, false negative rate 30.7%, about 1.5 seconds per sample. Per-category accuracy: safe 96%, nudity 81%, guns 67%, knives 48%, swords 70%, gestures 74%. Filename plus size scores 80.6% against 76.9% for vision only.
caption: binary_v6 on the clean set, with the filename. It flags 4.2% of safe models and misses 30.7% of the ones it should flag.
```

binary_v6 sees the render plus the file's name and size, which scored 80.6% against 76.9% from the image alone. But a scraped filename can give the answer away, and uploaders name files anything, so 76.9% is our realistic baseline.

binary_v7, a later revision, cut misses from 450 to 307 at the cost of more false flags (97, up from 46), and matched the labels on 84.2% of models. It also sees the filename, and these results don't include an image-only run of it.

## Shieldstral vs Qwen

```figure
src: /projects/3d-western-model-showdown.webp
width: 1600
height: 593
alt: Two charts on all 2,559 samples. Accuracy: Qwen3-VL-2B binary_v6 80.6%, Qwen3-VL-2B binary_v7 84.2% (kept), Shieldstral-1.0-3B at threshold 0.02 80.7%. Errors: binary_v6 46 false positives and 450 false negatives, binary_v7 97 and 307, Shieldstral 212 and 281.
caption: We kept Qwen3-VL-2B with binary_v7: the highest agreement and less than half of Shieldstral's false flags, for 26 more misses.
```

Shieldstral-1.0-3B is made for image safety. I wrote an eval harness for it on llama.cpp that scores its probability of "yes" from the same render and filename. At the default threshold of 0.5 it got 56.7%. A sweep over the saved scores reached 80.7% at 0.02, again tuned on the same set. It missed 26 fewer than binary_v7 (281 against 307), but it produced more than twice the false flags to review (212 against 97) and it's a bigger model to host, so we kept Qwen.

To see why Shieldstral needed such a low threshold, I ran a small control. A real photo of an AK-47 scored 0.90 for unsafe, and a clay render of an AK-47 part scored 0.20. My best explanation is domain shift: its encoder learned from photos, and clay renders look like generic mechanical shapes. Two images don't prove it, but scoring renders and photos of the same objects across categories would.

## Handoff

I got all four open PRs merged to main, then reviewed the multi-model benchmark harness and runbook for Nibi, a research compute cluster. I fixed four issues, like a missing path that failed silently, smoke-tested it end to end and handed it off with a 30-sample check to run before the full sweep.

## What I'd do next

Still open when my term ended in Aug 2026:

- Build a held-out split and rerun v7 on it, with and without the filename.
- Check whether Qwen's saved scores have the same threshold headroom Shieldstral had.
- Sort the flagged models into bad source labels and verifier mistakes, and reuse them as a harder test set.
- Finish the switch to classifying uploads, then wire it into the print form.
