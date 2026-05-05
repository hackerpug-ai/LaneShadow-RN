# IDLE-S06-REM-AND-T01 — Android live idle plumbing repair
> Status: ✅ Completed
> Cycle: 2
> Commit: 9ee507d35fa3045513123bc8f8f314bbbe238589
> Reviewer: kotlin-reviewer
> Updated: 2026-05-05T08:26:17.450Z

```
TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
SPRINT:     sprint-06-idlescreen -> ./SPRINT.md
PRD_REFS:   UC-MAP-01, UC-CHAT-01, UC-FID-01

RUNTIME_COMMANDS:
  test:      ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest' --tests 'com.laneshadow.ui.atoms.LSMapTest' --tests 'com.laneshadow.ui.templates.IdleScreenTest'
  typecheck: ./gradlew :app:compileDebugKotlin
  lint:      ./gradlew detekt
```

---

## OUTCOME

The live Android idle route carries ViewModel weather, favorites, advisory, location, and chat-active state through to the rendered map view instead of dropping it in mock-state adaptation.

---

## CRITICAL CONSTRAINTS

- **MUST** make live `IdleUiState` fields reach the visible `IdleScreen`; unit tests on ViewModel state alone are not enough.
- **MUST** remove the manual-mode no-op in `LSChatInput`; rider mode changes must update state or call a real callback.
- **MUST** render favorites as copper dot pins from live favorites, not Mapbox default markers.
- **NEVER** keep `IdleRoute.toMockState()` as a lossy adapter for sprint-critical fields.
- **STRICTLY** keep Sprint 07 planning out of scope; suggestion tap primes idle input and send may continue to hand off to planning.

---

## DONE WHEN

- [x] AC-1: `IdleRoute.toMockState()` or replacement passes `favoriteLocations`, advisory fields, and no-location state to `IdleScreen` (PRIMARY)
- [x] AC-2: Live advisory weather displays `advisory-card`
- [x] AC-3: Live favorites render copper pin annotations with theme-aware specs
- [x] AC-4: Suggestion chip tap sets active input state and primer without immediate navigation
- [x] AC-5: Geocode failure sets location unavailable; later success clears it and re-enables chat
- [x] AC-6: Manual/auto pill mode change calls a real ViewModel path
- [x] AC-7: Android E2E/instrumented tags referenced by tests exist in production UI
- [ ] Runtime commands above exit 0

---

## ACCEPTANCE CRITERIA

### AC-1: Live state reaches screen [PRIMARY]
- **GIVEN** `IdleUiState` has one favorite, advisory message, and location label
- **WHEN** `IdleRoute` builds screen state
- **THEN** `IdleScreenState` contains the same favorite, advisory, and location values
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.liveState_adapter_preservesIdleFields'`

### AC-2: Advisory card renders from live state
- **GIVEN** weather severity is `ADVISORY`
- **WHEN** idle screen renders through `IdleRoute`
- **THEN** `advisory-card` exists with non-empty advisory text
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.IdleScreenTest.liveAdvisory_rendersCard'`

### AC-3: Favorite pins use copper dot style
- **GIVEN** live favorites contain one coordinate
- **WHEN** `LSMap` resolves favorite pin specs
- **THEN** one copper signal pin spec is emitted and no `default-marker` icon path is used
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.favoritePins_useCopperDotSpecs'`

### AC-4: Suggestion chip primes input
- **GIVEN** chat input is idle and location is enabled
- **WHEN** rider taps a suggestion chip
- **THEN** input value is the chip primer, send affordance is active, and `navigateTo == null`
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.suggestionChipTap_primesInputWithoutNavigation'`

### AC-5: Geocode recovery state
- **GIVEN** reverse geocode fails once, then succeeds
- **WHEN** `observeLocation` processes both outcomes
- **THEN** `locationUnavailable` changes `true -> false` and `isLocationEnabled` changes `false -> true`
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.geocodeRecovery_clearsUnavailable'`

### AC-6: Manual mode is wired
- **GIVEN** the location pill is visible
- **WHEN** rider toggles MANUAL mode
- **THEN** `IdleUiState.locationMode == "manual"` and pill tint/copy update
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.locationModeToggle_setsManual'`

### AC-7: E2E tags match production
- **GIVEN** `IdleStateE2ETest` waits for stable tags
- **WHEN** production idle UI renders
- **THEN** `idlescreen-current-user-greeting`, `suggestion-chip`, `planning-phase-indicator`, and `sessions-drawer-root` references are either emitted or the tests are updated to existing stable tags
- **VERIFY:** `./gradlew :app:compileDebugAndroidTestKotlin`

---

## TEST CRITERIA

