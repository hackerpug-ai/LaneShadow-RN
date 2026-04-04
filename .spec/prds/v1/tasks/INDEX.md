# Task Index: LaneShadow V1 — Ride the Moment

> Generated: 2026-04-04
> PRD: .spec/prds/v1/
> Total Epics: 8
> Total Tasks: 43

## Epic Structure

### Epic 1: Phase 0 Remediation — Unblock V1 Development

**Folder:** `epic-1-phase-0-remediation/`

**Human Test:**
1. Run pnpm dev:client and verify web platform loads without errors
2. Toggle dark mode and verify map polylines use theme colors
3. Verify all icons render correctly across the app
4. Run pnpm typecheck and pnpm lint — both pass

**Tasks:**
- [US-001](epic-1-phase-0-remediation/US-001.md): Replace all 24 @expo/vector-icons direct imports with IconSymbol
- [US-002](epic-1-phase-0-remediation/US-002.md): Replace all 10 React Native Text imports with Paper Text
- [US-003](epic-1-phase-0-remediation/US-003.md): Replace hardcoded colors in map components with semantic tokens
- [US-004](epic-1-phase-0-remediation/US-004.md): Run verification gates and fix remaining issues

---

### Epic 2: Chat Infrastructure & First Conversation

**Folder:** `epic-2-chat-infrastructure/`

**Human Test:**
1. Open app — verify chat input bar visible at bottom of map
2. Type 'scenic 2-hour ride to Santa Cruz, avoid highways' and tap send
3. Watch progress indicators cycle through phases
4. Verify 2-3 route polylines appear on map within 12 seconds
5. Verify route attachment cards with names like 'Coastal Cruiser'
6. Tap different route cards — verify polyline highlights
7. Type invalid request — verify helpful error message

**Tasks:**
- [US-005](epic-2-chat-infrastructure/US-005.md): Create planning_sessions and session_messages Convex tables
- [US-006](epic-2-chat-infrastructure/US-006.md): Create planning session CRUD operations
- [US-007](epic-2-chat-infrastructure/US-007.md): Create session messages CRUD operations
- [US-008](epic-2-chat-infrastructure/US-008.md): Add error codes and model field extensions for agentic system
- [US-009](epic-2-chat-infrastructure/US-009.md): Implement parseNaturalLanguageInput action
- [US-010](epic-2-chat-infrastructure/US-010.md): Implement useRideFlow 6-state machine hook
- [US-011](epic-2-chat-infrastructure/US-011.md): Implement useChatPlanning hook
- [US-012](epic-2-chat-infrastructure/US-012.md): Integrate ChatInputBar into HomeMapScreen
- [US-013](epic-2-chat-infrastructure/US-013.md): Implement ridePlanningAgent with pi core and sendMessage action
- [US-014](epic-2-chat-infrastructure/US-014.md): Implement plan_usage rate limiting and conversational error recovery

---

### Epic 3: Conversation Refinement & Message Overlay

**Folder:** `epic-3-conversation-refinement/`

**Human Test:**
1. Generate routes, then type 'actually avoid Highway 1' — verify updated routes within 12s
2. Observe agent overlay on map — wait 5s, verify auto-dismiss
3. Pin and swipe-dismiss overlay
4. Expand chat to full history — verify all messages and route cards
5. Tap manual mode icon — verify planning sheet opens

**Tasks:**
- [US-015](epic-3-conversation-refinement/US-015.md): Implement conversation refinement flow in useChatPlanning
- [US-016](epic-3-conversation-refinement/US-016.md): Integrate AgentMessageOverlay with auto-dismiss and pin
- [US-017](epic-3-conversation-refinement/US-017.md): Integrate FullChatHistoryView with route attachment interaction
- [US-018](epic-3-conversation-refinement/US-018.md): Wire manual planning mode fallback from chat input

---

### Epic 4: Session Management

**Folder:** `epic-4-session-management/`

**Human Test:**
1. Plan a ride, then tap New Session — verify map clears
2. Plan different ride in new session
3. Open sidebar — verify both sessions listed
4. Tap first session — verify routes restore on map
5. Close and reopen app — verify most recent session loads

**Tasks:**
- [US-019](epic-4-session-management/US-019.md): Implement useChatSession hook with session CRUD
- [US-020](epic-4-session-management/US-020.md): Implement useSessionHistory and integrate SessionSidebar
- [US-021](epic-4-session-management/US-021.md): Wire NewSessionButton and session clearing logic

---

### Epic 5: Weather Completion

**Folder:** `epic-5-weather-completion/`

**Human Test:**
1. Generate routes — verify weather badges and 'Best for today' badge
2. Toggle rain and temperature overlays on polylines
3. Tap segment for weather values
4. Expand hourly weather timeline — verify worst hour highlighted
5. Type 'what if I leave at 3pm' — verify re-ranking
6. Verify graceful degradation when weather unavailable

