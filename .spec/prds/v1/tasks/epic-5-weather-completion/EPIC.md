# Epic 5: Weather Completion

> Epic Sequence: 5
> PRD: .spec/prds/v1/05-uc-wx.md, .spec/prds/v1/07-technical-backend.md
> PRD Version: 1.0.0
> Appetite: 6 weeks
> Tasks: 8 (US-022 through US-029)

## Overview

Complete the weather story: rain and temperature data pipeline, all three overlays on polylines, weather badges on route cards, conditions scoring with 'Best for today', expandable weather timeline, departure time adjustment, and weather error recovery.

## Human Test Steps

When this epic is complete, users should be able to:

1. Generate routes — verify weather badges on each route card
2. Verify 'Best for today' badge on top-ranked route — tap for explanation
3. Toggle rain overlay — verify polyline segments colored by rain probability
4. Toggle temperature overlay — verify polyline colored by comfort bands
5. Tap a polyline segment — verify rain/temp value appears
6. Tap expand on a route — verify hourly weather timeline
7. Verify worst hour highlighted in timeline
8. Type 'what if I leave at 3pm' — verify routes re-rank with updated badges
9. (Simulate weather API down) — verify 'Weather unavailable' indicator, routes still work

## Acceptance Criteria (from PRD)

- Weather provider fetches rain + temperature alongside wind in a single API call
- Orchestrator stores all three overlay types on routeSnapshot
- Conditions scoring is deterministic: starts at 100, deducted by severity
- Routes sorted by conditions score descending
- 'Best for today' badge on highest-scored route
- Rain overlay colors polyline segments by probability bands
- Temperature overlay colors polyline segments by comfort bands
- Tapping a polyline segment shows the weather value
- Weather badges on each route card show dominant condition
- Hourly weather timeline aligned to departure time with worst hour highlighted
- Departure time adjustment re-fetches weather and re-ranks routes
- Weather failure never blocks route generation
- Stale weather data (>2hrs) shows warning

## PRD Sections Covered

- UC-WX-01: Wind Overlay (existing)
- UC-WX-02: Rain Overlay
- UC-WX-03: Temperature Overlay
- UC-WX-04: Weather Badges & Best for Today
- UC-WX-05: Weather Timeline
- UC-WX-06: Departure Time Adjustment
- UC-WX-07: Weather Error Recovery
- UC-AG-04: Conditions Scoring

## Dependencies

This epic depends on:
- Epic 1: Phase 0 Remediation (complete)
- Epic 2: Chat Infrastructure (complete)

This epic blocks:
- Epic 7
- Epic 8

## Task List

| Task ID | Title | Type | Priority | Assignee |
|---------|-------|------|----------|----------|
| US-022 | Extend weatherProvider to fetch rain + temperature alongside wind | FEATURE | P0 | backend-engineer |
| US-023 | Wire rain+temp overlays into planRideOrchestrator | FEATURE | P0 | backend-engineer |
| US-024 | Implement conditions scoring and 'Best for today' ranking | FEATURE | P0 | backend-engineer |
| US-025 | Wire enrichRoute into planRideOrchestrator | FEATURE | P1 | backend-engineer |
| US-026 | Implement rain and temperature polyline overlay rendering | FEATURE | P0 | ui-developer |
| US-027 | Add weather badges to RouteAttachmentCard | FEATURE | P0 | ui-developer |
| US-028 | Build WeatherTimelineSheet for hourly detail | FEATURE | P1 | ui-developer |
| US-029 | Implement departure time adjustment and weather error recovery | FEATURE | P1 | backend-engineer |

## Dependency Graph

```
US-022 (weather provider) ──► US-023 (orchestrator wiring) ──► US-024 (scoring)
                                                              └──► US-025 (enrichRoute)
US-022 ──► US-026 (overlay rendering) [parallel with backend]
US-024 ──► US-027 (weather badges)
US-027 ──► US-028 (timeline sheet)
US-024 ──► US-029 (departure adjustment)
```

## Parallel Groups

- **Group A** (no deps): US-022
- **Group B** (after US-022): US-023, US-026
- **Group C** (after US-023): US-024, US-025
- **Group D** (after US-024): US-027, US-029
- **Group E** (after US-027): US-028

## Design Notes

- Weather provider must use a single Open-Meteo API call per point — never separate calls for different variables
- Conditions scoring is strictly deterministic — no LLM involvement
- enrichRoute failure must be non-blocking; fallback labels always exist
- Rain probability bands: <30% green, 30-60% yellow, >60% danger
- Temperature comfort bands: <45F cold, 45-65F cool, 65-85F comfortable, >85F hot
