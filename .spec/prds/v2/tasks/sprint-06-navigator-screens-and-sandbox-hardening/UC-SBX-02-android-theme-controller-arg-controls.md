# UC-SBX-02-android: Theme controller + light/dark toggle + `argTypes` controls (finalize) — Android

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** kotlin-implementer
**Estimate:** 180 min
**Type:** INFRA
**Status:** Backlog
**Priority:** P0
**Effort:** M
**PRD Refs:** UC-SBX-02

---

## Background

Finalize Android theme bridging and argTypes control rendering — top-bar light/dark/auto toggle live-rerenders every story; inspector renders text/select/toggle/number/color-token controls per story declaration.

## Critical Constraints

**MUST:**
- Implement `LaneShadowSandboxThemeController` as a Compose-aware bridge mapping native-sandbox `ThemeMode` (.auto/.alwaysLight/.alwaysDark) into host `LaneShadowTheme.ThemeMode`.
- Re-render every visible story when toggle changes, within one frame, with no app relaunch.
- Wire host-side `argTypes` controls: text → TextField, select → DropdownMenu, toggle → Switch, number → Stepper/NumberField, color-token → token-group dropdown.
- `color-token` control MUST list every token in the named TOK group from the generated `Tokens.kt`.
- Theme controller scope MUST be the sandbox preview wrapper only — never leak into main-app theme.

**NEVER:**
- Extend native-sandbox ArgType primitives — host wires UI only (RULES §10).
- Read tokens via reflection from outside `tokens/platforms/kotlin/.../generated/`.
- Persist theme state outside the sandbox process.
- Wrap the main `LaneShadowApp` composable with the sandbox theme controller.
- Use `isSystemInDarkTheme()` outside the controller bridge — host stories consume LaneShadowTheme.

**STRICTLY:**
- Route all color reads through `MaterialTheme.colorScheme` / LaneShadowTheme tokens — no `Color(0xFF...)` literals.
- Scope theme overrides via `CompositionLocalProvider` inside the sandbox preview wrapper.
- Recompose downstream stories on state change via `mutableStateOf` + Compose snapshots (no manual invalidation).

## Specification

**Objective:** Finalize Android theme bridging and argTypes control rendering — top-bar light/dark/auto toggle live-rerenders every story; inspector renders text/select/toggle/number/color-token controls per story declaration.

**Success State:** Toggling theme in the sandbox top bar instantly switches every visible story between light/dark; declaring `argTypes` on a story produces correct interactive controls in the inspector pane; main app launched normally is unaffected by sandbox theme state.

## Acceptance Criteria

### AC-1 — Theme controller bridge
- **GIVEN** Developer opens `android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowSandboxThemeController.kt`
- **WHEN** They inspect the class
- **THEN** They find a `LaneShadowSandboxThemeController` implementing native-sandbox `ThemeController` whose `themeMode` state bridges into Compose `isSystemInDarkTheme` + host `LaneShadowTheme.ThemeMode`
- **Verify:** Compile + unit test asserts mapping table for all three modes
- **TDD State:** RED

### AC-2 — Live theme toggle
- **GIVEN** Developer launches `/native-sandbox --platform android` and opens any story
- **WHEN** They tap the light/dark/auto toggle in the sandbox top bar
- **THEN** Every visible story re-renders with the corresponding theme variant within one frame, no relaunch
- **Verify:** Manual smoke; Compose UI test toggles state and asserts colorScheme switch on a probe composable
- **TDD State:** RED

### AC-3 — Standard argType controls render
- **GIVEN** Developer opens a story declaring `argTypes` of `text`, `select`, `toggle`, and `number`
- **WHEN** They view the inspector pane
- **THEN** They see a TextField (text), DropdownMenu (select), Switch (toggle), and stepper (number) for each respective control
- **Verify:** Compose UI test using `createComposeRule` finds each widget by tag in a fixture story
- **TDD State:** RED

### AC-4 — color-token control
- **GIVEN** A story declares `argTypes = listOf(ArgType("tint", control = ColorToken(group = "color.action")))`
- **WHEN** Developer opens the story and changes the dropdown selection
- **THEN** Dropdown lists every token in `color.action` group from generated `Tokens.kt`; story re-renders live with the swapped token
- **Verify:** Compose UI test asserts dropdown options match `Tokens.colorAction.*` keys; selection changes recomposition output
- **TDD State:** RED

### AC-5 — Sandbox theme does not leak
- **GIVEN** Developer runs the main app (release variant, not the sandbox debug variant)
- **WHEN** They observe theme behavior
- **THEN** Theme follows system dark mode normally — sandbox controller code is excluded from the main variant and never registered in production composition
- **Verify:** Confirm `LaneShadowSandboxThemeController.kt` lives under `app/src/debug/`; release variant build does not reference it (`./gradlew :app:assembleRelease` succeeds)
- **TDD State:** RED

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|----|-----------|------------|--------|------|
| TC-1 | Mapping (.auto, system=dark) → LaneShadowTheme.Dark; (.alwaysLight) → Light; (.alwaysDark) → Dark | AC-1 | JUnit parametric test | unit |
| TC-2 | Toggling theme state recomposes a probe story's colorScheme | AC-2 | Compose UI test with createComposeRule | instrumented |
| TC-3 | Inspector renders one widget per ArgType variant in a fixture story | AC-3 | Compose UI test with semantics assertions | instrumented |
| TC-4 | ColorToken dropdown options exactly equal the keys of the named token group | AC-4 | Compose UI test compares dropdown labels to `Tokens.colorAction` map | instrumented |
| TC-5 | Release variant does not link sandbox theme controller | AC-5 | `./gradlew :app:assembleRelease` succeeds with no debug-only references | build |

