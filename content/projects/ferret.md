---
title: "ferret"
type: project
id: ferret
description: Local-first semantic search: text, images and PDF pages indexed into one SQLite file, searched by meaning, keyword or filename.
priority: reference
dates: "Oct 2026 (approx.)"
role: "solo"
tags: [local-first, retrieval, rust, developer-tools]
related: [index.md, ../local-ai.md]
updated: 2026-10-17
---
# ferret

Local-first semantic file search. Ferret indexes text, images and PDF pages into one local SQLite file and searches it by meaning, keywords or filename, from the terminal, from fzf, from Quickshell or from an agent. It ships as one static Rust binary, with no daemon and no GUI.

## How it works

1. Walk the configured roots, honouring gitignore, hidden files, size caps and include or exclude globs, and report every skip.
2. Extract text chunks, image pixels and PDF pages, the last as text plus an optional raster per page.
3. Embed through an OpenAI-compatible embedding server. The default is a local `llama-server` running EmbeddingGemma; ferret itself never loads model weights.
4. Search hybrid: vector similarity, keyword and filename, fused with reciprocal rank fusion, with filters applied in SQL before ranking.

## What it does

- Indexes text, images, PDFs, audio and video. Audio and video become segments (30 seconds and 10 seconds by default) embedded through the model's audio and video encoders, with no transcription, and stay searchable with plain text queries.
- Three search modes: semantic, keyword or hybrid. Keyword search and filter-only browsing never call the embedder, so they work offline and against a dead server.
- Filters on file kind, extension, directory, basename glob and modified time, all applied before ranking.
- Human-readable output or JSON. The JSON search contract is frozen for its Quickshell, fzf and agent clients, and every hit carries its vector, keyword and filename scores separately.
- Resumable indexing: an interrupted run keeps its finished files, and only uncommitted PDF pages are redone.

## Requirements

- An OpenAI-compatible `POST /v1/embeddings` server. Choosing a non-local backend uploads file bytes, and the command warns when that backend is in effect.
- `poppler-utils` for PDFs, `ffmpeg` for audio and video, and ImageMagick only for HEIC photos.
- A Nix flake with a NixOS module, or a plain `cargo build --release` without Nix.
- The test suite runs against a deterministic fake embedder, so it needs no network and no GPU.

## Links

- GitHub: https://github.com/HasNate618/ferret
