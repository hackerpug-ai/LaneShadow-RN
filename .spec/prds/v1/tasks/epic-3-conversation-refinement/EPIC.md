# Epic 3: Conversation Refinement & Message Overlay

> Epic Sequence: 3
> PRD: .spec/prds/v1/
> Tasks: 4

## Overview

Complete the conversational loop: follow-up messages refine existing routes in context, temporary AI message overlays appear on the map and auto-dismiss, manual planning mode fallback, and expanded chat history view.

## Human Test Steps

When this epic is complete, users should be able to:

1. Generate routes with "scenic 2-hour ride to Santa Cruz, avoid highways"
2. Type "actually avoid Highway 1" — verify updated routes replace previous on map within 12s
3. Type "make it shorter" — verify routes update reflecting constraint
4. Observe agent response overlay (top-left) — wait 5s, verify auto-dismiss
5. Send message — tap overlay to pin, verify stays
6. Swipe overlay to dismiss manually
7. Tap expand chevron — verify full chat history with all route cards
8. Scroll up — verify previous route cards visible and tappable
9. Collapse — verify map is primary again
10. Tap manual mode icon — verify planning sheet opens

## Acceptance Criteria (from PRD)

- Follow-up messages refine routes in context of current session (UC-AG-07)
- Updated routes generated within 12 seconds for refinement requests
- Agent handles preference changes, stop additions, and constraint modifications
- Previous route attachments remain visible in chat history
- New route attachments replace active routes on map
- Agent response overlay appears at top-left, auto-dismisses after 5s (UC-AG-08)
- Overlay can be pinned (tap) or dismissed (swipe)
- Route attachment cards visible within overlay
- Full chat history view shows all messages chronologically (UC-AG-10)
- Route cards in history are tappable to highlight polyline on map
- Expand/collapse chat without losing map visibility
- Manual mode icon opens existing PlanRideSheet with preferences carried over (UC-AG-05)

## PRD Sections Covered

- UC-AG-07: Refine routes through follow-up messages
- UC-AG-08: View temporary AI message overlay on map
- UC-AG-10: Expand chat to full message history
- UC-AG-05: Switch to manual planning mode

## Dependencies

- **Depends on**: Epic 1 (Phase 0 Remediation), Epic 2 (Chat Infrastructure)
- **Blocks**: Epics 5, 6, 7

## Task List

| Task ID | Title | Type | Priority | Blocked By |
|---------|-------|------|----------|------------|
| US-015 | Implement conversation refinement flow in useChatPlanning | FEATURE | P0 | Epic 2 |
| US-016 | Integrate AgentMessageOverlay with auto-dismiss and pin | FEATURE | P0 | Epic 2 |
| US-017 | Integrate FullChatHistoryView with route attachment interaction | FEATURE | P0 | Epic 2 |
| US-018 | Wire manual planning mode fallback from chat input | FEATURE | P1 | Epic 2 |
