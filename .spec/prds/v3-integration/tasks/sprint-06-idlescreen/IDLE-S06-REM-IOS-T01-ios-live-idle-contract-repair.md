# IDLE-S06-REM-IOS-T01 — iOS live idle contract repair
> Status: ✅ Completed
> Cycle: 1
> Commit: f896ce7c3908624fb4539fd6b934025dab99f68f
> Reviewer: swift-reviewer
> Updated: 2026-05-05T07:58:56.672Z

```
TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
SPRINT:     sprint-06-idlescreen -> ./SPRINT.md
PRD_REFS:   UC-MAP-01, UC-CHAT-01, UC-FID-01

RUNTIME_COMMANDS:
  test:      xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenWiringTests -only-testing:LaneShadowTests/LocationServiceTests
  typecheck: xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --quiet ios/LaneShadow ios/LaneShadowTests
```

---

## OUTCOME

The production iOS idle map uses the fixed Convex contracts and renders the sprint-required greeting, weather meta, location state, favorite pins, and chat active state.

---

## CRITICAL CONSTRAINTS

- **MUST** update only production idle paths, their tests, and the Swift Convex client; do not hand-edit `.xcodeproj` internals.
- **MUST** render the production headline as `Where are we riding today/tonight, {firstName}?` with the scope word italicized.
- **MUST** clear `locationUnavailable` after a later successful reverse-geocode.
- **NEVER** keep Santa Cruz hardcoded for weather once a current or fallback location is available.
- **STRICTLY** separate "suggestion chip primes input" from "send starts planning"; the chip tap must not immediately dispatch planning.

---

## DONE WHEN

- [x] AC-1: Swift Convex endpoints match `actions/places:reverseGeocode` and `actions/weather:getCurrentWeather` (PRIMARY)
- [x] AC-2: Weather DTO decodes `tempF`, `condition`, `severity`, and `dayOfWeek`; meta row is uppercase
- [x] AC-3: Production greeting headline matches the sprint copy with italic scope word
- [x] AC-4: Weather fetch uses current/fallback location coordinates instead of unconditional Santa Cruz
- [x] AC-5: Suggestion chip tap primes `LSChatInput` active state without entering planning
- [x] AC-6: Reverse-geocode recovery clears unavailable state and re-enables chat
- [ ] Runtime commands above exit 0

---

## ACCEPTANCE CRITERIA

### AC-1: Swift endpoint names match Convex [PRIMARY]
- **GIVEN** fixed Convex public names
- **WHEN** `LaneShadowConvexAction` is inspected and idle view model fetches location/weather
- **THEN** Swift calls `actions/places:reverseGeocode` and `actions/weather:getCurrentWeather`
- **VERIFY:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/ConvexClientTests`

### AC-2: Weather meta row uses decoded day
- **GIVEN** weather response `{tempF:68, condition:"CLEAR", severity:"normal", dayOfWeek:"FRIDAY"}`
- **WHEN** `IdleViewModel` observes weather
- **THEN** `metaRow == "FRIDAY · 68°F · CLEAR"`
- **VERIFY:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenWiringTests`

### AC-3: Production greeting copy matches sprint
- **GIVEN** first name `Marcus` and `greetingScope == .today`
- **WHEN** `IdleScreenContainer` renders
- **THEN** the visible headline reads `Where are we riding today, Marcus?` with `today` italicized
- **VERIFY:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenWiringTests`

### AC-4: Weather follows current location
- **GIVEN** `LocationService` provides `(37.81,-122.47)`
- **WHEN** idle observation starts
- **THEN** `fetchCurrentWeather(lat:37.81,lng:-122.47)` is called before meta row emission
- **VERIFY:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LocationServiceTests`

### AC-5: Suggestion chip primes input only
- **GIVEN** idle chat input is enabled
- **WHEN** the rider taps a suggestion chip
- **THEN** input value becomes the chip primer and send affordance appears; no planning session is created until send is tapped
- **VERIFY:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenWiringTests`

### AC-6: Location recovery resets unavailable
- **GIVEN** reverse-geocode fails once, then succeeds
- **WHEN** the second location event is processed
- **THEN** `locationUnavailable == false`, `locationLabel != nil`, and `isLocationEnabled == true`
- **VERIFY:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LocationServiceTests`

---

## TEST CRITERIA

| ID | Statement | Maps To | Type |
|----|-----------|---------|------|
| TC-1 | Swift endpoint string for weather contains `actions/weather:getCurrentWeather` | AC-1 | contract |
| TC-2 | Swift endpoint string for geocode contains `actions/places:reverseGeocode` | AC-1 | contract |
| TC-3 | Meta row equals `FRIDAY · 68°F · CLEAR` when weather fixture emits Friday | AC-2 | happy_path |
| TC-4 | Headline contains `Where are we riding today, Marcus?` when scope is today | AC-3 | happy_path |
| TC-5 | Weather client receives current location coordinates when location is available | AC-4 | happy_path |
| TC-6 | Suggestion tap does not call `createPlanningSession` | AC-5 | edge_case |
| TC-7 | Successful geocode after failure clears `locationUnavailable` | AC-6 | error_recovery |

