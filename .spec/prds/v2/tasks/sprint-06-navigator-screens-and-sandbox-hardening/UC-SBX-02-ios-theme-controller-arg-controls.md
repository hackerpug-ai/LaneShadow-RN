# UC-SBX-02-ios: Theme controller + light/dark toggle + `argTypes` controls (finalize) — iOS

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** swift-implementer
**Estimate:** 180 min
**Type:** INFRA
**Status:** Backlog
**Priority:** P0
**Effort:** M
**PRD Refs:** UC-SBX-02

---

## Background

Finalize the LaneShadow theme controller bridging native-sandbox's `ThemeMode` into `LaneShadowTheme.ThemeMode` and ship host-side argType control widgets (text, select, toggle, number, color-token) wired through `ArgValues` so every story can declare `argTypes` and get live-editable controls in the sandbox inspector.

## Critical Constraints

**MUST:**
- `LaneShadowSandboxThemeController` MUST conform to `NativeSandbox.ThemeController` and `ObservableObject`, bridging `ThemeMode` (light/dark/auto) into `LaneShadowTheme.ThemeMode`.
- Theme toggle MUST be exposed via the native-sandbox top bar (no custom host top bar) and live re-render every visible story within one frame.
- argTypes wiring MUST support `.text`, `.select`, `.toggle`, `.number`, `.colorToken(group:)` per RULES §10 — host-side rendering only.
- The `.colorToken(group:)` control MUST resolve token groups from `LaneShadowTheme` at runtime and live-swap the rendered atom/molecule on selection change.
- Theme controller state MUST be scoped to the sandbox preview wrapper — toggling sandbox theme MUST NOT mutate the host app's theme when the app is run normally.

**NEVER:**
- Extend native-sandbox's `ArgType` enum or `ThemeController` protocol — host-side wiring only.
- Persist sandbox theme selection into shared app preferences (sandbox is debug-only state).
- Hardcode color hex values in control widgets — every color must come from `LaneShadowTheme` token groups.
- Touch any path under `android/**`, `react-native/**`, or `tokens/platforms/swift/Sources/LaneShadowTheme/**`.
- Modify `~/Projects/native-sandbox/**`.

**STRICTLY:**
- Re-render latency on theme toggle ≤ 1 frame (16ms) measured by Combine/SwiftUI snapshot.
- argType control changes propagate via `ArgValues` updates; the story `render(args)` closure receives the new values without app relaunch.
- `infrastructure.theme.controller` story registered under `InfrastructureStories.all` to self-document the bridge.

## Specification

**Objective:** Finalize the LaneShadow theme controller bridging native-sandbox's `ThemeMode` into `LaneShadowTheme.ThemeMode` and ship host-side argType control widgets wired through `ArgValues`.

**Success State:** Toggling light/dark/auto in the sandbox top bar live re-renders every visible story; declaring `.colorToken(group: "color.action")` on a story produces a working dropdown that swaps the rendered token; argType edits propagate within one frame; the host app's theme is unaffected when launched outside sandbox.

## Acceptance Criteria

### AC-1 — Theme controller bridge
- **GIVEN** A developer opens `ios/LaneShadow/Sandbox/Theme/LaneShadowSandboxThemeController.swift`
- **WHEN** They inspect the type declaration
- **THEN** They find `final class LaneShadowSandboxThemeController: ObservableObject, NativeSandbox.ThemeController` with a `@Published var themeMode: NativeSandbox.ThemeMode` and a derived `var hostThemeMode: LaneShadowTheme.ThemeMode` mapping `.light`/`.dark`/`.auto` correctly
- **Verify:** Read the file; confirm protocol conformance and bridge mapping
- **TDD State:** RED

### AC-2 — Live theme toggle re-renders stories
- **GIVEN** The developer launches `pnpm sandbox:ios` and selects any story
- **WHEN** They toggle the theme between light/dark/auto via the sandbox top bar
- **THEN** The currently visible story re-renders with the new theme variant within one frame; subsequent story selections continue using the toggled theme
- **Verify:** Manual sandbox launch + visual confirmation; snapshot test capturing same story in light vs dark
- **TDD State:** RED

