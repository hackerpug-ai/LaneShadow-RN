<!-- Template Version: 5.1.0 | Sprint: sprint-05-organisms | Type: FEATURE/TDD -->

================================================================================
TASK: REMEDIATION-03 — UC-ORG-02 iOS: Replace EmptyView stubs in MapLayer
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     S
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   90 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   07-uc-org.md (UC-ORG-02)

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapLayerTests
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: 0/3 ACs complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSMapLayer renders actual slot content for leadingDrawer and bottomSheet instead of EmptyView() placeholders, with correct z-ordering and safe-area handling verified by tests.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST replace EmptyView() at lines 68 and 75 with actual content rendering from DrawerSpec.content and BottomSheetSpec.content closures.
- MUST preserve z-order contract: map → scrim → overlays → bottomSheet → drawer → topBar.
- MUST delegate bottomSheet to LSBottomSheet molecule — never reproduce sheet drag/detent logic inline.
- MUST update tests that verify drawer/sheet rendering to check actual content appears.
- NEVER re-implement sheet or drawer positioning logic — delegate to existing molecules.
- NEVER modify atoms or molecules from prior sprints.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: leadingDrawer renders DrawerSpec.content instead of EmptyView() (PRIMARY)
- [ ] AC-2: bottomSheet renders via LSBottomSheet molecule instead of EmptyView()
- [ ] AC-3: Updated tests verify actual content renders in correct z-order

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: leadingDrawer renders slot content [PRIMARY]
  GIVEN: LSMapLayer with leadingDrawer = DrawerSpec(content: { Text("Drawer") }, onDismiss: {})
  WHEN:  view body resolves with drawer visible
  THEN:  "Drawer" text appears in the drawer slot at correct z-order (above scrim, below topBar); not EmptyView
  VERIFY: cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapLayerTests/test_leadingDrawer_rendersSlotContent 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSMapLayerTests.swift
  TEST_FUNCTION: test_leadingDrawer_rendersSlotContent

AC-2: bottomSheet delegates to LSBottomSheet
  GIVEN: LSMapLayer with bottomSheet = BottomSheetSpec(content: { Text("Sheet") }, detent: .large, onDismiss: {})
  WHEN:  view body resolves
  THEN:  LSBottomSheet molecule renders with provided content; detent forwarded; onDismiss wired; no EmptyView in sheet slot
  VERIFY: cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapLayerTests/test_bottomSheet_delegatesToLSBottomSheet 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSMapLayerTests.swift
  TEST_FUNCTION: test_bottomSheet_delegatesToLSBottomSheet

AC-3: No EmptyView stubs remain
  GIVEN: LSMapLayer.swift source
  WHEN:  inspected
  THEN:  no EmptyView() calls in drawer or sheet rendering paths; "deferred" comments removed
  VERIFY: grep -c 'EmptyView()' ios/LaneShadow/Views/Organisms/LSMapLayer.swift | xargs test 0 -eq

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Organisms/LSMapLayer.swift (MODIFY — replace EmptyView stubs)
- ios/LaneShadowTests/Organisms/LSMapLayerTests.swift (MODIFY — update stub-verifying tests)

writeProhibited:
- ios/LaneShadow/Views/Molecules/LSBottomSheet.swift — molecule from Sprint 4
- ios/LaneShadow/Views/Atoms/** — atoms from prior sprints
- ios/LaneShadow/Views/Organisms/LSMapLayerSlots.swift — slot types already correct
- android/** — wrong platform
- tokens/** — not this task

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. ios/LaneShadow/Views/Organisms/LSMapLayer.swift [PRIMARY PATTERN]
   - Lines: 60-80 (current EmptyView stubs)
   - Focus: identify exact EmptyView locations; understand z-stack structure

2. ios/LaneShadow/Views/Organisms/LSMapLayerSlots.swift
   - Focus: DrawerSpec and BottomSheetSpec types; content closure signatures

3. ios/LaneShadow/Views/Molecules/LSBottomSheet.swift
   - Focus: LSBottomSheet API for delegation (init parameters, detent handling)

4. ios/LaneShadowTests/Organisms/LSMapLayerTests.swift
   - Focus: existing test structure; identify tests to update for real content

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Build succeeds
  Command: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'
  Expected: BUILD SUCCEEDED

Gate 2: Tests pass
  Command: cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapLayerTests
  Expected: TEST SUCCEEDED

Gate 3: No EmptyView stubs
  Command: grep -c 'EmptyView()' ios/LaneShadow/Views/Organisms/LSMapLayer.swift
  Expected: 0

Gate 4: swiftformat clean
  Command: swiftformat --lint ios/LaneShadow/Views/Organisms/LSMapLayer.swift
  Expected: exit 0

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-ORG-02-ios (source exists, stubs present)
Blocks:     Sprint 5 human testing gate
Parallel:   REMEDIATION-01 (Android ORG-03), REMEDIATION-02 (iOS ORG-03)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "leadingDrawer renders DrawerSpec.content instead of EmptyView", "verify": "xcodebuild test LSMapLayerTests/test_leadingDrawer_rendersSlotContent" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "bottomSheet delegates to LSBottomSheet molecule", "verify": "xcodebuild test LSMapLayerTests/test_bottomSheet_delegatesToLSBottomSheet" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "No EmptyView() in LSMapLayer.swift", "verify": "grep -c EmptyView() = 0" }
  ]
}
-->
