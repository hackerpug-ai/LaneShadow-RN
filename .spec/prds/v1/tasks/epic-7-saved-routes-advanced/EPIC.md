# Epic 7: Saved Routes Advanced

> Epic Sequence: 7
> PRD: .spec/prds/v1/06-uc-sr.md
> PRD Version: 1.0.0
> Appetite: 6 weeks
> Tasks: 6

## Overview

Complete all remaining saved routes features: rating, notes, re-plan from saved route, mark as ridden, favorite roads integration, and navigation export to Google Maps/Waze.

## Human Test Steps

When this epic is complete, users should be able to:

1. Open saved route — tap 4 stars — verify on list card
2. Tap Add Note — write/save — verify indicator on list
3. Edit/delete note — verify indicator removed
4. Filter by 4+ stars — verify only rated routes
5. Tap Re-plan — verify new session with route as context
6. Refine via chat — verify original unchanged
7. Toggle Mark as Ridden — verify badge+date on list
8. Filter by Ridden — verify filter works
9. Generate with 'include my favorite roads' — verify indicator on cards
10. Tap Navigate — verify Google Maps/Waze opens

## Acceptance Criteria (from PRD)

- Rider can rate a saved route 1-5 stars with immediate persistence
- Rider can add, edit, and delete notes on a saved route
- Rider can filter saved routes by rating threshold
- Rider can re-plan from a saved route without modifying the original
- Rider can mark a route as ridden with timestamp
- Rider can filter by Ridden/Planned status
- Rider can request favorite roads inclusion in route planning
- Rider can export a route to Google Maps or Waze for navigation

## PRD Sections Covered

- UC-SR-06: Favorite Roads Integration
- UC-SR-07: Rating and Notes
- UC-SR-08: Re-plan from Saved Route
- UC-SR-09: Mark as Ridden
- UC-SR-10: Navigation Export

## Dependencies

This epic depends on:
- Epic 1: Phase 0 Remediation (complete)
- Epic 2: Chat Infrastructure
- Epic 5: Weather Completion
- Epic 6: Save Routes Core

This epic blocks:
- Epic 8: Integration Testing & V1 Gate

## Task List

| Task ID | Title | Type | Priority | Assignee |
|---------|-------|------|----------|----------|
| US-034 | Add rating, notes, ridden fields to saved routes schema | FEATURE | P0 | convex-implementer |
| US-035 | Build rating and notes UI in route detail view | FEATURE | P0 | ui-developer |
| US-036 | Implement re-plan from saved route | FEATURE | P1 | ui-developer |
| US-037 | Implement mark as ridden toggle and filter | FEATURE | P1 | ui-developer |
| US-038 | Wire favorite roads auto-inclusion into route planning | FEATURE | P1 | pi-agent-implementer |
| US-039 | Implement navigation export to Google Maps and Waze | FEATURE | P0 | ui-developer |

## Dependency Graph

```
US-034 (schema) ──┬──► US-035 (rating/notes UI)
                  ├──► US-037 (ridden toggle)
                  └──► US-038 (favorite roads)
US-036 (re-plan) ── no schema deps (parallel after Epic 6)
US-039 (nav export) ── no schema deps (parallel)
```

## Parallel Groups

- **Group A** (no deps): US-034, US-036, US-039
- **Group B** (after US-034): US-035, US-037, US-038
