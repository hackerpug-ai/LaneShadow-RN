<!-- Template Version: 5.1.0 | Sprint: sprint-05-organisms | Type: FEATURE/TDD -->

================================================================================
TASK: REMEDIATION-01 — UC-ORG-03 Android: Missing tests + disabled stories
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   120 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   07-uc-org.md (UC-ORG-03)

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSNavigatorMessageTest' --tests 'com.laneshadow.ui.organisms.LSInlineErrorCalloutTest'
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: 0/6 ACs complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSNavigatorMessage and LSInlineErrorCallout have full unit test coverage with behavior-verifying tests (not vanity tests), sandbox stories are enabled in OrganismStories.kt, and hardcoded tween() durations are replaced with motion.recipe token references.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST write REAL tests that verify BEHAVIOR — no tests that only check existence or assert `isDisplayed()` without content verification.
- MUST test auto-dismiss timer (5000ms) actually fires onDismiss for unpinned messages.
- MUST test suggestion chip callbacks fire exactly once per tap.
- MUST enable LSNavigatorMessageStory and LSInlineErrorCalloutStory in OrganismStories.kt — remove the "API issues" comment-out.
- MUST replace `tween(280)` and `tween(220)` in LSNavigatorMessage.kt with `LaneShadowTheme.motion.recipe.*` references.
- NEVER write tests that assert view "is not null" or just check type existence without verifying rendering/behavior.
- NEVER re-implement the organism — only fix tests and enable stories. The organism source already exists.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSNavigatorMessageTest.kt exists with 4+ behavior-verifying tests (auto-dismiss, pin cancellation, attachment rendering, close callback) (PRIMARY)
- [ ] AC-2: LSInlineErrorCalloutTest.kt exists with 3+ behavior-verifying tests (warn-stripe rendering, suggestion tap, detail expansion)
- [ ] AC-3: OrganismStories.kt has LSNavigatorMessageStory.all and LSInlineErrorCalloutStory.all uncommented and registered
- [ ] AC-4: No hardcoded tween() durations in LSNavigatorMessage.kt (grep gate passes)
- [ ] AC-5: All new tests pass via ./gradlew :app:testDebugUnitTest
- [ ] AC-6: compileDebugKotlin BUILD SUCCESSFUL + detekt 0 findings

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: LSNavigatorMessageTest covers behavior [PRIMARY]
  GIVEN: LSNavigatorMessage composable rendered in test
  WHEN:  test suite runs
  THEN:  tests verify: (a) signal-stripe LSGlassPanel renders, (b) auto-dismiss fires onDismiss after 5000ms for unpinned, (c) pinned variant does NOT auto-dismiss, (d) pin/close callbacks fire exactly once
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSNavigatorMessageTest' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSNavigatorMessageTest.kt
  TEST_FUNCTION: (multiple — at least 4 test functions)

AC-2: LSInlineErrorCalloutTest covers behavior
  GIVEN: LSInlineErrorCallout composable rendered in test
  WHEN:  test suite runs
  THEN:  tests verify: (a) warn-stripe glass panel renders, (b) suggestion chip tap fires onSuggestionTap with correct chip, (c) optional detail text renders when provided
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSInlineErrorCalloutTest' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSInlineErrorCalloutTest.kt
  TEST_FUNCTION: (multiple — at least 3 test functions)

AC-3: Sandbox stories enabled
  GIVEN: OrganismStories.kt source file
  WHEN:  inspected
  THEN:  LSNavigatorMessageStory.all and LSInlineErrorCalloutStory.all are NOT commented out; "API issues" comment removed; stories registered with ComponentTier.Organism
  VERIFY: grep -c 'LSNavigatorMessageStory\|LSInlineErrorCalloutStory' android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/OrganismStories.kt | awk '$1 >= 2 && !/\/\//'

AC-4: No hardcoded tween durations
  GIVEN: LSNavigatorMessage.kt source
  WHEN:  inspected
  THEN:  no `tween(` calls with integer literal durations; all animation specs reference LaneShadowTheme.motion.recipe.*
  VERIFY: grep -n 'tween(' android/app/src/main/java/com/laneshadow/ui/organisms/LSNavigatorMessage.kt | wc -l | xargs test 0 -eq

