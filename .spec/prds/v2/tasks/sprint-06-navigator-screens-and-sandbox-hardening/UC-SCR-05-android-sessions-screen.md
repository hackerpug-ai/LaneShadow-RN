# UC-SCR-05-android: `SessionsScreen` — scrimmed map + `LSSessionsDrawer` — Android Compose

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** kotlin-implementer
**Estimate:** 120 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** M
**PRD Refs:** UC-SCR-05

---

## Background

Render SessionsScreen on Android with non-interactive map backdrop, 0.35 scrim, and left-anchored LSSessionsDrawer with grouped sessions and active-session signal stripe. Compose template composing scrimmed map backdrop with leading drawer; no top bar; drawer handles its own chrome.

## Critical Constraints

**MUST:**
- Set scrim opacity 0.35 via `LSScrim` token, NEVER hardcode.
- Use `motion.recipe.sidebarSlideIn` for drawer enter/exit.
- Register `templates.sessions.default` at `tier: ComponentTier.template`.
- STRICTLY no Convex — `SessionsMockProvider` only.

**NEVER:**
- Edit iOS or token sources.
- Add a top bar — drawer owns its own header.

**STRICTLY:**
- Active session id is "Santa Cruz loop"; non-active rows fire `onSelect` exactly once.

## Specification

**Objective:** Render SessionsScreen on Android with non-interactive map backdrop, 0.35 scrim, and left-anchored LSSessionsDrawer with grouped sessions and active-session signal stripe.

**Success State:** Story renders drawer with sticky chrome, scrim tap dismisses, callbacks fire, light/dark re-resolves, no fetch logic.

## Acceptance Criteria

### AC-1 — Sessions composition renders
- **GIVEN** Sandbox `templates.sessions.default` selected
- **WHEN** Story mounts
- **THEN** Dimmed map behind `LSScrim` at 0.35, `LSSessionsDrawer` slides in from the left via `motion.recipe.sidebarSlideIn`, 'Rides' header + 'NEW' button + 'THIS WEEK' section label + 5 session rows ('Santa Cruz loop' marked active via signal stripe), no top bar
- **Verify:** Compose UI test asserts hierarchy + active-row stripe
- **TDD State:** RED

### AC-2 — Row select callback
- **GIVEN** Drawer rendered
- **WHEN** Developer taps a non-active session row
- **THEN** `onSelect(session.id)` fires exactly once
- **Verify:** UI test with fake handler
- **TDD State:** RED

### AC-3 — NEW button callback
- **GIVEN** Drawer rendered
- **WHEN** Developer taps 'NEW'
- **THEN** `onNew` fires exactly once
- **Verify:** UI test
- **TDD State:** RED

### AC-4 — Scrim tap dismisses with reverse animation
- **GIVEN** Drawer presented
- **WHEN** Developer taps the scrim outside the drawer
- **THEN** `onDismiss` fires; drawer animates out via reverse of `motion.recipe.sidebarSlideIn`
- **Verify:** UI test asserts callback + reverse animation invocation
- **TDD State:** RED

### AC-5 — Sticky drawer chrome on scroll
- **GIVEN** Drawer rendered with overflow rows
- **WHEN** Developer scrolls the session list
- **THEN** Drawer header, NEW button, and 'THIS WEEK' label remain sticky
- **Verify:** UI test with scroll gesture
- **TDD State:** RED

### AC-6 — Light/dark re-resolves tokens
- **GIVEN** Story rendered
- **WHEN** Theme toggled
- **THEN** Scrim, drawer chrome, active stripe, row backgrounds all re-resolve
- **Verify:** Snapshot test light + dark
- **TDD State:** RED

### AC-7 — No data-fetching logic
- **GIVEN** Source
- **WHEN** Inspected
- **THEN** No Convex/network — data via `SessionsMockProvider`
- **Verify:** Static unit test
- **TDD State:** RED

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|----|-----------|------------|--------|------|
| TC-1 | UI test asserts scrim + drawer + 5 rows + active stripe | AC-1 | connectedDebugAndroidTest | ui |
| TC-2 | UI test asserts onSelect callback | AC-2 | connectedDebugAndroidTest | ui |
| TC-3 | UI test asserts onNew callback | AC-3 | connectedDebugAndroidTest | ui |
| TC-4 | UI test asserts scrim tap dismiss + reverse animation | AC-4 | connectedDebugAndroidTest | ui |
| TC-5 | UI test asserts sticky chrome on scroll | AC-5 | connectedDebugAndroidTest | ui |
| TC-6 | Snapshot test light + dark | AC-6 | testDebugUnitTest | snapshot |
| TC-7 | Import allow-list test | AC-7 | testDebugUnitTest | unit |

