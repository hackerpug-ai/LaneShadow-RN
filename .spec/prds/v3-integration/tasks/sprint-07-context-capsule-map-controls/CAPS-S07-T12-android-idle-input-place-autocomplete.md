# CAPS-S07-T12 — Android idle input place autocomplete
> Status: ✅ Done
> Cycle: 2
> Commit: ff1d0782
> Updated: 2026-05-06T17:41:02-07:00

```
TASK_TYPE:  FEATURE
STATUS:     Done (carried forward; requires post-design-gate walkthrough)
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
SPRINT:     sprint-07-context-capsule-map-controls -> ./SPRINT.md
PRD_REFS:   UC-CHAT-01, UC-MAP-01

RUNTIME_COMMANDS:
  test:      ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest' --tests 'com.laneshadow.services.ConvexClientProviderTest'
  typecheck: ./gradlew :app:compileDebugKotlin
  lint:      ./gradlew detekt
```

---

## Sprint 7 Carry-Forward

This task was originally executed during Sprint 06 remediation and was moved into Sprint 07 on 2026-05-07. The code-level implementation remains recorded at commit `ff1d0782`; final Sprint 7 evidence now lives under `gate-evidence/autocomplete/` because the strict design/snapshot review tasks were deleted from scope.

## OUTCOME

When an Android rider types in the Sprint 07 retrofitted idle input, Compose shows up to three Mapbox-backed place recommendations and selection primes the input without routing.

---

## CRITICAL CONSTRAINTS

- **MUST** call Convex `actions/places:suggestPlaces` and `actions/places:retrievePlace`; Android must not call Mapbox Search directly.
- **MUST** be re-verified against the post-redesign idle screen from CAPS-S07-T06.
- **MUST** keep static ride suggestion chips for empty input and replace them with place recommendations only while typed autocomplete is active.
- **MUST** cap visible place recommendations at 3 in UI state and Compose rendering.
- **NEVER** add `com.google.android.libraries.places` or Google Places SDK/API usage for this remediation.
- **STRICTLY** keep recommendation selection separate from routing, map camera movement, markers, and planning navigation.

---

## DONE WHEN

- [x] AC-1: Typing two or more characters triggers debounced Convex autocomplete with current/fallback proximity (PRIMARY)
- [x] AC-2: Empty or one-character input cancels autocomplete and restores static ride suggestion chips
- [x] AC-3: Compose renders at most three accessible place recommendation rows
- [x] AC-4: Selecting a recommendation retrieves the place, fills input, stores selected metadata, and leaves `navigateTo == null`
- [x] AC-5: Stale autocomplete responses cannot overwrite newer query results
- [x] AC-6: Autocomplete failures are recoverable without disabling the idle input
- [x] Runtime commands above exit 0

---

## ACCEPTANCE CRITERIA

### AC-1: Debounced autocomplete request [PRIMARY]
- **GIVEN** the idle input is enabled and current/fallback location is known
- **WHEN** the rider types `Bi`
- **THEN** `IdleViewModel` calls `ConvexClientProvider.suggestPlaces(query="Bi", proximity=current/fallback, sessionToken=active UUID)` after the debounce interval
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.typingTwoCharacters_triggersDebouncedSuggest'`

### AC-2: Short query restores static chips
- **GIVEN** place recommendations are visible from a previous query
- **WHEN** the rider clears the input or leaves one non-space character
- **THEN** autocomplete results are cleared, in-flight results are ignored, and static idle ride chips are visible again
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.shortQuery_clearsAutocompleteRestoresRideChips'`

### AC-3: Max-three accessible recommendations
- **GIVEN** the fake Convex provider returns five suggestions
- **WHEN** `IdleScreen` renders the chat input recommendation dropdown
- **THEN** exactly three rows with stable test tags and content descriptions are emitted
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.rendersAtMostThreeAccessibleRecommendations'`

### AC-4: Selection primes only
- **GIVEN** three recommendations are visible
- **WHEN** the rider taps `Big Sur`
- **THEN** `inputValue` becomes the selected place label, `selectedPlace` is set, and `navigateTo` remains `null`
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.selectRecommendation_primesInputWithoutNavigation'`

### AC-5: Stale responses ignored
- **GIVEN** requests for `Bi` and `Big` are in flight
- **WHEN** the `Bi` response returns after the `Big` response
- **THEN** the visible recommendations still correspond to `Big`
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.staleAutocompleteResponse_ignored'`

