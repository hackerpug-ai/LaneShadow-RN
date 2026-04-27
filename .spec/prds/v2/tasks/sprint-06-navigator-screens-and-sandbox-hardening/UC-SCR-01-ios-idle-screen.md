# UC-SCR-01-ios: `IdleScreen` — map + greeting overlay + chat input with suggestions — iOS SwiftUI

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** swift-implementer
**Estimate:** 120 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** M
**PRD Refs:** UC-SCR-01

---

## Background

Render the dormant Navigator `IdleScreen` template on iOS as a sandbox story sourced entirely from `IdleMockProvider`. Composes Sprint 5 organisms (`LSMapLayer`, `LSTopBar`, `LSChatInput`) via the native-sandbox `Story` API at `tier: ComponentTier.template`. No live Convex; no networking; tokens-only styling.

## Critical Constraints

**MUST:**
- Register via native-sandbox `Story` API at `tier: .template` and aggregate into `TemplateStories.all` — no ad-hoc preview-only views.
- Source every color/spacing/typography/motion value from `LaneShadowTheme` — STRICTLY no literal hex, RGB, or numeric pt values.
- Inject all data exclusively via `IdleMockProvider` — NEVER call Convex, network, persistence, or real device location.
- Compose only via `LSMapLayer` slots (`map` / `topBar` / `topOverlays` / `bottomOverlays`) — NEVER reach inside organism internals.

**NEVER:**
- Write to Android targets, theme package sources, or `react-native/**`.
- Mutate Sprint-5 organisms under `ios/LaneShadow/Views/Organisms/**`.
- Introduce data-fetching code (Convex, URLSession, CLLocationManager).

**STRICTLY:**
- Story id must be `templates.idle.default` (dotted notation).
- Italicize "today" via `Text` concatenation with `.italic()` on the matching token.

## Specification

**Objective:** Render the dormant Navigator `IdleScreen` template on iOS as a story sourced entirely from `IdleMockProvider`, composing existing organisms via `LSMapLayer` slots.

**Success State:** Reviewer opens Sandbox → Templates → `templates.idle.default` on iPhone 16 simulator and sees `LSTopBar` glass chrome, greeting overlay (label row + opinion-serif headline with italicized "today"), full-screen Copper Studio map with favorite pins, and anchored `LSChatInput` with 4 suggestion chips and "Near Santa Cruz, CA · MANUAL" badge. Light/dark toggle re-renders all chrome; tapping a chip fires `onSuggestionTap`; build/test/lint/token gates green.

## Acceptance Criteria

### AC-1 — Idle composition renders
- **GIVEN** the sandbox app is launched on iPhone 16 simulator
- **WHEN** the reviewer opens story `templates.idle.default`
- **THEN** the screen shows `LSTopBar` at top, greeting overlay (FRIDAY · 68°F · CLEAR label + opinion-serif headline `Where are we riding _today?_` with italicized "today"), full-screen paper-map with favorite pins, and `LSChatInput` anchored at bottom with 4 chips ("Twisty back roads", "Coastal cruise", "Half-day loop", "Mountain passes") plus location badge "Near Santa Cruz, CA · MANUAL"
- **Verify:** Snapshot test `IdleScreenTests.test_default_renders_all_slots` + manual sandbox open
- **TDD State:** RED

### AC-2 — Suggestion tap fires callback
- **GIVEN** the Idle story is rendered
- **WHEN** the reviewer taps the "Coastal cruise" chip
- **THEN** `onSuggestionTap` fires once with that chip and the input value updates to "Coastal cruise" via `ChatMockProvider` binding
- **Verify:** ViewInspector test asserts callback invocation count and updated `@State` value
- **TDD State:** RED

### AC-3 — Trailing icon swap on input
- **GIVEN** the chat input is empty (sliders icon visible in trailing slot)
- **WHEN** the reviewer types any character
- **THEN** the trailing icon swaps from `sliders` to `send` (per LSChatInput contract)
- **Verify:** ViewInspector test on trailing icon identifier before/after typed text
- **TDD State:** RED

