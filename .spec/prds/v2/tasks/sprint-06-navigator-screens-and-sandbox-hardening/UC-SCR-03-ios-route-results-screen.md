# UC-SCR-03-ios: `RouteResultsScreen` — 3 alt polylines + NavigatorMessage + refine chat — iOS SwiftUI

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** swift-implementer
**Estimate:** 180 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** L
**PRD Refs:** UC-SCR-03

---

## Background

Render `RouteResultsScreen` with three alternative polylines + Navigator message carrying three attached route cards + refine chat input, sourced from `RouteResultsMockProvider`. Polylines colored via `color.route.{best,alt1,alt2}`; camera frames union via `cameraFit: .polylines(padding: .spacing4)`; draw-on animation uses `motion.recipe.routeDrawOn` with 120ms stagger.

## Critical Constraints

**MUST:**
- Render polylines using `color.route.best`, `color.route.alt1`, `color.route.alt2` tokens — NEVER literal colors.
- Animate route draw-on via `motion.recipe.routeDrawOn` with 120ms stagger — NEVER hardcoded easing.
- Use `cameraFit: .polylines(padding: .spacing4)` — NEVER manual camera math.
- Register via `Story` API at `tier: .template` into `TemplateStories.all`.

**NEVER:**
- Fetch data; mutate organisms; call Convex.
- Inline route fixtures in story body.

**STRICTLY:**
- Story id `templates.routeResults.default`; message pre-pinned (`pinned: true`) so auto-dismiss does not fire.
- First attachment card carries `selected: true` and the best badge.

## Specification

**Objective:** Render `RouteResultsScreen` with three alternative polylines + Navigator message carrying three attached route cards + refine chat input, sourced from `RouteResultsMockProvider`.

**Success State:** Reviewer opens `templates.routeResults.default`: top bar, pinned `LSNavigatorMessage` with "THE NAVIGATOR" label, body in opinion-serif, three stacked compact `LSRouteAttachmentCard`s (first selected, best badge, stripe in `color.route.best`), map below with three polylines auto-framed via `cameraFit: .polylines`, refine chat input at bottom. Tap pin/close fires `onPin`/`onDismiss`. Light/dark gates green.

## Acceptance Criteria

### AC-1 — RouteResults composition renders
- **GIVEN** sandbox on iPhone 16
- **WHEN** reviewer opens `templates.routeResults.default`
- **THEN** screen shows top bar, `LSNavigatorMessage` pinned with "THE NAVIGATOR" label, body text in opinion-serif, three compact `LSRouteAttachmentCard`s stacked (first marked selected, stripe in `color.route.best`, best badge on first card), map with three polylines in `color.route.best/alt1/alt2`, chat input with refine placeholder
- **Verify:** snapshot + manual
- **TDD State:** RED

### AC-2 — Polyline color + camera fit tokens
- **GIVEN** the route-results template source
- **WHEN** scanned
- **THEN** polyline colors map to `LaneShadowTheme.color.route.{best,alt1,alt2}` and camera uses `cameraFit: .polylines(padding: .spacing4)` — no literal hex or numeric padding
- **Verify:** static grep + ViewInspector
- **TDD State:** RED

### AC-3 — Draw-on animation with stagger
- **GIVEN** the story is opened fresh
- **WHEN** the screen first renders
- **THEN** the three polylines animate using `motion.recipe.routeDrawOn` with 120ms stagger between paths
- **Verify:** ViewInspector animation introspection asserting recipe + stagger value
- **TDD State:** RED

### AC-4 — Pin/close callbacks
- **GIVEN** the message is pre-pinned
- **WHEN** reviewer taps pin then close
- **THEN** `onPin` fires once, `onDismiss` fires once, auto-dismiss does NOT fire because `pinned: true`
- **Verify:** ViewInspector tap test asserting callback counts
- **TDD State:** RED

### AC-5 — Dark map style switch
- **GIVEN** the story is rendered
- **WHEN** reviewer toggles dark mode
- **THEN** map style re-resolves to dark Studio style; glass chrome, message surface, route stripes all re-resolve via tokens
- **Verify:** snapshot pair + map style id assertion
- **TDD State:** RED

### AC-6 — No data fetching in template
- **GIVEN** the `RouteResultsScreen` source
- **WHEN** scanned
- **THEN** no Convex/URLSession/.task — all data via `RouteResultsMockProvider`
- **Verify:** static grep test
- **TDD State:** RED

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|----|-----------|------------|--------|------|
| TC-1 | Light snapshot of default route-results variant matches baseline | AC-1 | snapshot | snapshot |
| TC-2 | Source references `color.route.best/alt1/alt2` and `cameraFit: .polylines(padding: .spacing4)`; zero literal hex | AC-2 | static grep | static |
| TC-3 | Animation introspection confirms `routeDrawOn` recipe with 120ms inter-path delay | AC-3 | ViewInspector | behavioral |
| TC-4 | Pin tap → onPin count==1; close tap → onDismiss count==1; no auto-dismiss timer fires | AC-4 | ViewInspector + clock advance | behavioral |
| TC-5 | Dark snapshot matches baseline and map style id == dark | AC-5 | snapshot + introspection | snapshot |
| TC-6 | Static grep finds no fetch symbols | AC-6 | static | static |

## Reading List

