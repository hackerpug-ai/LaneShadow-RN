# IDLE-S06-REM-IOS-T02 — iOS idle input place autocomplete

```
TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
SPRINT:     sprint-06-idlescreen -> ./SPRINT.md
PRD_REFS:   UC-CHAT-01, UC-MAP-01

RUNTIME_COMMANDS:
  test:      xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests -only-testing:LaneShadowTests/IdleScreenWiringTests
  typecheck: xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftlint lint ios/LaneShadow/Features/Idle ios/LaneShadow/Views/Molecules ios/LaneShadow/Services
```

---

## OUTCOME

When an iOS rider types in the Sprint 06 idle input, the app shows up to three Mapbox-backed place recommendations and selecting one primes the input without starting routing.

---

## CRITICAL CONSTRAINTS

- **MUST** call Convex `actions/places:suggestPlaces` and `actions/places:retrievePlace`; iOS must not call Mapbox Search directly.
- **MUST** keep static ride suggestion chips for empty input and replace them with place recommendations only while the typed query is active.
- **MUST** cap visible place recommendations at 3 even if backend or test fakes return more.
- **NEVER** start planning, move the map camera, add markers, or draw routes when a place recommendation is selected.
- **STRICTLY** avoid adding Google Places SDK dependencies; this remediation uses the Mapbox Search Box Convex contract.

---

## DONE WHEN

- [ ] AC-1: Typing two or more characters triggers debounced Convex autocomplete with current/fallback proximity (PRIMARY)
- [ ] AC-2: Empty or one-character input cancels autocomplete and restores static ride suggestion chips
- [ ] AC-3: The visible idle input recommendation list renders at most three accessible rows
- [ ] AC-4: Selecting a recommendation retrieves the place, fills the input, stores selected metadata, and does not start planning
- [ ] AC-5: Stale autocomplete responses cannot overwrite newer query results
- [ ] AC-6: Autocomplete failures show a recoverable inline state without disabling existing idle input behavior
- [ ] Runtime commands above exit 0

---

## ACCEPTANCE CRITERIA

### AC-1: Debounced autocomplete request [PRIMARY]
- **GIVEN** the idle input is enabled and current/fallback location is known
- **WHEN** the rider types `Bi`
- **THEN** `IdleViewModel` calls `suggestPlaces(query:"Bi", proximity: current/fallback coordinate, sessionToken: active UUID)` after the debounce interval
- **VERIFY:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_typingTwoCharactersTriggersDebouncedSuggest`

### AC-2: Short query restores static chips
- **GIVEN** place recommendations are visible from a previous query
- **WHEN** the rider clears the input or leaves one non-space character
- **THEN** autocomplete results are cleared, any in-flight request is ignored, and the original idle ride suggestion chips are visible again
- **VERIFY:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_shortQueryClearsAutocompleteRestoresRideChips`

### AC-3: Max-three accessible recommendations
- **GIVEN** the Convex client returns five place suggestions
- **WHEN** `IdleScreenContainer` renders the idle input dropdown
- **THEN** exactly three recommendation rows are visible with `accessibilityLabel` values containing the place name and label
- **VERIFY:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_rendersAtMostThreeAccessibleRecommendations`

### AC-4: Selection primes only
- **GIVEN** three recommendations are visible
- **WHEN** the rider taps `Big Sur`
- **THEN** the input value becomes the selected place label, selected place metadata is stored, and no planning session is created until Send is tapped
- **VERIFY:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_selectRecommendationPrimesInputWithoutPlanning`

### AC-5: Stale responses ignored
- **GIVEN** requests for `Bi` and `Big` are in flight
- **WHEN** the `Bi` response returns after the `Big` response
- **THEN** the visible recommendations still correspond to `Big`
- **VERIFY:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_staleAutocompleteResponseIgnored`

### AC-6: Failure is recoverable
- **GIVEN** Convex returns an autocomplete error
- **WHEN** the idle input processes the error
- **THEN** a non-blocking autocomplete error state appears and typing a later valid query can replace it with recommendations
- **VERIFY:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_autocompleteFailureRecoversOnNextQuery`

---

## TEST CRITERIA

| ID | Statement | Maps To | Type |
|----|-----------|---------|------|
| TC-1 | `suggestPlaces` is called once after debounce when query length is two | AC-1 | happy_path |
| TC-2 | Proximity equals current or fallback coordinate when autocomplete starts | AC-1 | contract |
| TC-3 | Autocomplete results are empty when query length is one | AC-2 | edge_case |
| TC-4 | Static ride chips are visible when query length is zero | AC-2 | edge_case |
| TC-5 | Recommendation row count equals three when five suggestions are returned | AC-3 | contract |
| TC-6 | Recommendation rows expose accessibility labels when rendered | AC-3 | accessibility |
| TC-7 | Selected place metadata is non-nil after recommendation tap | AC-4 | happy_path |
| TC-8 | `createPlanningSession` call count remains zero after recommendation tap | AC-4 | guardrail |
| TC-9 | Newer query results remain visible when an older response resolves later | AC-5 | concurrency |
| TC-10 | Autocomplete error state clears after a later successful query | AC-6 | error_recovery |

---

## SCOPE

**writeAllowed:**
- `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` (MODIFY)
- `ios/LaneShadow/Features/Idle/IdleViewModel.swift` (MODIFY)
- `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` (MODIFY)
- `ios/LaneShadow/Views/Molecules/LSChatInput.swift` (MODIFY)
- `ios/LaneShadowTests/Features/Idle/IdlePlaceAutocompleteTests.swift` (NEW)
- `ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift` (MODIFY only for regression coverage)
- `ios/LaneShadowTests/Helpers/StubLaneShadowConvexClient.swift` (MODIFY)