## Reading List

- `.spec/prds/v2/concepts/uc-scr-05-sessions.html` lines `all` — REQUIRED READING — visual design source for this task
- `.spec/prds/v2/08-uc-scr.md` lines `126-148` — UC-SCR-05 spec + ACs
- `.spec/prds/v2/11-technical-requirements.md` lines `all` — Session schema
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt` lines `all` — Drawer API
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSScrim.kt` lines `all` — Scrim usage
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt` lines `all` — leadingDrawer + scrim slots

## Guardrails

**WRITE-ALLOWED:**
- `android/app/src/debug/java/com/laneshadow/sandbox/templates/SessionsScreenStory.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/ui/templates/SessionsScreen.kt` (NEW)
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/SessionsMockProvider.kt` (NEW)
- `android/app/src/test/java/com/laneshadow/ui/templates/SessionsScreenTest.kt` (NEW)

**WRITE-PROHIBITED:**
- `ios/**` — iOS task is paired
- `tokens/platforms/kotlin/**` — read only
- `react-native/**`

## Code Pattern

**Reference:** Slot-based template with leadingDrawer + scrim.

**Source:** UC-ORG-02 LSMapLayer + LSSessionsDrawer organism

**Anti-Pattern:** Hardcoded scrim opacity or animation duration.

## Design

**References:**
- `concepts/uc-scr-05-sessions.html`
- `concepts/designs.html`
- `.spec/prds/v2/08-uc-scr.md#UC-SCR-05`

**Interaction Notes:**
- No top bar; drawer owns chrome; scrim taps dismiss via reverse animation.

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

**Rationale:** Compose template composing scrimmed map backdrop with leading drawer; no top bar; drawer handles its own chrome.

## Coding Standards

- `brain/docs/kotlin-rules.md`
- `RULES.md §6 ComponentTier`
- `styles/RULES.md`

## Dependencies

**Depends On:** UC-SBX-01-android, UC-SBX-03-android

**Blocks:** UC-SBX-06-android

## TDD Workflow

1. **RED** — Write failing tests for AC-1..AC-7
2. **GREEN** — Implement Compose code
3. **REFACTOR** — Clean
4. **VERIFY** — Run all gates; commit when green

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"Sessions composition renders","verify":"ui"},
{"id":"AC-2","type":"acceptance_criterion","description":"Row select callback","verify":"ui"},
{"id":"AC-3","type":"acceptance_criterion","description":"NEW button callback","verify":"ui"},
{"id":"AC-4","type":"acceptance_criterion","description":"Scrim tap dismisses w/ reverse anim","verify":"ui"},
{"id":"AC-5","type":"acceptance_criterion","description":"Sticky drawer chrome on scroll","verify":"ui"},
{"id":"AC-6","type":"acceptance_criterion","description":"Light/dark re-resolves","verify":"snapshot"},
{"id":"AC-7","type":"acceptance_criterion","description":"No data fetching","verify":"unit"},
{"id":"TC-1","type":"test_criterion","description":"Scrim + drawer + active stripe","verify":"ui","maps_to_ac":"AC-1"},
{"id":"TC-2","type":"test_criterion","description":"onSelect callback","verify":"ui","maps_to_ac":"AC-2"},
{"id":"TC-3","type":"test_criterion","description":"onNew callback","verify":"ui","maps_to_ac":"AC-3"},
{"id":"TC-4","type":"test_criterion","description":"Scrim dismiss + reverse anim","verify":"ui","maps_to_ac":"AC-4"},
{"id":"TC-5","type":"test_criterion","description":"Sticky chrome","verify":"ui","maps_to_ac":"AC-5"},
{"id":"TC-6","type":"test_criterion","description":"Snapshot light+dark","verify":"snapshot","maps_to_ac":"AC-6"},
{"id":"TC-7","type":"test_criterion","description":"Import allow-list","verify":"unit","maps_to_ac":"AC-7"}
]}
-->
