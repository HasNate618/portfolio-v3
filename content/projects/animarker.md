---
title: "Animarker"
type: project
id: animarker
description: An Android wildlife tracker that identifies species with computer vision and maps sightings.
priority: reference
rank: archive
dates: "May 2023"
role: "solo"
status: shipped
tags: [android, ai, computer-vision, data-collection]
related: [index.md, ../skills.md]
updated: 2026-10-16
---
# Animarker

An Android app that identifies an animal from a photo and puts the sighting on a map. Built with Kotlin, TensorFlow and the Google Maps API. It was my first hackathon, and I did it solo: a small online event that ran over two weeks, where everyone was in high school, me included.

## Tech Stack

- Kotlin
- TensorFlow (CNN model)
- Google Maps API
- MySQL
- Android Studio

## Description

Animarker allows users to upload photos of animal sightings, automatically identifies the species using AI, and plots the sighting on a global map. It creates a crowd-sourced database of wildlife observations.

### Key Features

1. **Photo Upload**
   - Select from gallery or take new photo
   - Android Intents for camera integration
   - Image preprocessing

2. **AI Species Identification**
   - CNN (Convolutional Neural Network) trained in TensorFlow
   - Identifies animal species from images
   - Confidence scoring

3. **Location Mapping**
   - GPS coordinates extracted from photos
   - Google Maps API for visualization
   - Pins showing sighting locations

4. **Search & Discovery**
   - Search for specific animals
   - View all sightings of a species
   - Geographic filtering

5. **Database**
   - MySQL for storing sightings
   - Species data, location, date
   - User contributions

### Development Journey

This was a comprehensive learning project. Through Animarker, I learned:

- Android Studio app development
- Kotlin programming
- CNN model training in TensorFlow
- MySQL database creation and management
- Google Maps API integration

### Technical Details

**ML Pipeline:**
- Image classification with CNN
- Trained on wildlife dataset
- Real-time inference on device

**Database Schema:**
- Species table (name, classification, image)
- Sightings table (species_id, location, date, user_id)
- Users table (optional, for contributions)

### Ethical Considerations

- Privacy protection for location data
- Responsible wildlife observation guidelines
- Data accuracy and verification
- Potential impact on endangered species

## Links

- Devpost: https://devpost.com/software/endangered-animal-app
- GitHub: https://github.com/HasNate618/Animarker
- Google Play: Available
