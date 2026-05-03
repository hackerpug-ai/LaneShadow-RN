================================================================================
TASK: CHAT-S04-R05 - iOS RouteDetailsScreen viewState live wiring (real polylines, isBest, timeRange)
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  test:      xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test
  typecheck: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  lint:      swiftformat --lint ios/

PROGRESS: 0/6 AC · pending

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Live RouteDetailsScreen renders the selected option's real polyline, correct `isBest` flag, and computed 6-hour `timeRange` on physical device — viewState live path no longer renders empty.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST decode encoded polyline string from `routeEnrichments` into `[CLLocationCoordinate2D]` before passing to `LSMap`
- MUST derive `isBest` from `option.id == plan.bestOptionId` (or equivalent ranking field) — never hardcode `true`
- MUST derive `timeRange` from enrichment start/end timestamps formatted as the existing sandbox tuple shape
- MUST update LSMap polylines without view recreation when `selectedRouteId` changes
- MUST render gracefully on empty/missing polyline (no crash, no force unwrap)
- NEVER pass `polylines: []` to LSMap in viewState live path
- NEVER hardcode `isBest: true`
- NEVER pass `timeRange: ("", "")` in live path
- NEVER edit `ios/LaneShadow.xcodeproj/**` directly — regenerate via `scripts/ios/generate-project.sh`
- STRICTLY maintain sandbox/mock parity — sandbox stories must continue to render identically
- STRICTLY all UI strings/colors continue to use semantic tokens

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Real polyline rendered for selected option (AC-1 PRIMARY)
- [ ] isBest derived true for best option (AC-2)
- [ ] isBest derived false for alt option (AC-3)
- [ ] timeRange derived from enrichment timestamps (AC-4)
- [ ] Empty/missing polyline does not crash (AC-5)
- [ ] Switching selectedRouteId updates rendered polyline (AC-6)
- [ ] xcodebuild test + build clean
- [ ] swiftformat --lint passes
- [ ] Token compliance script passes
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Real polyline rendered for selected option [PRIMARY]
  GIVEN: A plan with a routeEnrichment containing an encoded polyline for the selected option
  WHEN:  RouteDetailsScreen renders viewState live path for that option
  THEN:  LSMap receives a non-empty polylines array decoded from the enrichment's encoded string

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Views/Templates/RouteDetailsScreenViewStateTests.swift
  TEST_FUNCTION: test_liveViewState_passesDecodedPolylineToLSMap

AC-2: isBest derived true for best option
  GIVEN: A plan whose bestOptionId equals the selectedRouteId
  WHEN:  RouteDetailsScreen renders viewState live path
  THEN:  isBest passed downstream is true and the best-pill is visible in the rendered hierarchy

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Views/Templates/RouteDetailsScreenViewStateTests.swift
  TEST_FUNCTION: test_liveViewState_isBestTrueWhenSelectedMatchesBest

AC-3: isBest derived false for alt option
  GIVEN: A plan whose bestOptionId does NOT equal the selectedRouteId
  WHEN:  RouteDetailsScreen renders viewState live path
  THEN:  isBest passed downstream is false and the best-pill is absent

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Views/Templates/RouteDetailsScreenViewStateTests.swift
  TEST_FUNCTION: test_liveViewState_isBestFalseForAltOption

AC-4: timeRange derived from enrichment timestamps
  GIVEN: A routeEnrichment with start and end timestamps spanning a 6-hour window
  WHEN:  RouteDetailsScreen renders viewState live path
  THEN:  timeRange tuple contains formatted start and end strings matching the sandbox story format

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Views/Templates/RouteDetailsScreenViewStateTests.swift
  TEST_FUNCTION: test_liveViewState_timeRangeFormattedFromEnrichment

AC-5: Empty/missing polyline does not crash
  GIVEN: A routeEnrichment whose encoded polyline is empty string or nil
  WHEN:  RouteDetailsScreen renders viewState live path
  THEN:  LSMap receives an empty polylines array, the screen renders without crash, and a placeholder/empty-state behavior identical to sandbox is observed

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Views/Templates/RouteDetailsScreenViewStateTests.swift
  TEST_FUNCTION: test_liveViewState_emptyPolylineRendersGracefully

