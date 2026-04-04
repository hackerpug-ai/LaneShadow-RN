# Product Team Report: V1 PRD Adjustment Plan

**Date**: 2026-04-03
**Team**: pm-lead, convex-backend, ui-architect, ui-reviewer

---

## Objective

Analyze the V1 PRD scope against the current codebase and create an adjustment plan that identifies improvements, new functionality, and code removal required to evolve the current implementation into the scoped V1 product.

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **V1 Completion** | ~23% overall |
| **NLP Group** | 0% (0/11 UCs) |
| **WX Group** | 29% (1/7 implemented, 2/7 partial) |
| **SR Group** | 60% (3/10 implemented, 4/10 partial) |
| **Critical Issues Found** | 3 BLOCKING (24 icon imports, 10 Text violations, hardcoded colors) |

**Key Finding**: The V1 PRD describes a **conversational AI copilot** for ride planning. The current codebase implements a **manual planning form**. This is a fundamental architectural mismatch requiring chat infrastructure to be built from scratch.

---

## Deliverables

### 1. Gap Analysis Matrix
**Author**: pm-lead (product-manager)
**File**: `.spec/artifacts/team-product/01-gap-analysis-matrix.md`

Comprehensive analysis of all 28 V1 use cases against current implementation:

- **NLP Group (11 UCs)**: 0% complete — entire conversational planning paradigm missing
- **WX Group (7 UCs)**: 29% complete — wind overlay implemented, rain/temp/badges/timeline missing
- **SR Group (10 UCs)**: 60% complete — browsing/search/delete implemented, rating/notes/re-plan/export missing

**Critical Gaps**:
- No chat/AI session infrastructure
- No conversational error handling
- Weather data pipeline incomplete (only wind integrated)
- No conditions scoring system

### 2. Frontend Adjustment Plan
**Author**: ui-architect (frontend-designer)
**File**: `.spec/artifacts/team-product/03-frontend-adjustment-plan.md`

Detailed component inventory and implementation plan:

**Components to CREATE (8)**:
- `ChatInput` — Always-visible floating input bar
- `ChatMessageOverlay` — Temporary AI response on map
- `ChatSessionView` — Expanded chat history
- `RouteAttachmentCard` — Compact route card for messages
- `SessionSidebar` — Left drawer for session history
- `RouteWeatherBadge` — Weather condition badge
- `WeatherTimelineSheet` — Hourly weather chart
- `AnimatedSketchPolyline` — Planning animation

**Components to MODIFY (4)**:
- `HomeMapScreen` — Replace 4-state with 6-state machine
- `PlanRideSheet` — Add fallback manual mode
- `RouteOptionsSheet` — Add weather badges
- `RouteOptionCard` — Share layout with attachments

**Components to REMOVE (2)**:
- `FloatingSearchInput` — Replaced by ChatInput
- Teacher-specific components (3) — Not V1 relevant

**New Hooks Required (6)**:
- `useRideFlow` — 6-state reducer
- `useChatSession` — Session CRUD
- `useSessionHistory` — Session list
- `useMessageOverlay` — Auto-dismiss timer
- `useChatPlanning` — Wraps planRide with chat lifecycle
- `useRouteComparison` — Route selection + polyline memoization

**Implementation Phases**: 6 phases, 14.5-18.5 days estimated

### 3. Backend Adjustment Notes
**Author**: convex-backend (convex-planner)
**Status**: Contributed directly to cross-validation report

**Key Backend Requirements**:
- New tables: `planning_sessions`, `session_messages`, `plan_usage`
- New action: `parseNaturalLanguageInput` (NLP entry point)
- Modified: `weatherProvider` (add rain+temp), `probeConditions`, `mapConditions`
- New endpoints: Session CRUD, message CRUD, saved routes CRUD, rate limiting
- Migration: All additive, no breaking changes

**BLOCKING Dependencies**:
- Session management endpoints must exist before chat UI implementation
- Weather data pipeline must be complete for conditions scoring

### 4. Final Cross-Validation Report
**Author**: ui-reviewer (react-native-ui-reviewer)
**File**: `.spec/artifacts/team-product/04-final-adjustment-report.md`

**Verdict**: **NEEDS_FIXES** — Critical quality violations found

**CRITICAL Issues (BLOCKING V1 Implementation)**:

1. **24 components** import directly from `@expo/vector-icons` instead of using `IconSymbol` wrapper
   - **Impact**: Breaks web platform compatibility
   - **Fix**: 4-6 hours required

2. **10 components** use core React Native `Text` instead of Paper Text
   - **Impact**: Breaks theme system, loses variants
   - **Fix**: 2-3 hours required

3. **Hardcoded colors** in map components
   - **Impact**: Breaks dark mode
   - **Fix**: 1-2 hours required

**Phase 0 Remediation Required**: 7-11 hours BEFORE any V1 implementation begins

---

## Cross-Team Insights

### 1. Architectural Mismatch
All agents converged on this finding: The current codebase is a **manual form-based planning UI**. The V1 PRD requires a **conversational AI copilot**. This is not a gap — it's a different paradigm.

### 2. Quality Debt Blocking Progress
The cross-validation revealed systemic quality violations (icon imports, Text usage, hardcoded colors) that will propagate into V1 features if not remediated first. This changes the implementation sequence.

