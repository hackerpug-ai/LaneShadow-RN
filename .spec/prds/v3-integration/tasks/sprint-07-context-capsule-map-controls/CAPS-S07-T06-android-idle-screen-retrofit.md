# CAPS-S07-T06 — Android IdleScreen retrofit (Compose) — replace legacy greeting + advisory with LSContextCapsule + LSMapControls

> **Task ID:** CAPS-S07-T06 · **Sprint:** [Sprint 07](./SPRINT.md) · **Agent:** kotlin-implementer · **Estimate:** 180 min · **Type:** FEATURE · **Status:** Done · **Priority:** P0 · **Effort:** M
> **PRD Refs:** UC-FID-01, UC-CHAT-01, UC-MAP-01

## Background

Android parity to CAPS-S07-T05 (iOS). After T02 ships `LSContextCapsule` and T04 ships `LSMapControls`, this task retrofits the Sprint 06 Android `IdleScreen.kt` and extends `IdleViewModel` with `capsuleState: StateFlow<CapsuleState>`. Removes the legacy `GreetingOverlay()` (Text + Text + LSAdvisoryCard) and replaces with the new components in the LSMapLayer top-overlay region.

## Critical Constraints

**MUST:**
- Mount `LSContextCapsule(state = capsuleState)` and `LSMapControls(mode = MapControlsMode.Map, ...)` from CAPS-S07-T02 / T04 (blocking dependencies)
- Remove the legacy `GreetingOverlay()` private composable (Text + Text + LSAdvisoryCard) and the standalone LSAdvisoryCard usage in IdleScreen (advisory copy folds into capsule `--warning` state)
- Extend `IdleViewModel` with `val capsuleState: StateFlow<CapsuleState>` derived via `combine(greetingScope, firstName, metaRow, weatherSummary) { ... }` using `kotlinx.coroutines.flow.combine` — never block, never use `runBlocking`
- Preserve existing testTags: `chat-input`, `ls-topbar`, `idlescreen-map`. Remove old testTags: `greeting-overlay`, `greeting-meta`, `greeting-headline`, `advisory-card`. Add new testTags: `idle-context-capsule`, `idle-map-controls`

**NEVER:**
- Re-implement LSMapView / LSMapHost / LSMapLayer — bind to existing Sprint 06 host (RULES.md anti-pattern)
- Add live `LSMapView.zoomTo(...)` / `easeCamera(...)` SDK calls beyond what existing `LSMap` exposes — full camera wiring stub OK; live binding optional
- Premature `--planning` capsule swap on suggestion-chip tap (Sprint 08 owns that transition)
- Remove `chat-input` / `ls-topbar` / `idlescreen-map` testTags
- Mutate IdleViewModel constructor signature (Hilt @Inject) — additive properties only

**STRICTLY:**
- AnnotatedString + SpanStyle(fontStyle=FontStyle.Italic) for headline italic em — replicate `Greeting.kt` pattern (italic on scope word only)
- `_capsuleState` is a hot StateFlow (MutableStateFlow + asStateFlow), readable synchronously after setup
- `deriveCapsuleState()` invoked from each relevant `observe*` flow — weather change AND user change AND time-of-day change all retrigger it

## Specification

**Objective:** IdleScreen renders new `LSContextCapsule` (in `--idle` state with copper italic scope-word, meta dot row, `--warning` when WeatherSeverity ≥ ADVISORY) centered below topbar, plus `LSMapControls` (mode = Map) **vertically centered along the right edge** of the map canvas; legacy `GreetingOverlay()` + standalone `LSAdvisoryCard` deleted; `IdleViewModel` exposes `capsuleState: StateFlow<CapsuleState>` derived from existing flows.

**Success State:** `./gradlew :app:assembleDebug` builds clean; `./gradlew :app:testDebugUnitTest` exits 0; `GreetingOverlay()` function deleted from `IdleScreen.kt` (grep returns 0); new testTags `idle-context-capsule` / `idle-map-controls` present.

## Acceptance Criteria

### AC-1 — Capsule replaces legacy greeting overlay [PRIMARY]

