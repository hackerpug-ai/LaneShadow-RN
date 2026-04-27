# UC-SCR-02-ios: `PlanningScreen` — sketching polyline + phase indicator + thinking chat — iOS SwiftUI

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** swift-implementer
**Estimate:** 180 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** L
**PRD Refs:** UC-SCR-02

---

## Background

Render the thinking-state `PlanningScreen` template on iOS, animating the sketching polyline and pulsing active phase via motion recipes, sourced from `PlanningMockProvider`. Composition: top bar + `LSPhaseIndicator` (5 steps, one active pulsing) + sketching polyline on map + disabled `LSChatInput` with `LSSpinner` in trailing slot.

## Critical Constraints

**MUST:**
- Drive sketching polyline + phase pulse from `motion.recipe.sketchPolylineLoop` and `motion.recipe.phaseDotPulse` — NEVER hardcode duration or easing.
- Register via `Story` API at `tier: .template` and aggregate into `TemplateStories.all`.
- Source all visual values from `LaneShadowTheme` — STRICTLY no literal hex/pt.
- Expose phase variant via Story `argTypes` so reviewer can step through active phases.

**NEVER:**
- Call Convex/network/timers outside motion recipe.
- Mutate Sprint-5 organisms.
- Make ChatInput interactive in this template (`isThinking: true`).

**STRICTLY:**
- Story id `templates.planning.default`; argType `activePhase: IntRange(1...5)`.
- ChatInput trailing slot must contain `LSSpinner`, not the send button.

## Specification

**Objective:** Render the thinking-state `PlanningScreen` template on iOS, animating the sketching polyline and pulsing active phase via motion recipes, sourced from `PlanningMockProvider`.

**Success State:** Reviewer opens `templates.planning.phaseN` variants and sees: top bar, `LSPhaseIndicator` with 5 steps with the active step pulsing, sketching polyline animating continuously on the map, `LSChatInput` filled with prompt and `LSSpinner` in trailing slot. Switching argType updates active phase. All gates green.

## Acceptance Criteria

### AC-1 — Planning composition renders
- **GIVEN** sandbox launched on iPhone 16
- **WHEN** reviewer opens `templates.planning.default`
- **THEN** screen shows top bar, `LSPhaseIndicator` with 5 labeled steps and one active (pulsing ring via `motion.recipe.phaseDotPulse`), map with sketching polyline animation, chat input at bottom with filled prompt text and `LSSpinner` in trailing slot
- **Verify:** snapshot + manual
- **TDD State:** RED

### AC-2 — Phase argType drives indicator
- **GIVEN** the planning story is rendered
- **WHEN** reviewer changes the `activePhase` argType from 1 → 3
- **THEN** `LSPhaseIndicator` re-renders with phase 3 pulsing, phases 1–2 marked `done`
- **Verify:** ViewInspector test instantiating story with each variant
- **TDD State:** RED

### AC-3 — Sketch animation is recipe-driven
- **GIVEN** the planning template source
- **WHEN** scanned for animation declaration
- **THEN** the sketching polyline animation references `LaneShadowTheme.motion.recipe.sketchPolylineLoop` and is set to repeat forever — no literal duration/easing
- **Verify:** static grep test + ViewInspector animation introspection
- **TDD State:** RED

### AC-4 — Chat input is non-interactive
- **GIVEN** the planning story is rendered
- **WHEN** reviewer attempts to focus and type in the input
- **THEN** input is disabled (`isThinking: true`); send button is replaced by `LSSpinner`; no text changes commit
- **Verify:** ViewInspector disabled-state assertion + spinner presence
- **TDD State:** RED

### AC-5 — Light/dark token re-resolution
- **GIVEN** the planning story is rendered
- **WHEN** reviewer toggles dark mode
- **THEN** map style, phase indicator chrome, chat surface, and spinner all re-render using dark-scheme tokens
- **Verify:** snapshot pair
- **TDD State:** RED

### AC-6 — No data fetching in template
- **GIVEN** the `PlanningScreen` source file
- **WHEN** scanned
- **THEN** all data arrives via `PlanningMockProvider` — no Convex/URLSession/Task fetchers
- **Verify:** static grep test
- **TDD State:** RED

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|----|-----------|------------|--------|------|
| TC-1 | Snapshot of default planning variant matches baseline | AC-1 | snapshot | snapshot |
| TC-2 | Phase argType variants 1–5 each render with correct active index | AC-2 | parameterized ViewInspector | behavioral |
| TC-3 | Source contains `motion.recipe.sketchPolylineLoop` and zero literal `Animation.linear(duration:` for the sketch | AC-3 | static grep | static |
| TC-4 | Chat input is disabled and trailing slot contains LSSpinner | AC-4 | ViewInspector | behavioral |
| TC-5 | Dark snapshot matches baseline | AC-5 | snapshot | snapshot |
| TC-6 | Static grep finds no Convex/URLSession/.task in template | AC-6 | static | static |

## Reading List

- `.spec/prds/v2/concepts/uc-scr-02-planning.html` lines `all` — REQUIRED READING — visual design source for this task
- `.spec/prds/v2/08-uc-scr.md` lines `52-73` — UC-SCR-02 composition + AC list
- `.spec/prds/v2/11-technical-requirements.md` lines `188-220` — Story API contract
- `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` lines `all` — Slot composition + sketching polyline overlay path
- `ios/LaneShadow/Views/Molecules/` lines `all` — LSPhaseIndicator molecule API
- `ios/LaneShadow/Views/Atoms/LSChatInput.swift` lines `all` — isThinking branch + spinner trailing
- `tokens/platforms/swift/Sources/LaneShadowTheme/` lines `all` — motion.recipe.sketchPolylineLoop + phaseDotPulse

