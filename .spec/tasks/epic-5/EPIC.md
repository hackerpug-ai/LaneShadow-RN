# Epic 5: Scenic Routing Rearchitecture

> Epic Sequence: 5
> PRD: .spec/prd/ROADMAP.md
> Tasks: 5

## Overview

Replace the LLM-as-geographer pattern in `planRide` with a deterministic routing pipeline. Overpass API discovers real scenic waypoints (viewpoints, mountain passes, peaks) within the route corridor. Google Routes API compiles routes through those real waypoints. A single lightweight LLM call enriches each route with a human-readable label and rationale based on the actual waypoint names.

This rearchitecture removes hallucination risk, cuts route generation latency from ~30–60s to ~7–12s, and establishes the extensibility pattern for future data sources (road conditions, curvature scoring, elevation) — all of which can be added as structured context to the enrichment call without redesigning the pipeline.

## Human Test Steps

When this epic is complete:

1. Tap "Plan Ride" with any start and end points
2. Route appears in under 15 seconds
3. Route label and rationale mention real named landmarks (e.g., "Tioga Pass", "Glacier Point Overlook") — not invented road names
4. Three distinct route options are shown, each using different scenic waypoints
5. Disabling "Avoid Highways" in preferences changes the route character
6. `pnpm test` passes — no agent session mocks remain

## Acceptance Criteria (from PRD)

- Route generation completes in ≤15s end-to-end
- Labels and rationale reference real geographic landmarks, not hallucinated road names
- 2–3 distinct route options per planning request
- Fallback: if Overpass API returns <2 nodes, 1 direct scenic route is returned
- No regression on existing route save/display functionality

## PRD Sections Covered

- Technical Requirements: Routing Architecture (new section)
- UC-P1 route generation quality improvement

## Dependencies

This epic depends on:
- Epic 4: Save & Reuse Favorite Roads (favorite roads wiring to planning — US-047 passes geometry; new pipeline must continue to accept it)

This epic blocks:
- Epic 6: Mark Areas to Avoid (avoid areas will be passed to the deterministic orchestrator)

## Task List

| Task ID | Title | Type | Priority | Blocked By |
|---------|-------|------|----------|------------|
| US-050 | Add Overpass API scenic waypoint discovery tool | FEATURE | P0 | - |
| US-051 | Refactor planRide to deterministic orchestrator | REFACTOR | P0 | US-050, US-053 |
| US-052 | Add lightweight route enrichment LLM call | FEATURE | P1 | US-051 |
| US-053 | Enhance routing provider with motorcycle options | FEATURE | P0 | - |
| US-054 | Update test suite for deterministic pipeline | TEST | P1 | US-051, US-052 |
