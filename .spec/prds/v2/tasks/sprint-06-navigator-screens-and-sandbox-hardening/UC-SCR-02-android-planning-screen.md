# UC-SCR-02-android: `PlanningScreen` — sketching polyline + phase indicator + thinking chat — Android Compose

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** kotlin-implementer
**Estimate:** 180 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** L
**PRD Refs:** UC-SCR-02

---

## Background

Render PlanningScreen on Android with continuous sketching polyline, phase indicator with one active step pulsing, top bar, and a disabled chat input showing the rider's prompt with a spinner in the trailing slot.

## Critical Constraints

**MUST:**
- Drive sketching polyline from `motion.recipe.sketchPolylineLoop` token — NEVER hardcoded duration/easing.
- Drive phase pulse from `motion.recipe.phaseDotPulse`.
- Register at `tier: ComponentTier.template` with id `templates.planning.default` (+ argType variants for active phase).
- STRICTLY no Convex/network — `PlanningMockProvider` is the only data source.

**NEVER:**
- Edit iOS or token sources.
- Inline animation duration/easing literals or enable chat input.

**STRICTLY:**
- ChatInput trailing slot contains `LSSpinner`, not send button.

## Specification

**Objective:** Render PlanningScreen on Android with continuous sketching polyline, phase indicator with one active step pulsing, top bar, and a disabled chat input showing the rider's prompt with a spinner in the trailing slot.

**Success State:** Sandbox story renders all variants per active-phase argType, animations reference token recipes, chat input is non-interactive, and tests confirm no fetch logic.

## Acceptance Criteria

### AC-1 — Planning screen composition renders
- **GIVEN** Sandbox launched with `templates.planning.default`
- **WHEN** Story mounts
- **THEN** Top bar visible, `LSPhaseIndicator` shows 5 labeled steps with one active (pulsing ring via `motion.recipe.phaseDotPulse`), map shows sketching polyline animation, chat input bottom-anchored with filled prompt and `LSSpinner` in trailing slot
- **Verify:** Compose UI test asserts node hierarchy + active phase semantics
- **TDD State:** RED

### AC-2 — Active phase argType drives re-render
- **GIVEN** Story argTypes expose `activePhase`
- **WHEN** Developer changes the active phase
- **THEN** `LSPhaseIndicator` re-renders with the new step pulsing and prior steps marked `done`
- **Verify:** UI test parameterized over phases asserts active/done semantics
- **TDD State:** RED

### AC-3 — Sketch polyline references motion recipe
- **GIVEN** PlanningScreen source
- **WHEN** Inspected
- **THEN** Animation declaration references `LaneShadowTheme.motion.recipe.sketchPolylineLoop` (no inline duration/easing literals)
- **Verify:** Static unit test scans source for forbidden literals + asserts recipe usage
- **TDD State:** RED

### AC-4 — Chat input non-interactive while thinking
- **GIVEN** PlanningScreen rendered with `isThinking=true`
- **WHEN** Developer attempts to type or tap send
- **THEN** Input is disabled and trailing slot shows `LSSpinner` (not send button)
- **Verify:** UI test asserts disabled semantics + spinner node present
- **TDD State:** RED

### AC-5 — Light/dark re-resolves tokens
- **GIVEN** PlanningScreen rendered
- **WHEN** Theme toggled
- **THEN** All elements re-render with correct LaneShadowTheme tokens
- **Verify:** Snapshot test in both color schemes
- **TDD State:** RED

### AC-6 — No data-fetching logic
- **GIVEN** PlanningScreen source
- **WHEN** Inspected
- **THEN** No Convex/network/repository imports; data via `PlanningMockProvider`
- **Verify:** Static unit test asserts import allow-list
- **TDD State:** RED

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|----|-----------|------------|--------|------|
| TC-1 | UI test renders default story and asserts composition | AC-1 | connectedDebugAndroidTest | ui |
| TC-2 | Parameterized UI test cycles activePhase argType | AC-2 | connectedDebugAndroidTest | ui |
| TC-3 | Static test verifies sketch animation references motion recipe | AC-3 | testDebugUnitTest | unit |
| TC-4 | UI test confirms input disabled + spinner present | AC-4 | connectedDebugAndroidTest | ui |
| TC-5 | Snapshot test light + dark | AC-5 | testDebugUnitTest | snapshot |
| TC-6 | Import allow-list test | AC-6 | testDebugUnitTest | unit |