### AC-4 — Hamburger stub fires
- **GIVEN** the Idle story is rendered
- **WHEN** the reviewer taps the hamburger icon in `LSTopBar`
- **THEN** the sandbox stub `presentSessions` callback fires once (logged through Story callback log)
- **Verify:** ViewInspector tap test asserts callback count == 1
- **TDD State:** RED

### AC-5 — Light/dark token re-resolution
- **GIVEN** the Idle story is rendered
- **WHEN** the reviewer toggles ThemeController to dark mode
- **THEN** map style, glass chrome, greeting headline, chat surface all re-render using dark-scheme tokens with no hardcoded values
- **Verify:** Snapshot test pair (light + dark) for `templates.idle.default`
- **TDD State:** RED

### AC-6 — No data fetching in template
- **GIVEN** the `IdleScreen` source file
- **WHEN** scanned for forbidden symbols
- **THEN** no references to Convex client, URLSession, CLLocationManager, or async data loaders exist; all data flows in via `IdleMockProvider`
- **Verify:** Static `XCTest` grep assertion in `IdleScreenTests.test_no_data_fetching_symbols`
- **TDD State:** RED

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|----|-----------|------------|--------|------|
| TC-1 | Snapshot of `templates.idle.default` in light mode matches recorded baseline | AC-1 | xcodebuild test snapshot diff | snapshot |
| TC-2 | Tapping suggestion chip increments callback count to exactly 1 with the matching chip payload | AC-2 | ViewInspector unit test | behavioral |
| TC-3 | Trailing icon identifier transitions from `sliders` → `send` when text length > 0 | AC-3 | ViewInspector unit test | behavioral |
| TC-4 | Hamburger tap fires `onMenuTap` exactly once | AC-4 | ViewInspector unit test | behavioral |
| TC-5 | Snapshot in dark mode matches recorded dark baseline | AC-5 | snapshot diff | snapshot |
| TC-6 | Source file contains zero matches for `Convex|URLSession|CLLocationManager|.task` | AC-6 | static grep test | static |

## Reading List

- `.spec/prds/v2/concepts/uc-scr-01-idle.html` lines `all` — REQUIRED READING — visual design source for this task
- `.spec/prds/v2/08-uc-scr.md` lines `25-49` — UC-SCR-01 composition + AC list (verbatim source)
- `.spec/prds/v2/11-technical-requirements.md` lines `188-220` — Story API + MockProvider contract
- `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` lines `all` — Slot API consumed by template
- `ios/LaneShadow/Views/Organisms/LSTopBar.swift` lines `all` — Top bar callbacks
- `ios/LaneShadow/Views/Atoms/LSChatInput.swift` lines `all` — Chat input bindings + suggestion chip API
- `ios/LaneShadow/Sandbox/Stories/Organisms/LSNavigatorMessageStory.swift` lines `1-60` — Pattern for Story registration
- `tokens/platforms/swift/Sources/LaneShadowTheme/` lines `all` — Color/spacing/typography/motion tokens — only token source

## Guardrails

**WRITE-ALLOWED:**
- `ios/LaneShadow/Sandbox/Stories/Templates/IdleScreenStory.swift` (NEW)
- `ios/LaneShadow/Views/Templates/IdleScreen.swift` (NEW)
- `ios/LaneShadow/Sandbox/MockProviders/IdleMockProvider.swift` (NEW)
- `ios/LaneShadow/Sandbox/Stories/Templates/TemplateStories.swift` (CREATE OR MODIFY — register all template story aggregators)
- `ios/LaneShadowTests/Templates/IdleScreenTests.swift` (NEW)

**WRITE-PROHIBITED:**
- `android/**` — Android task is paired
- `tokens/platforms/swift/**` — read only
- `react-native/**` — RN shell retiring
- `ios/LaneShadow/Views/Organisms/**` — Sprint 5 frozen
- `server/convex/**` — no backend coupling

## Code Pattern

**Reference:**
```swift
Story(id: "templates.idle.default", tier: .template, component: "IdleScreen", name: "Default", summary: "...") { _ in
    IdleScreen(provider: IdleMockProvider.default)
}
```

**Source:** `ios/LaneShadow/Sandbox/Stories/Organisms/LSNavigatorMessageStory.swift:1-60`