---

## SCOPE

**writeAllowed:**
- `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` (MODIFY)
- `ios/LaneShadow/Features/Idle/IdleViewModel.swift` (MODIFY)
- `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` (MODIFY)
- `ios/LaneShadow/Features/Idle/IdleWeatherTypes.swift` (MODIFY if needed)
- `ios/LaneShadow/Services/LocationService.swift` (MODIFY if a stream/test seam is needed)
- `ios/LaneShadowTests/Features/Idle/**` (MODIFY/NEW)
- `ios/LaneShadowTests/Integration/ConvexClientTests.swift` (MODIFY if endpoint contract coverage belongs there)

**writeProhibited:**
- `ios/LaneShadow.xcodeproj/project.pbxproj` - generated only
- `server/**` - owned by IDLE-S06-REM-CVX-T01
- `android/**` - owned by IDLE-S06-REM-AND-T01
- `ios/LaneShadowUITests/DesignReview/**` - owned by IDLE-S06-REM-QA-T01

---

## AGENT INSTRUCTIONS

Run ACs in order. First lock down endpoint strings and DTO decoding, then repair visible idle copy and state transitions. Use fakes for `LaneShadowPlanningDataProviding` and `LocationService` seams; do not use live Clerk or Mapbox in unit tests.

---

## READING LIST

