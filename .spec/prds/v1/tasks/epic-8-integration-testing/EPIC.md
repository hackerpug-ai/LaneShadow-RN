# Epic 8: Integration Testing & V1 Gate

> Epic Sequence: 8
> PRD: .spec/prds/v1/ (cross-cutting)
> PRD Version: 1.0.0
> Appetite: 4 weeks
> Tasks: 4

## Overview

Final integration pass: V1 gate test end-to-end, performance profiling, accessibility audit, rate limiting verification. This is the last epic before V1 ship.

## Human Test Steps

When this epic is complete, users should be able to:

1. FULL GATE TEST: Type 'scenic 2-hour ride to Santa Cruz, avoid highways'
2. Verify 3 route options with weather badges on map within 12 seconds
3. Type 'actually avoid Highway 1' — verify updated options
4. Save best route — verify in saved routes
5. Start new session — verify clean slate
6. Resume previous — verify routes restore
7. Test poor connectivity — verify graceful errors
8. Use 5 plans on free tier — verify limit message on 6th
9. Toggle all 3 weather overlays — verify performance
10. Run screen reader — verify accessibility

## Acceptance Criteria (from PRD)

- V1 gate test passes end-to-end with initial gen + refinement < 12s each
- Map renders 3 polylines without frame drops
- Chat scrolls smoothly
- Session load < 2s
- Weather overlay toggle < 500ms
- All interactive components have testID and accessibilityLabel
- Screen reader can navigate all interactive elements
- Free tier blocks after 5 plans/month with helpful message
- Pro tier unlimited
- Month rollover resets usage count

## PRD Sections Covered

- V1 Gate Test (cross-cutting)
- 07-technical-backend.md (rate limiting)
- 09-technical-client.md (performance)
- 08-technical-ui.md (accessibility)

## Dependencies

This epic depends on:
- All previous epics (1-7)

This epic blocks:
- None (final epic)

## Task List

| Task ID | Title | Type | Priority | Assignee |
|---------|-------|------|----------|----------|
| US-040 | End-to-end V1 gate test validation | INFRA | P0 | qa-engineer |
| US-041 | Performance profiling and optimization | INFRA | P1 | infrastructure-engineer |
| US-042 | Accessibility audit — testID and accessibilityLabel | INFRA | P1 | ui-developer |
| US-043 | Rate limiting end-to-end verification | INFRA | P1 | backend-engineer |

## Dependency Graph

```
US-040 (gate test) ── must run first to identify issues
US-041 (perf) ── parallel with US-042, US-043
US-042 (a11y) ── parallel with US-041, US-043
US-043 (rate limiting) ── parallel with US-041, US-042
```

## Parallel Groups

- **Group A** (first): US-040
- **Group B** (after gate test identifies issues): US-041, US-042, US-043