**GIVEN** IdleScreen rendered with default `IdleScreenState`
**WHEN** Composable mounts
**THEN** Compose tree contains a node with `testTag='idle-context-capsule'` wrapping LSContextCapsule; nodes with testTags `greeting-overlay`, `greeting-meta`, `greeting-headline` DO NOT exist; `GreetingOverlay()` private composable deleted from IdleScreen.kt (verified by grep)
**Verify:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.IdleScreenRetrofitTest.capsule_replaces_legacy_greeting_overlay'`

### AC-2 — MapControls mounted at right-edge vertically-centered overlay slot

**GIVEN** IdleScreen rendered with default state
**WHEN** Composable mounts
**THEN** Compose tree contains a node with `testTag='idle-map-controls'` wrapping LSMapControls in `mode=MapControlsMode.Map`; the workbar's parent slot aligns to `Alignment.CenterEnd` (verified via Compose layout assertion: `onNodeWithTag(...).getBoundsInWindow().center.y` is within ±20dp of the map canvas vertical center; `.right` is within ±theme.space.md of parent right edge)
**Verify:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.IdleScreenRetrofitTest.map_controls_mounted_center_end'`

### AC-3 — Capsule reflects greeting scope + first name + meta from ViewModel

**GIVEN** `IdleViewModel.capsuleState` emits `CapsuleState.Idle(scope=TONIGHT, headline=AnnotatedString building 'Where are we riding tonight, Marcus?' with italic 'tonight', metaItems=listOf('FRIDAY','62°F','CLEAR'))`
**WHEN** IdleScreen consumes state
**THEN** LSContextCapsule's headline node contains 'Where are we riding tonight, Marcus?' with italic span on 'tonight' tinted `theme.colors.signal.default`; meta row shows three labels separated by 4dp dots: FRIDAY · 62°F · CLEAR
**Verify:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.capsule_state_reflects_evening_greeting'`

### AC-4 — WeatherSeverity ADVISORY → capsule isWarning=true

**GIVEN** `IdleViewModel` observes `WeatherSummary` with `severity=WeatherSeverity.ADVISORY` (Rain · 0.4″) at hour 10
**WHEN** ViewModel processes the update
**THEN** `_capsuleState` emits `CapsuleState.Idle(scope=TODAY, headline=AnnotatedString building 'Not the prettiest day for it.' with italic 'prettiest', metaItems containing 'Rain · 0.4″', isWarning=true)`; the standalone LSAdvisoryCard composable is no longer present in the Compose tree
**Verify:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.advisory_severity_flips_capsule_warning'`

### AC-5 — Suggestion-chip tap leaves capsule in --idle (does NOT swap to --planning)

**GIVEN** `IdleViewModel.capsuleState` in `CapsuleState.Idle` and chat input idle
**WHEN** Rider taps a suggestion chip
**THEN** `capsuleState` remains `CapsuleState.Idle` (NOT Planning) — planning-state swap lives in Sprint 08; chat-input testTag transitions to active per existing IDLE-S06-AND-T03 wiring
**Verify:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.suggestion_chip_tap_keeps_capsule_idle'`

### AC-6 — Existing testTags preserved (chat-input, ls-topbar, idlescreen-map)