AC-5: All tests pass
  GIVEN: test suite
  WHEN:  ./gradlew :app:testDebugUnitTest runs for both test classes
  THEN:  BUILD SUCCESSFUL; 0 test failures
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSNavigatorMessageTest' --tests 'com.laneshadow.ui.organisms.LSInlineErrorCalloutTest' 2>&1 | grep 'BUILD SUCCESSFUL'

AC-6: Build + lint clean
  GIVEN: android project
  WHEN:  compileDebugKotlin and detekt run
  THEN:  BUILD SUCCESSFUL; 0 detekt findings
  VERIFY: cd android && ./gradlew :app:compileDebugKotlin && ./gradlew detekt

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/test/java/com/laneshadow/ui/organisms/LSNavigatorMessageTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/organisms/LSInlineErrorCalloutTest.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/OrganismStories.kt (MODIFY — uncomment stories)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSNavigatorMessage.kt (MODIFY — fix tween tokens only)

writeProhibited:
- android/app/src/main/java/com/laneshadow/ui/organisms/LSInlineErrorCallout.kt — organism source already correct
- android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt — not this task
- ios/** — wrong platform
- tokens/** — token definitions not in scope

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. android/app/src/main/java/com/laneshadow/ui/organisms/LSNavigatorMessage.kt [PRIMARY PATTERN]
   - Focus: existing implementation; identify auto-dismiss logic, animation specs, test tags

2. android/app/src/main/java/com/laneshadow/ui/organisms/LSInlineErrorCallout.kt
   - Focus: existing implementation; identify suggestion callback wiring, test tags

3. android/app/src/test/java/com/laneshadow/ui/organisms/LSTopBarTest.kt
   - Focus: test pattern for compose UI testing in this project; callback testing pattern

4. android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/OrganismStories.kt
   - Focus: current commented-out state; how other stories are registered

5. android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/ (LSNavigatorMessageStory.kt, LSInlineErrorCalloutStory.kt)
   - Focus: story definitions that need enabling

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Test files exist and compile
  Command: cd android && ./gradlew :app:compileDebugUnitTestKotlin
  Expected: BUILD SUCCESSFUL

Gate 2: All tests pass
  Command: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSNavigatorMessageTest' --tests 'com.laneshadow.ui.organisms.LSInlineErrorCalloutTest'
  Expected: BUILD SUCCESSFUL

Gate 3: No hardcoded tween
  Command: grep -n 'tween(' android/app/src/main/java/com/laneshadow/ui/organisms/LSNavigatorMessage.kt | wc -l
  Expected: 0

Gate 4: Stories enabled
  Command: grep 'LSNavigatorMessageStory\|LSInlineErrorCalloutStory' android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/OrganismStories.kt
  Expected: Lines present without // prefix

Gate 5: detekt clean
  Command: cd android && ./gradlew detekt
  Expected: 0 findings

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-ORG-03-android (source exists, tests missing)
Blocks:     Sprint 5 human testing gate (stories must be visible)
Parallel:   REMEDIATION-02 (iOS), REMEDIATION-03 (MapLayer iOS)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "LSNavigatorMessageTest.kt has 4+ behavior tests covering auto-dismiss, pin, attachment, close", "verify": "gradle test LSNavigatorMessageTest" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "LSInlineErrorCalloutTest.kt has 3+ behavior tests covering warn-stripe, suggestion tap, detail", "verify": "gradle test LSInlineErrorCalloutTest" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "OrganismStories.kt has NavigatorMessage + InlineError stories enabled", "verify": "grep gate" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "No hardcoded tween() in LSNavigatorMessage.kt", "verify": "grep tween(" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "All new tests pass", "verify": "gradle test" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "compileDebugKotlin + detekt clean", "verify": "gradle compileDebugKotlin && gradle detekt" }
  ]
}
-->
