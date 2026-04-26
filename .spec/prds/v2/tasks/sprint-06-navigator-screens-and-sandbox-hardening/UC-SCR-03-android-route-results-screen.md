# UC-SCR-03-android: `RouteResultsScreen` — 3 alt polylines + NavigatorMessage + refine chat — Android Compose

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** kotlin-implementer
**Estimate:** 180 min
**Type:** FEATURE
**Status:** ✅ Completed (AC-5/TC-5 snapshot verification deferred to UC-SBX-06-android dropshots wiring per sprint sequencing)
**Completed:** 2026-04-26
**Commits:** eae820de (initial), 4ca6d71d (wip), 35124b52 (animation enhance), 47121935 (TC-2 instrumented + TC-3 constant)
**Reviewer:** kotlin-reviewer (cycle 1 NEEDS_FIXES → cycle 2 APPROVED with AC-5/TC-5 deferral)
**Priority:** P0
**Effort:** L
**PRD Refs:** UC-SCR-03

---

## Background

Render RouteResultsScreen on Android with three concurrent polylines, pinned Navigator message containing 3 route attachment cards, and a refine chat input.

## Critical Constraints

**MUST:**
- Color polylines via `LaneShadowTheme.color.route.best/alt1/alt2` — NEVER hardcoded.
- Use `motion.recipe.routeDrawOn` with 120ms stagger between paths.
- Register `templates.routeResults.default` at `tier: ComponentTier.template`.
- STRICTLY no Convex — `RouteResultsMockProvider` only.

**NEVER:**
- Edit iOS or token sources.
- Hardcode polyline hex values or stagger duration.

**STRICTLY:**
- Message pre-pinned (`pinned = true`) so auto-dismiss does not fire.

## Specification

**Objective:** Render RouteResultsScreen on Android with three concurrent polylines, pinned Navigator message containing 3 route attachment cards, and a refine chat input.

**Success State:** Story renders three polylines with route-variant colors, camera fits union bounds with `spacing.4` padding, attachments stack with first selected/best, animations reference motion recipes, no fetch logic.

## Acceptance Criteria

### AC-1 — RouteResults composition renders
- **GIVEN** Sandbox `templates.routeResults.default` selected
- **WHEN** Story mounts
- **THEN** Top bar visible; `LSNavigatorMessage` pinned with 'THE NAVIGATOR' label, opinion-serif body, three compact `LSRouteAttachmentCard`s stacked (first marked selected, stripe in `color.route.best`, best badge on first card); map below shows three polylines in `color.route.best/alt1/alt2`; chat input with refine placeholder
- **Verify:** Compose UI test asserts hierarchy + per-card stripe colors
- **TDD State:** RED

### AC-2 — Polyline colors + camera fit
- **GIVEN** Story rendered
- **WHEN** Inspected
- **THEN** Three polylines render with per-variant tokens and camera auto-frames union bounds with `spacing.4` padding via `cameraFit: .polylines`
- **Verify:** UI test asserts camera fit invocation params + polyline color tokens
- **TDD State:** RED

### AC-3 — Route draw-on animation stagger
- **GIVEN** Story mounts
- **WHEN** Polylines animate in
- **THEN** `motion.recipe.routeDrawOn` fires with 120ms stagger between paths
- **Verify:** Static + UI test asserts animation recipe usage and stagger constant
- **TDD State:** RED

### AC-4 — Pin/dismiss callbacks
- **GIVEN** NavigatorMessage is pre-pinned
- **WHEN** Developer taps pin then close icons
- **THEN** `onPin` then `onDismiss` fire; auto-dismiss does NOT fire because message is pre-pinned
- **Verify:** UI test using fake handlers asserts callbacks + no auto-dismiss timer fires
- **TDD State:** RED

### AC-5 — Light/dark re-resolution
- **GIVEN** Story rendered
- **WHEN** Theme toggled
- **THEN** Map style re-resolves to dark Studio style; glass chrome, message surface, route stripes re-resolve
- **Verify:** Snapshot test light + dark
- **TDD State:** RED

### AC-6 — No data-fetching logic
- **GIVEN** Source
- **WHEN** Inspected
- **THEN** No Convex/network — data via `RouteResultsMockProvider`
- **Verify:** Static unit test
- **TDD State:** RED

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|----|-----------|------------|--------|------|
| TC-1 | UI test asserts NavigatorMessage + 3 attachments + 3 polylines | AC-1 | connectedDebugAndroidTest | ui |
| TC-2 | UI test asserts camera fit and polyline color tokens | AC-2 | connectedDebugAndroidTest | ui |
| TC-3 | UI/static test asserts routeDrawOn 120ms stagger | AC-3 | testDebugUnitTest | unit |
| TC-4 | UI test asserts pin/dismiss + no auto-dismiss | AC-4 | connectedDebugAndroidTest | ui |
| TC-5 | Snapshot test light + dark | AC-5 | testDebugUnitTest | snapshot |
| TC-6 | Import allow-list test | AC-6 | testDebugUnitTest | unit |