## Reading List

- `.spec/prds/v2/concepts/uc-scr-02-planning.html` lines `all` — REQUIRED READING — visual design source for this task
- `.spec/prds/v2/08-uc-scr.md` lines `52-74` — UC-SCR-02 spec + ACs
- `.spec/prds/v2/11-technical-requirements.md` lines `all` — PlanningPhase schema
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseIndicator.kt` lines `all` — Phase indicator API
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSSpinner.kt` lines `all` — Spinner usage
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt` lines `all` — Slot API

## Guardrails

**WRITE-ALLOWED:**
- `android/app/src/debug/java/com/laneshadow/sandbox/templates/PlanningScreenStory.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt` (NEW)
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/PlanningMockProvider.kt` (NEW)
- `android/app/src/test/java/com/laneshadow/ui/templates/PlanningScreenTest.kt` (NEW)

**WRITE-PROHIBITED:**
- `ios/**` — iOS task is paired
- `tokens/platforms/kotlin/**` — read only
- `react-native/**`

## Code Pattern

**Reference:** Slot-based template with motion-recipe-driven animations.

**Source:** UC-ORG-02 LSMapLayer + UC-ATM-12 LSPhaseIndicator

**Anti-Pattern:** Inlining animation duration/easing literals or enabling chat input.

## Design

**References:**
- `concepts/uc-scr-02-planning.html`
- `concepts/designs.html`
- `.spec/prds/v2/08-uc-scr.md#UC-SCR-02`

**Interaction Notes:**
- Continuous sketch animation; phase indicator pulses active step; chat input disabled.

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

**Rationale:** Compose template orchestrating sketching polyline animation, LSPhaseIndicator, and disabled LSChatInput with LSSpinner; registers as template story.

## Coding Standards

- `brain/docs/kotlin-rules.md`
- `RULES.md §6 ComponentTier`
- `styles/RULES.md`

## Dependencies

**Depends On:** UC-SBX-01-android, UC-SBX-03-android

**Blocks:** UC-SBX-06-android

## TDD Workflow

1. **RED** — Write failing tests for AC-1..AC-6
2. **GREEN** — Implement minimum Compose code
3. **REFACTOR** — Clean
4. **VERIFY** — Run all gates; commit when green

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"Planning composition renders","verify":"ui"},
{"id":"AC-2","type":"acceptance_criterion","description":"activePhase argType re-renders","verify":"ui"},
{"id":"AC-3","type":"acceptance_criterion","description":"Sketch polyline references motion recipe","verify":"unit"},
{"id":"AC-4","type":"acceptance_criterion","description":"Chat input non-interactive","verify":"ui"},
{"id":"AC-5","type":"acceptance_criterion","description":"Light/dark re-resolves tokens","verify":"snapshot"},
{"id":"AC-6","type":"acceptance_criterion","description":"No data-fetching logic","verify":"unit"},
{"id":"TC-1","type":"test_criterion","description":"Default UI test","verify":"ui","maps_to_ac":"AC-1"},
{"id":"TC-2","type":"test_criterion","description":"Parameterized phase UI test","verify":"ui","maps_to_ac":"AC-2"},
{"id":"TC-3","type":"test_criterion","description":"Static motion recipe scan","verify":"unit","maps_to_ac":"AC-3"},
{"id":"TC-4","type":"test_criterion","description":"Input disabled + spinner","verify":"ui","maps_to_ac":"AC-4"},
{"id":"TC-5","type":"test_criterion","description":"Snapshot light + dark","verify":"snapshot","maps_to_ac":"AC-5"},
{"id":"TC-6","type":"test_criterion","description":"Import allow-list","verify":"unit","maps_to_ac":"AC-6"}
]}
-->
