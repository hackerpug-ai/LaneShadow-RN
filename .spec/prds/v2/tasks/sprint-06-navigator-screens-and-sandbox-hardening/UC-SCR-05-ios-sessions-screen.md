# UC-SCR-05-ios: `SessionsScreen` — scrimmed map + `LSSessionsDrawer` — iOS SwiftUI

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** swift-implementer
**Estimate:** 120 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** M
**PRD Refs:** UC-SCR-05

---

## Background

Render `SessionsScreen` with dimmed map backdrop + left-anchored `LSSessionsDrawer` showing grouped sessions and active-session stripe, sourced from `SessionsMockProvider`. Drawer-over-scrim composition with sidebar slide-in motion recipe; no top bar (drawer owns its own chrome).

## Critical Constraints

**MUST:**
- Use `LSMapLayer` `scrim` (opacity 0.35) + `leadingDrawer` slots — NEVER overlay manually.
- Drive drawer in/out via `motion.recipe.sidebarSlideIn` (and its reverse) — NEVER literal animation.
- Omit `topBar` slot (drawer owns its own header).
- Register via `Story` API at `tier: .template` into `TemplateStories.all`.

**NEVER:**
- Call Convex; mutate `LSSessionsDrawer` internals.
- Hardcode scrim opacity or animation duration.

**STRICTLY:**
- Story id `templates.sessions.default`.
- Active session id is "Santa Cruz loop"; non-active rows fire `onSelect(session.id)` exactly once.

## Specification

**Objective:** Render `SessionsScreen` with dimmed map backdrop + left-anchored `LSSessionsDrawer` showing grouped sessions and active-session stripe, sourced from `SessionsMockProvider`.

**Success State:** Reviewer opens `templates.sessions.default`: dimmed map behind 0.35 scrim, `LSSessionsDrawer` slid in from the left, "Rides" header + "NEW" button + "THIS WEEK" label + 5 session rows ("Santa Cruz loop" active with stripe). Tap row/new/scrim fires correct callbacks. Header sticky on scroll. Light/dark gates green.

## Acceptance Criteria

### AC-1 — Sessions composition renders
- **GIVEN** sandbox on iPhone 16
- **WHEN** reviewer opens `templates.sessions.default`
- **THEN** screen shows dimmed map behind `LSScrim` at 0.35 opacity, `LSSessionsDrawer` slid in from left via `motion.recipe.sidebarSlideIn`, "Rides" header + "NEW" button + "THIS WEEK" section label + 5 session rows with "Santa Cruz loop" marked active via signal stripe
- **Verify:** snapshot + manual
- **TDD State:** RED

### AC-2 — Row select callback
- **GIVEN** the drawer is rendered
- **WHEN** reviewer taps a non-active session row
- **THEN** `onSelect(session.id)` fires exactly once with the tapped row's id
- **Verify:** ViewInspector tap test asserting callback count + payload
- **TDD State:** RED

### AC-3 — NEW button callback
- **GIVEN** the drawer is rendered
- **WHEN** reviewer taps the "NEW" button
- **THEN** `onNew` fires exactly once
- **Verify:** ViewInspector tap test
- **TDD State:** RED

### AC-4 — Scrim dismiss + reverse slide
- **GIVEN** the drawer is rendered
- **WHEN** reviewer taps the scrim outside the drawer
- **THEN** `onDismiss` fires; drawer animates out using the reverse of `motion.recipe.sidebarSlideIn`
- **Verify:** ViewInspector tap test + animation introspection
- **TDD State:** RED

### AC-5 — Sticky header on scroll
- **GIVEN** the drawer has scrollable content
- **WHEN** reviewer scrolls the session list
- **THEN** the drawer header + "NEW" button + "THIS WEEK" label remain pinned at top
- **Verify:** snapshot at scroll-offset > 0 confirms header position
- **TDD State:** RED

### AC-6 — Light/dark token re-resolution
- **GIVEN** the story is rendered
- **WHEN** reviewer toggles dark mode
- **THEN** scrim, drawer chrome, active stripe, and row backgrounds all re-resolve via dark-scheme tokens
- **Verify:** snapshot pair
- **TDD State:** RED

### AC-7 — No data fetching in template
- **GIVEN** the `SessionsScreen` source
- **WHEN** scanned
- **THEN** no Convex/URLSession/.task — all data via `SessionsMockProvider`
- **Verify:** static grep test
- **TDD State:** RED

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|----|-----------|------------|--------|------|
| TC-1 | Default snapshot matches baseline (drawer fully extended, scrim 0.35) | AC-1 | snapshot | snapshot |
| TC-2 | Row tap fires onSelect once with matching id | AC-2 | unit | behavioral |
| TC-3 | NEW button tap fires onNew once | AC-3 | unit | behavioral |
| TC-4 | Scrim tap fires onDismiss; outgoing animation references sidebarSlideIn recipe | AC-4 | unit | behavioral |
| TC-5 | Snapshot at scroll-offset > 0 shows header pinned | AC-5 | snapshot | snapshot |
| TC-6 | Dark snapshot matches baseline | AC-6 | snapshot | snapshot |
| TC-7 | Static grep finds no fetch symbols | AC-7 | static | static |

## Reading List