## Reading List

- `.spec/prds/v2/concepts/uc-scr-03-route-results.html` lines `all` — REQUIRED READING — visual design source for this task
- `.spec/prds/v2/08-uc-scr.md` lines `77-99` — UC-SCR-03 spec + ACs
- `.spec/prds/v2/11-technical-requirements.md` lines `all` — NavigatorMessage + RouteAttachment schemas
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSNavigatorMessage.kt` lines `all` — NavigatorMessage API
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteAttachmentCard.kt` lines `all` — Attachment card API
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt` lines `all` — Camera fit / polyline slot

## Guardrails

**WRITE-ALLOWED:**
- `android/app/src/debug/java/com/laneshadow/sandbox/templates/RouteResultsScreenStory.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/ui/templates/RouteResultsScreen.kt` (NEW)
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/RouteResultsMockProvider.kt` (NEW)
- `android/app/src/test/java/com/laneshadow/ui/templates/RouteResultsScreenTest.kt` (NEW)

**WRITE-PROHIBITED:**
- `ios/**` — iOS task is paired
- `tokens/platforms/kotlin/**` — read only
- `react-native/**`

## Code Pattern

**Reference:** Slot-based template with multi-polyline map + attachment-bearing message.

**Source:** UC-ORG-02 LSMapLayer + UC-ORG-NavigatorMessage

**Anti-Pattern:** Hardcoding polyline hex values or stagger duration.

## Design

**References:**
- `concepts/uc-scr-03-route-results.html`
- `concepts/designs.html`
- `.spec/prds/v2/08-uc-scr.md#UC-SCR-03`

**Interaction Notes:**
- Three polylines drawn with stagger; NavigatorMessage pre-pinned (no auto-dismiss); refine chat input.

## Verification Gates

| Gate | Command | Expected |
|------|---------|----------|
| lint | `cd android && ./gradlew detekt` | BUILD SUCCESSFUL, zero violations |
| build | `cd android && ./gradlew :app:compileDebugKotlin` | BUILD SUCCESSFUL |
| unit-test | `cd android && ./gradlew :app:testDebugUnitTest` | All tests pass |
| compose-ui-test | `cd android && ./gradlew :app:connectedDebugAndroidTest` | All instrumented tests pass |
| tokens | `pnpm tokens:validate` | Tokens validate clean |

## Agent Assignment

**Agent:** kotlin-implementer

**Rationale:** Compose template stacking three polylines, pinned LSNavigatorMessage with attachments, and refine LSChatInput.

## Coding Standards

- `brain/docs/kotlin-rules.md`
- `RULES.md §6 ComponentTier`
- `styles/RULES.md`

## Dependencies

**Depends On:** UC-SBX-01-android, UC-SBX-03-android

**Blocks:** UC-SBX-06-android

## TDD Workflow

1. **RED** — Write failing tests for AC-1..AC-6
2. **GREEN** — Implement Compose code
3. **REFACTOR** — Clean
4. **VERIFY** — Run all gates; commit when green

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"RouteResults composition renders","verify":"ui"},
{"id":"AC-2","type":"acceptance_criterion","description":"Polyline colors + camera fit","verify":"ui"},
{"id":"AC-3","type":"acceptance_criterion","description":"Route draw-on stagger","verify":"unit"},
{"id":"AC-4","type":"acceptance_criterion","description":"Pin/dismiss callbacks","verify":"ui"},
{"id":"AC-5","type":"acceptance_criterion","description":"Light/dark re-resolves","verify":"snapshot"},
{"id":"AC-6","type":"acceptance_criterion","description":"No data fetching","verify":"unit"},
{"id":"TC-1","type":"test_criterion","description":"NavigatorMessage + 3 attachments + 3 polylines","verify":"ui","maps_to_ac":"AC-1"},
{"id":"TC-2","type":"test_criterion","description":"Camera fit + colors","verify":"ui","maps_to_ac":"AC-2"},
{"id":"TC-3","type":"test_criterion","description":"120ms stagger","verify":"unit","maps_to_ac":"AC-3"},
{"id":"TC-4","type":"test_criterion","description":"Pin/dismiss + no auto","verify":"ui","maps_to_ac":"AC-4"},
{"id":"TC-5","type":"test_criterion","description":"Snapshot light+dark","verify":"snapshot","maps_to_ac":"AC-5"},
{"id":"TC-6","type":"test_criterion","description":"No fetch imports","verify":"unit","maps_to_ac":"AC-6"}
]}
-->