AC-6: Switching selectedRouteId updates rendered polyline
  GIVEN: A plan with two options each having distinct enrichment polylines
  WHEN:  selectedRouteId changes from option A to option B
  THEN:  LSMap polylines payload updates from A's decoded coordinates to B's decoded coordinates within one render cycle

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Views/Templates/RouteDetailsScreenViewStateTests.swift
  TEST_FUNCTION: test_liveViewState_polylineUpdatesOnSelectionChange

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Type |
|-----|-----------|---------|------|
| TC-1 | Decoded polyline non-empty and matches expected coordinate count for fixture enrichment | AC-1 | happy_path |
| TC-2 | isBest is true when bestOptionId == selectedRouteId | AC-2 | happy_path |
| TC-3 | isBest is false when bestOptionId != selectedRouteId | AC-3 | happy_path |
| TC-4 | timeRange formatted strings equal sandbox-format strings for given timestamps | AC-4 | happy_path |
| TC-5 | Empty polyline string yields empty array and no crash | AC-5 | edge_case |
| TC-6 | Selection change triggers polyline payload swap | AC-6 | happy_path |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Templates/RouteDetailsScreen.swift
- ios/LaneShadow/Views/Templates/RouteDetailsViewState.swift
- ios/LaneShadow/Utilities/PolylineDecoder.swift (NEW if not present)
- ios/LaneShadowTests/Views/Templates/RouteDetailsScreenViewStateTests.swift (NEW)
- ios/LaneShadowTests/Utilities/PolylineDecoderTests.swift (NEW if PolylineDecoder created)
- ios/project.yml (MODIFY only if new test target sources need glob updates)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated; edit ios/project.yml + run scripts/ios/generate-project.sh
- ios/LaneShadow/Generated/** — generated by server/scripts/generate-mobile-types.ts
- ios/LaneShadow/Sandbox/** — sandbox parity is read-only for this task
- Any file outside scope.write_allowed

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use @Observable for viewState
- Decode polyline once per emission (not per render)
- Inject formatters/decoders for testability
- Maintain visual parity with sandbox stories

⚠️ Ask First:
- Adding new SPM dependencies for polyline decoding (prefer hand-rolled Google encoded polyline decoder)
- Diverging from RN/Android polyline decoding semantics

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Views/Templates/RouteDetailsScreen.swift (MODIFY): viewState live path passes real polylines/isBest/timeRange
- ios/LaneShadow/Views/Templates/RouteDetailsViewState.swift (MODIFY): derive fields from real subscription data
- ios/LaneShadow/Utilities/PolylineDecoder.swift (NEW): Google encoded polyline algorithm decoder
- ios/LaneShadowTests/Views/Templates/RouteDetailsScreenViewStateTests.swift (NEW): AC-1..AC-6 coverage
- ios/LaneShadowTests/Utilities/PolylineDecoderTests.swift (NEW): unit coverage for decoder

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH AC:

### RED PHASE
- READ: AC, current viewState live path at RouteDetailsScreen.swift:140-220
- WRITE: ONE Swift Testing test exercising GIVEN-WHEN-THEN
- RUN: `xcodebuild ... test -only-testing:LaneShadowTests/RouteDetailsScreenViewStateTests/<test_function>`
- VERIFY: Test FAILS

### GREEN PHASE
- WRITE: minimal viewState code to pass
- RUN: `xcodebuild ... test`
- VERIFY: Test PASSES

### REFACTOR PHASE
- READ: implementation
- RUN: full xcodebuild test + lint + token compliance
- VERIFY: still green

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. ios/LaneShadow/Views/Templates/RouteDetailsScreen.swift [PRIMARY PATTERN]
   - Lines: 140-220
   - Focus: viewState live path passing polylines:[], isBest:true, timeRange:("",")

2. ios/LaneShadow/Services/ConvexClient+LaneShadow.swift
   - Lines: all
   - Focus: routeEnrichments:list query shape and decoded payload type

3. ios/LaneShadow/Sandbox/Stories/* (RouteDetails*)
   - Lines: all
   - Focus: sandbox story format for polylines/timeRange/isBest — must match parity

4. .spec/prds/v3-integration/tasks/sprint-04-conversational-planning-loop/SPRINT.md
   - Lines: all
   - Focus: sprint requirements + human gate steps that depend on this view

5. .spec/reviews/red-hat-sprint-04-2026-05-03T14-19-50Z.md
   - Lines: F-17 section
   - Focus: exact failure description for this task

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: TDD_STATE values show each test went red before green.

Gate 2: Each AC has a test
  Verify: Test file contains one test per AC.

Gate 3: All Swift Testing tests pass
  Command: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/RouteDetailsScreenViewStateTests
  Expected: Exit 0.

Gate 4: Build (typecheck) clean
  Command: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  Expected: Exit 0.

Gate 5: Lint clean
  Command: swiftformat --lint ios/
  Expected: Exit 0.

Gate 6: Token compliance
  Command: scripts/tokens/enforce-native-compliance.sh
  Expected: Exit 0.

Gate 7: Snapshot parity
  Command: pnpm snapshots:check
  Expected: Exit 0.

Gate 8: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: CHAT-S04-R01 (db.routeEnrichments.list endpoint must exist)
Blocks:     CHAT-S04-R08 (iOS XCUITest E2E gate step 5 needs this wiring)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-R05",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "Real polyline rendered for selected option from decoded enrichment payload", "verify": "xcodebuild test -only-testing:LaneShadowTests/RouteDetailsScreenViewStateTests/test_liveViewState_passesDecodedPolylineToLSMap", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "isBest true when selected matches best option", "verify": "xcodebuild test -only-testing:LaneShadowTests/RouteDetailsScreenViewStateTests/test_liveViewState_isBestTrueWhenSelectedMatchesBest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "isBest false for alt option", "verify": "xcodebuild test -only-testing:LaneShadowTests/RouteDetailsScreenViewStateTests/test_liveViewState_isBestFalseForAltOption", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "timeRange formatted from enrichment start/end timestamps", "verify": "xcodebuild test -only-testing:LaneShadowTests/RouteDetailsScreenViewStateTests/test_liveViewState_timeRangeFormattedFromEnrichment", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "Empty polyline path renders without crash", "verify": "xcodebuild test -only-testing:LaneShadowTests/RouteDetailsScreenViewStateTests/test_liveViewState_emptyPolylineRendersGracefully", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "selectedRouteId change updates LSMap polylines", "verify": "xcodebuild test -only-testing:LaneShadowTests/RouteDetailsScreenViewStateTests/test_liveViewState_polylineUpdatesOnSelectionChange", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Decoded coordinates non-empty and length matches fixture", "maps_to_ac": "AC-1", "verify": "xcodebuild test -only-testing:LaneShadowTests/RouteDetailsScreenViewStateTests/test_liveViewState_passesDecodedPolylineToLSMap", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "isBest true assertion", "maps_to_ac": "AC-2", "verify": "xcodebuild test -only-testing:LaneShadowTests/RouteDetailsScreenViewStateTests/test_liveViewState_isBestTrueWhenSelectedMatchesBest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "isBest false assertion", "maps_to_ac": "AC-3", "verify": "xcodebuild test -only-testing:LaneShadowTests/RouteDetailsScreenViewStateTests/test_liveViewState_isBestFalseForAltOption", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "timeRange string equality vs sandbox format", "maps_to_ac": "AC-4", "verify": "xcodebuild test -only-testing:LaneShadowTests/RouteDetailsScreenViewStateTests/test_liveViewState_timeRangeFormattedFromEnrichment", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "Empty polyline edge case yields empty array, no crash", "maps_to_ac": "AC-5", "verify": "xcodebuild test -only-testing:LaneShadowTests/RouteDetailsScreenViewStateTests/test_liveViewState_emptyPolylineRendersGracefully", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "Selection change triggers polyline swap", "maps_to_ac": "AC-6", "verify": "xcodebuild test -only-testing:LaneShadowTests/RouteDetailsScreenViewStateTests/test_liveViewState_polylineUpdatesOnSelectionChange", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
