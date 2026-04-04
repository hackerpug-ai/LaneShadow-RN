# V1 Gap Analysis Matrix

**Date**: 2026-04-03
**Analyzed By**: product-manager (team-product-v1-gap-analysis)
**PRD Version**: 1.1.0

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Use Cases** | 28 |
| **Implemented** | 4 (14%) |
| **Partial** | 10 (36%) |
| **New** | 14 (50%) |
| **Remove** | 0 (0%) |
| **Overall Completion** | ~23% (weighted) |

### Key Findings

1. **Conversational Planning (NLP)** is the primary gap — essentially not implemented. The current system uses a manual planning sheet with form inputs instead of AI-powered conversational planning.

2. **Weather & Conditions (WX)** has foundational work (wind overlay exists, overlay toggle component) but lacks rain/temperature overlays and the AI-powered weather badges/timeline features.

3. **Saved Routes & Favorites (SR)** is the most complete group with browsing, searching, filtering, and deletion implemented. Missing: rating, notes, mark as ridden, re-plan from saved, and export to navigation.

4. **Critical Architecture Gap**: No chat/AI session infrastructure exists. The PRD assumes a conversational interface with persistent sessions, message history, and AI responses as map overlays. The current implementation is purely form-based.

---

## Functional Group: NLP — Conversational Planning (11 Use Cases)

**Completion**: 0% (0/11 implemented, 0/11 partial)

| UC ID | Title | Status | Evidence | Gaps/Notes |
|-------|-------|--------|----------|------------|
| **UC-NLP-01** | Start a planning conversation | NEW | `app/(app)/(tabs)/index.tsx:417-429` | Current: FloatingSearchInput triggers PlanRideSheet (form-based). Missing: Chat input bar always visible on map, suggestion chips, 500-char free-form input, session auto-creation, resolved location placeholder. |
| **UC-NLP-02** | Generate 2–3 alternative scenic routes as chat attachments | NEW | `convex/actions/agent/planRide.ts:129-178` | Current: planRide action exists, generates route options. Missing: Chat attachment rendering, inline progress indicators ("Reading your ride...", "Finding scenic roads..."), 12-second timeout, conversational response with descriptive text. |
| **UC-NLP-03** | View and select route attachments | NEW | `components/ui/route-option-card.tsx` | Current: RouteOptionCard component exists but not integrated with chat. Missing: Attachment cards in AI chat messages, map-as-primary comparison surface, "Best for today" highlight, sorting by scenic+conditions score. |
| **UC-NLP-04** | Conditions-aware route ranking ("Best for today") | NEW | — | Missing entirely. No scoring system combining scenic + conditions, no badge on route cards, no explanation tooltip on badge tap. |
| **UC-NLP-05** | Switch to manual planning mode | PARTIAL | `components/sheets/plan-ride-sheet.tsx` | Current: Manual planning sheet exists as the primary mode. Missing: Action to switch from chat to manual, preference carryover from chat context to sheet, return-to-chat without losing history. |
| **UC-NLP-06** | AI-generated route descriptions and labels | PARTIAL | `convex/actions/agent/tools/compileSketch.ts` | Current: enrichRoute generates route labels/descriptions via LLM. Missing: Integration with chat responses, display on attachment cards, storage with saved routes (label field exists but not populated by AI). |
| **UC-NLP-07** | Refine routes through follow-up messages | NEW | — | Missing entirely. No conversational context, no follow-up message handling, no "make it shorter", "avoid Highway 1" refinement, no in-context updates without starting over. |
| **UC-NLP-08** | View temporary AI message overlay on map | NEW | — | Missing entirely. No temporary overlay cards, no auto-dismiss after 5 seconds, no pin-to-keep-visible, no swipe-to-dismiss. Map has no AI message overlay system. |
| **UC-NLP-09** | Manage chat sessions | NEW | — | Missing entirely. No session model, no "New Session" button, no session history sidebar, no auto-generated session titles, no session persistence across app launches, no most-recent session auto-load. |
| **UC-NLP-10** | Expand chat to full message history | NEW | — | Missing entirely. No expand affordance, no full scrollable message history, no inline route attachments in chat history, no collapse back to map-primary view. |
| **UC-NLP-11** | Error recovery in conversation | NEW | `components/sheets/planning-error-sheet.tsx` | Current: Error sheet uses modal dialogs. Missing: Conversational error responses ("I need a bit more detail...", "I couldn't find routes..."), no raw error codes, no retry via another message (requires retry button). |

**NLP Group Summary**: The entire conversational planning paradigm is missing. Current implementation is a traditional form-based planning UI. Requires architectural pivot to chat-first, map-secondary experience with AI session management.

---

## Functional Group: WX — Weather & Conditions (7 Use Cases)

**Completion**: 29% (1/7 implemented, 2/7 partial)