- `.spec/prds/v2/concepts/uc-scr-03-route-results.html` lines `all` — REQUIRED READING — visual design source for this task
- `.spec/prds/v2/08-uc-scr.md` lines `77-99` — UC-SCR-03 composition + AC list
- `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` lines `all` — Slots + cameraFit
- `ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift` lines `all` — Pinned + attachments + onPin/onDismiss
- `ios/LaneShadow/Views/Organisms/LSRouteCard.swift` lines `all` — LSRouteAttachmentCard compact variant
- `ios/LaneShadow/Sandbox/Stories/Organisms/LSNavigatorMessageStory.swift` lines `1-120` — Story registration + attachment fixture pattern
- `tokens/platforms/swift/Sources/LaneShadowTheme/` lines `all` — color.route.* + motion.recipe.routeDrawOn

## Guardrails

**WRITE-ALLOWED:**
- `ios/LaneShadow/Sandbox/Stories/Templates/RouteResultsScreenStory.swift` (NEW)
- `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` (NEW)
- `ios/LaneShadow/Sandbox/MockProviders/RouteResultsMockProvider.swift` (NEW)
- `ios/LaneShadow/Sandbox/Stories/Templates/TemplateStories.swift` (MODIFY — append)
- `ios/LaneShadowTests/Templates/RouteResultsScreenTests.swift` (NEW)

**WRITE-PROHIBITED:**
- `android/**` — paired Android task
- `tokens/platforms/swift/**` — read only
- `react-native/**`
- `ios/LaneShadow/Views/Organisms/**` — Sprint 5 frozen

## Code Pattern

**Reference:**
```swift
Story(id: "templates.routeResults.default", tier: .template, component: "RouteResultsScreen",
      name: "Default — 3 Routes", summary: "...") { _ in
    RouteResultsScreen(provider: RouteResultsMockProvider.threeRoutes)
}
```

**Source:** `ios/LaneShadow/Sandbox/Stories/Organisms/LSNavigatorMessageStory.swift:1-120`

**Anti-Pattern:** Do NOT inline route fixtures in story body; do NOT use literal hex for stripe colors; do NOT compute camera bounds manually; do NOT call Convex.

## Design

**References:**
- `concepts/uc-scr-03-route-results.html`
- `concepts/designs.html`
- `.spec/prds/v2/08-uc-scr.md#UC-SCR-03`

**Interaction Notes:**
- NavigatorMessage placed in `topOverlays` slot, pre-pinned (`pinned: true`) so auto-dismiss is suppressed.
- Three polylines passed to `LSMap` in render order best→alt1→alt2; stagger applied on appearance.
- Camera framing handled by `LSMap`'s `cameraFit: .polylines(padding: .spacing4)`.
- First attachment card carries `selected: true` and the best badge.

## Verification Gates

| Gate | Command | Expected |
|------|---------|----------|
| lint | `swiftlint --quiet --strict` | exit 0 |
| build | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build` | BUILD SUCCEEDED |
| test | `xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests` | all tests pass |
| tokens | `pnpm tokens:validate` | exit 0 |

## Agent Assignment

**Agent:** swift-implementer

**Rationale:** Multi-polyline LSMap composition + LSNavigatorMessage with attachments + camera-fit logic; swift-implementer owns the LSMapLayer + organism composition pattern from Sprint 5.

## Coding Standards

- `brain/docs/swift-rules.md`
- `RULES.md §6 ComponentTier`
- `styles/RULES.md`

## Dependencies

**Depends On:** UC-SBX-01-ios, UC-SBX-03-ios, UC-ORG-03-ios, UC-ORG-06-ios

**Blocks:** UC-SBX-06-ios

## TDD Workflow

1. **RED** — Write failing tests for AC-1..AC-6
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
{"id":"AC-1","type":"acceptance_criterion","description":"RouteResults renders all slots","verify":"snapshot"},
{"id":"AC-2","type":"acceptance_criterion","description":"Polyline tokens + camera fit","verify":"grep + unit"},
{"id":"AC-3","type":"acceptance_criterion","description":"Draw-on animation with 120ms stagger","verify":"unit"},
{"id":"AC-4","type":"acceptance_criterion","description":"Pin/dismiss callbacks; no auto-dismiss when pinned","verify":"unit"},
{"id":"AC-5","type":"acceptance_criterion","description":"Dark map + chrome re-resolve","verify":"snapshot pair"},
{"id":"AC-6","type":"acceptance_criterion","description":"No data fetching","verify":"grep"},
{"id":"TC-1","type":"test_criterion","description":"Light snapshot","verify":"snapshot","maps_to_ac":"AC-1"},
{"id":"TC-2","type":"test_criterion","description":"Token references present","verify":"static","maps_to_ac":"AC-2"},
{"id":"TC-3","type":"test_criterion","description":"Animation recipe + stagger","verify":"unit","maps_to_ac":"AC-3"},
{"id":"TC-4","type":"test_criterion","description":"Pin/close callback counts","verify":"unit","maps_to_ac":"AC-4"},
{"id":"TC-5","type":"test_criterion","description":"Dark snapshot + map style","verify":"snapshot","maps_to_ac":"AC-5"},
{"id":"TC-6","type":"test_criterion","description":"No fetch symbols","verify":"static","maps_to_ac":"AC-6"}
]}
-->