**GIVEN** Retrofitted IdleScreen rendered
**WHEN** Compose tree inspected
**THEN** Nodes with testTags `chat-input`, `ls-topbar`, `idlescreen-map` all still exist (Sprint 06 IDLE-S06-AND-T04 instrumented suite continues to pass against these tags until CAPS-S07-T08 updates the suite)
**Verify:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.IdleScreenRetrofitTest.existing_testtags_preserved'`

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | idle-context-capsule node present; greeting-overlay/greeting-meta/greeting-headline absent | AC-1 | happy_path |
| TC-2 | idle-map-controls node present and right-edge vertically centered | AC-2 | happy_path |
| TC-3 | Capsule headline + meta reflect ViewModel evening state | AC-3 | happy_path |
| TC-4 | ADVISORY severity → capsuleState.isWarning=true; LSAdvisoryCard absent | AC-4 | edge_case |
| TC-5 | Suggestion-chip tap keeps capsuleState as Idle (no premature Planning) | AC-5 | edge_case |
| TC-6 | chat-input / ls-topbar / idlescreen-map nodes still present | AC-6 | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt` | 1-230 | **PRIMARY PATTERN** — current `GreetingOverlay()` + topOverlays slot wiring + AnnotatedString italic span construction |
| `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt` | 1-220 | Existing `observe*` / `_state.update` + Flow.combine pattern — replicate for `capsuleState` derivation |
| `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt` | 1-200 | Slot architecture — confirm whether `topOverlays` carries alignment hints OR introduce one |
| `android/app/src/main/java/com/laneshadow/ui/idle/Greeting.kt` | 1-30 | AnnotatedString construction with italic SpanStyle on scope word — replicate inside `deriveCapsuleState()` |
| `.spec/design/system/views/idle-screen/idle-screen.html` | 1-200 | Visual ground truth: capsule top-centered + controls right-edge vertically-centered; advisory folds into capsule `--warning` |

## Guardrails

**Write-Allowed:**
- `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt` (MODIFY — replace GreetingOverlay slot; mount LSMapControls; delete GreetingOverlay() function and LSAdvisoryCard import)
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt` (MODIFY — add `capsuleState` StateFlow + `deriveCapsuleState()`)
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleUiState.kt` (MODIFY — optionally fold/deprecate `greeting/greetingMeta/greetingEmphasis` if no downstream consumers)
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt` (MODIFY — pass `capsuleState` to IdleScreen)
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt` (MODIFY ONLY IF needed — add a CenterEnd slot OR extend GlassOverlaySlot with alignment hint to support vertical centering on the right edge)
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayerSlots.kt` (MODIFY ONLY IF needed)
- `android/app/src/test/java/com/laneshadow/ui/templates/IdleScreenRetrofitTest.kt` (NEW)
- `android/app/src/test/java/com/laneshadow/ui/idle/IdleViewModelTest.kt` (MODIFY — add 3 new test methods for capsule derivation)

