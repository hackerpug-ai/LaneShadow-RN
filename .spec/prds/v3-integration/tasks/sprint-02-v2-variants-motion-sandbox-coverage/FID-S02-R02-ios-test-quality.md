================================================================================
TASK: FID-S02-R02 - iOS Test Quality — Replace Empty Stubs with Real Tests
================================================================================

TASK_TYPE:  FIX
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build
  test: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'

PROGRESS: Not started

--------------------------------------------------------------------------------
OUTCOME (1 sentence)
--------------------------------------------------------------------------------

All Sprint 02 iOS test files contain real behavior-verifying assertions — no empty bodies, no TODO stubs, no XCTAssertNotNil-only tests — and the missing RouteResultsDetailsVariantTests.swift file is created.

--------------------------------------------------------------------------------
SOURCE
--------------------------------------------------------------------------------

Red-hat review 2026-04-28 Finding 2 (CRITICAL).
Three test files have inadequate coverage; one is missing entirely.

Verified gaps:
- MotionTests.swift: 5 tests use XCTAssertNotNil(view) + TODO comments, no behavior verification
- IdlePlanningVariantTests.swift: 6 tests check provider state strings, not UI rendering
- SessionsErrorVariantTests.swift: 6 tests have empty WHEN/THEN blocks with "This test will fail until..." comments
- RouteResultsDetailsVariantTests.swift: FILE DOES NOT EXIST on disk, 0 references in Xcode project

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST NOT weaken existing passing tests
- MUST use Swift Testing framework (@Test, #expect) consistent with existing test files
- MUST add RouteResultsDetailsVariantTests.swift to the Xcode project (project.pbxproj)
- Tests should verify RENDERING behavior where possible (view hierarchy assertions, accessibility labels, presence of specific subviews), not just provider data
- Where SwiftUI view introspection is impractical, tests MUST verify the contract between provider state and the view (e.g., "given this provider variant, the view constructs with these parameters")

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] MotionTests.swift: Each of 5 tests verifies animation reads correct duration/easing from theme.motion tokens (AC-1)
- [ ] IdlePlanningVariantTests.swift: Each of 6 tests verifies UI rendering, not just provider state (AC-2)
- [ ] SessionsErrorVariantTests.swift: Each of 6 tests has real assertions verifying components exist and render correctly (AC-3)
- [ ] RouteResultsDetailsVariantTests.swift: Created with 8 real tests for T05 AC-1..AC-8 (AC-4)
- [ ] RouteResultsDetailsVariantTests.swift added to Xcode project.pbxproj (AC-5)
- [ ] `xcodebuild test` passes (AC-6)
- [ ] No TODO / "will fail until" / empty test bodies remain in any Sprint 02 test file

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: MotionTests real assertions
  GIVEN: MotionTests.swift is inspected
  WHEN:  Each test function body is read
  THEN:  No test has only `XCTAssertNotNil(view)` as its sole assertion; each verifies the animation binds the correct recipe token (duration, easing, repeat mode) or verifies the resulting Animation struct's properties

AC-2: IdlePlanningVariantTests verify rendering
  GIVEN: IdlePlanningVariantTests.swift is inspected
  WHEN:  Each test function body is read
  THEN:  Tests assert more than provider state strings — they verify view structure, accessibility labels, or conditional rendering of variant-specific elements (advisory card, cancel sheet, warning border)

AC-3: SessionsErrorVariantTests real bodies
  GIVEN: SessionsErrorVariantTests.swift is inspected
  WHEN:  Each test function body is read
  THEN:  No "This test will fail until" comments; each test verifies LSConfirmDialog renders, FlowLayout wraps, LSWifiOffWatermark appears, sections parameter works, etc.

AC-4: RouteResultsDetailsVariantTests created
  GIVEN: ios/LaneShadowTests/Sandbox/RouteResultsDetailsVariantTests.swift
  WHEN:  File is inspected
  THEN:  Contains 8 @Test functions covering T05 AC-1..AC-8 (alt-selection, refining, recall, dark, medium detent, dismissing, saved-state, mixed-weather fix) with real assertions

AC-5: Xcode project includes new test file
  GIVEN: ios/LaneShadow.xcodeproj/project.pbxproj
  WHEN:  Searched for RouteResultsDetailsVariantTests
  THEN:  At least 4 references (file ref + build phase + 2 target membership entries)

AC-6: All tests pass
  GIVEN: `xcodebuild test` runs
  WHEN:  All Sprint 02 test suites execute
  THEN:  Exit code 0, no test failures

AC-7: No stubs remain
  GIVEN: All Sprint 02 test files are grep'd
  WHEN:  `grep -rn "TODO\|will fail until\|XCTAssertNotNil" ios/LaneShadowTests/Sandbox/MotionTests.swift ios/LaneShadowTests/Sandbox/SessionsErrorVariantTests.swift ios/LaneShadowTests/Sandbox/IdlePlanningVariantTests.swift ios/LaneShadowTests/Sandbox/RouteResultsDetailsVariantTests.swift`
  THEN:  Zero matches

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadowTests/Sandbox/MotionTests.swift (MODIFY — replace shallow assertions)
- ios/LaneShadowTests/Sandbox/IdlePlanningVariantTests.swift (MODIFY — add rendering assertions)
- ios/LaneShadowTests/Sandbox/SessionsErrorVariantTests.swift (MODIFY — fill empty test bodies)
- ios/LaneShadowTests/Sandbox/RouteResultsDetailsVariantTests.swift (NEW — create with 8 tests)
- ios/LaneShadow.xcodeproj/project.pbxproj (MODIFY — add new test file)

writeProhibited:
- ios/LaneShadow/Views/** — no implementation changes
- ios/LaneShadow/Theme/** — token changes in R01
- ios/LaneShadow/Sandbox/** — no mock provider changes
- android/** — separate platform

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S02-R01 (motion tokens must exist for MotionTests to verify)
Blocks:     R04 (snapshot re-capture needs passing tests)
Parallel:   R03 (Android missing files)

================================================================================
