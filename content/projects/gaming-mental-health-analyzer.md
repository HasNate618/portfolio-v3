---
title: "Gaming and Mental Health Analyzer"
type: project
id: gaming-mental-health-analyzer
description: A machine-learning pipeline that predicts five wellbeing risks from gaming habits.
priority: reference
rank: archive
dates: "Mar 2026 (approx.)"
role: "team"
status: shipped
tags: [ai, data-science, health]
related: [index.md, ../skills.md]
updated: 2026-10-16
---
# Gaming and Mental Health Analyzer

ML system that predicts mental wellbeing risks across sleep, productivity, social isolation, dysregulation, and emotional problems based on gaming habits. Built with Python, scikit-learn and Jupyter Notebook.

## Tech Stack

- Python
- scikit-learn (RandomForest, GradientBoosting, LogisticRegression)
- Jupyter Notebook
- pandas, numpy
- Next.js 16, React 19, TypeScript (frontend)
- Tailwind CSS 4
- Recharts (visualization)
- Kaggle dataset

## Description

A Dataquest team project that uses machine learning to analyze the relationship between gaming habits and mental wellbeing. Users fill out a short assessment and receive personalized risk analysis across five wellbeing dimensions.

### What It Does

- Predicts risk levels for five mental health outcomes:
  - Sleep problems
  - Productivity issues
  - Social isolation
  - Dysregulation
  - Emotional problems
- Shows which specific habits drive each risk
- Retro arcade-themed web interface with charts
- Scenario analysis for intervention recommendations

### Machine Learning Pipeline

**Feature Taxonomy:**
- Actionable causes: daily gaming hours, monthly spending, exercise, genre, platform
- Context confounders: age, gender, years gaming
- Mediators: sleep, mood, social, productivity metrics

**Target Definitions:**
- Sleep problem: poor sleep quality or frequent disruption
- Productivity problem: poor academic/work performance
- Social isolation: high isolation score or low face-to-face hours
- Emotional problem: depressed, anxious, or withdrawn mood state
- Dysregulation: frequent mood swings or continued gaming despite problems

**Model Training:**
- Three algorithms evaluated per issue (best by F1 + ROC-AUC kept):
  - RandomForestClassifier (500 trees, balanced class weights)
  - GradientBoostingClassifier
  - LogisticRegression (balanced class weights)
- Leakage prevention: excluding features that directly define target
- Preprocessing: median imputation, standard scaling, one-hot encoding

**Performance:**

| Issue | Best Model | F1 | ROC-AUC |
|---|---|---|---|
| Sleep problem | GradientBoosting | 0.809 | 0.672 |
| Social isolation | RandomForest | 0.794 | 0.927 |
| Productivity | RandomForest | 0.646 | 0.716 |
| Dysregulation | GradientBoosting | 0.550 | 0.626 |
| Emotional | LogisticRegression | 0.374 | 0.559 |
| **Overall** | **RandomForest** | **0.667** | **0.898** |

**Explainability:**
- Local feature contributions via perturbation analysis
- Intervention scenarios showing behavioral change impact
- Per-feature breakdown of risk drivers

### Architecture

- **ML Pipeline**: Python scripts for training and inference
- **Frontend**: Next.js web app with interactive forms and charts
- **API**: Next.js API route spawns Python subprocess for inference
- **Data**: 1,000 records, 27 features from Kaggle

### Key Features

1. **User Assessment**
   - 9-field form (age, gaming hours, spending, genre, etc.)
   - Real-time validation and range clipping

2. **Risk Analysis**
   - Overall wellbeing score
   - Per-issue risk levels
   - Top contributing factors

3. **Visualization**
   - Pie charts for risk distribution
   - Bar charts for feature contributions
   - Scenario comparison graphs

4. **Intervention Scenarios**
   - "What if you reduced gaming by 2h/day?"
   - Quantified impact predictions
   - Actionable recommendations

## Links

- GitHub: https://github.com/HasNate618/Dataquest26
