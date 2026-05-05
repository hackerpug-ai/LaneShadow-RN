# IDLE-S06-IOS-T03 — iOS LocationService + reverse-geocode pill + MANUAL/AUTO/NEEDED toggle + LSChatInput is-active

```
TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
SPRINT:     sprint-06-idlescreen → ../SPRINT.md
PRD_REFS:   UC-CHAT-01, UC-FID-01

RUNTIME_COMMANDS:
  test:      xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: xcodebuild ... build
  lint:      swiftformat --quiet
  project:   bash scripts/ios/generate-project.sh
```

---

## OUTCOME

A new `LocationService` exposes CoreLocation coordinate, mode (`.auto|.manual|.needed`), and reverse-geocoded place label (`"Near {city}, {state}"`) — wired through `IdleViewModel` to populate `LSLocationContextBar`. MANUAL toggle copper-tints the mode pill and locks the coordinate. Suggestion-chip tap populates `chatInputValue`, swapping the filter button for a copper send button.

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** create `ios/LaneShadow/Services/LocationService.swift` as `@MainActor @Observable final class` with `currentCoordinate: CLLocationCoordinate2D?`, `mode: LocationMode`, `placeLabel: String?`, and `func toggleMode()`.
- **MUST** add the new file to `ios/project.yml` and run `scripts/ios/generate-project.sh` to regenerate `ios/LaneShadow.xcodeproj` — never hand-edit `.pbxproj`.
- **MUST** add Convex action case `getReverseGeocode` to `LaneShadowConvexAction` enum + `func reverseGeocode(lat:Double, lng:Double) async throws -> String?` on `LaneShadowPlanningDataProviding` (formats result as `"Near {city}, {state}"`).
- **MUST** inject `LocationService` into `IdleViewModel` via init parameter (slot reserved by T02). VM observes coordinate stream + calls `convexClient.reverseGeocode` when coordinate updates >50m.
- **MUST** wire LSChatInput is-active state: chip tap sets `chatInputValue` to chip label → existing `value.isEmpty` check on `LSChatInput.swift:144` swaps filter→send button.
- **MUST** wire MANUAL toggle: tapping the mode pill calls `locationService.toggleMode()`; `LSLocationContextBar` modePill foreground switches to `LaneShadowTheme.color.signal.default` (copper) when `mode == .manual`.
- **MUST** request `CLLocationManager.requestWhenInUseAuthorization()` at service init; permission denial → `mode = .needed`, `placeLabel = "Set a start point"`.
- **NEVER** store `CLLocationManager` directly; bridge delegate via private inner coordinator class (CLLocationManager is not `Sendable`).
- **NEVER** call reverse-geocode on every GPS update — debounce at 50m via `CLLocation.distance(from:)`.
- **NEVER** add CoreLocation usage to `IdleScreen.swift` or `IdleViewModel.swift` — all CoreLocation coupling is isolated in `LocationService.swift`.
- **STRICTLY** the chip→is-active is driven by non-empty `chatInputValue` binding; do NOT modify `LSChatInput.swift` internal logic.

---

## DONE WHEN

- [ ] AC-1: Location pill shows `"Near {city}, {state}"` from reverse-geocode (PRIMARY)
- [ ] AC-2: MANUAL toggle copper-tints mode pill and locks coordinate
- [ ] AC-3: AUTO toggle resumes live coordinate updates after manual lock
- [ ] AC-4: Permission denied transitions mode to `.needed` with fallback label
- [ ] AC-5: Chip tap populates `chatInputValue` and triggers send button
- [ ] AC-6: Reverse-geocode debounced — only called when distance > 50m
- [ ] All `xcodebuild test` exits 0; `IdleScreen.swift` no_data_fetching_symbols still passes
- [ ] `git diff --name-only` ⊆ writeAllowed

---

## ACCEPTANCE CRITERIA

