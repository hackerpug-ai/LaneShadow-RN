# Epic 3b: LLM Tool Augmentation — Grounding & Enrichment

> Epic Sequence: 3b
> PRD: .spec/prds/v1/
> Tasks: 8
> Status: DRAFT
> Depends on: Epic 3 (US-021 through US-026 — per-segment compilation + LLM-first prompt)
> Research: holocron doc js71smnvvxr3k1z5gmbydspsh184bqz7

## Overview

Epic 3 gives the LLM the ability to author route sketches and have them validated per-segment by Google Maps. Epic 3b gives the LLM **tools** so it stops guessing roads from parametric memory and starts selecting from verified, scored, real-world data. This is the difference between "the AI hallucinates a road and hopes Google catches it" and "the AI looks up real roads, scores them by curviness, checks surface quality, and picks the best ones."

Seven new agent tools transform the LLM from a geography-guessing oracle into a tool-augmented motorcycle navigator with access to road databases, elevation data, POIs, weather, and user preferences.

## Architecture Context (Post-Epic 3)

After Epic 3, the agent has:
- `createRouteSketch` — author a sketch with segments + anchorPoints
- `compileSketch` / `compileSegments` — validate per-segment with Google Maps
- `geocode` — convert place names to lat/lng
- `findScenicWaypoints` — Overpass API for scenic POIs (exists, needs enhancement)

This epic adds tools the LLM calls BEFORE and DURING sketch authoring to ground its knowledge in real data.

## Human Test Steps

When this epic is complete, users should be able to:

1. Ask "scenic 2-hour ride from San Jose" — verify the LLM mentions specific road curvature scores in its rationale ("Skyline Blvd — curvature: 2400, very twisty")
2. Verify the route only uses paved roads — no gravel/dirt recommendations for street bikes
3. See elevation profile data in route response ("3,200 ft total climb, max grade 12%")
4. Ask "find me lunch 2 hours into the ride" — verify Search Along Route returns restaurants along the planned route
5. Verify the LLM avoids recommending a road that doesn't exist (grounding check — road verified via OSM before inclusion)
6. Ask for a route when weather is bad on one path — verify the LLM routes around the weather issue

## Acceptance Criteria

- LLM can verify road existence via OSM before including in sketch
- LLM can score roads by curvature and use scores in route selection
- LLM can check road surface type and exclude unpaved roads
- Elevation profiles generated for compiled route segments
- Places can be found along a route polyline via Google SAR
- Weather data available to LLM during route authoring (not just post-compilation)
- User favorites influence route suggestions

## PRD Sections Covered

- AG group: "AI authors opinionated routes from its own road knowledge" → enhanced with real data
- AG: "Hallucinations are features, not bugs" → reduced hallucination via grounding tools
- WX: Weather data integrated into planning phase
- SR: Favorite roads auto-included in planning

## Dependencies

This epic depends on:
- Epic 3 (US-021 per-segment compilation, US-024 LLM-first system prompt)
- `findScenicWaypoints.ts` (existing Overpass integration to extend)
- `piTools.ts` (tool schema registry)
- `ridePlanningAgent.ts` (system prompt, tool wiring)

This epic blocks:
- Epic 5 (weather completion — weather-during-planning tool feeds into WX)
- Epic 8 (integration testing — new tools need E2E coverage)

## Task List

| Task ID | Title | Type | Priority | Estimate | Blocked By |
|---------|-------|------|----------|----------|------------|
| US-062 | OSM road lookup tool (verify road exists + get attributes) | FEATURE | P0 | 90 min | Epic 3 |
| US-063 | Road curvature scoring tool | FEATURE | P0 | 120 min | US-062 |
| US-064 | Road surface verification tool | FEATURE | P0 | 60 min | US-062 |
| US-065 | Elevation profile tool | FEATURE | P1 | 90 min | Epic 3 |
| US-066 | Google Search Along Route tool | FEATURE | P1 | 90 min | Epic 3 |
| US-067 | Weather-during-planning tool | FEATURE | P2 | 75 min | Epic 3 |
| US-068 | User favorites lookup tool | FEATURE | P2 | 60 min | Epic 3 |
| US-069 | Wire tools to agent + update system prompt | FEATURE | P0 | 90 min | US-062, US-063, US-064 |
