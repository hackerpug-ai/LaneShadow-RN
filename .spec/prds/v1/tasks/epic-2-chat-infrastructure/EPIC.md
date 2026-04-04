# Epic 2: Chat Infrastructure & First Conversation

> Epic Sequence: 2
> PRD: .spec/prds/v1/
> Tasks: 10

## Overview
Build the core conversational planning loop: chat input on map, planning sessions backend, parseNaturalLanguageInput, wire chat to orchestrator, display 2-3 route polylines from a conversation message.

## Human Test Steps
When this epic is complete, users should be able to:
1. Open app — verify chat input bar visible at bottom of map
2. Observe suggestion chips (2-hour loop, scenic coastal, etc.)
3. Type "scenic 2-hour ride to Santa Cruz, avoid highways" and tap send
4. Watch progress indicators cycle through phases
5. Verify 2-3 route polylines appear on map within 12 seconds
6. Verify route attachment cards with names like "Coastal Cruiser"
7. Tap different route cards — verify polyline highlights
8. Type invalid request — verify helpful error message in chat

## Acceptance Criteria (from PRD)
- Chat input bar always visible at bottom of map screen
- Suggestion chips displayed in IDLE state
- Natural language input parsed to structured PlanInput
- Planning progress phases displayed in real-time
- 2-3 route polylines rendered on map from conversation
- Route attachment cards with generated names
- Tapping route cards highlights corresponding polyline
- Error messages delivered conversationally (no modal dialogs)
- Rate limiting enforced (5 plans/month free tier)

## PRD Sections Covered
- UC-AG-01: First Conversational Ride Plan
- UC-AG-02: Route Refinement via Chat
- UC-AG-03: Multi-Route Comparison
- UC-AG-06: Agentic Error Recovery
- UC-AG-07: NLP Input Parsing
- UC-AG-09: Session Management
- UC-AG-10: Session Persistence
- UC-AG-11: Rate Limiting

## Dependencies
Depends on Epic 1 (Phase 0 Remediation) — all quality gates must pass before feature work.

## Task List
| Task ID | Title | Type | Priority | Blocked By |
|---------|-------|------|----------|------------|
| US-005 | Create planning_sessions and session_messages Convex tables | INFRA | P0 | - |
| US-006 | Create planning session CRUD operations | FEATURE | P0 | US-005 |
| US-007 | Create session messages CRUD operations | FEATURE | P0 | US-005, US-006 |
| US-008 | Add error codes and model field extensions for agentic system | INFRA | P0 | - |
| US-009 | Implement parseNaturalLanguageInput action | FEATURE | P0 | US-008 |
| US-010 | Implement useRideFlow 6-state machine hook | FEATURE | P0 | - |
| US-011 | Implement useChatPlanning hook | FEATURE | P0 | US-010 |
| US-012 | Integrate ChatInputBar into HomeMapScreen | FEATURE | P0 | US-010, US-011 |
| US-013 | Implement ridePlanningAgent with pi core and sendMessage action | FEATURE | P0 | US-006, US-007, US-009 |
| US-014 | Implement plan_usage rate limiting and conversational error recovery | FEATURE | P1 | - |