### AC-1: Location pill shows "Near {city}, {state}" [PRIMARY]
- **GIVEN** LocationService in auto mode with valid coordinate (36.97, -122.02)
- **WHEN** reverse-geocode resolves to ('Santa Cruz', 'CA')
- **THEN** `locationContext.label == "Near Santa Cruz, CA"` and LSChatInput pill displays it
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/placeLabel_formatsNearCityState`

### AC-2: MANUAL toggle copper-tints mode pill and locks coordinate
- **GIVEN** LocationService mode is `.auto` with coordinate (36.97, -122.02)
- **WHEN** `toggleMode()` is called
- **THEN** mode → `.manual`; coordinate frozen at last auto value; LSLocationContextBar modePill foreground = `LaneShadowTheme.color.signal.default`
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/manualToggle_locksCoordinate`

### AC-3: AUTO toggle resumes live coordinate updates
- **GIVEN** LocationService mode is `.manual`
- **WHEN** `toggleMode()` is called again
- **THEN** mode → `.auto`; CLLocationManager updates restarted; coordinate updates resume on next GPS fix
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/autoToggle_resumesLiveTracking`

### AC-4: Permission denied → .needed
- **GIVEN** CLLocationManager authorization returns `.denied` or `.restricted`
- **WHEN** LocationService processes the callback
- **THEN** `mode == .needed`; `placeLabel == "Set a start point"`; `IdleScreenState.locationContext.mode == "needed"`; LSChatInput `isEnabled == false`, placeholder = "Set a start point to begin…"
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/permission_denied_transitionsToNeeded`

### AC-5: Chip tap populates chatInputValue and triggers send button
- **GIVEN** `IdleScreenContainer` rendered with `chipIsActive == false` and `chatInputValue == ""`
- **WHEN** user taps "Twisty back roads" suggestion chip
- **THEN** `chatInputValue == "Twisty back roads"`; trailing slot shows `lschatinput-send` not `lschatinput-filter`
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/IdleScreenWiringTests/chipTap_populatesInputAndShowsSend`

### AC-6: Reverse-geocode debounced (>50m)
- **GIVEN** LocationService has last-geocoded coordinate (36.97, -122.02)
- **WHEN** new GPS fix arrives at (36.971, -122.021) — ~130m away
- **THEN** `reverseGeocode` IS called (>50m); if new fix only 20m away, action is NOT called
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/reverseGeocode_debounced_50m`

---

## TEST CRITERIA

| ID    | Statement                                                                          | Maps To | Type        |
|-------|------------------------------------------------------------------------------------|---------|-------------|
| TC-1  | (36.97,-122.02) + reverseGeocode → "Near Santa Cruz, CA"                           | AC-1    | happy_path  |
| TC-2  | toggleMode from .auto → mode=.manual + coordinate frozen                           | AC-2    | happy_path  |
| TC-3  | toggleMode from .manual → mode=.auto + tracking resumed                            | AC-3    | happy_path  |
| TC-4  | authorization .denied → mode=.needed + placeLabel='Set a start point'              | AC-4    | edge_case   |
| TC-5  | chip tap sets chatInputValue + send button visible                                 | AC-5    | happy_path  |
| TC-6  | reverseGeocode only fires when new coord >50m from last geocoded                   | AC-6    | edge_case   |

---

## SCOPE

**writeAllowed:**
- `ios/LaneShadow/Services/LocationService.swift` (NEW)
- `ios/LaneShadow/Features/Idle/IdleViewModel.swift` (MODIFY — wire `locationService` injection + observe coordinate stream)
- `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` (MODIFY — add `chipIsActive` `@State`; wire `onModeChange` to `locationService.toggleMode()`)
- `ios/LaneShadow/Views/Molecules/LSLocationContextBar.swift` (MODIFY — copper tint on `mode == .manual`)
- `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` (MODIFY — add `getReverseGeocode` action + `reverseGeocode` protocol method)
- `ios/LaneShadowTests/Helpers/StubLaneShadowConvexClient.swift` (MODIFY — stub `reverseGeocode`)
- `ios/LaneShadowTests/Services/LocationServiceTests.swift` (NEW)
- `ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift` (MODIFY — add `chipTap_populatesInputAndShowsSend`)
- `ios/project.yml` (MODIFY — add LocationService.swift to sources)

**writeProhibited:**
- `android/**`, `tokens/**`, `server/**`, `react-native/**`
- `ios/LaneShadow/Views/Molecules/LSChatInput.swift` — READ ONLY; is-active state already driven by value binding
- `ios/LaneShadow.xcodeproj/**` — generated; do not hand-edit

