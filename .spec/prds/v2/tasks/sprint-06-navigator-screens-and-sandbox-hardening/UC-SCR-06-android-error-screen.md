# UC-SCR-06-android: `ErrorScreen` — map + `LSInlineErrorCallout` + recovery chat — Android Compose

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** kotlin-implementer
**Estimate:** 120 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** M
**PRD Refs:** UC-SCR-06

---

## Background

Render ErrorScreen on Android with map backdrop, LSInlineErrorCallout (warn-stripe + Navigator body + detail + 2 suggestion chips), and recovery chat input.

## Critical Constraints

**MUST:**
- Drive callout warn stripe and chip styling from LaneShadowTheme tokens — NEVER hardcoded.
- Register `templates.error.default` at `tier: ComponentTier.template`.
- STRICTLY no Convex — `ErrorMockProvider` only.
- Add story to `TemplateStories.all`.

**NEVER:**
- Edit iOS or token sources.
- Hardcode warn-stripe color or chip styling.

**STRICTLY:**
- Trailing icon swap mirrors Idle behavior.

## Specification

**Objective:** Render ErrorScreen on Android with map backdrop, LSInlineErrorCallout (warn-stripe + Navigator body + detail + 2 suggestion chips), and recovery chat input.

**Success State:** Story renders callout with chips, suggestion taps fire callbacks, chat input swap behaves like Idle, light/dark re-resolves, no fetch logic.

## Acceptance Criteria

### AC-1 — Error composition renders
- **GIVEN** Sandbox `templates.error.default` selected
- **WHEN** Story mounts
- **THEN** Top bar visible, `LSInlineErrorCallout` shows warn-stripe + compass chip + 'THE NAVIGATOR' label + opinion-serif body "Couldn't stitch that one together — the segment through Lucia looked broken." + muted detail text + 'Try inland' + 'End at Big Sur' suggestion chips; map below; chat input with recovery placeholder "Try again, or let me know what to change…"
- **Verify:** Compose UI test asserts hierarchy + textual content
- **TDD State:** RED

### AC-2 — Suggestion chip callback
- **GIVEN** Callout rendered
- **WHEN** Developer taps a suggestion chip
- **THEN** `onSuggestionTap(chip)` fires exactly once with the tapped chip
- **Verify:** UI test with fake handler
- **TDD State:** RED

### AC-3 — Trailing icon swap on input
- **GIVEN** Chat input empty
- **WHEN** Developer types
- **THEN** Trailing slot swaps from filter/sliders to send (matching Idle behavior)
- **Verify:** UI test asserts trailing node tag swap
- **TDD State:** RED

### AC-4 — Light/dark re-resolves tokens
- **GIVEN** Story rendered
- **WHEN** Theme toggled
- **THEN** Callout warn stripe, glass chrome, suggestion chips all re-resolve
- **Verify:** Snapshot test light + dark
- **TDD State:** RED

### AC-5 — No data-fetching logic
- **GIVEN** Source
- **WHEN** Inspected
- **THEN** No Convex/network — data via `ErrorMockProvider`
- **Verify:** Static unit test
- **TDD State:** RED

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|----|-----------|------------|--------|------|
| TC-1 | UI test asserts callout + chips + chat input composition | AC-1 | connectedDebugAndroidTest | ui |
| TC-2 | UI test asserts suggestion tap callback | AC-2 | connectedDebugAndroidTest | ui |
| TC-3 | UI test asserts trailing icon swap on type | AC-3 | connectedDebugAndroidTest | ui |
| TC-4 | Snapshot test light + dark | AC-4 | testDebugUnitTest | snapshot |
| TC-5 | Import allow-list test | AC-5 | testDebugUnitTest | unit |

## Reading List

- `.spec/prds/v2/concepts/uc-scr-06-error.html` lines `all` — REQUIRED READING — visual design source for this task
- `.spec/prds/v2/08-uc-scr.md` lines `152-172` — UC-SCR-06 spec + ACs
- `.spec/prds/v2/11-technical-requirements.md` lines `all` — NavigatorError + SuggestionChip schemas
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSInlineErrorCallout.kt` lines `all` — Callout API
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSChatInput.kt` lines `all` — Chat input parameters
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt` lines `all` — Slot API

## Guardrails

**WRITE-ALLOWED:**
- `android/app/src/debug/java/com/laneshadow/sandbox/templates/ErrorScreenStory.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/ui/templates/ErrorScreen.kt` (NEW)
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/ErrorMockProvider.kt` (NEW)
- `android/app/src/test/java/com/laneshadow/ui/templates/ErrorScreenTest.kt` (NEW)

**WRITE-PROHIBITED:**
- `ios/**` — iOS task is paired
- `tokens/platforms/kotlin/**` — read only
- `react-native/**`

## Code Pattern

**Reference:** Slot-based template with topOverlay error callout.

**Source:** UC-ORG-02 LSMapLayer + LSInlineErrorCallout organism

**Anti-Pattern:** Hardcoded warn-stripe color or chip styling.

## Design

**References:**
- `concepts/uc-scr-06-error.html`
- `concepts/designs.html`
- `.spec/prds/v2/08-uc-scr.md#UC-SCR-06`

**Interaction Notes:**
- Callout sits under top bar; suggestion chips fire callbacks; chat input recovery placeholder.

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

**Rationale:** Compose template composing map + LSInlineErrorCallout (warn-stripe + suggestion chips) + recovery LSChatInput.

## Coding Standards

- `brain/docs/kotlin-rules.md`
- `RULES.md §6 ComponentTier`
- `styles/RULES.md`

## Dependencies

**Depends On:** UC-SBX-01-android, UC-SBX-03-android

**Blocks:** UC-SBX-06-android

## TDD Workflow

1. **RED** — Write failing tests for AC-1..AC-5
2. **GREEN** — Implement Compose code
3. **REFACTOR** — Clean
4. **VERIFY** — Run all gates; commit when green

---


## Error States (V3 Deferred)

These error states are documented for V3 planning. They are NOT implemented in Sprint 6.

- **Map init failure:** Show `LSInlineErrorCallout` with warn-stripe + recovery message. Map surface falls back to static placeholder. See UC-SCR-06 for canonical error UI pattern.
- **Malformed fixture data:** Sandbox: display empty state with console warning. In production (V3), validate fixture schema and surface descriptive error to user.
- **Animation failure:** Graceful degradation to static render. If motion recipe fails to initialize, render the final frame without animation. No error surface needed.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"Error composition renders","verify":"ui"},
{"id":"AC-2","type":"acceptance_criterion","description":"Suggestion chip callback","verify":"ui"},
{"id":"AC-3","type":"acceptance_criterion","description":"Trailing icon swap","verify":"ui"},
{"id":"AC-4","type":"acceptance_criterion","description":"Light/dark re-resolves","verify":"snapshot"},
{"id":"AC-5","type":"acceptance_criterion","description":"No data fetching","verify":"unit"},
{"id":"TC-1","type":"test_criterion","description":"Callout + chips + input","verify":"ui","maps_to_ac":"AC-1"},
{"id":"TC-2","type":"test_criterion","description":"Suggestion callback","verify":"ui","maps_to_ac":"AC-2"},
{"id":"TC-3","type":"test_criterion","description":"Trailing icon swap","verify":"ui","maps_to_ac":"AC-3"},
{"id":"TC-4","type":"test_criterion","description":"Snapshot light+dark","verify":"snapshot","maps_to_ac":"AC-4"},
{"id":"TC-5","type":"test_criterion","description":"Import allow-list","verify":"unit","maps_to_ac":"AC-5"}
]}
-->