- `.spec/prds/v2/concepts/uc-scr-05-sessions.html` lines `all` — REQUIRED READING — visual design source for this task
- `.spec/prds/v2/08-uc-scr.md` lines `126-148` — UC-SCR-05 composition + AC list
- `ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift` lines `all` — Drawer header/list/active stripe API
- `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` lines `all` — scrim + leadingDrawer slots
- `ios/LaneShadow/Views/Atoms/LSScrim.swift` lines `all` — Scrim opacity + tap forwarding
- `tokens/platforms/swift/Sources/LaneShadowTheme/` lines `all` — motion.recipe.sidebarSlideIn + scrim opacity token

## Guardrails

**WRITE-ALLOWED:**
- `ios/LaneShadow/Sandbox/Stories/Templates/SessionsScreenStory.swift` (NEW)
- `ios/LaneShadow/Views/Templates/SessionsScreen.swift` (NEW)
- `ios/LaneShadow/Sandbox/MockProviders/SessionsMockProvider.swift` (NEW)
- `ios/LaneShadow/Sandbox/Stories/Templates/TemplateStories.swift` (MODIFY — append)
- `ios/LaneShadowTests/Templates/SessionsScreenTests.swift` (NEW)

**WRITE-PROHIBITED:**
- `android/**` — paired Android task
- `tokens/platforms/swift/**` — read only
- `react-native/**`
- `ios/LaneShadow/Views/Organisms/**` — Sprint 5 frozen

## Code Pattern

**Reference:**
```swift
Story(id: "templates.sessions.default", tier: .template, component: "SessionsScreen",
      name: "Default — This Week", summary: "...") { _ in
    SessionsScreen(provider: SessionsMockProvider.thisWeek)
}
```

**Source:** `ios/LaneShadow/Sandbox/Stories/Organisms/LSNavigatorMessageStory.swift:1-60`

**Anti-Pattern:** Do NOT add a top bar; do NOT hardcode scrim opacity or animation duration; do NOT call backend; do NOT mutate LSSessionsDrawer.

## Design

**References:**
- `concepts/uc-scr-05-sessions.html`
- `concepts/designs.html`
- `.spec/prds/v2/08-uc-scr.md#UC-SCR-05`

**Interaction Notes:**
- No `topBar` slot — drawer owns its own header chrome.
- Scrim tap area covers everything outside the drawer's leading rect; tap forwards to `onDismiss`.
- Active row marked via signal stripe atom from `LSSessionsDrawer` API.
- Drawer presents on initial render via slide-in transition tied to `motion.recipe.sidebarSlideIn`.

## Verification Gates

| Gate | Command | Expected |
|------|---------|----------|
| lint | `swiftlint --quiet --strict` | exit 0 |
| build | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build` | BUILD SUCCEEDED |
| test | `xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/SessionsScreenTests` | all tests pass |
| tokens | `pnpm tokens:validate` | exit 0 |

## Agent Assignment

**Agent:** swift-implementer

**Rationale:** Drawer-over-scrim composition with sidebar slide-in motion recipe; swift-implementer owns LSMapLayer scrim + leadingDrawer slot integration.

## Coding Standards

- `brain/docs/swift-rules.md`
- `RULES.md §6 ComponentTier`
- `styles/RULES.md`

## Dependencies

**Depends On:** UC-SBX-01-ios, UC-SBX-03-ios, UC-ORG-05-ios

**Blocks:** UC-SBX-06-ios

## TDD Workflow

1. **RED** — Write failing tests for AC-1..AC-7
2. **GREEN** — Implement minimum SwiftUI to pass each AC
3. **REFACTOR** — Clean without breaking tests
4. **VERIFY** — Run all gates; commit only when green

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"Sessions renders scrim + drawer","verify":"snapshot"},
{"id":"AC-2","type":"acceptance_criterion","description":"Row select callback","verify":"unit"},
{"id":"AC-3","type":"acceptance_criterion","description":"NEW callback","verify":"unit"},
{"id":"AC-4","type":"acceptance_criterion","description":"Scrim dismiss + reverse slide","verify":"unit"},
{"id":"AC-5","type":"acceptance_criterion","description":"Sticky header on scroll","verify":"snapshot"},
{"id":"AC-6","type":"acceptance_criterion","description":"Dark re-resolve","verify":"snapshot pair"},
{"id":"AC-7","type":"acceptance_criterion","description":"No data fetching","verify":"grep"},
{"id":"TC-1","type":"test_criterion","description":"Default snapshot","verify":"snapshot","maps_to_ac":"AC-1"},
{"id":"TC-2","type":"test_criterion","description":"Row select once","verify":"unit","maps_to_ac":"AC-2"},
{"id":"TC-3","type":"test_criterion","description":"NEW once","verify":"unit","maps_to_ac":"AC-3"},
{"id":"TC-4","type":"test_criterion","description":"Scrim dismiss + recipe","verify":"unit","maps_to_ac":"AC-4"},
{"id":"TC-5","type":"test_criterion","description":"Sticky header snapshot","verify":"snapshot","maps_to_ac":"AC-5"},
{"id":"TC-6","type":"test_criterion","description":"Dark snapshot","verify":"snapshot","maps_to_ac":"AC-6"},
{"id":"TC-7","type":"test_criterion","description":"No fetch symbols","verify":"static","maps_to_ac":"AC-7"}
]}
-->