---

## BOUNDARIES

✅ **Always:**
- Use `@MainActor @Observable` for LocationService; bridge delegate via private inner class
- Run `scripts/ios/generate-project.sh` after editing `ios/project.yml`
- Use theme tokens for all colors

⚠️ **Ask First:**
- Adding `Info.plist` entries (e.g., `NSLocationAlwaysUsageDescription`)
- Changing the 50m debounce threshold

---

## DELIVERABLE

- `LocationService.swift` (NEW): `@MainActor @Observable final class` with CoreLocation delegate bridge, reverse-geocode debounce, `toggleMode()`
- `IdleViewModel.swift` (MODIFY): observes `locationService.coordinateStream`, calls `reverseGeocode` on debounced updates
- `IdleScreenContainer.swift` (MODIFY): `chipIsActive` state + `onModeChange` wiring
- `LSLocationContextBar.swift` (MODIFY): copper foreground when `mode == .manual`
- `ConvexClient+LaneShadow.swift` (MODIFY): `getReverseGeocode` action case + protocol method
- `StubLaneShadowConvexClient.swift` (MODIFY): stub
- `LocationServiceTests.swift` (NEW): 5 tests
- `IdleScreenWiringTests.swift` (MODIFY): adds `chipTap_populatesInputAndShowsSend`
- `ios/project.yml` (MODIFY): adds `LocationService.swift`; regenerates xcodeproj

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC: RED → GREEN → REFACTOR. After AC-1: run `bash scripts/ios/generate-project.sh` to regenerate the project file from updated `project.yml`.

---

## READING LIST

1. `ios/LaneShadow/Views/Molecules/LSLocationContextBar.swift:1-84` **[PRIMARY PATTERN]** — modePill construction lines 67-79; mode==.manual copper tint switch
2. `ios/LaneShadow/Views/Molecules/LSChatInput.swift:140-210` — trailingSlot is-active logic (`value.isEmpty` check); chip tap handler
3. `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift:1-35` — `onSuggestionTap` closure to wire `chatInputValue`
4. `ios/LaneShadow/Features/Idle/IdleViewModel.swift:18-37` — init parameters; add `locationService: LocationService`
5. `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift:21-23, 231-258` — add `getReverseGeocode` enum case + protocol method

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| project.yml regenerated | `bash scripts/ios/generate-project.sh` | Exit 0 |
| Swift format | `swiftformat ... --quiet` | Exit 0 |
| Build check | `xcodebuild ... build` | Exit 0 |
| Unit tests — T03 ACs | `xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests -only-testing:LaneShadowTests/IdleScreenWiringTests/chipTap_populatesInputAndShowsSend` | Exit 0, 6 tests pass |
| Regression — IdleScreenWiringTests full | `xcodebuild test -only-testing:LaneShadowTests/IdleScreenWiringTests` | Exit 0 |
| Regression — no_data_fetching_symbols | `xcodebuild test -only-testing:LaneShadowTests/IdleScreenTests/no_data_fetching_symbols` | Exit 0 |

---

## OUT OF SCOPE

- Replacing `LSPaperMap` with `LSMap` — IDLE-S06-IOS-T02 (already done before T03)
- DesignReviewCaptureTests for variants — IDLE-S06-IOS-T04
- Settings page for permission re-request UX

---

## CONTEXT

**Current state:** No `LocationService.swift` exists in `ios/LaneShadow/Services/`. `LSLocationContextBar.swift` already supports `.auto`/`.manual`/`.needed` modes via `LSLocationContextMode` enum but mode toggle is stubbed. `LSChatInput.swift:144` already has `value.isEmpty` check that drives filter→send swap (no internal change needed).

**Gap:** Sprint 6 gate requires real CoreLocation + reverse-geocode pill + MANUAL toggle + chip→is-active wiring.

---

## REVIEW (for swift-reviewer)

**Must pass:**
- One test per AC; tests verify behavior not implementation
- `LocationService` is `@MainActor @Observable`; CoreLocation delegate via private inner class (Sendable-safe)
- No CoreLocation imports in `IdleScreen.swift` or `IdleViewModel.swift` (grep proof)
- Theme tokens for all colors; no hardcoded `Color(0x...)`
- SCOPE respected; `ios/project.yml` regenerated cleanly

