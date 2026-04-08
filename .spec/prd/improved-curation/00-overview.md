---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-08
prd_version: 1.0.0
---

# Improved Curation System

## Product Description

An algotorial recommendation system that combines human expertise with algorithmic personalization to deliver high-quality recommendations without requiring user interaction history. The system solves the cold-start problem by leveraging content-based filtering, domain expert curation, and multi-dimensional quality scoring to ensure LLM agents provide relevant, diverse, and trustworthy recommendations from day one.

## Problem Statement

Current LLM recommendation agents suffer from three critical limitations:

1. **Cold-start problem**: Without user interaction data, recommendations rely solely on prompting, leading to generic or irrelevant suggestions
2. **Quality degradation**: Adding RAG data without quality controls introduces "bad opinions" that make recommendations worse over time
3. **Lack of taste**: Algorithmic-only approaches miss cultural context, nuanced preferences, and domain expertise that human curators provide

## Solution Summary

Build a hybrid "Algotorial" system (inspired by Spotify's approach) with three layers:

1. **Content-based foundation**: Extract rich metadata, generate semantic embeddings, and build knowledge graphs for item similarity
2. **Human expertise layer**: Domain experts create quality pools and define taste profiles with explicit quality criteria
3. **Quality-gated LLM pipeline**: Semantic search retrieves candidates, quality filters remove low-score items, then LLM generates final recommendations from approved pools

This approach scales human judgment while maintaining quality gates, ensuring recommendations improve over time without degrading from low-quality data.

## Research Foundation

Based on deep research of Spotify's Algotorial playlists, Netflix's metadata-heavy content profiling, and academic work on cold-start recommendation systems. Key insights:

- **Metadata quality is the critical success factor** - poor metadata = poor recommendations
- **Human experts create candidate pools, not perfect playlists** - algorithms personalize from those pools
- **Multi-dimensional quality scoring** (relevance, freshness, diversity, expert approval) prevents "bad opinions" from reaching users
