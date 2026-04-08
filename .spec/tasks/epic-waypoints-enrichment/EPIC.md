# Epic: Waypoints & Staggered Enrichment

> Epic Sequence: 1
> PRD: /Users/justinrich/.claude/plans/imperative-popping-sparrow.md
> Tasks: 14

## Overview

This epic delivers two high-value features for LaneShadow's route planning experience:

1. **Waypoints with On/Off-Route & Deviation Handling**: Users can add stops to routes, with clear feedback when a stop requires deviation from the optimal path.

2. **Staggered Enrichment with Invalidation**: Routes return immediately with fallback labels, then continue enrichment in background. Smart invalidation when routes change.

## Human Test Steps

When this epic is complete, users should be able to:

1. Add a waypoint to a route and see deviation cost if it's off-route
2. Approve or reject off-route waypoints before route regeneration
3. Reorder on-route waypoints and see updated route
4. See route results immediately (<200ms) with fallback labels
5. Watch route labels update automatically when background enrichment completes
6. Make route changes and see old enrichment cancelled automatically

## Acceptance Criteria (from Plan)

- Users can add waypoints to routes via natural language or coordinates
- Waypoints are classified as on-route (<500m) or off-route
- Off-route waypoints show deviation cost (time/distance) before approval
- Approved waypoints regenerate route with new stops
- Route results return immediately with fallback labels
- Background enrichment updates UI with labels when complete
- Route changes cancel pending enrichment jobs
- Enrichment cache reduces redundant API calls

## PRD Sections Covered

- Feature 1: Waypoints with Deviation Handling
- Feature 2: Staggered Enrichment with Invalidation

## Dependencies

No epic dependencies - this is a standalone epic.

## Task List

| Task ID | Title | Type | Priority | Blocked By | Assignee |
|---------|-------|------|----------|------------|----------|
| US-056 | Create route_enrichments table and schema | INFRA | P0 | - | convex-implementer |
| US-057 | Implement content fingerprinting for enrichment cache | FEATURE | P0 | US-056 | convex-implementer |
| US-058 | Integrate enrichRoute into orchestrator | FEATURE | P0 | US-056, US-057 | convex-implementer |
| US-060 | Create background enrichment job runner | FEATURE | P0 | US-056, US-058 | convex-implementer |
| US-059 | Implement enrichment invalidation trigger | FEATURE | P0 | US-058 | convex-implementer |
| US-061 | Wire enrichment into routing agent | FEATURE | P0 | US-059 | pi-agent-implementer |
| US-062 | Build enrichment status UI components | FEATURE | P1 | US-058 | react-native-ui-implementer |
| US-063 | Implement session message enrichment updates | FEATURE | P1 | US-062 | react-native-ui-implementer |
| US-050 | Create waypoints data model and schema | INFRA | P0 | - | convex-implementer |
| US-051 | Implement deviation calculation service | FEATURE | P0 | US-050 | convex-implementer |
| US-052 | Create waypoint agent tools | FEATURE | P0 | US-050, US-051 | pi-agent-implementer |
| US-053 | Build waypoint list UI component | DESIGN | P1 | US-050 | frontend-designer |
| US-054 | Build waypoint card with approval UI | FEATURE | P1 | US-053 | react-native-ui-implementer |
| US-055 | Add waypoint markers to map | FEATURE | P1 | US-054 | react-native-ui-implementer |