| UC ID | Title | Status | Evidence | Gaps/Notes |
|-------|-------|--------|----------|------------|
| **UC-WX-01** | View wind overlay on route polyline | IMPLEMENTED | `components/map/overlay-toggle.tsx:22-253`, `app/(app)/(tabs)/index.tsx:118-138` | Wind overlay toggle exists, defaults to active when route selected. Polyline coloring for wind bands implemented. Color legend and direction arrows may need verification. |
| **UC-WX-02** | View rain forecast overlay on route polyline | NEW | `components/map/overlay-toggle.tsx:28` | Rain toggle exists in OverlayToggle but disabled when no data. Missing: Rain overlay polyline coloring implementation, rain probability bands, alignment to departure time, peak rain window label, tap-for-probability on segments. |
| **UC-WX-03** | View temperature overlay on route polyline | NEW | `components/map/overlay-toggle.tsx:29` | Temperature toggle exists but disabled. Missing: Temperature overlay polyline coloring, comfort band mapping (cold/cool/comfortable/hot), high/low range summary, tap-for-temperature on segments. |
| **UC-WX-04** | Weather badges on route comparison cards | NEW | `components/ui/route-option-card.tsx:24-27` | RouteOptionCard has badges array but weather badges not implemented. Missing: Compact weather badge showing dominant condition, salient condition selection logic, weather icon reinforcement, dynamic updates on departure time change. |
| **UC-WX-05** | Expand weather timeline detail for a route | NEW | — | Missing entirely. No expand control on route detail, no hourly weather timeline (wind/rain/temperature per hour), no alignment to departure time, no worst-condition highlight. |
| **UC-WX-06** | Adjust departure time and re-rank routes | NEW | `components/sheets/plan-ride-sheet.tsx:191-202` | Current: DepartureTimeSelector exists but doesn't trigger weather re-ranking. Missing: Chat-based departure time adjustment ("what if I leave at 3pm?"), weather re-fetch for new time, re-ranking with updated "Best for today", overlay updates. |
| **UC-WX-07** | Weather data error recovery | NEW | `convex/actions/agent/providers/weatherProvider.ts` | Current: Weather provider exists. Missing: Conversational error messaging ("Weather data isn't available right now..."), "Weather unavailable" indicator on cards, staleness notice ("Weather checked at 7:03 AM..."), graceful degradation to scenic-only ranking. |

**WX Group Summary**: Wind overlay is implemented. Rain and temperature overlays have UI scaffolding (toggles) but no backend data or rendering. Weather badges, timeline, departure time adjustment, and error recovery are missing. Weather integration needs backend data pipeline and UI completion.

---

## Functional Group: SR — Saved Routes & Favorites (10 Use Cases)

**Completion**: 60% (3/10 implemented, 4/10 partial)

| UC ID | Title | Status | Evidence | Gaps/Notes |
|-------|-------|--------|----------|------------|
| **UC-SR-01** | Save a planned route | PARTIAL | `convex/db/savedRoutes.ts:403-427`, `components/sheets/save-route-confirmation-sheet.tsx` | Current: saveRoute mutation exists, SaveRouteConfirmationSheet component exists. Missing: Save action from route attachment card in chat (no chat), AI-generated name/description auto-populated, toast confirmation, duplicate prevention, immediate access after save. |
| **UC-SR-02** | Browse saved routes list | IMPLEMENTED | `app/(app)/(tabs)/saved-routes.tsx:46-241`, `hooks/use-saved-routes.ts` | Saved routes list with newest-first sorting, route cards with name/date/start-end/thumbnail, empty state with CTA. Fully implemented. |
| **UC-SR-03** | Search and filter saved routes | IMPLEMENTED | `app/(app)/(tabs)/saved-routes.tsx:51-94`, `convex/db/savedRoutes.utils.ts` | Real-time name search, date range filter (Last week/month/3 months), Clear filters control, "No results" empty state. Fully implemented. |
| **UC-SR-04** | Rename or delete a saved route | PARTIAL | `convex/db/savedRoutes.ts:275-313`, `components/ui/delete-route-dialog.tsx` | Current: renameRoute mutation exists, soft delete with undo implemented. Missing: Rename control in route detail view (rename exists but may not be exposed in UI), inline edit, immediate list update. |
| **UC-SR-05** | Save a favorite road segment | IMPLEMENTED | `components/ui/save-favorite-sheet.tsx`, `convex/db/favoriteRoads.ts` | Long-press on polyline (US-042), Save as Favorite action sheet (US-043), favorite_roads table, favorite road card with mini map (US-044). Fully implemented. |
| **UC-SR-06** | Auto-include favorite roads in route planning | PARTIAL | `app/(app)/(tabs)/settings.tsx`, `convex/actions/agent/lib/planRideOrchestrator.ts` | Current: Favorite Roads settings section (US-045), "Include favorite roads" toggle mentioned (US-046 in_progress), passed to routing provider (US-047). Missing: Toggle in PlanRideSheet (chat-based in PRD), "Includes your favorites" indicator on route cards, "couldn't include [Name]" message. |
| **UC-SR-07** | Rate a route and add notes | NEW | — | Missing entirely. No 1-5 star rating control, no rating display on list cards, no "Add note" control, no note edit/delete, no note indicator icon, no 4+ star filter. |
| **UC-SR-08** | Re-plan from a saved route | NEW | `app/(app)/saved-route/[id].tsx` | Current: Saved route detail view exists. Missing: "Re-plan this route" action, new session pre-loaded with saved route context, saved route as first attachment, unmodified original (re-planning creates new alternatives). |
| **UC-SR-09** | Mark a route as ridden | NEW | — | Missing entirely. No "Mark as Ridden" toggle, no "Ridden" badge with date, no ridden vs planned filter, no unmark capability. |
| **UC-SR-10** | Export route to navigation app | NEW | — | Missing entirely. No "Navigate" action on attachment cards or saved routes, no Google Maps/Waze deep-link construction, no confirmation toast, no fallback message when neither app installed. |