**writeProhibited:**
- `ios/project.yml` and `ios/LaneShadow.xcodeproj/**` - no dependency or generated-project changes for this task
- `server/**` - owned by IDLE-S06-REM-CVX-T02
- `android/**` - owned by IDLE-S06-REM-AND-T02
- Map camera, marker, route polyline, or planning-state files

---

## BOUNDARIES

✅ **Always:**
- Generate one autocomplete session UUID per input-focus/search session.
- Debounce typed autocomplete by 300 ms.
- Cancel or ignore stale tasks before applying response state.
- Keep Send as the only planning trigger.

⚠️ **Ask First:**
- Moving chat input state entirely out of `IdleScreenContainer`.
- Adding a new design-system molecule instead of extending `LSChatInput`.
- Persisting selected place metadata beyond the current idle input session.

---

## DELIVERABLE

- `ConvexClient+LaneShadow.swift` (MODIFY): add `suggestPlaces`/`retrievePlace` action enum cases, DTOs, and `LaneShadowPlanningDataProviding` methods.
- `IdleViewModel.swift` (MODIFY): add query handling, session token, debounced autocomplete task, selected place, stale-response guard, and recovery state.
- `LSChatInput.swift` (MODIFY): render autocomplete dropdown/loading/error states under the input and hide static chips during active query recommendations.
- `IdlePlaceAutocompleteTests.swift` (NEW): ViewModel and rendered-container coverage for AC-1 through AC-6.

---

## AGENT INSTRUCTIONS

For each AC, write the failing Swift Testing or XCTest assertion first. Use a fake `LaneShadowPlanningDataProviding` implementation; do not require live Mapbox, Clerk, or Convex for unit tests. Keep selection as input priming only.

---

## READING LIST

1. `ios/LaneShadow/Features/Idle/IdleViewModel.swift` - current location, suggestion-chip, and planning-submit state
2. `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` - current local `chatInputValue` and idle overlay wiring
3. `ios/LaneShadow/Views/Molecules/LSChatInput.swift` - static chip row and trailing send/filter affordance
4. `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` - action enum, DTO, and protocol patterns
5. `ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift` - current no-immediate-planning test pattern
6. `.spec/design/system/views/mapapp/idle/idle-screen.html` - idle input visual reference

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Idle autocomplete tests | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests -only-testing:LaneShadowTests/IdleScreenWiringTests` | Exit 0 |
| iOS build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` | Exit 0 |
| SwiftLint | `swiftlint lint ios/LaneShadow/Features/Idle ios/LaneShadow/Views/Molecules ios/LaneShadow/Services` | Exit 0 |
| Token compliance | `scripts/tokens/enforce-native-compliance.sh` | Exit 0 |

---

## OUT OF SCOPE

- Backend action implementation
- Android parity implementation
- Manual PlanRideSheet
- Map camera movement or selected-place pins
- Routing or planning submission changes

---

## REVIEW

Reviewer must verify the production `IdleScreenContainer` path, not only sandbox previews. Recommendation selection must not create a planning session before explicit Send.

---

## DESIGN

**References:** `.spec/design/system/views/mapapp/idle/README.md`, `.spec/design/system/views/mapapp/idle/idle-screen.html`

**Pattern:** Production idle ViewModel owns external data; `LSChatInput` remains a reusable molecule with explicit state inputs.

**Pattern source:** `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` and `ios/LaneShadow/Views/Molecules/LSChatInput.swift`.

**Anti-pattern:** Reusing the static suggestion-chip row as fake place results or hiding autocomplete in a separate manual-mode sheet.

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-REM-CVX-T02, IDLE-S06-REM-IOS-T01
- **Blocks:** IDLE-S06-REM-GATE-T02

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
      "description": "GIVEN idle input enabled and location known WHEN rider types two characters THEN IdleViewModel calls suggestPlaces after debounce with proximity and session token",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_typingTwoCharactersTriggersDebouncedSuggest",
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
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_shortQueryClearsAutocompleteRestoresRideChips",
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
      "description": "GIVEN Convex returns five suggestions WHEN IdleScreenContainer renders dropdown THEN exactly three accessible recommendation rows are visible",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_rendersAtMostThreeAccessibleRecommendations",
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
      "description": "GIVEN recommendations visible WHEN rider taps Big Sur THEN input fills, selected metadata stores, and no planning session is created",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_selectRecommendationPrimesInputWithoutPlanning",
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
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_staleAutocompleteResponseIgnored",
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
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_autocompleteFailureRecoversOnNextQuery",
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
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_typingTwoCharactersTriggersDebouncedSuggest",
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
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_typingTwoCharactersTriggersDebouncedSuggest",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Autocomplete results are empty when query length is one",
      "maps_to_ac": "AC-2",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_shortQueryClearsAutocompleteRestoresRideChips",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Static ride chips are visible when query length is zero",
      "maps_to_ac": "AC-2",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_shortQueryClearsAutocompleteRestoresRideChips",
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
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_rendersAtMostThreeAccessibleRecommendations",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Recommendation rows expose accessibility labels when rendered",
      "maps_to_ac": "AC-3",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_rendersAtMostThreeAccessibleRecommendations",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Selected place metadata is non-nil after recommendation tap",
      "maps_to_ac": "AC-4",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_selectRecommendationPrimesInputWithoutPlanning",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "createPlanningSession call count remains zero after recommendation tap",
      "maps_to_ac": "AC-4",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_selectRecommendationPrimesInputWithoutPlanning",
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
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_staleAutocompleteResponseIgnored",
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
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests/test_autocompleteFailureRecoversOnNextQuery",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    }
  ]
}
-->