1. `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` - endpoint enums and DTOs
2. `ios/LaneShadow/Features/Idle/IdleViewModel.swift` - weather, favorites, location, suggestion behavior
3. `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` - production idle UI
4. `ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift` - existing idle tests and fakes
5. `.spec/design/system/views/mapapp/idle/idle-screen.html` - canonical greeting and chat active design

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Idle tests | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenWiringTests -only-testing:LaneShadowTests/LocationServiceTests` | Exit 0 |
| Convex client tests | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/ConvexClientTests` | Exit 0 |
| Build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` | Exit 0 |
| Native tokens | `scripts/tokens/enforce-native-compliance.sh` | Exit 0 |

---

## OUT OF SCOPE

- XCUITest design-review capture method cleanup
- Android state plumbing
- Sprint gate evidence archival

---

## REVIEW

Reviewer must verify the production `IdleScreenContainer`, not only sandbox `IdleScreen`, and must reject any solution that still starts planning from a suggestion tap before explicit send.

---

## DESIGN

**References:** `.spec/design/system/views/mapapp/idle/idle-screen.html`, `.spec/design/system/views/mapapp/idle/README.md`

**Pattern:** View model owns live data and state transitions; production container renders the canonical map-view idle overlay.

**Anti-pattern:** Leaving sprint-required copy in sandbox templates while production shows `Good morning`.

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-REM-CVX-T01
- **Blocks:** IDLE-S06-REM-QA-T01, IDLE-S06-REM-GATE-T01

---

## CODING STANDARDS

- `RULES.md` section "Accessibility Standards"
- `RULES.md` section "Real Device E2E Testing"
- `/Users/justinrich/Projects/brain/docs/TDD-METHODOLOGY.md`

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN fixed Convex names WHEN Swift idle client calls actions THEN endpoint strings match actions/places:reverseGeocode and actions/weather:getCurrentWeather",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/ConvexClientTests",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "ios/LaneShadow/Services/ConvexClient+LaneShadow.swift:24; ios/LaneShadow/Services/ConvexClient+LaneShadow.swift:25; ios/LaneShadowTests/Integration/ConvexClientTests.swift:117; /tmp/review-convex-tests.txt EXIT_CODE:0",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "f896ce7c3908624fb4539fd6b934025dab99f68f"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN weather fixture with FRIDAY WHEN IdleViewModel observes weather THEN metaRow equals FRIDAY · 68°F · CLEAR",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenWiringTests",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "ios/LaneShadow/Services/ConvexClient+LaneShadow.swift:57; ios/LaneShadow/Services/ConvexClient+LaneShadow.swift:703; ios/LaneShadow/Features/Idle/IdleViewModel.swift:214; ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift:37; /tmp/review-idle-tests.txt EXIT_CODE:0",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "f896ce7c3908624fb4539fd6b934025dab99f68f"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN first name and today scope WHEN IdleScreenContainer renders THEN headline reads Where are we riding today, Marcus? with italic scope",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenWiringTests",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "ios/LaneShadow/Features/Idle/IdleScreenContainer.swift:60; ios/LaneShadow/Features/Idle/IdleScreenContainer.swift:63; ios/LaneShadow/Features/Idle/IdleScreenContainer.swift:64; ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift:13; /tmp/review-idle-tests.txt EXIT_CODE:0",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "f896ce7c3908624fb4539fd6b934025dab99f68f"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN current location WHEN idle observation starts THEN fetchCurrentWeather uses that coordinate",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LocationServiceTests",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "ios/LaneShadow/Features/Idle/IdleViewModel.swift:136; ios/LaneShadow/Features/Idle/IdleViewModel.swift:192; ios/LaneShadow/Features/Idle/IdleViewModel.swift:207; ios/LaneShadowTests/Features/Idle/LocationServiceTests.swift:92; /tmp/review-location-tests.txt EXIT_CODE:0",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "f896ce7c3908624fb4539fd6b934025dab99f68f"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN idle chat input WHEN suggestion chip tapped THEN input is primed and planning is not created until send",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenWiringTests",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "ios/LaneShadow/Features/Idle/IdleScreenContainer.swift:161; ios/LaneShadow/Views/Molecules/LSChatInput.swift:144; ios/LaneShadow/Views/Molecules/LSChatInput.swift:167; ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift:60; /tmp/review-idle-tests.txt EXIT_CODE:0",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "f896ce7c3908624fb4539fd6b934025dab99f68f"
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "GIVEN geocode failure then success WHEN second event processed THEN unavailable false and chat enabled",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LocationServiceTests",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "ios/LaneShadow/Features/Idle/IdleViewModel.swift:179; ios/LaneShadow/Features/Idle/IdleViewModel.swift:181; ios/LaneShadow/Features/Idle/IdleScreenContainer.swift:165; ios/LaneShadowTests/Features/Idle/LocationServiceTests.swift:123; /tmp/review-location-tests.txt EXIT_CODE:0",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "f896ce7c3908624fb4539fd6b934025dab99f68f"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Swift endpoint string for weather contains actions/weather:getCurrentWeather",
      "maps_to_ac": "AC-1",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/ConvexClientTests",
      "satisfied": true,
      "evidence": "ios/LaneShadowTests/Integration/ConvexClientTests.swift:123; /tmp/review-convex-tests.txt EXIT_CODE:0",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "f896ce7c3908624fb4539fd6b934025dab99f68f"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Swift endpoint string for geocode contains actions/places:reverseGeocode",
      "maps_to_ac": "AC-1",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/ConvexClientTests",
      "satisfied": true,
      "evidence": "ios/LaneShadowTests/Integration/ConvexClientTests.swift:118; /tmp/review-convex-tests.txt EXIT_CODE:0",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "f896ce7c3908624fb4539fd6b934025dab99f68f"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Meta row equals FRIDAY · 68°F · CLEAR when weather fixture emits Friday",
      "maps_to_ac": "AC-2",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenWiringTests",
      "satisfied": true,
      "evidence": "ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift:55; /tmp/review-idle-tests.txt EXIT_CODE:0",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "f896ce7c3908624fb4539fd6b934025dab99f68f"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Headline contains Where are we riding today, Marcus? when scope is today",
      "maps_to_ac": "AC-3",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenWiringTests",
      "satisfied": true,
      "evidence": "ios/LaneShadow/Features/Idle/IdleScreenContainer.swift:61; ios/LaneShadow/Features/Idle/IdleScreenContainer.swift:62; ios/LaneShadow/Features/Idle/IdleScreenContainer.swift:64; ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift:33; /tmp/review-idle-tests.txt EXIT_CODE:0",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "f896ce7c3908624fb4539fd6b934025dab99f68f"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Weather client receives current location coordinates when location is available",
      "maps_to_ac": "AC-4",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LocationServiceTests",
      "satisfied": true,
      "evidence": "ios/LaneShadowTests/Features/Idle/LocationServiceTests.swift:115; /tmp/review-location-tests.txt EXIT_CODE:0",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "f896ce7c3908624fb4539fd6b934025dab99f68f"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Suggestion tap does not call createPlanningSession",
      "maps_to_ac": "AC-5",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenWiringTests",
      "satisfied": true,
      "evidence": "ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift:93; /tmp/review-idle-tests.txt EXIT_CODE:0",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "f896ce7c3908624fb4539fd6b934025dab99f68f"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Successful geocode after failure clears locationUnavailable",
      "maps_to_ac": "AC-6",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LocationServiceTests",
      "satisfied": true,
      "evidence": "ios/LaneShadowTests/Features/Idle/LocationServiceTests.swift:158; /tmp/review-location-tests.txt EXIT_CODE:0",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "f896ce7c3908624fb4539fd6b934025dab99f68f"
    }
  ]
}
-->