| ID | Statement | Maps To | Type |
|----|-----------|---------|------|
| TC-1 | Adapter output retains one favorite when state contains one favorite | AC-1 | happy_path |
| TC-2 | Adapter output retains advisory message when ViewModel state contains advisory | AC-1 | happy_path |
| TC-3 | `advisory-card` renders when `showAdvisoryCard` is true | AC-2 | happy_path |
| TC-4 | Favorite pin specs contain signal copper color token | AC-3 | happy_path |
| TC-5 | Suggestion tap leaves `navigateTo` null | AC-4 | edge_case |
| TC-6 | Geocode recovery clears `locationUnavailable` | AC-5 | error_recovery |
| TC-7 | Manual mode callback changes `locationMode` to manual | AC-6 | happy_path |
| TC-8 | Android test sources compile against production tags | AC-7 | contract |

---

## Remediation Trail

| Cycle | FIX | Failed Reqs | Reviewer | At |
|---|---|---|---|---|
| 2 | FIX-IDLE-S06-REM-AND-T01-C1 | AC-5 | kotlin-reviewer | 2026-05-05T08:03:15.594Z |

## SCOPE

**writeAllowed:**
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleUiState.kt` (MODIFY)
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt` (MODIFY)
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt` (MODIFY)
- `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt` (MODIFY)
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt` (MODIFY)
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` (MODIFY)
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMapTypes.kt` (MODIFY)
- `android/app/src/test/java/com/laneshadow/ui/idle/IdleViewModelTest.kt` (MODIFY)
- `android/app/src/test/java/com/laneshadow/ui/atoms/LSMapTest.kt` (MODIFY)
- `android/app/src/testDebug/java/com/laneshadow/ui/templates/IdleScreenTest.kt` (MODIFY)
- `android/app/src/androidTest/java/com/laneshadow/e2e/mapview/IdleStateE2ETest.kt` (MODIFY only for tag alignment)

**writeProhibited:**
- `server/**` - owned by IDLE-S06-REM-CVX-T01
- `ios/**` - owned by iOS remediation tasks
- `tokens/**` unless token compliance fails from existing token use

---

## AGENT INSTRUCTIONS

Start with tests proving data loss through `IdleRoute.toMockState()`. Then remove the loss, wire chat/location state, and only then touch map pin rendering. Avoid wide rewrites: this is a repair task for Sprint 06 idle state, not a navigation architecture rewrite.

---

## READING LIST

1. `android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt` - lossy adapter
2. `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt` - current state transitions
3. `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt` - rendered idle template
4. `android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt` - manual mode no-op and send/filter state
5. `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` - current favorite marker implementation

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Idle unit tests | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest'` | Exit 0 |
| Map unit tests | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest'` | Exit 0 |
| Template tests | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.IdleScreenTest'` | Exit 0 |
| Android test compile | `./gradlew :app:compileDebugAndroidTestKotlin` | Exit 0 |
| Typecheck | `./gradlew :app:compileDebugKotlin` | Exit 0 |
| Detekt | `./gradlew detekt` | Exit 0 |

---

## OUT OF SCOPE

- Full Hilt/Convex live auth E2E
- Planning screen behavior beyond preserving `navigateTo == null` until send
- Backend endpoint repairs

---

## REVIEW

Reviewer must inspect the rendered path, not just ViewModel fields. A pass requires proof that favorites/advisory/location/chat-active state is visible in the UI path used by `IdleRoute`.

---

## DESIGN

**References:** `.spec/design/system/views/idle-screen/idle-screen.html`, `.spec/design/system/views/idle-screen/README.md`

**Pattern:** `IdleUiState` is the source of truth; template state is a lossless projection for the idle design component.

**Anti-pattern:** Dropping live fields because the template still uses `IdleMockProvider` types.

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-REM-CVX-T01
- **Blocks:** IDLE-S06-REM-GATE-T01

---

## CODING STANDARDS