### AC-3 — Standard argType controls render
- **GIVEN** A story declares `argTypes` containing `.text`, `.select`, `.toggle`, `.number` entries
- **WHEN** The developer opens that story in the sandbox
- **THEN** The inspector pane renders a text field (text), dropdown (select), toggle switch (toggle), and stepper (number) bound to the corresponding `ArgValues` keys; edits update the rendered story within one frame
- **Verify:** Add a fixture story `infrastructure.controls.demo` exercising all four; visually verify in sandbox; unit test asserts widget mapping
- **TDD State:** RED

### AC-4 — color-token control swaps live
- **GIVEN** A story declares `.colorToken(group: "color.action")`
- **WHEN** The developer opens the story and changes the dropdown selection
- **THEN** The dropdown lists every token in `color.action` from `LaneShadowTheme`; selecting a different token live-swaps the rendered atom/molecule's color within one frame
- **Verify:** Fixture story `infrastructure.controls.color-token` with a button atom; sandbox manual verification + unit test that token group resolves to expected count
- **TDD State:** RED

### AC-5 — Theme scoped to sandbox
- **GIVEN** The developer runs the host app via the main scheme (not sandbox scheme)
- **WHEN** The app launches
- **THEN** The host app's theme follows the system/host preference; no leakage from any sandbox theme controller state
- **Verify:** Run `xcodebuild ... build` with the main scheme; launch app; verify theme respects system; static analysis confirms `LaneShadowSandboxThemeController` is not referenced outside `ios/LaneShadow/Sandbox/**`
- **TDD State:** RED

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|----|-----------|------------|--------|------|
| TC-1 | ThemeController bridge maps all three modes correctly | AC-1 | Unit test in `ios/LaneShadowTests/Sandbox/ThemeControllerTests.swift` asserts mapping for `.light`, `.dark`, `.auto` | unit |
| TC-2 | Toggling themeMode publishes a new value to subscribers | AC-2 | Combine sink test; assert publisher emits within one runloop tick | unit |
| TC-3 | Each ArgType resolves to the expected SwiftUI control type | AC-3 | ViewInspector test on the inspector pane host view; assert TextField/Picker/Toggle/Stepper presence | unit |
| TC-4 | colorToken group resolves to the LaneShadowTheme token list | AC-4 | Unit test calls token-group resolver for `color.action`; asserts non-empty result equal to theme metadata | unit |
| TC-5 | Sandbox controller has zero references outside Sandbox/ | AC-5 | Grep test asserts `LaneShadowSandboxThemeController` only appears under `ios/LaneShadow/Sandbox/**` and `ios/LaneShadowTests/Sandbox/**` | static |

## Reading List

- `.spec/prds/v2/09-uc-sbx.md` lines `38-49` — UC-SBX-02 acceptance criteria — bridge, live toggle, argType controls, color-token control, scoping
- `.spec/prds/v2/11-technical-requirements.md` lines `all` — ThemeController + ArgType protocol shape from native-sandbox
- `concepts/designs.html` lines `all` — REQUIRED READING — visual design source for this task
- `ios/LaneShadow/Sandbox/Theme/LaneShadowThemeController.swift` lines `all` — Existing partial controller — must be renamed/finalized to `LaneShadowSandboxThemeController` per PRD
- `ios/LaneShadow/Sandbox/Theme/LaneShadowPreviewWrapper.swift` lines `all` — Preview wrapper that applies `.laneShadowTheme()` — must consume controller state
- `tokens/platforms/swift/Sources/LaneShadowTheme/` lines `all` — READ-ONLY — token group sources for color-token control
- `~/Projects/native-sandbox/ios/Sources/NativeSandbox/Theming/` lines `all` — READ-ONLY — `ThemeController` protocol contract
- `~/Projects/native-sandbox/ios/Sources/NativeSandbox/Model/` lines `all` — READ-ONLY — `ArgType`, `ArgValues` shapes
- `RULES.md` lines `§10` — argTypes contract: text/select/toggle/number/color-token

## Guardrails

