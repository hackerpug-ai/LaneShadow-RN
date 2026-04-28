================================================================================
TASK: FID-S01-T10 - iOS Test Infrastructure + Programmatic Assertions
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO build
  test: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'

PROGRESS: AC-1..AC-4 not started

--------------------------------------------------------------------------------
OUTCOME (1 sentence, ≤30 words — observable success)
--------------------------------------------------------------------------------

All iOS sandbox tests compile and execute with programmatic assertions verifying actual font tokens, dimensions, and component structure — not snapshot-only tests.

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER replace a snapshot test with an empty assertion — every AC must have a specific, falsifiable check
- NEVER use XCTAssert(true) or trivially-passing assertions
- MUST preserve existing snapshot tests as supplementary — add programmatic checks alongside them
- MUST fix MapSlotTests compilation before any other work (it blocks T02 verification)
- STRICTLY use ViewInspector or source-grep patterns already established in SessionsDrawerTests.swift

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] MapSlotTests.swift compiles and all 5 tests execute (AC-1)
- [ ] TypographyTests.swift has programmatic font-family verification per AC (AC-2)
- [ ] RouteSheetShellTests.swift measures Save/Ride button widths programmatically (AC-3)
- [ ] All iOS tests pass: `xcodebuild test` exits 0 (AC-4)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: MapSlotTests compilation fix
  GIVEN: MapSlotTests.swift is loaded in the Xcode project
  WHEN:  The test target compiles
  THEN:  Zero compilation errors — tests use correct SnapshotTesting API (no `.snapshot()` trait in Swift Testing, no `.iPhone16` config)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/MapSlotTests.swift
  TEST_FUNCTION: (all 5 existing tests must compile)

AC-2: Programmatic typography verification
  GIVEN: TypographyTests.swift is executed
  WHEN:  Each AC test runs (AC-1 through AC-6)
  THEN:  Tests contain source-grep assertions (like SessionsDrawerTests pattern) verifying the correct typography token is used in the source file (e.g., `source.contains("opinion.xl")` for IdleScreen, `source.contains("opinion.lg")` for SessionsDrawer "Rides")

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/TypographyTests.swift
  TEST_FUNCTION: (enhanced versions of existing testIdleScreenGreetingOpinionXL, etc.)

AC-3: RouteSheet button proportion measurement
  GIVEN: RouteSheetShellTests.swift testSaveRideButtonProportion() is executed
  WHEN:  The test measures Save and Ride button frames
  THEN:  Test programmatically verifies Save button width : Ride button width ≈ 1:2 ratio (within 5% tolerance)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/RouteSheetShellTests.swift
  TEST_FUNCTION: testSaveRideButtonProportion

