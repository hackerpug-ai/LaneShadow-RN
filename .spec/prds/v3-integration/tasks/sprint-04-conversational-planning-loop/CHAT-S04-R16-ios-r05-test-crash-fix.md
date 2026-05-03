================================================================================
TASK: CHAT-S04-R16 - Fix iOS RouteDetailsScreenViewStateTests crash
================================================================================

TASK_TYPE:  BUGFIX
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     S
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/RouteDetailsScreenViewStateTests
  build:     cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'

PROGRESS: 0/3 AC · pending

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

RouteDetailsScreenViewStateTests passes cleanly in xcodebuild test. R05's viewState wiring (polylines, isBest, timeRange) is verified at runtime, not just by code review.

--------------------------------------------------------------------------------
SOURCE
--------------------------------------------------------------------------------

Finding RF-06 from red-hat round-2 review (2026-05-03T21:43:36Z):
- `xcodebuild test` crashes with "signal kill before establishing connection" in RouteDetailsScreenViewStateTests
- R05 was merged with logic that appears correct from code review, but tests crash before verification
- swift-reviewer rated R05 at 40% confidence due to inability to verify runtime behavior

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST resolve the test crash (signal kill / connection failure)
- MUST NOT change the production RouteDetailsScreen viewState logic — only fix test infrastructure
- MUST verify AC-6 (selection updates polyline) which was never reached due to crash
- NEVER skip the failing test or mark it as expected failure

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] xcodebuild test for RouteDetailsScreenViewStateTests passes (AC-1)
- [ ] All 6 R05 viewState ACs verified at runtime (AC-2)
- [ ] No regression in other iOS test suites (AC-3)
- [ ] xcodebuild build clean

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: RouteDetailsScreenViewStateTests passes
  GIVEN: The iOS test target builds and runs
  WHEN:  xcodebuild test targets RouteDetailsScreenViewStateTests
  THEN:  All tests pass without crash (exit code 0)

AC-2: R05 viewState ACs verified at runtime
  GIVEN: RouteDetailsScreenViewStateTests passes
  WHEN:  Test output is inspected
  THEN:  Polyline decoding (AC-1), isBest true/false (AC-2/3), timeRange formatting (AC-4), empty polyline graceful (AC-5), selection updates (AC-6) are all verified

AC-3: No regression in other iOS test suites
  GIVEN: The full LaneShadowTests suite runs
  WHEN:  xcodebuild test completes
  THEN:  No new failures introduced

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadowTests/Views/Templates/RouteDetailsScreenViewStateTests.swift (MODIFY — fix crash)
- ios/LaneShadowTests/** (MODIFY if test infrastructure needs adjustment)

writeProhibited:
- ios/LaneShadow/Views/Templates/RouteDetailsScreen.swift — production code verified correct in round-2
- ios/LaneShadow/Features/RouteDetails/** — production code verified correct in round-2

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: CHAT-S04-R05 (merged — viewState wiring already on main)
Blocks:     CHAT-S04-R08 (iOS E2E suite needs stable test infrastructure)

================================================================================