**Anti-Pattern:** Do NOT inline fixture data inside the story body; do NOT use literal hex colors or numeric padding; do NOT call Convex; do NOT subclass or modify Sprint-5 organisms.

## Design

**References:**
- `concepts/uc-scr-01-idle.html`
- `concepts/designs.html`
- `.spec/prds/v2/08-uc-scr.md#UC-SCR-01`

**Interaction Notes:**
- Greeting overlay positioned in `topOverlays` slot with `spacing.4` top padding under the bar.
- Italicize the word "today" in the headline using `Text` concatenation with `.italic()` on the matching token.
- Suggestion chip taps update `@State` prompt via `ChatMockProvider` binding and fire `onSuggestionTap`.
- Trailing icon swap is owned by `LSChatInput` — template only passes binding.
- Hamburger tap → console log via `print('presentSessions')` AND fires injectable callback for tests.

## Verification Gates

| Gate | Command | Expected |
|------|---------|----------|
| lint | `swiftlint --quiet --strict` | exit 0; zero warnings in new files |
| build | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build` | BUILD SUCCEEDED |
| test | `xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/IdleScreenTests` | all tests pass |
| tokens | `pnpm tokens:validate` | exit 0 |

## Agent Assignment

**Agent:** swift-implementer

**Rationale:** Pure SwiftUI template assembly composing existing Sprint 5 organisms (LSMapLayer, LSTopBar, LSChatInput) via the native-sandbox Story API. No data layer; swift-implementer is the canonical iOS sandbox executor.

## Coding Standards

- `brain/docs/swift-rules.md`
- `RULES.md §6 ComponentTier`
- `styles/RULES.md`

## Dependencies

**Depends On:** UC-SBX-01-ios, UC-SBX-03-ios

**Blocks:** UC-SBX-06-ios

## TDD Workflow

1. **RED** — Write failing tests for AC-1..AC-6 (see Test Criteria table)
2. **GREEN** — Implement minimum SwiftUI code to pass each AC's tests
3. **REFACTOR** — Clean up without breaking tests
4. **VERIFY** — Run all four verification gates; commit only when green

---


## Error States (V3 Deferred)

These error states are documented for V3 planning. They are NOT implemented in Sprint 6.

- **Map init failure:** Show `LSInlineErrorCallout` with warn-stripe + recovery message. Map surface falls back to static placeholder. See UC-SCR-06 for canonical error UI pattern.
- **Malformed fixture data:** Sandbox: display empty state with console warning. In production (V3), validate fixture schema and surface descriptive error to user.
- **Animation failure:** Graceful degradation to static render. If motion recipe fails to initialize, render the final frame without animation. No error surface needed.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"Idle composition renders all six slot elements","verify":"snapshot + manual"},
{"id":"AC-2","type":"acceptance_criterion","description":"Suggestion tap fires callback and updates input value","verify":"ViewInspector"},
{"id":"AC-3","type":"acceptance_criterion","description":"Trailing icon swaps sliders↔send on text change","verify":"ViewInspector"},
{"id":"AC-4","type":"acceptance_criterion","description":"Hamburger tap fires presentSessions stub","verify":"ViewInspector"},
{"id":"AC-5","type":"acceptance_criterion","description":"Light/dark toggle re-resolves all tokens","verify":"snapshot pair"},
{"id":"AC-6","type":"acceptance_criterion","description":"No data-fetching symbols in template source","verify":"static grep"},
{"id":"TC-1","type":"test_criterion","description":"Light snapshot matches baseline","verify":"snapshot","maps_to_ac":"AC-1"},
{"id":"TC-2","type":"test_criterion","description":"Suggestion callback fires once","verify":"unit","maps_to_ac":"AC-2"},
{"id":"TC-3","type":"test_criterion","description":"Icon transitions on text","verify":"unit","maps_to_ac":"AC-3"},
{"id":"TC-4","type":"test_criterion","description":"Menu callback fires once","verify":"unit","maps_to_ac":"AC-4"},
{"id":"TC-5","type":"test_criterion","description":"Dark snapshot matches baseline","verify":"snapshot","maps_to_ac":"AC-5"},
{"id":"TC-6","type":"test_criterion","description":"Static grep finds no fetching symbols","verify":"static","maps_to_ac":"AC-6"}
]}
-->
