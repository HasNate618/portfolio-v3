---
title: "Eyecandy"
type: project
id: eyecandy
description: A team-built AR try-on experience for Shopify products on Snap Spectacles.
priority: reference
rank: archive
dates: "Sep 2025"
role: "team"
status: shipped
tags: [ar, ai, shopping, full-stack]
related: [index.md, ../awards.md, ../skills.md]
updated: 2026-10-16
---
# Eyecandy

An AR shopping experience that turns Shopify products into virtual try-on using augmented reality. Built with Snap Spectacles, Lens Studio and Shopify API.

## Status

Built at Hack the North 2025. The prize is listed in [awards](../awards.md).

## Tech Stack

- Snap Spectacles
- Lens Studio
- Shopify API
- TypeScript
- Express/FastAPI backend
- Gemini API

## Description

Eyecandy reimagines online shopping by blending commerce and augmented reality. Users can look at a Shopify product image and instantly see themselves wearing it in AR.

### Key Features

1. **AR Try-On**
   - Instant virtual try-on of products
   - First-person and third-person camera toggles
   - Hands-free interaction via voice commands

2. **Product Pipeline**
   - Shopify Storefront API integration
   - OAuth connection to fetch products
   - Normalized data through backend

3. **3D Conversion**
   - Single-image 3D reconstruction
   - Background removal from product images
   - GLB mesh generation via Snap3D API
   - Mesh optimization (<15k triangles)

4. **AR Anchoring**
   - Upper Body Tracking 3D for attaching products
   - Face mesh for glasses
   - Torso joints for jackets and accessories
   - Voice ML for hands-free browsing

### Architecture

**Data Pipeline:**
1. Free Shopify development store with OAuth
2. Backend normalizes product data
3. Returns JSON with title, imageUrl, generated glbUrl

**2D → 3D Conversion:**
1. Segment product images to remove backgrounds
2. Run through single-view reconstruction model
3. Produce GLB meshes
4. Decimate and compress for real-time rendering

**AR Integration:**
1. Import meshes into Lens Studio
2. Anchor to body tracking points
3. Enable speech recognition
4. Add camera toggles

### What We Learned

- AR anchoring and body tracking
- Value of official APIs over scraping
- Single-image 3D reconstruction techniques
- Hands-free interaction design

## Links

- Devpost: https://devpost.com/software/eye-candy
- GitHub: https://github.com/Duck-luv-pie/eyecandy