### AC-6: Failure is recoverable
- **GIVEN** Convex returns an autocomplete error
- **WHEN** the idle input processes the error
- **THEN** a non-blocking autocomplete error state appears and a later valid query can replace it with recommendations
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.autocompleteFailure_recoversOnNextQuery'`

---

## TEST CRITERIA

| ID | Statement | Maps To | Type |
|----|-----------|---------|------|
| TC-1 | `suggestPlaces` is called once after debounce when query length is two | AC-1 | happy_path |
| TC-2 | Proximity equals current or fallback coordinate when autocomplete starts | AC-1 | contract |
| TC-3 | Autocomplete suggestions are empty when query length is one | AC-2 | edge_case |
| TC-4 | Static ride suggestions are visible when input is empty | AC-2 | edge_case |
| TC-5 | Recommendation row count equals three when five suggestions are returned | AC-3 | contract |
| TC-6 | Recommendation rows expose content descriptions when rendered | AC-3 | accessibility |
| TC-7 | `selectedPlace` is non-null after recommendation tap | AC-4 | happy_path |
| TC-8 | `navigateTo` remains null after recommendation tap | AC-4 | guardrail |
| TC-9 | Newer query results remain visible when an older response resolves later | AC-5 | concurrency |
| TC-10 | Autocomplete error state clears after a later successful query | AC-6 | error_recovery |

---

## SCOPE

