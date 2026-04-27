# UC-SCR-06-ios: `ErrorScreen` — map + `LSInlineErrorCallout` + recovery chat — iOS SwiftUI

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** swift-implementer
**Estimate:** 120 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** M
**PRD Refs:** UC-SCR-06

---

## Background

Render `ErrorScreen` with `LSInlineErrorCallout` (warn stripe + body + suggestion chips) + recovery chat input, sourced from `ErrorMockProvider`. Composition: top bar + callout in `topOverlays` + map + recovery `LSChatInput` in `bottomOverlays`.

## Critical Constraints

**MUST:**
- Place `LSInlineErrorCallout` in `topOverlays` slot under top bar.
- Source warn-stripe color, glass chrome, and chip backgrounds from `LaneShadowTheme` — STRICTLY no literals.
- Register via `Story` API at `tier: .template` into `TemplateStories.all`.
- Inject error + suggestions exclusively via `ErrorMockProvider`.

**NEVER:**
- Call Convex; mutate `LSInlineErrorCallout` internals.
- Inline suggestion fixtures in the story body.

**STRICTLY:**
- Story id `templates.error.default`.
- Trailing icon swap behavior consistent with Idle.

## Specification

**Objective:** Render `ErrorScreen` with `LSInlineErrorCallout` (warn stripe + body + suggestion chips) + recovery chat input, sourced from `ErrorMockProvider`.

**Success State:** Reviewer opens `templates.error.default`: top bar, callout with warn stripe + compass chip + "THE NAVIGATOR" label + opinion-serif body + muted detail + "Try inland" / "End at Big Sur" chips, map below, chat input with recovery placeholder. Chip taps fire `onSuggestionTap`; trailing icon swaps on type. All gates green.

## Acceptance Criteria

### AC-1 — Error composition renders
- **GIVEN** sandbox on iPhone 16
- **WHEN** reviewer opens `templates.error.default`
- **THEN** screen shows top bar, `LSInlineErrorCallout` with warn-stripe + compass chip + "THE NAVIGATOR" label + opinion-serif body "Couldn't stitch that one together — the segment through Lucia looked broken." + muted detail text + "Try inland" + "End at Big Sur" suggestion chips, map below, chat input with recovery placeholder
- **Verify:** snapshot + manual
- **TDD State:** RED

### AC-2 — Suggestion chip callback
- **GIVEN** the error story is rendered
- **WHEN** reviewer taps the "Try inland" chip
- **THEN** `onSuggestionTap(chip)` fires exactly once with the tapped chip
- **Verify:** ViewInspector tap test asserting count + payload
- **TDD State:** RED

### AC-3 — Trailing icon swap on input
- **GIVEN** the chat input is empty
- **WHEN** reviewer types any character
- **THEN** trailing icon swaps from `sliders` to `send` (consistent with other screens)
- **Verify:** ViewInspector identifier test
- **TDD State:** RED

### AC-4 — Light/dark token re-resolution
- **GIVEN** the story is rendered
- **WHEN** reviewer toggles dark mode
- **THEN** warn stripe, glass chrome, suggestion chips all re-resolve via dark-scheme tokens
- **Verify:** snapshot pair
- **TDD State:** RED

### AC-5 — No data fetching in template
- **GIVEN** the `ErrorScreen` source
- **WHEN** scanned
- **THEN** no Convex/URLSession/.task — all data via `ErrorMockProvider`
- **Verify:** static grep test
- **TDD State:** RED

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|----|-----------|------------|--------|------|
| TC-1 | Default snapshot matches baseline | AC-1 | snapshot | snapshot |
| TC-2 | Chip tap fires onSuggestionTap once with matching chip | AC-2 | ViewInspector | behavioral |
| TC-3 | Trailing icon transitions sliders → send when text length > 0 | AC-3 | ViewInspector | behavioral |
| TC-4 | Dark snapshot matches baseline | AC-4 | snapshot | snapshot |
| TC-5 | Static grep finds no fetch symbols | AC-5 | static | static |

## Reading List

- `.spec/prds/v2/concepts/uc-scr-06-error.html` lines `all` — REQUIRED READING — visual design source for this task
- `.spec/prds/v2/08-uc-scr.md` lines `152-172` — UC-SCR-06 composition + AC list
- `ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift` lines `all` — Callout API + warn stripe + suggestions
- `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` lines `all` — topOverlays + bottomOverlays slots
- `ios/LaneShadow/Views/Atoms/LSChatInput.swift` lines `all` — Recovery placeholder + trailing icon swap
- `tokens/platforms/swift/Sources/LaneShadowTheme/` lines `all` — Warn-stripe + signal tokens