**WRITE-ALLOWED:**
- `ios/LaneShadow/Sandbox/Theme/LaneShadowSandboxThemeController.swift`
- `ios/LaneShadow/Sandbox/Theme/LaneShadowPreviewWrapper.swift`
- `ios/LaneShadow/Sandbox/Controls/**`
- `ios/LaneShadow/Sandbox/Stories/Infrastructure/**`
- `ios/LaneShadow/Sandbox/LaneShadowSandboxEntry.swift`
- `ios/LaneShadow/Sandbox/Stories/InfrastructureStories.swift`
- `ios/LaneShadowTests/Sandbox/ThemeControllerTests.swift`
- `ios/LaneShadowTests/Sandbox/ArgControlsTests.swift`

**WRITE-PROHIBITED:**
- `android/**`
- `react-native/**`
- `tokens/platforms/swift/Sources/LaneShadowTheme/**` — read only
- `~/Projects/native-sandbox/**` — external dep

## Code Pattern

**Reference:** ObservableObject bridge + protocol conformance to native-sandbox `ThemeController`; argType-to-SwiftUI control mapping table.

**Source:** PRD UC-SBX-02; native-sandbox `ThemeController` protocol; RULES §10 argTypes spec.

**Anti-Pattern:** Maintaining two parallel theme states (host + sandbox) instead of bridging; rendering controls via custom host top bar; persisting sandbox state into app preferences.

## Design

**References:**
- `concepts/designs.html`
- `.spec/prds/v2/09-uc-sbx.md#UC-SBX-02`

**Interaction Notes:**
- Top bar in native-sandbox shows a segmented control for Light/Dark/Auto.
- Inspector pane shows one row per declared argType.
- color-token dropdown shows token name + a small swatch fill.

## Verification Gates

| Gate | Command | Expected |
|------|---------|----------|
| lint | `swiftlint --quiet --strict` | Zero warnings, zero errors |
| build | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build` | BUILD SUCCEEDED |
| unit-tests | `xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` | ThemeControllerTests + ArgControlsTests pass |
| sandbox-launch | `pnpm sandbox:ios` | Theme toggle visible in top bar; toggling re-renders selected story; argType controls render correctly |

## Agent Assignment

**Agent:** swift-implementer

**Rationale:** Bridges native-sandbox `ThemeController` protocol into LaneShadow's `LaneShadowTheme.ThemeMode` and wires host-side `argTypes` controls (text/select/toggle/number/color-token). All work lives under `ios/LaneShadow/Sandbox/Theme/**` — pure SwiftUI/Combine glue owned by swift-implementer.

## Coding Standards

- `brain/docs/swift-rules.md`
- `RULES.md §6 ComponentTier`
- `RULES.md §10 args`

## Dependencies

**Depends On:** UC-SBX-01-ios

**Blocks:** UC-SCR-01-ios, UC-SCR-02-ios, UC-SCR-03-ios, UC-SCR-04-ios, UC-SCR-05-ios, UC-SCR-06-ios

## TDD Workflow

1. **RED** — Write ThemeControllerTests + ArgControlsTests asserting mapping and widget mapping
2. **GREEN** — Implement controller + control widgets
3. **REFACTOR** — Clean
4. **VERIFY** — Run all gates; commit when green

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"Theme controller bridge","verify":"file inspect"},
{"id":"AC-2","type":"acceptance_criterion","description":"Live theme toggle re-renders stories","verify":"manual + snapshot"},
{"id":"AC-3","type":"acceptance_criterion","description":"Standard argType controls render","verify":"unit + manual"},
{"id":"AC-4","type":"acceptance_criterion","description":"color-token control swaps live","verify":"unit + manual"},
{"id":"AC-5","type":"acceptance_criterion","description":"Theme scoped to sandbox","verify":"static + manual"},
{"id":"TC-1","type":"test_criterion","description":"Bridge mapping for all 3 modes","verify":"unit","maps_to_ac":"AC-1"},
{"id":"TC-2","type":"test_criterion","description":"Toggle publishes within tick","verify":"unit","maps_to_ac":"AC-2"},
{"id":"TC-3","type":"test_criterion","description":"ArgType→widget mapping","verify":"unit","maps_to_ac":"AC-3"},
{"id":"TC-4","type":"test_criterion","description":"Token group resolves","verify":"unit","maps_to_ac":"AC-4"},
{"id":"TC-5","type":"test_criterion","description":"No leakage outside Sandbox/","verify":"static","maps_to_ac":"AC-5"}
]}
-->
