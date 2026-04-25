<!-- Template Version: 5.1.0 | Sprint: sprint-05-organisms | Type: FEATURE/TDD -->

================================================================================
TASK: REMEDIATION-04 — Token sweep: Replace hardcoded values across organisms
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     S
AGENT:      implementer=swift-implementer + kotlin-implementer | reviewer=swift-reviewer + kotlin-reviewer
ESTIMATE:   60 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   07-uc-org.md (all UC-ORG)

RUNTIME_COMMANDS:
  test-ios:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  test-android:  cd android && ./gradlew :app:testDebugUnitTest
  typecheck-ios: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck-android: cd android && ./gradlew :app:compileDebugKotlin
  lint-ios:      swiftformat --lint ios/LaneShadow/
  lint-android:  cd android && ./gradlew detekt

PROGRESS: 0/4 ACs complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

All organism source files on both platforms use semantic tokens for sizes, opacities, and animation durations instead of hardcoded numeric literals. Design token constitution is satisfied.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST replace ALL hardcoded numeric values in organism source files with semantic tokens from LaneShadowTheme.
- iOS violations to fix: LSTopBar.swift (40, 6), LSSessionsDrawer.swift (312, 1, 3, 0.1), LSNavigatorMessage.swift (2, 0.22), LSInlineErrorCallout.swift (0.22), multiple files (0.1, 0.05, 0.5).
- Android violations to fix: LSMapLayer.kt (tween durations at lines 143, 155), LSSessionsDrawer.kt (18.dp, 14.dp, 16.dp, 12.dp, Material3 Text).
- MUST NOT break any existing tests — this is a token refactoring pass.
- MUST run full test suite on both platforms after changes.
- NEVER add new features — only replace literal values with token references.
- NEVER modify atoms or molecules — only organism source files.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: iOS organism source files have zero hardcoded sizes/opacities (PRIMARY)
- [ ] AC-2: Android organism source files have zero hardcoded tween/dp literals
- [ ] AC-3: Both platform test suites still pass
- [ ] AC-4: grep gates pass on both platforms

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: iOS token compliance [PRIMARY]
  GIVEN: All iOS organism source files in ios/LaneShadow/Views/Organisms/
  WHEN:  scanned for hardcoded values
  THEN:  grep for literal opacity values (.opacity(0.), hardcoded widths, heights, durations returns 0 matches; all values reference theme tokens
  VERIFY: grep -rn '\.opacity(0\.' ios/LaneShadow/Views/Organisms/*.swift | wc -l | xargs test 0 -eq && grep -rn 'Font.system\|Color(hex:\|Color(red:\|\.monospaced()' ios/LaneShadow/Views/Organisms/*.swift | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

AC-2: Android token compliance
  GIVEN: All Android organism source files
  WHEN:  scanned for hardcoded values
  THEN:  grep for tween( with integer literals, hardcoded dp padding values in organism files returns 0; all values reference LaneShadowTheme tokens
  VERIFY: grep -rn 'tween(' android/app/src/main/java/com/laneshadow/ui/organisms/*.kt | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

AC-3: Test suites pass on both platforms
  GIVEN: iOS + Android test suites
  WHEN:  run after token changes
  THEN:  all tests still pass; no regressions
  VERIFY: cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'TEST SUCCEEDED'
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest 2>&1 | grep 'BUILD SUCCESSFUL'

AC-4: LSSessionsDrawer uses LSText instead of Material3 Text
  GIVEN: LSSessionsDrawer.kt source
  WHEN:  inspected
  THEN:  no `androidx.compose.material3.Text` imports; all text rendered via LSText atom
  VERIFY: grep -c 'import androidx.compose.material3.Text' android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt | xargs test 0 -eq

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Organisms/LSTopBar.swift (MODIFY — replace 40, 6 with tokens)
- ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift (MODIFY — replace 312, 1, 3, 0.1)
- ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift (MODIFY — replace 2, 0.22)
- ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift (MODIFY — replace 0.22)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt (MODIFY — replace tween)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt (MODIFY — replace dp literals, Text → LSText)

writeProhibited:
- ios/LaneShadow/Views/Atoms/** — atoms from prior sprints
- ios/LaneShadow/Views/Molecules/** — molecules from Sprint 4
- android/app/src/main/java/com/laneshadow/ui/atoms/** — atoms from prior sprints
- android/app/src/main/java/com/laneshadow/ui/molecules/** — molecules from Sprint 4
- tokens/** — token definitions (add new tokens to existing theme files if needed)
- Test files — tests should not need changes for token refactoring

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. ios/LaneShadow/Views/Organisms/LSTopBar.swift [PRIMARY PATTERN]
   - Lines: 113, 117 (hardcoded 40, 6)
   - Focus: identify token equivalents for chipSize, recordingDotSize

2. ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift
   - Lines: 57, 61, 64, 130
   - Focus: identify token equivalents for 312 width, 1 border, 3 stripe, 0.1 shadow

3. android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt
   - Lines: 143, 155
   - Focus: tween() calls to replace with LaneShadowTheme.motion.recipe.*

4. android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt
   - Lines: 152, 205, 214, 228, 251, 266
   - Focus: hardcoded dp values and Material3 Text usage

5. tokens/platforms/swift/Sources/LaneShadowTheme/ + android theme package
   - Focus: available spacing, sizing, opacity, motion tokens

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: iOS build
  Command: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  Expected: BUILD SUCCEEDED

Gate 2: iOS tests
  Command: cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  Expected: TEST SUCCEEDED

Gate 3: Android build + tests
  Command: cd android && ./gradlew :app:testDebugUnitTest
  Expected: BUILD SUCCESSFUL

Gate 4: iOS grep gate
  Command: grep -rn '\.opacity(0\.' ios/LaneShadow/Views/Organisms/*.swift | wc -l
  Expected: 0

Gate 5: Android grep gate
  Command: grep -rn 'tween(' android/app/src/main/java/com/laneshadow/ui/organisms/*.kt | wc -l
  Expected: 0

Gate 6: swiftformat + detekt clean
  Command: swiftformat --lint ios/LaneShadow/ && cd android && ./gradlew detekt
  Expected: exit 0

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: All UC-ORG-* tasks (source exists)
Blocks:     Sprint 5 closure (token constitution gate)
Parallel:   REMEDIATION-01, REMEDIATION-02, REMEDIATION-03

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "iOS organism files have zero hardcoded opacities/sizes", "verify": "grep gate on ios/LaneShadow/Views/Organisms/*.swift" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Android organism files have zero hardcoded tween/dp literals", "verify": "grep gate on android organisms/*.kt" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Both platform test suites pass after refactoring", "verify": "xcodebuild test + gradle test" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "LSSessionsDrawer uses LSText not Material3 Text", "verify": "grep import androidx.compose.material3.Text = 0" }
  ]
}
-->