**SR Group Summary**: Saved routes browsing, search, filtering, and favorite road segments are fully implemented. Soft delete with undo is complete. Partial: saving routes (needs chat integration), rename/delete (UI exposure), favorite roads auto-include (missing indicators). Missing: ratings, notes, re-plan, mark as ridden, export to navigation.

---

## Implementation Status by Component

### Implemented Components

| Component | File | Used By UCs |
|-----------|------|-------------|
| PlanRideSheet | `components/sheets/plan-ride-sheet.tsx` | NLP-05 (manual mode) |
| OverlayToggle | `components/map/overlay-toggle.tsx` | WX-01 (wind), WX-02 (rain - toggle only), WX-03 (temp - toggle only) |
| RouteOptionCard | `components/ui/route-option-card.tsx` | NLP-03 (structure exists, not integrated) |
| SavedRoutesScreen | `app/(app)/(tabs)/saved-routes.tsx` | SR-02, SR-03 |
| SavedRouteCard | `components/ui/saved-route-card.tsx` | SR-02 |
| DeleteRouteDialog | `components/ui/delete-route-dialog.tsx` | SR-04 |
| SaveFavoriteSheet | `components/ui/save-favorite-sheet.tsx` | SR-05 |
| FavoriteRoadCard | `components/ui/favorite-road-card.tsx` | SR-05 |
| planRide action | `convex/actions/agent/planRide.ts` | NLP-02 (backend exists, no chat UI) |
| savedRoutes queries/mutations | `convex/db/savedRoutes.ts` | SR-01, SR-02, SR-03, SR-04 |
| favoriteRoads queries/mutations | `convex/db/favoriteRoads.ts` | SR-05, SR-06 |

### Missing Components

| Component | Required For UCs | Priority |
|-----------|------------------|----------|
| Chat input bar (always visible) | NLP-01, NLP-07, NLP-10 | CRITICAL |
| AI session management (create/list/resume) | NLP-09 | CRITICAL |
| Chat message history component | NLP-10 | CRITICAL |
| Temporary AI overlay on map | NLP-08 | CRITICAL |
| Route attachment cards in chat | NLP-02, NLP-03 | CRITICAL |
| Conditions scoring system | NLP-04, WX-04 | HIGH |
| Weather badges (on route cards) | NLP-04, WX-04 | HIGH |
| Rain overlay polyline rendering | WX-02 | HIGH |
| Temperature overlay polyline rendering | WX-03 | HIGH |
| Weather timeline expansion | WX-05 | MEDIUM |
| Departure time chat refinement | WX-06 | HIGH |
| Conversational error handler | NLP-11, WX-07 | HIGH |
| Rating component | SR-07 | MEDIUM |
| Notes component | SR-07 | MEDIUM |
| Re-plan action | SR-08 | MEDIUM |
| Mark as ridden toggle | SR-09 | LOW |
| Export to navigation deep-link | SR-10 | MEDIUM |

---

## Cross-Cutting Architectural Gaps

### 1. No Chat/AI Session Infrastructure

**Impact**: UC-NLP-01, UC-NLP-07, UC-NLP-09, UC-NLP-10, UC-NLP-11

**Current State**: Manual planning form (PlanRideSheet) with no conversation memory.

**Required**:
- `planning_sessions` table (mentioned in PRD but not in schema)
- `session_messages` table for message history
- Chat session CRUD operations
- Session list/resume UI
- Message composition and rendering

### 2. No Conversational Error Handling

**Impact**: UC-NLP-11, UC-WX-07

**Current State**: Modal error sheets (PlanningErrorSheet).

**Required**:
- Error message templates for conversational responses
- Error severity classification
- Retry via follow-up message pattern