## Guardrails

**WRITE-ALLOWED:**
- `ios/LaneShadow/Sandbox/Stories/Templates/ErrorScreenStory.swift` (NEW)
- `ios/LaneShadow/Views/Templates/ErrorScreen.swift` (NEW)
- `ios/LaneShadow/Sandbox/MockProviders/ErrorMockProvider.swift` (NEW)
- `ios/LaneShadow/Sandbox/Stories/Templates/TemplateStories.swift` (MODIFY — append)
- `ios/LaneShadowTests/Templates/ErrorScreenTests.swift` (NEW)

**WRITE-PROHIBITED:**
- `android/**` — paired Android task
- `tokens/platforms/swift/**` — read only
- `react-native/**`
- `ios/LaneShadow/Views/Organisms/**` — Sprint 5 frozen

## Code Pattern

**Reference:**
```swift
Story(id: "templates.error.default", tier: .template, component: "ErrorScreen",
      name: "Default — Lucia Segment", summary: "...") { _ in
    ErrorScreen(provider: ErrorMockProvider.luciaSegment)
}
```

**Source:** `ios/LaneShadow/Sandbox/Stories/Organisms/LSNavigatorMessageStory.swift:1-60`

**Anti-Pattern:** Do NOT use literal warn color; do NOT inline suggestion fixtures in the story; do NOT call Convex; do NOT mutate LSInlineErrorCallout.

## Design

**References:**
- `concepts/uc-scr-06-error.html`
- `concepts/designs.html`
- `.spec/prds/v2/08-uc-scr.md#UC-SCR-06`

**Interaction Notes:**
- Callout placed in `topOverlays` slot under top bar.
- Two suggestion chips inline within the callout body — taps forward to `onSuggestionTap(chip)`.
- Chat input placeholder: "Try again, or let me know what to change…".
- Trailing icon swap mirrors Idle/Error consistency.

## Verification Gates

| Gate | Command | Expected |
|------|---------|----------|
| lint | `swiftlint --quiet --strict` | exit 0 |
| build | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build` | BUILD SUCCEEDED |
| test | `xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/ErrorScreenTests` | all tests pass |
| tokens | `pnpm tokens:validate` | exit 0 |

## Agent Assignment

**Agent:** swift-implementer

**Rationale:** Inline-error overlay + recovery chat composition; swift-implementer owns LSInlineErrorCallout integration and Story registration patterns.

## Coding Standards

- `brain/docs/swift-rules.md`
- `RULES.md §6 ComponentTier`
- `styles/RULES.md`

## Dependencies

**Depends On:** UC-SBX-01-ios, UC-SBX-03-ios, UC-ORG-03-ios

**Blocks:** UC-SBX-06-ios

## TDD Workflow

1. **RED** — Write failing tests for AC-1..AC-5
2. **GREEN** — Implement minimum SwiftUI to pass each AC
3. **REFACTOR** — Clean without breaking tests
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
{"id":"AC-1","type":"acceptance_criterion","description":"Error renders all slots","verify":"snapshot"},
{"id":"AC-2","type":"acceptance_criterion","description":"Chip tap fires once","verify":"unit"},
{"id":"AC-3","type":"acceptance_criterion","description":"Trailing icon swap","verify":"unit"},
{"id":"AC-4","type":"acceptance_criterion","description":"Dark re-resolve","verify":"snapshot pair"},
{"id":"AC-5","type":"acceptance_criterion","description":"No data fetching","verify":"grep"},
{"id":"TC-1","type":"test_criterion","description":"Light snapshot","verify":"snapshot","maps_to_ac":"AC-1"},
{"id":"TC-2","type":"test_criterion","description":"Chip callback","verify":"unit","maps_to_ac":"AC-2"},
{"id":"TC-3","type":"test_criterion","description":"Icon swap","verify":"unit","maps_to_ac":"AC-3"},
{"id":"TC-4","type":"test_criterion","description":"Dark snapshot","verify":"snapshot","maps_to_ac":"AC-4"},
{"id":"TC-5","type":"test_criterion","description":"No fetch symbols","verify":"static","maps_to_ac":"AC-5"}
]}
-->