**Write-Prohibited:**
- `ios/**`, `server/**`, `react-native/**`, `tokens/**`
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSContextCapsule.kt` — owned by CAPS-S07-T02 (read-only consume)
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapControls.kt` — owned by CAPS-S07-T04 (read-only consume)
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` — Sprint 06 owned
- `android/app/src/androidTest/**` — instrumented updates live in CAPS-S07-T08

## Design

**Token Recipe:**
- Capsule position: Top-overlay centered slot (LSMapLayer.topOverlays first slot, alignment center)
- Controls position: Right-edge **vertically-centered** slot (`Modifier.align(Alignment.CenterEnd).padding(end = theme.space.md)`). This is the canonical placement codified 2026-05-06 — the workbar reads as map chrome rather than topbar accessory, matches React Native production, and keeps every chip within comfortable thumb-reach
- Idle today: `CapsuleState.Idle(scope=TODAY, headline=builders.italicScopeAnnotated('today', firstName), metaItems=[day, '$temp°F', condition], isWarning=showAdvisory)`
- Idle tonight: same with scope=TONIGHT, headline 'tonight'
- Idle warning: `CapsuleState.Idle(headline=builders.italicScopeAnnotated('prettiest', null) for 'Not the prettiest day for it.', metaItems include rain/snow accumulation, isWarning=true)`
- All other tokens inherited from CAPS-S07-T02 (capsule molecule) and CAPS-S07-T04 (controls organism)

**Pattern:** Mirror IDLE-S06-AND-T01's flow-composition pattern (`combine` + `_state.update` inside `observeX()`) for `capsuleState`; mirror IdleScreen's existing `topOverlays` slot model for capsule + controls mounting.

**Anti-Pattern:** Re-implementing LSMapLayer / LSMap / Mapbox SDK lifecycle; premature Planning swap on suggestion-chip tap; removing parity testTags

**Compose Considerations:** `capsuleState: StateFlow` consumed via `state.capsuleState.collectAsStateWithLifecycle().value` — pass to LSContextCapsule. Slot ordering matters: capsule slot first (top-center, anchored below topbar), controls slot last (right-edge vertically centered, `Alignment.CenterEnd`) so they coexist at LSMapLayer z=2 in non-overlapping vertical regions without collision.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.IdleScreenRetrofitTest.capsule_replaces_legacy_greeting_overlay'` |
| AC-2 | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.IdleScreenRetrofitTest.map_controls_mounted_center_end'` |
| AC-3 | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.capsule_state_reflects_evening_greeting'` |
| AC-4 | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.advisory_severity_flips_capsule_warning'` |
| AC-5 | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.suggestion_chip_tap_keeps_capsule_idle'` |
| AC-6 | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.IdleScreenRetrofitTest.existing_testtags_preserved'` |
| greeting-deleted | `grep -c 'fun GreetingOverlay' android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt  # expect 0` |
| build | `./gradlew :app:assembleDebug` |
| compile | `./gradlew :app:compileDebugKotlin` |
| lint | `./gradlew detekt` |
| tokens | `scripts/tokens/enforce-native-compliance.sh` |

## Agent Assignment

**Agent:** kotlin-implementer
**Rationale:** Compose template-level wiring + ViewModel state derivation via `combine()` + Hilt-aware test fakes. Matches kotlin-implementer's template+ViewModel remit and the Sprint 06 IDLE-S06-AND-T01 / IDLE-S06-AND-T02 patterns.

## Coding Standards

- `RULES.md` §Cross-Platform Component Parity — testTags must match iOS T05 (`idle-context-capsule`, `idle-map-controls`)
- `RULES.md` §Accessibility Standards (Android) — capsule headline exposed as `Modifier.semantics { heading() }` since it's the page primary heading
- `RULES.md` §Verification Standards
- `brain/docs/mobile-architecture/android-principles.md` — UDF: ViewModel exposes StateFlow, View collects, no two-way data flow
- `brain/docs/mobile-architecture/performance-optimization.md` — `Flow.combine + StateFlow.collectAsStateWithLifecycle` is canonical

## Dependencies

**Depends on:** CAPS-S07-T02 (LSContextCapsule), CAPS-S07-T04 (LSMapControls)
**Blocks:** CAPS-S07-T08, CAPS-S07-T09 (sprint gate)
**Parallel:** CAPS-S07-T05 (iOS twin)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN retrofitted IdleScreen WHEN rendered THEN idle-context-capsule node present, legacy greeting tags absent","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.IdleScreenRetrofitTest.capsule_replaces_legacy_greeting_overlay'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN retrofitted IdleScreen WHEN rendered THEN idle-map-controls node right-edge vertically centered","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.IdleScreenRetrofitTest.map_controls_mounted_center_end'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN evening + Marcus state WHEN consumed THEN capsule renders italic 'tonight' + 3 meta labels","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.capsule_state_reflects_evening_greeting'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN ADVISORY severity WHEN processed THEN capsuleState.isWarning=true; LSAdvisoryCard absent","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.advisory_severity_flips_capsule_warning'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN suggestion-chip tap WHEN processed THEN capsuleState remains Idle","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.suggestion_chip_tap_keeps_capsule_idle'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN retrofitted IdleScreen WHEN rendered THEN chat-input/ls-topbar/idlescreen-map tags preserved","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.IdleScreenRetrofitTest.existing_testtags_preserved'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"Capsule node present, legacy tags absent","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.IdleScreenRetrofitTest.capsule_replaces_legacy_greeting_overlay'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Map controls right-edge vertically centered","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.IdleScreenRetrofitTest.map_controls_mounted_center_end'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Capsule reflects evening greeting","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.capsule_state_reflects_evening_greeting'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"ADVISORY → isWarning=true","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.advisory_severity_flips_capsule_warning'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Suggestion chip → capsule stays Idle","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.suggestion_chip_tap_keeps_capsule_idle'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Existing testTags preserved","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.IdleScreenRetrofitTest.existing_testtags_preserved'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"}
  ]
}
-->