AC-4: Full test suite passes
  GIVEN: All iOS sandbox test files are compiled
  WHEN:  `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` runs
  THEN:  Exit code 0, all tests pass

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/*.swift
  TEST_FUNCTION: (all)

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadowTests/Sandbox/MapSlotTests.swift (MODIFY)
- ios/LaneShadowTests/Sandbox/TypographyTests.swift (MODIFY)
- ios/LaneShadowTests/Sandbox/RouteSheetShellTests.swift (MODIFY)

writeProhibited:
- ios/LaneShadow/** (production code — no changes)
- android/**
- server/**

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

Always:
- Use source-grep pattern from SessionsDrawerTests.swift (read file, assert on contents)
- Keep existing snapshot tests — add programmatic assertions alongside them
- Fix the minimal API surface to make MapSlotTests compile

Ask First:
- Adding new test helper files
- Changing test target build settings

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- MapSlotTests.swift: Fix `.snapshot()` trait and `.iPhone16` config to use correct SnapshotTesting API
- TypographyTests.swift: Add source-grep assertions verifying correct font tokens in each AC test
- RouteSheetShellTests.swift: Add programmatic button width measurement to testSaveRideButtonProportion

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## AC-1: MapSlotTests fix (highest priority — blocks everything)

### RED PHASE
  RUN: xcodebuild test targeting MapSlotTests
  VERIFY: Compilation fails (confirm the 10 errors)
  DOCUMENT: The specific errors (.snapshot trait, .iPhone16 config)

### GREEN PHASE
  READ: SessionsDrawerTests.swift and RouteSheetShellTests.swift for correct snapshot API usage
  FIX: Replace Swift Testing `.snapshot()` trait with XCTest-compatible snapshot calls
  FIX: Replace `.iPhone16` config with manual UITraitCollection construction (see TypographyTests.swift)
  RUN: xcodebuild test
  VERIFY: All 5 MapSlotTests compile and execute

## AC-2: Typography assertions

### RED PHASE
  READ: Current TypographyTests.swift (note: no source-grep assertions)
  READ: SessionsDrawerTests.swift source() helper pattern
  WRITE: Add source-grep assertions to each AC test verifying the correct token
  RUN: xcodebuild test
  VERIFY: New assertions pass (they should, since implementation is correct per T01)

### GREEN PHASE
  No implementation changes needed — assertions should pass against existing code
  If any assertion fails, the T01 implementation has a real bug — report it

## AC-3: Button proportion

### RED PHASE
  READ: Current testSaveRideButtonProportion (snapshot-only)
  WRITE: Add programmatic width measurement using UIHostingController + layout
  RUN: xcodebuild test
  VERIFY: Test measures and asserts Save:Ride ≈ 1:2

### GREEN PHASE
  If assertion fails, the T04 implementation has a real bug — report it

## AFTER ALL ACs:
  Run full test suite: xcodebuild test
  Verify zero failures

--------------------------------------------------------------------------------
READING LIST (max 5 files)
--------------------------------------------------------------------------------

1. ios/LaneShadowTests/Sandbox/MapSlotTests.swift [PRIMARY — fix target]
   - Lines: all
   - Focus: Broken `.snapshot()` trait and `.iPhone16` config usage

2. ios/LaneShadowTests/Sandbox/TypographyTests.swift [MODIFY target]
   - Lines: all
   - Focus: Add source-grep assertions per AC

3. ios/LaneShadowTests/Sandbox/SessionsDrawerTests.swift [PATTERN SOURCE]
   - Lines: 232-236 (source() helper)
   - Focus: Pattern for reading source files and asserting on contents

4. ios/LaneShadowTests/Sandbox/RouteSheetShellTests.swift [MODIFY target]
   - Lines: 175-203 (testSaveRideButtonProportion)
   - Focus: Add width measurement to existing snapshot test

5. ios/LaneShadowTests/Sandbox/TypographyTests.swift [API REFERENCE]
   - Lines: 34-42 (correct assertSnapshot usage)
   - Focus: Correct SnapshotTesting + XCTest API pattern

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: MapSlotTests compiles
  Command: cd ios && xcodebuild build-for-testing -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  Expected: Exit 0, zero compilation errors in MapSlotTests.swift

Gate 2: Source-grep assertions present
  Command: grep -c 'source.contains\|source(' ios/LaneShadowTests/Sandbox/TypographyTests.swift
  Expected: Count ≥ 6 (one per AC)

Gate 3: Button measurement present
  Command: grep -c 'saveButton\|rideButton\|width\|frame' ios/LaneShadowTests/Sandbox/RouteSheetShellTests.swift
  Expected: Count ≥ 3 (measuring both button widths)

Gate 4: Full test suite passes
  Command: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  Expected: Exit 0

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S01-T01, FID-S01-T02, FID-S01-T04, FID-S01-T05 (implementations must exist)
Blocks:     FID-S01-T09 (verification cannot complete without passing tests)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN MapSlotTests.swift is loaded WHEN test target compiles THEN zero compilation errors with correct SnapshotTesting API", "verify": "cd ios && xcodebuild build-for-testing -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN TypographyTests.swift executes WHEN each AC test runs THEN source-grep assertions verify correct typography tokens in source files", "verify": "grep -c 'source.contains' ios/LaneShadowTests/Sandbox/TypographyTests.swift" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN testSaveRideButtonProportion executes WHEN test measures button frames THEN Save:Ride width ratio ≈ 1:2 within 5% tolerance", "verify": "grep -c 'saveButton\\|rideButton' ios/LaneShadowTests/Sandbox/RouteSheetShellTests.swift" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN all iOS sandbox tests compiled WHEN xcodebuild test runs THEN exit code 0 with all tests passing", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "TC-1", "type": "test_criterion", "description": "MapSlotTests.swift contains zero uses of .snapshot() Swift Testing trait", "maps_to_ac": "AC-1", "verify": "! grep -q '.snapshot()' ios/LaneShadowTests/Sandbox/MapSlotTests.swift" },
    { "id": "TC-2", "type": "test_criterion", "description": "TypographyTests.swift has source-grep assertion for opinion.xl in IdleScreen test", "maps_to_ac": "AC-2", "verify": "grep -q 'opinion.xl' ios/LaneShadowTests/Sandbox/TypographyTests.swift" },
    { "id": "TC-3", "type": "test_criterion", "description": "TypographyTests.swift has source-grep assertion for opinion.lg in SessionsDrawer test", "maps_to_ac": "AC-2", "verify": "grep -q 'opinion.lg' ios/LaneShadowTests/Sandbox/TypographyTests.swift" },
    { "id": "TC-4", "type": "test_criterion", "description": "RouteSheetShellTests measures both Save and Ride button frame widths", "maps_to_ac": "AC-3", "verify": "grep -c 'width' ios/LaneShadowTests/Sandbox/RouteSheetShellTests.swift" },
    { "id": "TC-5", "type": "test_criterion", "description": "All iOS sandbox tests pass when executed on simulator", "maps_to_ac": "AC-4", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" }
  ]
}
-->
