# Epic 3: Conversation Refinement & Chat UX Polish

> Epic Sequence: 3
> PRD: .spec/prds/v1/
> Tasks: 11
> Status: REFINED (2026-04-06) — trimmed to verified gaps only; LLM-first routing tasks added

## Overview

Polish the conversational UX: enable follow-up messages during route viewing, add gesture-based transcript controls, wire route card taps to map polylines, and clean up orphaned design-era components.

## Architecture Context (Post-Epic 2)

The backend is **complete** for this epic. The ReAct agent loop handles multi-turn refinement natively. Session reuse works at the app level via `activeChatSessionId`. The standalone chat tab provides full chat history. The remaining work is small frontend wiring tasks.

## Human Test Steps

1. Generate routes with "scenic 2-hour ride to Santa Cruz, avoid highways"
2. Type "actually avoid Highway 1" — verify updated routes replace previous on map within 12s
3. Type "make it shorter" — verify routes update reflecting constraint
4. Observe transient transcript overlay — wait 5s, verify auto-dismiss
5. Tap transcript to pin, verify stays past 5s
6. Swipe transcript up to dismiss manually
7. Tap map area — verify transcript dismisses

## Acceptance Criteria

- Follow-up messages work during route viewing (SEND_MESSAGE handled in ROUTE_RESULTS/ROUTE_DETAILS)
- Transient transcript can be pinned (tap), swiped away (up), or map-tap dismissed
- Previous route attachments remain in chat history after refinement
- Orphaned design-era components removed

## Task List

| Task ID | Title | Type | Priority | Estimate | Blocked By |
|---------|-------|------|----------|----------|------------|
| US-015 | Enable conversation refinement via state machine handlers | FEATURE | P0 | 45 min | Epic 2 |
| US-016 | Add pin/dismiss gestures to transient message overlay | FEATURE | P0 | 60 min | US-015 |
| US-018 | Wire manual planning mode fallback from chat input | FEATURE | P1 | 60 min | Epic 2 |
| US-019 | Remove orphaned design-era components | CHORE | P2 | 30 min | US-016 |
| US-020 | LLM-first routing architecture ("The Californians Pattern") | FEATURE | P0 | 4-6 hrs | Epic 2 |
| US-021 | Per-segment compilation in routing provider | FEATURE | P0 | 90 min | - |
| US-022 | Segment stitching & partial result types | FEATURE | P0 | 60 min | US-021 |
| US-023 | Rich per-segment error feedback to LLM | FEATURE | P0 | 75 min | US-021, US-022 |
| US-024 | LLM-first system prompt rewrite | FEATURE | P0 | 60 min | - |
| US-025 | Segment retry loop with LLM revision | FEATURE | P0 | 90 min | US-023, US-024 |
| US-026 | Road-aware waypoint placement via viaNames | FEATURE | P1 | 60 min | US-021 |

## Removed Tasks

| Task ID | Title | Reason |
|---------|-------|--------|
| US-017 | Build expandable chat history sheet | **Redundant** — standalone chat tab (`app/(app)/(tabs)/chat.tsx`) already provides full expanded chat experience. Three-quarter sheet adds complexity without clear UX gain. |

## Dependencies

- **Depends on**: Epic 1, Epic 2
- **Blocks**: Epics 5, 6, 7
