# Epic 1: Complete Weather Planning Experience

> Epic Sequence: 1
> PRD: .spec/prd/README.md
> PRD Version: 1.0.0
> Appetite: 6 weeks
> Tasks: 9

## Overview

Enable riders to make informed weather decisions by exposing rain and temperature overlays alongside existing wind data.

## Human Test Steps

When this epic is complete, users should be able to:

1. Open the app and start planning a route (A to B)
2. See rain probability badge on each route option card
3. See temperature range badge on each route option card
4. Tap a route to select it
5. On the map, toggle to rain overlay - see precipitation risk colors on route segments
6. Toggle to temperature overlay - see thermal comfort colors
7. Go back to comparison view
8. See weather strip showing worst condition per route
9. Tap to expand and see segment-by-segment weather breakdown
10. Select the route with best weather conditions

## Acceptance Criteria (from PRD)

- Rider can see rain probability badge on each route option card
- Rider can toggle rain overlay on map view to see precipitation risk along route segments
- System displays rain data with time-based color coding (light/moderate/heavy)
- Rider can view rain forecast timing in route summary
- Rider can see temperature range badge on each route option card
- Rider can toggle temperature overlay on map view to see thermal conditions along route
- System displays temperature with comfort color coding (cold/comfortable/hot)
- Rider can view high/low temperatures in route summary
- Rider can toggle between overlay types (wind/rain/temp) on comparison view
- Rider can view all three overlays summarized in a compact weather strip per route
- System displays the "worst" weather condition prominently for quick decision-making
- Rider can expand overlay details for more granular segment-by-segment view

## PRD Sections Covered

- UC-P1GAP-01: Rain Overlay Integration
- UC-P1GAP-02: Temperature Overlay Integration
- UC-P1GAP-03: Multi-Overlay Comparison

## Dependencies

This epic blocks the following epics:
- Epic 2: Browse & View Saved Routes

## Task List

| Task ID | Title | Type | Priority | Assignee |
|---------|-------|------|----------|----------|
| US-001 | Wire rain-badge.tsx to RouteSnapshot.overlays.rain | FEATURE | P1 | react-native-ui-implementer |
| US-002 | Wire temperature-badge.tsx to RouteSnapshot.overlays.temperature | FEATURE | P1 | react-native-ui-implementer |
| US-003 | Add overlay toggle control (wind/rain/temp) to map view | FEATURE | P2 | react-native-ui-implementer |
| US-004 | Implement rain-based polyline coloring (light/moderate/heavy) | FEATURE | P2 | react-native-ui-implementer |
| US-005 | Implement temperature-based polyline coloring (cold/comfortable/hot) | FEATURE | P2 | react-native-ui-implementer |
| US-006 | Create compact weather-strip component with worst-condition highlight | FEATURE | P2 | react-native-ui-implementer |
| US-007 | Add expandable segment-by-segment overlay detail view | FEATURE | P3 | react-native-ui-implementer |
| US-008 | Add rain timing to route summary | FEATURE | P3 | react-native-ui-implementer |
| US-009 | Add high/low temperature to route summary | FEATURE | P3 | react-native-ui-implementer |

## Dependency Graph

```
US-001 ──┬──► US-006 ──► US-007
         │
         └──► US-008

US-002 ──┬──► US-006
         │
         └──► US-009

US-003 ──► US-004 ──► US-005
```
