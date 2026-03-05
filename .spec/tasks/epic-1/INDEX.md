# Task Index: LaneShadow Epic 1

> Generated: 2026-03-04
> PRD: .spec/prd/README.md
> PRD Version: 1.0.0
> Appetite: 6 weeks
> Total Epics: 1 (this is Epic 1 only)
> Total Tasks: 9

## Epic Structure

## Epic 1: Complete Weather Planning Experience

**Folder:** `epic-1/`

**Human Test:**
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

**Tasks:**
- [US-001](epic-1/US-001.md): Wire rain-badge.tsx to RouteSnapshot.overlays.rain
- [US-002](epic-1/US-002.md): Wire temperature-badge.tsx to RouteSnapshot.overlays.temperature
- [US-003](epic-1/US-003.md): Add overlay toggle control (wind/rain/temp) to map view
- [US-004](epic-1/US-004.md): Implement rain-based polyline coloring (light/moderate/heavy)
- [US-005](epic-1/US-005.md): Implement temperature-based polyline coloring (cold/comfortable/hot)
- [US-006](epic-1/US-006.md): Create compact weather-strip component with worst-condition highlight
- [US-007](epic-1/US-007.md): Add expandable segment-by-segment overlay detail view
- [US-008](epic-1/US-008.md): Add rain timing to route summary
- [US-009](epic-1/US-009.md): Add high/low temperature to route summary

## Usage

These task files are designed for execution orchestration. Each task file contains:

- Complete task specification following TASK-TEMPLATE.md v5.0
- All required sections for agent execution:
  - CRITICAL CONSTRAINTS (MUST/NEVER/STRICTLY)
  - SPECIFICATION (objective + success state)
  - ACCEPTANCE CRITERIA (GIVEN-WHEN-THEN with verify commands)
  - GUARDRAILS (WRITE-ALLOWED/WRITE-PROHIBITED)
  - DESIGN (references, patterns, anti-patterns)
  - CODING STANDARDS
  - DEPENDENCIES
  - METADATA

To use with an orchestrator:
1. Read EPIC.md for epic context
2. Read individual task files for execution
3. Orchestrate subagents with task content

## Execution Order (Recommended)

```
Phase A: Badge Wiring (parallel)
├── US-001: Rain badge
└── US-002: Temperature badge

Phase B: Map Overlays (sequential)
├── US-003: Overlay toggle
├── US-004: Rain polyline coloring
└── US-005: Temperature polyline coloring

Phase C: Composite Components (after Phase A)
├── US-006: Weather strip (needs US-001, US-002)
└── US-007: Segment detail view (needs US-006)

Phase D: Summary Displays (after badge wiring)
├── US-008: Rain timing (needs US-001)
└── US-009: Temperature range (needs US-002)
```

## PRD Coverage

100% of Epic 1 PRD acceptance criteria covered:

| Use Case | Tasks |
|----------|-------|
| UC-P1GAP-01: Rain Overlay Integration | US-001, US-008 |
| UC-P1GAP-02: Temperature Overlay Integration | US-002, US-003, US-004, US-005, US-009 |
| UC-P1GAP-03: Multi-Overlay Comparison | US-006, US-007 |

## Agent Assignments

All tasks assigned to `react-native-ui-implementer` (UI-focused epic).

| Agent | Task Count |
|-------|------------|
| react-native-ui-implementer | 9 |

## Task Complexity Distribution

| Complexity | Count | Tasks |
|------------|-------|-------|
| small | 5 | US-001, US-002, US-003, US-005, US-009 |
| medium | 4 | US-004, US-006, US-007, US-008 |
| large | 0 | - |
