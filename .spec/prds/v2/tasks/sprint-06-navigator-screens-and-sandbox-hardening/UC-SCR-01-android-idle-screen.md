# UC-SCR-01-android: `IdleScreen` — map + greeting overlay + chat input with suggestions — Android Compose

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** kotlin-implementer
**Estimate:** 120 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** M
**PRD Refs:** UC-SCR-01

---

## Background

Render the dormant Navigator IdleScreen on Android with map, greeting overlay (label + opinion-serif headline with italicized "today"), top bar, and chat input with 4 suggestion chips + location badge — fully driven by `IdleMockProvider`.

## Critical Constraints

**MUST:**
- Source ALL visual values from LaneShadowTheme tokens — NEVER hardcode hex/dp/sp literals.
- Register the story via native-sandbox Story API at `tier: ComponentTier.template` with id `templates.idle.default`.
- STRICTLY no live Convex / no data fetching inside the screen — all data comes from `IdleMockProvider`.
- Add the story to `TemplateStories.all` so the sandbox aggregator picks it up.

**NEVER:**
- Edit iOS files or `tokens/platforms/kotlin` generated sources.
- Inline fixture data inside the story or hardcode location strings.

**STRICTLY:**
- Italicize "today" via Compose `AnnotatedString` with italic span.
- Use `MaterialTheme.colorScheme` resolved via LaneShadowTheme bridge.

## Specification

**Objective:** Render the dormant Navigator IdleScreen on Android with map, greeting overlay (label + opinion-serif headline with italicized "today"), top bar, and chat input with 4 suggestion chips + location badge — fully driven by `IdleMockProvider`.

**Success State:** Sandbox story `templates.idle.default` renders end-to-end on Android emulator/device, theme toggling re-resolves all tokens, suggestion chip taps update mock state, and unit tests assert the screen contains no fetch logic.

## Acceptance Criteria

### AC-1 — Idle screen composition renders
- **GIVEN** Sandbox is launched on Android with `templates.idle.default` selected
- **WHEN** The story mounts
- **THEN** `LSTopBar` renders at top, greeting overlay sits immediately below (label "FRIDAY · 68°F · CLEAR" in `typography.ui.label.sm`/`color.signal.default` + headline "Where are we riding today?" in `typography.opinion.xl`/`color.content.primary` with "today" italicized), `LSMap` fills the canvas with favorite pins, and `LSChatInput` is anchored at bottom with 4 chips ("Twisty back roads", "Coastal cruise", "Half-day loop", "Mountain passes") and a location badge ("Near Santa Cruz, CA", "MANUAL")
- **Verify:** Compose UI test asserts presence + textual content of all sub-composables
- **TDD State:** RED

### AC-2 — Suggestion chip tap updates input
- **GIVEN** Idle screen rendered with `IdleMockProvider`
- **WHEN** Developer taps a suggestion chip
- **THEN** `onSuggestionTap(chip)` fires once and `ChatMockProvider` updates input value to the chip label
- **Verify:** Compose UI test taps chip and asserts input field text equals chip label
- **TDD State:** RED

### AC-3 — Trailing icon swap
- **GIVEN** Chat input is empty
- **WHEN** Developer types into the input
- **THEN** Trailing icon swaps from `sliders` to `send`
- **Verify:** Compose UI test types and asserts trailing icon node tag
- **TDD State:** RED

### AC-4 — Hamburger menu callback
- **GIVEN** Idle screen rendered
- **WHEN** Developer taps the hamburger in `LSTopBar`
- **THEN** `onMenuTap` fires (sandbox stub logs "present sessions")
- **Verify:** UI test asserts callback invocation via fake handler
- **TDD State:** RED

### AC-5 — Light/dark token re-resolution
- **GIVEN** Idle screen rendered
- **WHEN** Theme is toggled between light and dark via the sandbox toggle
- **THEN** Map style, glass chrome, greeting text, and chat surface all re-render using LaneShadowTheme tokens
- **Verify:** Snapshot/UI test in both color schemes confirms token values resolve
- **TDD State:** RED

### AC-6 — No data-fetching logic
- **GIVEN** Source code for `IdleScreen.kt`
- **WHEN** Inspected
- **THEN** Contains no Convex client, no networking, no repository — all data injected via `IdleMockProvider`
- **Verify:** Static unit test asserts only mock-provider props on the public composable signature
- **TDD State:** RED

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|----|-----------|------------|--------|------|
| TC-1 | Compose UI test renders `templates.idle.default` and asserts layout + text content | AC-1 | connectedDebugAndroidTest | ui |
| TC-2 | Tapping a suggestion chip updates the chat input value | AC-2 | connectedDebugAndroidTest | ui |
| TC-3 | Typing toggles trailing icon from sliders to send | AC-3 | connectedDebugAndroidTest | ui |
| TC-4 | Hamburger tap invokes onMenuTap callback | AC-4 | connectedDebugAndroidTest | ui |
| TC-5 | Snapshot test renders screen in light + dark and validates token-driven values | AC-5 | testDebugUnitTest | snapshot |
| TC-6 | Static reflection test asserts no Convex/network imports in IdleScreen.kt | AC-6 | testDebugUnitTest | unit |

## Reading List