## Reading List

- `concepts/designs.html` lines `1-end` — REQUIRED READING — visual design source for this task
- `.spec/prds/v2/09-uc-sbx.md` lines `38-50` — UC-SBX-02 acceptance criteria verbatim
- `.spec/prds/v2/11-technical-requirements.md` lines `200-215` — ThemeController API + Story args contract
- `android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowSandboxThemeController.kt` lines `1-end` — Existing partial controller to finalize
- `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/` lines `all` — Tokens.kt — source of color token groups (READ ONLY)
- `ios/LaneShadow/Sandbox/LaneShadowSandboxThemeController.swift` lines `1-end` — iOS reference for parity bridge semantics
- `RULES.md` lines `1-end` — §10 args policy — host wires control widgets only

## Guardrails

**WRITE-ALLOWED:**
- `android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowSandboxThemeController.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/argcontrols/**` (TextArgControl, SelectArgControl, ToggleArgControl, NumberArgControl, ColorTokenArgControl composables)
- `android/app/src/debug/java/com/laneshadow/sandbox/SandboxPreviewWrapper.kt`
- `android/app/src/test/java/com/laneshadow/sandbox/**`
- `android/app/src/androidTest/java/com/laneshadow/sandbox/**`

**WRITE-PROHIBITED:**
- `ios/**`
- `react-native/**`
- `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/**` — read only
- native-sandbox library — external dep
- `android/app/src/main/**` — sandbox is debug-variant only

## Code Pattern

**Reference:** Compose CompositionLocalProvider scoped to the SandboxPreviewWrapper composable; argType state held via `remember { mutableStateOf(...) }` and passed into the story content lambda.

**Source:** `.spec/prds/v2/09-uc-sbx.md#UC-SBX-02`

**Anti-Pattern:** Mutating `LaneShadowTheme` global state, hardcoding hex colors, or reading tokens via reflection from main-variant sources.

## Design

**References:**
- `concepts/designs.html`
- `.spec/prds/v2/09-uc-sbx.md#UC-SBX-02`

**Interaction Notes:**
- Top-bar toggle cycles auto → light → dark; inspector pane shows control widgets directly under story title; color-token dropdown shows hex swatch next to each token name.

## Verification Gates

| Gate | Command | Expected |
|------|---------|----------|
| lint | `cd android && ./gradlew detekt` | 0 violations |
| build | `cd android && ./gradlew :app:compileDebugKotlin` | BUILD SUCCESSFUL |
| release-build | `cd android && ./gradlew :app:assembleRelease` | BUILD SUCCESSFUL — sandbox controller absent from release graph |
| unit-test | `cd android && ./gradlew :app:testDebugUnitTest` | Theme mapping tests pass |
| instrumented-test | `cd android && ./gradlew :app:connectedDebugAndroidTest` | Toggle + arg control tests pass |

## Agent Assignment

**Agent:** kotlin-implementer

**Rationale:** Compose-specific bridging of native-sandbox ThemeMode into LaneShadowTheme via MaterialTheme + isSystemInDarkTheme; argTypes wiring to Compose state. Pure host-side Kotlin.

## Coding Standards

- `brain/docs/kotlin-rules.md`
- `RULES.md §6 ComponentTier`
- `RULES.md §10 args`

## Dependencies

**Depends On:** UC-SBX-01-android

**Blocks:** UC-SCR-01-android, UC-SCR-02-android, UC-SCR-03-android, UC-SCR-04-android, UC-SCR-05-android, UC-SCR-06-android

## TDD Workflow

1. **RED** — Write theme mapping + arg control tests
2. **GREEN** — Implement controller + control composables
3. **REFACTOR** — Clean
4. **VERIFY** — Run all gates; commit when green

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"Theme controller bridge","verify":"unit"},
{"id":"AC-2","type":"acceptance_criterion","description":"Live theme toggle","verify":"instrumented"},
{"id":"AC-3","type":"acceptance_criterion","description":"Standard argType controls render","verify":"instrumented"},
{"id":"AC-4","type":"acceptance_criterion","description":"color-token control","verify":"instrumented"},
{"id":"AC-5","type":"acceptance_criterion","description":"Sandbox theme does not leak","verify":"build"},
{"id":"TC-1","type":"test_criterion","description":"3-mode mapping","verify":"unit","maps_to_ac":"AC-1"},
{"id":"TC-2","type":"test_criterion","description":"Toggle recomposes probe","verify":"instrumented","maps_to_ac":"AC-2"},
{"id":"TC-3","type":"test_criterion","description":"Widget per ArgType","verify":"instrumented","maps_to_ac":"AC-3"},
{"id":"TC-4","type":"test_criterion","description":"ColorToken dropdown options","verify":"instrumented","maps_to_ac":"AC-4"},
{"id":"TC-5","type":"test_criterion","description":"Release build no sandbox refs","verify":"build","maps_to_ac":"AC-5"}
]}
-->
