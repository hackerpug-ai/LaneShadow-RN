<!-- Template Version: 5.1.0 | Sprint: sprint-04-molecules-composite-patterns | Type: REMEDIATION/TDD -->

================================================================================
TASK: REMEDIATE-02-android — Fix ChatInput stubs + WeatherBadge test enum
================================================================================

TASK_TYPE:  REMEDIATION
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     S
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   30 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   06-uc-mol.md (UC-MOL-05, UC-MOL-06)
SOURCE:     Red-hat review 2026-04-24 (.spec/reviews/red-hat-sprint-04-molecules-2026-04-24.md)

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :app:testDebugUnitTest
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: AC-1 none · AC-2 none · AC-3 none · AC-4 none · 0/4 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Android LSWeatherBadgeTest uses correct WeatherCondition.Clear enum (fixes compilation blocker). LSChatInput properly integrates LSLocationContextBar when locationBadge is non-null, uses LSSuggestionChip molecule for suggestion chips (not raw LSPill), and routes inputHeight through theme.sizing.component.inputHeight (with fallback). Missing LSSuggestionChipTest.kt unit test created.

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST fix LSWeatherBadgeTest.kt:30 — change WeatherCondition.Sun to WeatherCondition.Clear.
- MUST replace LSChatInput.kt:74-77 TODO stub with actual LSLocationContextBar composable call.
- MUST replace LSChatInput.kt:85-96 raw LSPill usage with LSSuggestionChip molecule.
- MUST route inputHeight through theme.sizing.component.inputHeight when available, with documented fallback.
- MUST create LSSuggestionChipTest.kt unit test file.
- STRICTLY: ./gradlew :app:testDebugUnitTest exits BUILD SUCCESSFUL; ./gradlew :app:compileDebugKotlin succeeds.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSWeatherBadgeTest enum fix unblocks all Android unit tests
- [ ] AC-2: LSChatInput renders LSLocationContextBar when locationBadge is non-null
- [ ] AC-3: LSChatInput uses LSSuggestionChip instead of raw LSPill
- [ ] AC-4: LSSuggestionChipTest.kt created with basic composition tests

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: WeatherBadge test compilation fix
  GIVEN: LSWeatherBadgeTest.kt at android/app/src/test/java/com/laneshadow/ui/molecules/LSWeatherBadgeTest.kt
  WHEN:  reading line 30
  THEN:  uses WeatherCondition.Clear (not WeatherCondition.Sun)
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSWeatherBadgeTest.kt

AC-2: LSChatInput locationBadge integration
  GIVEN: LSChatInput.kt at android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt
  WHEN:  locationBadge parameter is non-null
  THEN:  LSLocationContextBar composable renders with location data (no TODO comment, no empty body)
  VERIFY: grep -A2 "locationBadge" android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt | grep -c "TODO" returns 0
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSChatInputTest.kt

AC-3: LSChatInput suggestion chip molecule composition
  GIVEN: LSChatInput.kt suggestion chip section
  WHEN:  suggestions list is non-empty
  THEN:  uses LSSuggestionChip composable (imported from molecules package), not raw LSPill
  VERIFY: grep -c "LSSuggestionChip" android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt returns >= 1
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSChatInputTest.kt

AC-4: LSSuggestionChipTest.kt created
  GIVEN: the Android molecule test directory
  WHEN:  listing test files
  THEN:  LSSuggestionChipTest.kt exists with at least 2 test functions verifying chip composition and callback
  VERIFY: test -f android/app/src/test/java/com/laneshadow/ui/molecules/LSSuggestionChipTest.kt && echo EXISTS
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSSuggestionChipTest.kt

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

- android/app/src/test/java/com/laneshadow/ui/molecules/LSWeatherBadgeTest.kt (line 30 — wrong enum)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt (full file — stubs at 65-67, 74-77, 85-96)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSLocationContextBar.kt (API — to integrate into ChatInput)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt (API — to replace raw LSPill)
- android/app/src/main/java/com/laneshadow/ui/molecules/PillSemanticsTypes.kt (WeatherCondition enum definition)
- android/app/src/test/java/com/laneshadow/ui/molecules/LSFilterChipTest.kt (reference — similar test pattern for SuggestionChip)

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE_ALLOWED:
  - android/app/src/test/java/com/laneshadow/ui/molecules/LSWeatherBadgeTest.kt (MODIFY)
  - android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt (MODIFY)
  - android/app/src/test/java/com/laneshadow/ui/molecules/LSChatInputTest.kt (MODIFY)
  - android/app/src/test/java/com/laneshadow/ui/molecules/LSSuggestionChipTest.kt (NEW)

WRITE_PROHIBITED:
  - All atom files (android/app/src/main/java/com/laneshadow/ui/atoms/*)
  - All other molecule implementation files
  - android/app/build.gradle*

--------------------------------------------------------------------------------
VERIFICATION GATES
--------------------------------------------------------------------------------

| Gate | Command | Expected |
|------|---------|----------|
| No TODO stubs | grep -c "TODO" android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt | 0 |
| SuggestionChip used | grep -c "LSSuggestionChip" android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt | >= 1 |
| Test compiles | cd android && ./gradlew :app:testDebugUnitTest | BUILD SUCCESSFUL |
| Kotlin compiles | cd android && ./gradlew :app:compileDebugKotlin | BUILD SUCCESSFUL |

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

depends_on: [] (all source molecules already exist)
blocks: [] (remediation only)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

Discovered by red-hat review 2026-04-24. This is the single highest-priority fix because the WeatherBadge test compilation error blocks ALL Android unit tests from running.

Specific locations:
- LSWeatherBadgeTest.kt:30 — WeatherCondition.Sun should be WeatherCondition.Clear
- LSChatInput.kt:65-67 — hardcoded 56.dp (minor, can use theme token with fallback)
- LSChatInput.kt:74-77 — empty body for locationBadge (TODO stub)
- LSChatInput.kt:85-96 — raw LSPill instead of LSSuggestionChip molecule
- Missing: android/app/src/test/java/com/laneshadow/ui/molecules/LSSuggestionChipTest.kt