**writeAllowed:**
- `android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt` (MODIFY)
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleUiState.kt` (MODIFY)
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt` (MODIFY)
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt` (MODIFY)
- `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt` (MODIFY)
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt` (MODIFY)
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInputTypes.kt` (MODIFY)
- `android/app/src/test/java/com/laneshadow/ui/idle/IdlePlaceAutocompleteTest.kt` (NEW)
- `android/app/src/test/java/com/laneshadow/services/ConvexClientProviderTest.kt` (MODIFY)

**writeProhibited:**
- `android/app/build.gradle.kts` - no Places SDK dependency for this task
- `ios/**` - owned by CAPS-S07-T11
- `server/**` - owned by CAPS-S07-T10
- Map camera, marker, route polyline, or planning-state files

---

## BOUNDARIES

✅ **Always:**
- Use `viewModelScope` for debounce and cancellation.
- Keep one autocomplete session token per input-focus/search session.
- Wrap Convex results in `Result<>` at the provider boundary.
- Emit stable Compose test tags for recommendation rows.

⚠️ **Ask First:**
- Adding a new repository abstraction instead of extending `ConvexClientProvider`.
- Persisting selected place metadata across app restarts.
- Changing navigation semantics for Send or suggestion taps.

---

## DELIVERABLE

- `ConvexClientProvider.kt` (MODIFY): add `suggestPlaces`/`retrievePlace` DTOs and action wrappers.
- `IdleUiState.kt` + `IdleViewModel.kt` (MODIFY): add typed autocomplete state, debounce, stale-response guard, selection, and recovery handling.
- `LSChatInput.kt` / `IdleScreen.kt` / `IdleRoute.kt` (MODIFY): render recommendation dropdown and route events through ViewModel.
- `IdlePlaceAutocompleteTest.kt` (NEW): unit/Compose-facing tests for AC-1 through AC-6.

---

## AGENT INSTRUCTIONS

For each AC, write the failing Kotlin test first. Use fake `ConvexGateway` / `ConvexClientProvider` seams and fake repositories; do not require live Clerk, Convex, Mapbox, emulator networking, or a Google Places dependency for unit tests.

---

## READING LIST

1. `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt` - current input, location, and navigation state
2. `android/app/src/main/java/com/laneshadow/ui/idle/IdleUiState.kt` - state surface to extend
3. `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt` - visible idle template path
4. `android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt` - chip row and input bar rendering
5. `android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt` - Convex action wrapper and fake-gateway seam
6. `android/app/src/test/java/com/laneshadow/ui/idle/IdleViewModelTest.kt` - current ViewModel testing pattern
7. `.spec/design/system/views/idle-screen/idle-screen.html` - idle input visual reference

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Idle autocomplete tests | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest' --tests 'com.laneshadow.services.ConvexClientProviderTest'` | Exit 0 |
| Kotlin compile | `./gradlew :app:compileDebugKotlin` | Exit 0 |
| Detekt | `./gradlew detekt` | Exit 0 |
| Token compliance | `scripts/tokens/enforce-native-compliance.sh` | Exit 0 |

---

## OUT OF SCOPE

- Backend action implementation
- iOS parity implementation
- Manual PlanRideSheet
- Map camera movement or selected-place pins
- Routing or planning submission changes

---

## REVIEW

Reviewer must verify the production `IdleRoute` -> `IdleScreen` -> `LSChatInput` path. A selected place recommendation may only prime input state and must not navigate to planning.

---

## DESIGN

**References:** `.spec/design/system/views/idle-screen/README.md`, `.spec/design/system/views/idle-screen/idle-screen.html`

**Pattern:** `IdleUiState` is the source of truth and the template projection must be lossless for visible idle behavior.

**Pattern source:** `android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt` and `android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt`.

**Anti-pattern:** Rendering place recommendations as static suggestion chips or adding a Google Places SDK dependency.

---

## DEPENDENCIES

- **Depends on:** CAPS-S07-T06, CAPS-S07-T10, IDLE-S06-REM-AND-T01
- **Blocks:** CAPS-S07-T13

---

## CODING STANDARDS

- `RULES.md` section "Accessibility Standards"
- `RULES.md` section "Cross-Platform Component Parity"
- `/Users/justinrich/Projects/brain/docs/REQUIREMENT-TRACKING.md`
- `/Users/justinrich/Projects/brain/docs/TDD-METHODOLOGY.md`

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN idle input enabled and location known WHEN rider types two characters THEN IdleViewModel calls Convex suggestPlaces after debounce with proximity and session token",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.typingTwoCharacters_triggersDebouncedSuggest'",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN recommendations visible WHEN input is cleared or one character remains THEN autocomplete clears and static ride chips return",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.shortQuery_clearsAutocompleteRestoresRideChips'",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN fake Convex returns five suggestions WHEN IdleScreen renders dropdown THEN exactly three accessible recommendation rows emit",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.rendersAtMostThreeAccessibleRecommendations'",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN recommendations visible WHEN rider taps Big Sur THEN input fills, selectedPlace stores, and navigateTo remains null",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.selectRecommendation_primesInputWithoutNavigation'",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN Bi and Big requests are in flight WHEN Bi resolves after Big THEN visible recommendations still match Big",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.staleAutocompleteResponse_ignored'",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "GIVEN autocomplete fails WHEN later valid query succeeds THEN non-blocking error is replaced by recommendations",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.autocompleteFailure_recoversOnNextQuery'",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "suggestPlaces is called once after debounce when query length is two",
      "maps_to_ac": "AC-1",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.typingTwoCharacters_triggersDebouncedSuggest'",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Proximity equals current or fallback coordinate when autocomplete starts",
      "maps_to_ac": "AC-1",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.typingTwoCharacters_triggersDebouncedSuggest'",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Autocomplete suggestions are empty when query length is one",
      "maps_to_ac": "AC-2",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.shortQuery_clearsAutocompleteRestoresRideChips'",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Static ride suggestions are visible when input is empty",
      "maps_to_ac": "AC-2",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.shortQuery_clearsAutocompleteRestoresRideChips'",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Recommendation row count equals three when five suggestions are returned",
      "maps_to_ac": "AC-3",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.rendersAtMostThreeAccessibleRecommendations'",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Recommendation rows expose content descriptions when rendered",
      "maps_to_ac": "AC-3",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.rendersAtMostThreeAccessibleRecommendations'",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "selectedPlace is non-null after recommendation tap",
      "maps_to_ac": "AC-4",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.selectRecommendation_primesInputWithoutNavigation'",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "navigateTo remains null after recommendation tap",
      "maps_to_ac": "AC-4",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.selectRecommendation_primesInputWithoutNavigation'",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": "Newer query results remain visible when an older response resolves later",
      "maps_to_ac": "AC-5",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.staleAutocompleteResponse_ignored'",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-10",
      "type": "test_criterion",
      "description": "Autocomplete error state clears after a later successful query",
      "maps_to_ac": "AC-6",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest.autocompleteFailure_recoversOnNextQuery'",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    }
  ]
}
-->