### 3. Weather Data Pipeline Incomplete

**Impact**: UC-WX-02, UC-WX-03, UC-WX-04, UC-WX-05, UC-WX-06

**Current State**: WeatherProvider exists but only wind data is integrated.

**Required**:
- Rain forecast data fetching and storage
- Temperature forecast data fetching and storage
- Per-segment weather alignment
- Weather timeline data structure
- Staleness tracking

### 4. Conditions Scoring System

**Impact**: UC-NLP-04, UC-WX-04

**Current State**: No scoring algorithm exists.

**Required**:
- Scenic score calculation (road type, elevation, POIs)
- Conditions score calculation (rain, wind, temperature)
- Combined ranking algorithm
- "Best for today" badge logic

---

## Priority Recommendations for Adjustment Plan

### Phase 1: Core Conversational Infrastructure (Weeks 1-2)

**Must Ship for V1**:
1. Implement chat input bar on map screen (UC-NLP-01)
2. Create planning_sessions and session_messages tables
3. Build chat message history component (UC-NLP-10)
4. Implement temporary AI overlay on map (UC-NLP-08)
5. Integrate route attachment cards in chat (UC-NLP-02, UC-NLP-03)

**Rationale**: Without chat infrastructure, the entire NLP group cannot ship. This is foundational to the V1 gate test.

### Phase 2: Weather & Conditions Completion (Weeks 3-4)

**Must Ship for V1**:
1. Implement rain overlay rendering (UC-WX-02)
2. Implement temperature overlay rendering (UC-WX-03)
3. Add weather badges to route cards (UC-WX-04)
4. Build conditions scoring system (UC-NLP-04)
5. Implement departure time adjustment via chat (UC-WX-06)

**Rationale**: Weather is a core differentiator. Without badges and conditions-based ranking, the "Best for today" promise fails.

### Phase 3: Saved Routes Polish (Weeks 5-6)

**Must Ship for V1**:
1. Implement rating and notes (UC-SR-07)
2. Add re-plan from saved route (UC-SR-08)
3. Implement export to navigation (UC-SR-10)
4. Add "Includes your favorites" indicator (UC-SR-06)
5. Mark as ridden (UC-SR-09)

**Rationale**: SR is 60% complete. These are polish features that can be descoped if needed, but export to navigation is the V1 workaround for turn-by-turn.

### Phase 4: Error Recovery & Refinement (Week 6)

**Must Ship for V1**:
1. Conversational error responses (UC-NLP-11, UC-WX-07)
2. Follow-up message refinement (UC-NLP-07)
3. Session management UI (UC-NLP-09)

**Rationale**: Error recovery and refinement are critical to the "magical" experience. Without them, the chat feels brittle.

---

## Risk Assessment

### High Risk Items

| Risk | Impact | Mitigation |
|------|--------|------------|
| Chat infrastructure not started | Blocks entire NLP group | Prioritize Phase 1 immediately |
| Weather data pipeline incomplete | Blocks WX group, conditions ranking | Parallelize weather backend with chat UI |
| Conditions scoring undefined | No "Best for today" badge | Implement simple heuristic first, refine later |
| Session management complexity | Could delay V1 | Defer session history sidebar to V1.1 (per PRD deferral note) |

### Medium Risk Items

| Risk | Impact | Mitigation |
|------|--------|------------|
| Export to navigation deep-link format | Workaround for missing turn-by-turn | Validate Google Maps and Waze URL formats early |
| AI-generated route name quality | Affects route attachment UX | Use simple templates first, enhance with LLM later |
| Follow-up refinement context handling | Core to conversational experience | Start with explicit refinement ("avoid X"), handle implicit ("shorter") later |

### Low Risk Items

| Risk | Impact | Mitigation |
|------|--------|------------|
| Mark as ridden feature | Nice-to-have, not in V1 gate test | Descoped if schedule pressure |
| Notes on saved routes | Nice-to-have | Descoped if schedule pressure |
| Weather timeline expansion | Power user feature | Descoped if schedule pressure |

---

## Conclusion

The V1 PRD describes a **conversational AI copilot** for motorcycle ride planning. The current codebase implements a **manual planning form** with excellent saved routes management. This is a fundamental architectural mismatch.

**To ship V1**, the team must:
1. Build chat infrastructure from scratch (sessions, messages, history)
2. Integrate AI responses as map overlays (not sheets)
3. Complete weather data pipeline (rain, temperature, badges)
4. Implement conditions-based ranking
5. Add conversational error handling

The 6-week appetite is achievable if chat infrastructure is started immediately and the team accepts the PRD's deferral guidance (session history sidebar to V1.1, single in-memory session acceptable for V1).

**Estimated V1 Ship Readiness**: 23% complete, requires ~4 weeks of focused development on NLP and WX groups.
