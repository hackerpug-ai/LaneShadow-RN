---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-09
prd_version: 1.0.0
---

# Progressive Route Loading

## Product Description

A performance optimization that returns motorcycle route options immediately after street routing completes (~5-10 seconds), then progressively enriches with weather data and AI labels via background jobs. Users see usable routes faster while additional context flows in asynchronously.

## Problem Statement

**Current State:**
- Route planning takes **~90 seconds** total
  - ~75s: Google Routes API (street routing)
  - ~15s: Open-Meteo weather API (25 points × 8s timeout)
- Weather data is fetched but **hardcoded to 'unavailable'** in the response
- Users wait unnecessarily for data that's never displayed
- Poor UX: staring at loading screen for 90 seconds

**User Impact:**
- Frustration with long wait times
- Abandonment before routes appear
- Wasted backend resources (15s weather fetch discarded)

## Solution Summary

**Progressive Loading Pattern:**
1. **Phase 1 (5-10s):** Street routing completes → routes appear immediately with geometry and basic stats
2. **Phase 2 (10-20s):** Weather data arrives via background job → wind/rain/temp badges fade in
3. **Phase 3 (20-40s):** AI enrichment completes → labels, rationales, highlights appear

**Technical Approach:**
- Remove blocking weather probe from route orchestrator
- Move weather fetching to existing enrichment pipeline
- Leverage `route_enrichments` table for background job scheduling
- Reactive UI updates via Convex subscriptions

**Key Insight:**
The enrichment infrastructure already exists. This is primarily a **removal and wiring task**, not new infrastructure.

## Expected Outcomes

- **75-85% reduction** in time-to-first-response (90s → 5-10s)
- **Better UX:** Users see routes immediately, details flow in progressively
- **No wasted effort:** Weather only fetched for routes users actually see
- **Graceful degradation:** Routes still work if enrichment fails
