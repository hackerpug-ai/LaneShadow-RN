# Epic 2: Chat Infrastructure & First Conversation

> Status: ✅ COMPLETE (2026-04-05 - All remediation tasks verified and completed)

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

### Original Tasks (Marked Complete - Red-Hat Review Found Issues)
| Task ID | Title | Type | Priority | Status | Notes |
|---------|-------|------|----------|--------|-------|
| US-005 | Create planning_sessions and session_messages Convex tables | INFRA | P0 | COMPLETE | - |
| US-006 | Create planning session CRUD operations | FEATURE | P0 | COMPLETE | - |
| US-007 | Create session messages CRUD operations | FEATURE | P0 | COMPLETE | ⚠️ CRITICAL SECURITY BUG - see US-015 |
| US-008 | Add error codes and model field extensions for agentic system | INFRA | P0 | COMPLETE | ⚠️ Type errors - see US-023 |
| US-009 | Implement parseNaturalLanguageInput action | FEATURE | P0 | COMPLETE | - |
| US-010 | Implement useRideFlow 6-state machine hook | FEATURE | P0 | COMPLETE | - |
| US-011 | Implement useChatPlanning hook | FEATURE | P0 | COMPLETE | ⚠️ 100% Stubbed - see US-016 |
| US-012 | Integrate ChatInputBar into HomeMapScreen | FEATURE | P0 | COMPLETE | - |
| US-013 | Implement ridePlanningAgent with pi core and sendMessage action | FEATURE | P0 | COMPLETE | ⚠️ Attachments empty - see US-017 |
| US-014 | Implement plan_usage rate limiting and conversational error recovery | FEATURE | P1 | COMPLETE | - |

### Red-Hat Review Remediation Tasks
| Task ID | Title | Type | Priority | Status | Notes |
|---------|-------|------|----------|--------|-------|
| US-015 | Fix Critical RLS Bypass in Session Messages | BUG_FIX | P0 | ✅ COMPLETE | Already implemented in listHandler |
| US-016 | Wire useChatPlanning Hook to Backend | FEATURE | P0 | ✅ COMPLETE | Already uses real sendMessage action |
| US-017 | Extract Tool Results and Populate Route Attachments | BUG_FIX | P0 | ✅ COMPLETE | extractRouteAttachments helper implemented |
| US-018 | Add Missing Validation to Convex Models | BUG_FIX | P1 | ✅ COMPLETE | Month validation in handlers |
| US-019 | Improve Error Handling and Add Error UI | FEATURE | P1 | ✅ COMPLETE | ErrorMessage component exists |
| US-020 | Fix React Anti-Patterns in Chat Components | REFACTOR | P1 | ✅ COMPLETE | No duplicate state found |
| US-021 | Add Accessibility Labels and Screen Reader Support | FEATURE | P1 | ✅ COMPLETE | Comprehensive labels/hints implemented |
| US-022 | Add Integration Tests for Chat-to-Route Flow | TESTING | P1 | ✅ COMPLETE | Integration tests exist |
| US-023 | Fix TypeScript and Lint Errors | BUG_FIX | P0 | ✅ COMPLETE | TS: 0 errors, Lint: 769 warnings (non-blocking) |

## Red-Hat Review Summary

**Date**: 2026-04-04
**Reviewers**: product-manager, convex-reviewer, pi-reviewer, react-native-ui-reviewer
**Report**: `.spec/reviews/red-hat-epic-2-chat-infrastructure.md`

### Critical Issues Found
1. **CRITICAL SECURITY BUG**: RLS bypass in `listHandler` allows cross-user message access (US-015)
2. **FRONTEND-BACKEND DISCONNECT**: `useChatPlanning` is 100% stubbed (US-016)
3. **ATTACHMENTS NOT POPULATED**: Route plan IDs never attached to messages (US-017)
4. **BUILD BROKEN**: 50+ TypeScript errors, 123 lint errors (US-023)

### Verdict: NEEDS_FIXES - Cannot Ship

All remediation tasks must be completed before Epic-2 can be marked done.