**Should verify:**
- 50m debounce uses `CLLocation.distance(from:)`
- Permission flow handles `.notDetermined` + `.authorizedWhenInUse` correctly
- `Info.plist` `NSLocationWhenInUseUsageDescription` present (in `ios/project.yml` plist entries)

**Verdict:** APPROVED | NEEDS_FIXES

---

## DESIGN

**References:**
- `.spec/design/system/views/idle-screen/idle-screen.html` — visual ground truth: location pill "Near Santa Cruz, CA", MANUAL copper, V01 dimmed chat input, is-active send button
- `.spec/design/system/views/idle-screen/README.md:36-60` — `mol-lcb__mode-chip is-manual` copper tint; `mol-chat-input` is-active filter→send swap; V01 No Location

**Pattern:** `@MainActor @Observable final class LocationService` mirroring `IdleViewModel` pattern; CLLocationManagerDelegate bridged via private inner class to avoid Sendable violation.

**Pattern source:** `ios/LaneShadow/Features/Idle/IdleViewModel.swift:1-6`

**Anti-pattern:** Don't add `CLLocationManager` as direct `@Observable` property (not Sendable). Don't modify `LSChatInput.swift` internals — is-active state is already driven by `value` binding.

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-CVX-T01 (`getReverseGeocode` action), IDLE-S06-IOS-T01 (VM `locationService` slot)
- **Blocks:** IDLE-S06-IOS-T04
- **Parallel:** IDLE-S06-AND-T03 (Android twin)

---

## CODING STANDARDS

- `RULES.md` §Verification Standards — `xcodebuild test` exact command
- `RULES.md` §Accessibility Standards (iOS) — mode pill `accessibilityValue` "Locked" when `.manual`
- `brain/docs/CODING-STANDARDS.md` — Swift 6 concurrency safety, Sendable bridging

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN coord (36.97,-122.02) + reverseGeocode resolves WHEN placeLabel read THEN 'Near Santa Cruz, CA'","verify":"xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/placeLabel_formatsNearCityState"},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN auto mode WHEN toggleMode() called THEN mode=.manual, coordinate locked, modePill copper-tinted","verify":"xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/manualToggle_locksCoordinate"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN manual mode WHEN toggleMode() called THEN mode=.auto, live tracking resumes","verify":"xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/autoToggle_resumesLiveTracking"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN authorization denied WHEN LocationService processes callback THEN mode=.needed, placeLabel='Set a start point'","verify":"xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/permission_denied_transitionsToNeeded"},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN empty chatInputValue WHEN chip tapped THEN chatInputValue=chip.label, send button visible","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleScreenWiringTests/chipTap_populatesInputAndShowsSend"},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN last-geocoded coord WHEN new fix arrives THEN reverseGeocode called only if distance>50m","verify":"xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/reverseGeocode_debounced_50m"},
    {"id":"TC-1","type":"test_criterion","description":"placeLabel_formatsNearCityState passes","maps_to_ac":"AC-1","verify":"xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/placeLabel_formatsNearCityState"},
    {"id":"TC-2","type":"test_criterion","description":"manualToggle_locksCoordinate passes","maps_to_ac":"AC-2","verify":"xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/manualToggle_locksCoordinate"},
    {"id":"TC-3","type":"test_criterion","description":"autoToggle_resumesLiveTracking passes","maps_to_ac":"AC-3","verify":"xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/autoToggle_resumesLiveTracking"},
    {"id":"TC-4","type":"test_criterion","description":"permission_denied_transitionsToNeeded passes","maps_to_ac":"AC-4","verify":"xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/permission_denied_transitionsToNeeded"},
    {"id":"TC-5","type":"test_criterion","description":"chipTap_populatesInputAndShowsSend passes","maps_to_ac":"AC-5","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleScreenWiringTests/chipTap_populatesInputAndShowsSend"},
    {"id":"TC-6","type":"test_criterion","description":"reverseGeocode_debounced_50m passes","maps_to_ac":"AC-6","verify":"xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/reverseGeocode_debounced_50m"}
  ]
}
-->