- `.spec/prds/v2/concepts/uc-scr-01-idle.html` lines `all` — REQUIRED READING — visual design source for this task
- `.spec/prds/v2/08-uc-scr.md` lines `25-49` — UC-SCR-01 spec + ACs
- `.spec/prds/v2/11-technical-requirements.md` lines `all` — Greeting/LocationContext/SuggestionChip schemas
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt` lines `all` — Slot API for map + overlays
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSChatInput.kt` lines `all` — Chat input parameters
- `android/app/src/debug/java/com/laneshadow/sandbox/` lines `all` — Story API + tier aggregators

## Guardrails

**WRITE-ALLOWED:**
- `android/app/src/debug/java/com/laneshadow/sandbox/templates/IdleScreenStory.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt` (NEW)
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/IdleMockProvider.kt` (NEW)
- `android/app/src/test/java/com/laneshadow/ui/templates/IdleScreenTest.kt` (NEW)

**WRITE-PROHIBITED:**
- `ios/**` — iOS task is paired
- `tokens/platforms/kotlin/**` — read only
- `react-native/**`

## Code Pattern

**Reference:** Slot-based template composing LSMapLayer with topBar + topOverlays + bottomOverlays slots.

**Source:** LSMapLayer organism (UC-ORG-02)

**Anti-Pattern:** Embedding suggestion chip data in the screen file or hardcoding location strings.

## Design

**References:**
- `concepts/uc-scr-01-idle.html`
- `concepts/designs.html`
- `.spec/prds/v2/08-uc-scr.md#UC-SCR-01`

**Interaction Notes:**
- Greeting overlay sits below TopBar; ChatInput anchored bottom safe-area; chip tap fills input.

## Verification Gates

| Gate | Command | Expected |
|------|---------|----------|
| lint | `cd android && ./gradlew detekt` | BUILD SUCCESSFUL, zero violations |
| build | `cd android && ./gradlew :app:compileDebugKotlin` | BUILD SUCCESSFUL |
| unit-test | `cd android && ./gradlew :app:testDebugUnitTest` | All tests pass incl. IdleScreenTest |
| compose-ui-test | `cd android && ./gradlew :app:connectedDebugAndroidTest` | All instrumented tests pass |
| tokens | `pnpm tokens:validate` | Tokens validate clean; no untracked literals |

## Agent Assignment

**Agent:** kotlin-implementer

**Rationale:** Android Compose template assembling LSMapLayer + LSTopBar + greeting overlay + LSChatInput; registers into native-sandbox TemplateStories.all via the Story API.

## Coding Standards

- `brain/docs/kotlin-rules.md`
- `RULES.md §6 ComponentTier`
- `styles/RULES.md`

## Dependencies

**Depends On:** UC-SBX-01-android, UC-SBX-03-android

**Blocks:** UC-SBX-06-android

## TDD Workflow

1. **RED** — Write failing Compose UI tests for AC-1..AC-6
2. **GREEN** — Implement minimum Compose code to pass each AC
3. **REFACTOR** — Clean
4. **VERIFY** — Run all gates; commit only when green

---


## Error States (V3 Deferred)

These error states are documented for V3 planning. They are NOT implemented in Sprint 6.

- **Map init failure:** Show `LSInlineErrorCallout` with warn-stripe + recovery message. Map surface falls back to static placeholder. See UC-SCR-06 for canonical error UI pattern.
- **Malformed fixture data:** Sandbox: display empty state with console warning. In production (V3), validate fixture schema and surface descriptive error to user.
- **Animation failure:** Graceful degradation to static render. If motion recipe fails to initialize, render the final frame without animation. No error surface needed.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"Idle screen composition renders","verify":"connectedDebugAndroidTest"},
{"id":"AC-2","type":"acceptance_criterion","description":"Suggestion chip tap updates input","verify":"connectedDebugAndroidTest"},
{"id":"AC-3","type":"acceptance_criterion","description":"Trailing icon swap","verify":"connectedDebugAndroidTest"},
{"id":"AC-4","type":"acceptance_criterion","description":"Hamburger menu callback","verify":"connectedDebugAndroidTest"},
{"id":"AC-5","type":"acceptance_criterion","description":"Light/dark token re-resolution","verify":"snapshot/unit"},
{"id":"AC-6","type":"acceptance_criterion","description":"No data-fetching logic","verify":"static unit"},
{"id":"TC-1","type":"test_criterion","description":"UI test renders + asserts layout","verify":"ui","maps_to_ac":"AC-1"},
{"id":"TC-2","type":"test_criterion","description":"Chip tap updates input value","verify":"ui","maps_to_ac":"AC-2"},
{"id":"TC-3","type":"test_criterion","description":"Trailing icon transitions","verify":"ui","maps_to_ac":"AC-3"},
{"id":"TC-4","type":"test_criterion","description":"Hamburger callback","verify":"ui","maps_to_ac":"AC-4"},
{"id":"TC-5","type":"test_criterion","description":"Snapshot light+dark","verify":"snapshot","maps_to_ac":"AC-5"},
{"id":"TC-6","type":"test_criterion","description":"No Convex/network imports","verify":"unit","maps_to_ac":"AC-6"}
]}
-->