- `RULES.md` section "Accessibility Standards"
- `RULES.md` section "Cross-Platform Component Parity"
- `/Users/justinrich/Projects/brain/docs/ANTI-STUB-REVIEW.md`

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN IdleUiState has favorite/advisory/location WHEN IdleRoute builds screen state THEN same values reach IdleScreenState",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.liveState_adapter_preservesIdleFields'",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt:63-83 maps favoriteLocations, advisoryMessage, showAdvisoryCard, locationLabel, locationMode, and isNoLocation into IdleScreenState without dropping live idle fields.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "9ee507d35fa3045513123bc8f8f314bbbe238589"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN weather severity advisory WHEN idle screen renders THEN advisory-card exists with text",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.IdleScreenTest.liveAdvisory_rendersCard'",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt:190-199 sets advisory state from live weather severity, and android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt:208-212 renders LSAdvisoryCard when showAdvisoryCard is true.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "9ee507d35fa3045513123bc8f8f314bbbe238589"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN live favorite coordinate WHEN LSMap resolves pins THEN one copper dot spec emits and default-marker is not used",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.favoritePins_useCopperDotSpecs'",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "android/app/src/main/java/com/laneshadow/ui/atoms/LSMapTypes.kt:406-416 resolves favorite pin specs with Signal fill and Surface.card ring tokens, and android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt:262-268 renders those favorites with createFavoritePinBitmap instead of a default-marker icon path.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "9ee507d35fa3045513123bc8f8f314bbbe238589"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN chat input idle WHEN suggestion tapped THEN input primed and navigateTo remains null",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.suggestionChipTap_primesInputWithoutNavigation'",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt:55-63 primes inputValue and keeps navigateTo null, and android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt:32-39 wires suggestion taps through that ViewModel path.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "9ee507d35fa3045513123bc8f8f314bbbe238589"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN geocode fails then succeeds WHEN observeLocation handles both THEN unavailable clears and chat enables",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.geocodeRecovery_clearsUnavailable'",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt:65-71 retries observeLocation when the rider switches back to auto mode, and android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt:226-270 clears locationUnavailable / restores isLocationEnabled on a later successful geocode; android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt:75-82 plus android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt:145-150 project that recovered state back into enabled chat.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "9ee507d35fa3045513123bc8f8f314bbbe238589"
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "GIVEN location pill visible WHEN manual toggled THEN IdleUiState.locationMode becomes manual",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.locationModeToggle_setsManual'",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt:145-148 forwards the pill toggle, android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt:39 passes it to the ViewModel, and android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt:65-68 updates IdleUiState.locationMode to the requested mode.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "9ee507d35fa3045513123bc8f8f314bbbe238589"
    },
    {
      "id": "AC-7",
      "type": "acceptance_criterion",
      "description": "GIVEN Android E2E tag references WHEN androidTest compiles THEN production tags and tests align",
      "verify": "./gradlew :app:compileDebugAndroidTestKotlin",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "./gradlew :app:compileDebugAndroidTestKotlin passed (EXIT_CODE:0); stable production tags exist at android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt:122, android/app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt:43, android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt:131, and android/app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt:171.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "9ee507d35fa3045513123bc8f8f314bbbe238589"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Adapter output retains one favorite when state contains one favorite",
      "maps_to_ac": "AC-1",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.liveState_adapter_preservesIdleFields'",
      "satisfied": true,
      "evidence": "Command passed: ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.idle.IdleViewModelTest.liveState_adapter_preservesIdleFields (EXIT_CODE:0)",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "9ee507d35fa3045513123bc8f8f314bbbe238589"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Adapter output retains advisory message when ViewModel state contains advisory",
      "maps_to_ac": "AC-1",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.liveState_adapter_preservesIdleFields'",
      "satisfied": true,
      "evidence": "Command passed: ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.idle.IdleViewModelTest.liveState_adapter_preservesIdleFields (EXIT_CODE:0)",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "9ee507d35fa3045513123bc8f8f314bbbe238589"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "advisory-card renders when showAdvisoryCard is true",
      "maps_to_ac": "AC-2",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.IdleScreenTest.liveAdvisory_rendersCard'",
      "satisfied": true,
      "evidence": "Command passed: ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.templates.IdleScreenTest.liveAdvisory_rendersCard (EXIT_CODE:0)",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "9ee507d35fa3045513123bc8f8f314bbbe238589"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Favorite pin specs contain signal copper color token",
      "maps_to_ac": "AC-3",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.favoritePins_useCopperDotSpecs'",
      "satisfied": true,
      "evidence": "Command passed: ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.atoms.LSMapTest.favoritePins_useCopperDotSpecs (EXIT_CODE:0)",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "9ee507d35fa3045513123bc8f8f314bbbe238589"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Suggestion tap leaves navigateTo null",
      "maps_to_ac": "AC-4",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.suggestionChipTap_primesInputWithoutNavigation'",
      "satisfied": true,
      "evidence": "Command passed: ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.idle.IdleViewModelTest.suggestionChipTap_primesInputWithoutNavigation (EXIT_CODE:0)",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "9ee507d35fa3045513123bc8f8f314bbbe238589"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Geocode recovery clears locationUnavailable",
      "maps_to_ac": "AC-5",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.geocodeRecovery_clearsUnavailable'",
      "satisfied": true,
      "evidence": "Command passed: ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.idle.IdleViewModelTest.geocodeRecovery_clearsUnavailable (EXIT_CODE:0)",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "9ee507d35fa3045513123bc8f8f314bbbe238589"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Manual mode callback changes locationMode to manual",
      "maps_to_ac": "AC-6",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.locationModeToggle_setsManual'",
      "satisfied": true,
      "evidence": "Command passed: ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.idle.IdleViewModelTest.locationModeToggle_setsManual (EXIT_CODE:0)",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "9ee507d35fa3045513123bc8f8f314bbbe238589"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "Android test sources compile against production tags",
      "maps_to_ac": "AC-7",
      "verify": "./gradlew :app:compileDebugAndroidTestKotlin",
      "satisfied": true,
      "evidence": "Command passed: ./gradlew :app:compileDebugAndroidTestKotlin (EXIT_CODE:0)",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "9ee507d35fa3045513123bc8f8f314bbbe238589"
    }
  ]
}
-->