## Guardrails

**WRITE-ALLOWED:**
- `ios/LaneShadow/Sandbox/Stories/Templates/PlanningScreenStory.swift` (NEW)
- `ios/LaneShadow/Views/Templates/PlanningScreen.swift` (NEW)
- `ios/LaneShadow/Sandbox/MockProviders/PlanningMockProvider.swift` (NEW)
- `ios/LaneShadow/Sandbox/Stories/Templates/TemplateStories.swift` (MODIFY — append)
- `ios/LaneShadowTests/Templates/PlanningScreenTests.swift` (NEW)

**WRITE-PROHIBITED:**
- `android/**` — Android task is paired
- `tokens/platforms/swift/**` — read only
- `react-native/**` — retiring
- `ios/LaneShadow/Views/Organisms/**` — Sprint 5 frozen

## Code Pattern

**Reference:**
```swift
Story(id: "templates.planning.default", tier: .template, component: "PlanningScreen",
      name: "Default — Phase 2", summary: "...",
      argTypes: ["activePhase": .intRange(1, 5)]) { args in
    PlanningScreen(provider: PlanningMockProvider(activePhase: args.int("activePhase") ?? 2))
}
```

**Source:** `ios/LaneShadow/Sandbox/Stories/Organisms/LSNavigatorMessageStory.swift:1-60`

**Anti-Pattern:** Do NOT hardcode `Animation.linear(duration: 1.5)`; do NOT bypass LSMapLayer slots; do NOT make ChatInput interactive in this template.

## Design

**References:**
- `concepts/uc-scr-02-planning.html`
- `concepts/designs.html`
- `.spec/prds/v2/08-uc-scr.md#UC-SCR-02`

**Interaction Notes:**
- Sketching polyline rendered as overlay atom above map tiles using `motion.recipe.sketchPolylineLoop` (repeatForever, autoreverses per recipe spec).
- Phase indicator placed in `topOverlays` slot under top bar with header "Let me think on that…".
- ChatInput receives `isThinking: true`; trailing slot becomes `LSSpinner`.
- Story exposes `argTypes: ["activePhase": IntEnum(1...5)]` so reviewer can step through.

## Verification Gates

| Gate | Command | Expected |
|------|---------|----------|
| lint | `swiftlint --quiet --strict` | exit 0 |
| build | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build` | BUILD SUCCEEDED |
| test | `xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/PlanningScreenTests` | all tests pass |
| tokens | `pnpm tokens:validate` | exit 0 |

## Agent Assignment

**Agent:** swift-implementer

**Rationale:** Template assembly with motion-recipe driven animation (`sketchPolylineLoop`, `phaseDotPulse`) and disabled-input state; swift-implementer owns SwiftUI motion + Story registration patterns.

## Coding Standards

- `brain/docs/swift-rules.md`
- `RULES.md §6 ComponentTier`
- `styles/RULES.md`

## Dependencies

**Depends On:** UC-SBX-01-ios, UC-SBX-03-ios

**Blocks:** UC-SBX-06-ios

## TDD Workflow

1. **RED** — Write failing tests for AC-1..AC-6
2. **GREEN** — Implement minimum SwiftUI code to pass each AC
3. **REFACTOR** — Clean without breaking tests
4. **VERIFY** — Run all four gates; commit only when green

---


## Error States (V3 Deferred)

These error states are documented for V3 planning. They are NOT implemented in Sprint 6.

- **Map init failure:** Show `LSInlineErrorCallout` with warn-stripe + recovery message. Map surface falls back to static placeholder. See UC-SCR-06 for canonical error UI pattern.
- **Malformed fixture data:** Sandbox: display empty state with console warning. In production (V3), validate fixture schema and surface descriptive error to user.
- **Animation failure:** Graceful degradation to static render. If motion recipe fails to initialize, render the final frame without animation. No error surface needed.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"Planning composition renders all slots","verify":"snapshot"},
{"id":"AC-2","type":"acceptance_criterion","description":"Phase argType drives indicator","verify":"unit"},
{"id":"AC-3","type":"acceptance_criterion","description":"Sketch animation recipe-driven","verify":"grep + introspection"},
{"id":"AC-4","type":"acceptance_criterion","description":"Chat input non-interactive with spinner","verify":"unit"},
{"id":"AC-5","type":"acceptance_criterion","description":"Light/dark re-resolve","verify":"snapshot pair"},
{"id":"AC-6","type":"acceptance_criterion","description":"No data fetching","verify":"grep"},
{"id":"TC-1","type":"test_criterion","description":"Default snapshot matches","verify":"snapshot","maps_to_ac":"AC-1"},
{"id":"TC-2","type":"test_criterion","description":"All 5 phase variants render correctly","verify":"unit","maps_to_ac":"AC-2"},
{"id":"TC-3","type":"test_criterion","description":"Recipe used; no literal duration","verify":"static","maps_to_ac":"AC-3"},
{"id":"TC-4","type":"test_criterion","description":"Disabled + spinner present","verify":"unit","maps_to_ac":"AC-4"},
{"id":"TC-5","type":"test_criterion","description":"Dark snapshot matches","verify":"snapshot","maps_to_ac":"AC-5"},
{"id":"TC-6","type":"test_criterion","description":"No fetch symbols","verify":"static","maps_to_ac":"AC-6"}
]}
-->