**Tasks:**
- [US-022](epic-5-weather-completion/US-022.md): Extend weatherProvider to fetch rain + temperature alongside wind
- [US-023](epic-5-weather-completion/US-023.md): Wire rain+temp overlays into planRideOrchestrator
- [US-024](epic-5-weather-completion/US-024.md): Implement conditions scoring and 'Best for today' ranking
- [US-025](epic-5-weather-completion/US-025.md): Wire enrichRoute into planRideOrchestrator
- [US-026](epic-5-weather-completion/US-026.md): Implement rain and temperature polyline overlay rendering
- [US-027](epic-5-weather-completion/US-027.md): Add weather badges to RouteAttachmentCard
- [US-028](epic-5-weather-completion/US-028.md): Build WeatherTimelineSheet for hourly detail
- [US-029](epic-5-weather-completion/US-029.md): Implement departure time adjustment and weather error recovery

---

### Epic 6: Save Routes & Core Library

**Folder:** `epic-6-save-routes-core/`

**Human Test:**
1. Generate routes — tap Save — verify toast and list entry
2. Search and filter saved routes
3. Rename a route from detail view
4. Delete with confirmation dialog

**Tasks:**
- [US-030](epic-6-save-routes-core/US-030.md): Implement savedRoutes Convex endpoints
- [US-031](epic-6-save-routes-core/US-031.md): Add Save Route action to RouteAttachmentCard
- [US-032](epic-6-save-routes-core/US-032.md): Connect saved routes list to new backend
- [US-033](epic-6-save-routes-core/US-033.md): Wire rename and delete in route detail view

---

### Epic 7: Saved Routes Advanced

**Folder:** `epic-7-saved-routes-advanced/`

**Human Test:**
1. Rate a route (4 stars) — verify on list card
2. Add/edit/delete notes — verify indicator
3. Re-plan from saved route — verify new session with context
4. Mark as Ridden — verify badge and filter
5. Include favorite roads in planning — verify indicator
6. Export to Google Maps/Waze — verify deep link

**Tasks:**
- [US-034](epic-7-saved-routes-advanced/US-034.md): Add rating, notes, ridden fields to saved routes schema
- [US-035](epic-7-saved-routes-advanced/US-035.md): Build rating and notes UI in route detail view
- [US-036](epic-7-saved-routes-advanced/US-036.md): Implement re-plan from saved route
- [US-037](epic-7-saved-routes-advanced/US-037.md): Implement mark as ridden toggle and filter
- [US-038](epic-7-saved-routes-advanced/US-038.md): Wire favorite roads auto-inclusion into route planning
- [US-039](epic-7-saved-routes-advanced/US-039.md): Implement navigation export to Google Maps and Waze

---

### Epic 8: Integration Testing & V1 Gate

**Folder:** `epic-8-integration-testing/`

**Human Test:**
1. FULL GATE TEST: 'scenic 2-hour ride to Santa Cruz' → 3 routes with badges in <12s
2. 'actually avoid Highway 1' → updated routes without starting over
3. Save, new session, resume, connectivity errors, rate limiting
4. Performance and accessibility verification

**Tasks:**
- [US-040](epic-8-integration-testing/US-040.md): End-to-end V1 gate test validation
- [US-041](epic-8-integration-testing/US-041.md): Performance profiling and optimization
- [US-042](epic-8-integration-testing/US-042.md): Accessibility audit — testID and accessibilityLabel
- [US-043](epic-8-integration-testing/US-043.md): Rate limiting end-to-end verification

---

## Dependency Graph

```
Epic 1 (Phase 0) ──→ Epic 2 (Chat Infra) ──→ Epic 3 (Refinement) ─┐
                                              Epic 4 (Sessions)   ─┤
                                              Epic 5 (Weather)    ─┼→ Epic 7 (SR Advanced) → Epic 8 (Gate)
                                              Epic 6 (Save Core)  ─┘
```

Epics 3, 4, 5, 6 can run **in parallel** after Epic 2.

## V1 Gate Test Minimum

Epics **1 + 2 + 3 + 5** are the minimum for the gate test. Epics 4, 6, 7 can defer to V1.1 under schedule pressure.

## Usage

These task files are designed for execution with `/kb-run-epic`.

Each task file contains:
- Complete task specification following TASK-TEMPLATE.md v4.0
- All required sections for agent execution

To execute:
1. `/kb-run-epic epic-1-phase-0-remediation` to run first epic
2. Tasks are dispatched to assigned agents in dependency order
3. Reviewers verify each completion before marking done

## PRD Coverage

100% of PRD acceptance criteria covered across all 28 use cases.

| Group | Use Cases | Epics |
|-------|-----------|-------|
| AG (Agentic Planning) | 11 UCs | Epics 2, 3, 4 |
| WX (Weather) | 7 UCs | Epic 5 |
| SR (Saved Routes) | 10 UCs | Epics 6, 7 |