### 3. Weather Integration is Partial
Wind overlay exists and works. Rain and temperature have UI scaffolding (toggles) but no backend data or rendering. The pipeline needs completion before weather badges can work.

---

## Gaps & Caveats

**Backend Plan Gap**: The `convex-backend` agent did not produce a standalone backend adjustment plan document. Their contributions were integrated into the cross-validation report. This may indicate the backend requirements were already well-specified in the PRD (07-technical-backend.md).

**Session History Deferral**: Per PRD deferral note, session history sidebar can be deferred to V1.1. Single in-memory session is acceptable for V1 gate test.

**Rate Limiting Scope**: Rate limiting (plan_usage table, check/increment endpoints) was mentioned in the PRD but not deeply analyzed by any agent. This may need attention before production launch.

---

## Recommended Next Steps

### Phase 0: CRITICAL REMEDIATION (Week 0, 1-2 days)
**Owner**: ui-reviewer (react-native-ui-reviewer) with ui-architect (frontend-designer)

1. Fix all 24 `@expo/vector-icons` direct imports to use `IconSymbol`
2. Fix all 10 `Text` from `react-native` imports to use Paper Text
3. Fix hardcoded colors in map components
4. Run verification gates: `pnpm typecheck`, `pnpm lint`, `pnpm dev:client`

**Acceptance**: All quality gates pass, web platform runs without icon errors

### Phase 1: BACKEND FOUNDATION (Week 1-2)
**Owner**: convex-backend (convex-planner) with backend-engineer

1. Create `planning_sessions` and `session_messages` tables
2. Implement `parseNaturalLanguageInput` action
3. Complete weather data pipeline (rain + temperature)
4. Implement conditions scoring system
5. Add rate limiting endpoints

**Acceptance**: Session CRUD works, NLP parsing returns structured input, weather data populates

### Phase 2: CHAT UI CORE (Week 2-3)
**Owner**: ui-architect (frontend-designer) with ui-developer

1. Create `ChatInput` component
2. Create `RouteAttachmentCard` component
3. Create `ChatMessageOverlay` component
4. Implement `useRideFlow` 6-state reducer
5. Migrate `HomeMapScreen` to new state machine

**Acceptance**: Chat input sends messages, routes render as attachments, overlay shows responses

### Phase 3: SESSION MANAGEMENT (Week 3-4)
**Owner**: ui-architect (frontend-designer) with ui-developer

1. Create `SessionSidebar` component
2. Create `ChatSessionView` component
3. Implement session resume flow
4. Add "New Session" button

**Acceptance**: Sessions persist across app launches, history loads, resume works

### Phase 4: WEATHER COMPLETION (Week 4-5)
**Owner**: convex-backend + ui-architect

1. Implement rain overlay rendering
2. Implement temperature overlay rendering
3. Add weather badges to route cards
4. Create `WeatherTimelineSheet` component
5. Wire departure time adjustment

**Acceptance**: All three overlays work, badges show conditions, timeline expands

### Phase 5: SAVED ROUTES POLISH (Week 5-6)
**Owner**: ui-architect (frontend-designer) with ui-developer

1. Implement rating and notes (UC-SR-07)
2. Add re-plan from saved route (UC-SR-08)
3. Implement export to navigation (UC-SR-10)
4. Add "Includes your favorites" indicator (UC-SR-06)
5. Mark as ridden toggle (UC-SR-09)

**Acceptance**: All saved route features complete

### Phase 6: INTEGRATION & TESTING (Week 6)
**Owner**: All agents + qa-engineer

1. Conversational error responses (UC-NLP-11, UC-WX-07)
2. Follow-up message refinement (UC-NLP-07)
3. E2E testing for chat flow
4. Accessibility audit
5. Performance profiling

**Acceptance**: V1 gate test passes — "scenic 2-hour ride to Santa Cruz" works in 10 seconds

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Chat infrastructure not started | Blocks entire NLP group | Start Phase 1 immediately after Phase 0 |
| Quality violations propagate | Breaks web, dark mode | Phase 0 remediation is BLOCKING |
| Weather data incomplete | No badges, no "Best for today" | Parallelize weather backend with chat UI |
| Session management complexity | Could delay V1 | Defer sidebar to V1.1 per PRD guidance |
| 6-week appetite may be tight | Scope creep risk | Phase 0+1+2 are critical, others can be trimmed |

---

## V1 Gate Test Status

**Current Status**: ❌ FAIL — Chat infrastructure does not exist

**Required to Pass**:
1. Chat input visible on map
2. "scenic 2-hour ride to Santa Cruz" message generates routes
3. 3 route options appear with weather badges
4. "actually avoid Highway 1" refinement works
5. All in under 10 seconds

**Estimated Time to Gate Test**: 4-5 weeks (after Phase 0 remediation)

---

**End of Product Team Report**

**Artifacts Location**: `.spec/artifacts/team-product/`
- `01-gap-analysis-matrix.md`
- `03-frontend-adjustment-plan.md`
- `04-final-adjustment-report.md`
- `2026-04-03-v1-prd-adjustment-plan-report.md` (this file)
