================================================================================
TASK: CHAT-S04-R10 - Android AppStories registration for sprint-04 templates
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew test
  instrumented: cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.sandbox.AllStoriesSnapshotTest
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: 0/7 AC · pending

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`AppStories` registers all sprint-04 template variants; `pnpm snapshots:check` shows 0 platform-only entries for sprint-04 templates tier.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST match story IDs to canonical iOS form exactly (lowercase, dot-separated, kebab-case)
- MUST render the actual sprint-04 Composable (Idle/Planning/RouteResults/RouteDetails/Error) in each story
- MUST match per-story mock state semantics to iOS counterpart's mock fixture
- MUST capture one PNG per story under `androidTest/screenshots/AllStoriesSnapshotTest/` via `AllStoriesSnapshotTest`
- NEVER use a story ID that diverges from iOS canonical form — parity check will fail
- NEVER inline production data fetching inside a sandbox story — stories use MockProviders only
- NEVER skip variants present on iOS — every iOS sprint-04 story must have an Android twin
- STRICTLY stories registered via `AppStories.all` aggregator returning non-empty list
- STRICTLY each story exposes id, title, and Composable content lambda
- STRICTLY naming spec enforced via regex test in unit suite

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AppStories.all returns non-empty list with sprint-04 templates (AC-1 PRIMARY)
- [ ] Story IDs match canonical iOS form via regex (AC-2)
- [ ] Idle screen variants registered (AC-3)
- [ ] Planning screen variants registered (AC-4)
- [ ] RouteResults / RouteDetails / Error variants registered (AC-5)
- [ ] Snapshot capture produces PNG per story (AC-6)
- [ ] Cross-platform parity check passes for sprint-04 templates (AC-7)
- [ ] gradlew compileDebugKotlin clean
- [ ] detekt clean

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: AppStories.all returns non-empty list with sprint-04 templates [PRIMARY]
  GIVEN: AppStories.kt is loaded in test process
  WHEN:  `AppStories.all()` is invoked
  THEN:  Returned list contains entries for all canonical sprint-04 template IDs (idle 7, planning 9, route-results 7, route-details 6, error 6) — total ≥ 35 sprint-04 template entries

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/sandbox/AppStoriesRegistryTest.kt
  TEST_FUNCTION: all_returns_sprint_04_template_stories

AC-2: Story IDs match canonical iOS form via regex
  GIVEN: AppStories.all() returns sprint-04 template stories
  WHEN:  Each story.id is matched against canonical regex `^templates\.(idle|planning|route-results|route-details|error)-screen\.[a-z0-9]+(-[a-z0-9]+)*$`
  THEN:  All story IDs match the regex AND no story ID contains uppercase, underscore, or camelCase fragments

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/sandbox/AppStoriesNamingTest.kt
  TEST_FUNCTION: story_ids_match_canonical_regex

AC-3: Idle screen variants registered
  GIVEN: AppStories.all() returns sprint-04 stories
  WHEN:  Stories are filtered by id starting with `templates.idle-screen.`
  THEN:  Set contains exactly: default, s02-typing-send, s03-dark, s04-filter-sheet, v-first-ride, v-no-location, v-weather-advisory

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/sandbox/AppStoriesRegistryTest.kt
  TEST_FUNCTION: idle_screen_variants_registered

AC-4: Planning screen variants registered
  GIVEN: AppStories.all() returns sprint-04 stories
  WHEN:  Stories are filtered by id starting with `templates.planning-screen.`
  THEN:  Set contains exactly: default, dark, phase1, phase3, phase4, phase5, v-cancel-confirm, v-single-candidate, v-slow

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/sandbox/AppStoriesRegistryTest.kt
  TEST_FUNCTION: planning_screen_variants_registered

AC-5: RouteResults / RouteDetails / Error screen variants registered
  GIVEN: AppStories.all() returns sprint-04 stories
  WHEN:  Stories are filtered by route-results / route-details / error screen prefixes
  THEN:  route-results contains: default, s02-alt-selected, s03-dark, s04-refining, v01-default, v02-weather-divergent, v03-recall; route-details contains: default, s02-mixed-weather, s03-dark, s04-medium, s05-dismissing, v01-saved; error contains: default, s02-dark, s03-extended, s04-recovered, v01-offline, v02-generic

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/sandbox/AppStoriesRegistryTest.kt
  TEST_FUNCTION: route_and_error_variants_registered

AC-6: Snapshot capture produces PNG per story
  GIVEN: AllStoriesSnapshotTest is run on emulator with sprint-04 stories registered
  WHEN:  Snapshot test executes
  THEN:  One PNG file per story is written under `android/app/src/androidTest/screenshots/AllStoriesSnapshotTest/{story-id}.png` AND no story is skipped

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/sandbox/AllStoriesSnapshotTest.kt
  TEST_FUNCTION: captures_png_for_every_sprint_04_story

AC-7: Cross-platform parity check passes for sprint-04 templates
  GIVEN: Android sprint-04 stories registered AND iOS counterparts exist (after CHAT-S04-R07)
  WHEN:  pnpm snapshots:check is executed
  THEN:  Templates tier returns 0 ios_only entries AND 0 android_only entries for sprint-04 screens

  TDD_STATE:     none
  TEST_FILE:     scripts/snapshots/check.ts
  TEST_FUNCTION: n/a-script-output

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Type |
|-----|-----------|---------|------|
| TC-1 | Unit test asserts AppStories.all() ≥ 35 sprint-04 template entries | AC-1 | happy_path |
| TC-2 | Regex test asserts canonical naming on every story ID | AC-2 | happy_path |
| TC-3 | Set-equality test for idle-screen variants | AC-3 | happy_path |
| TC-4 | Set-equality test for planning-screen variants | AC-4 | happy_path |
| TC-5 | Set-equality test for route-results / route-details / error variants | AC-5 | happy_path |
| TC-6 | Instrumented snapshot test produces PNG per story | AC-6 | happy_path |
| TC-7 | pnpm snapshots:check exits 0 with no platform-only entries for sprint-04 templates | AC-7 | integration |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/sandbox/stories/AppStories.kt
- android/app/src/main/java/com/laneshadow/ui/sandbox/stories/Sprint04IdleStories.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/sandbox/stories/Sprint04PlanningStories.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/sandbox/stories/Sprint04RouteResultsStories.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/sandbox/stories/Sprint04RouteDetailsStories.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/sandbox/stories/Sprint04ErrorStories.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/sandbox/MockProviders.kt
- android/app/src/test/java/com/laneshadow/ui/sandbox/AppStoriesRegistryTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/sandbox/AppStoriesNamingTest.kt (NEW)

writeProhibited:
- android/build/** — generated
- android/app/build/** — generated
- android/app/src/main/java/com/laneshadow/ui/idle/** — production composables out of scope
- android/app/src/main/java/com/laneshadow/ui/planning/** — production composables out of scope
- android/app/src/main/java/com/laneshadow/ui/routeresults/** — production composables out of scope (R09 owns)
- ios/** — iOS handled by R07

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Kebab-case story IDs only — enforced by regex
- Group stories per screen in dedicated Sprint04*Stories.kt files
- Wrap each story Composable in MaterialTheme + LaneShadowTheme

⚠️ Ask First:
- Inventing variants beyond what iOS has (parity-first)
- Touching production composables (file separate task if changes needed)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- AppStories.kt (MODIFY): aggregate sprint-04 sprints' story lists
- Sprint04*Stories.kt × 5 (NEW): per-screen story registrations
- MockProviders.kt (MODIFY): mock fixtures for each variant
- AppStoriesRegistryTest.kt + AppStoriesNamingTest.kt (NEW): unit assertions

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH AC:

### RED PHASE
- READ: AC, current AppStories.kt:13 (emptyList()), iOS canonical IDs, RULES.md parity spec
- WRITE: ONE unit / instrumented test asserting registration shape
- RUN: `./gradlew test --tests <TestClass>` or `./gradlew connectedDebugAndroidTest`
- VERIFY: Test FAILS

### GREEN PHASE
- WRITE: minimal story registrations
- RUN: tests
- VERIFY: Test PASSES

### REFACTOR PHASE
- READ: full registry
- RUN: full suite + snapshots:check
- VERIFY: parity passes

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. android/app/src/main/java/com/laneshadow/ui/sandbox/stories/AppStories.kt [PRIMARY PATTERN]
   - Lines: all
   - Focus: Current emptyList() at L13 — replace with full registry

2. android/app/src/main/java/com/laneshadow/ui/sandbox/SandboxStory.kt
   - Lines: all
   - Focus: Story contract (id, title, content)

3. android/app/src/main/java/com/laneshadow/ui/{idle,planning,routeresults,routedetails,error}/*Screen.kt
   - Lines: all
   - Focus: Composable signatures for each story

4. ios/LaneShadow/Sandbox/Stories/AppStories.swift
   - Lines: all
   - Focus: Canonical iOS story IDs to mirror

5. RULES.md
   - Lines: Cross-Platform Component Parity section
   - Focus: Naming spec

6. scripts/snapshots/check.ts
   - Lines: all
   - Focus: Parity check rules and tier classification

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: TDD_STATE values show each test went red before green.

Gate 2: All unit tests pass
  Command: cd android && ./gradlew test --tests com.laneshadow.ui.sandbox.AppStoriesRegistryTest --tests com.laneshadow.ui.sandbox.AppStoriesNamingTest
  Expected: Exit 0.

Gate 3: Instrumented snapshot test passes
  Command: cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.sandbox.AllStoriesSnapshotTest
  Expected: Exit 0.

Gate 4: Compile clean
  Command: cd android && ./gradlew :app:compileDebugKotlin
  Expected: Exit 0.

Gate 5: detekt clean
  Command: cd android && ./gradlew detekt
  Expected: Exit 0.

Gate 6: Token compliance
  Command: scripts/tokens/enforce-native-compliance.sh
  Expected: Exit 0.

Gate 7: Snapshot parity passes
  Command: pnpm snapshots:check
  Expected: Exit 0 with zero platform-only entries for sprint-04 templates.

Gate 8: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: CHAT-S04-R07 (iOS canonical story IDs must be in place first)
Blocks:     CHAT-S04-R12 (Android instrumented E2E uses sandbox stories as screen entry)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-R10",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "AppStories.all returns ≥ 35 sprint-04 template entries", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.sandbox.AppStoriesRegistryTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "Story IDs match canonical iOS regex form", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.sandbox.AppStoriesNamingTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "All 7 idle-screen variants registered", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.sandbox.AppStoriesRegistryTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "All 9 planning-screen variants registered", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.sandbox.AppStoriesRegistryTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "All route-results, route-details, error variants registered", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.sandbox.AppStoriesRegistryTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "AllStoriesSnapshotTest captures PNG per story", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.sandbox.AllStoriesSnapshotTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-7", "type": "acceptance_criterion", "description": "pnpm snapshots:check passes 0/0 for sprint-04 templates tier", "verify": "pnpm snapshots:check", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Unit test for ≥35 sprint-04 template entries", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.sandbox.AppStoriesRegistryTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Regex test for canonical naming", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.sandbox.AppStoriesNamingTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "Set-equality test for idle variants", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.sandbox.AppStoriesRegistryTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "Set-equality test for planning variants", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.sandbox.AppStoriesRegistryTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "Set-equality test for route/error variants", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.sandbox.AppStoriesRegistryTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "Snapshot test produces PNG per story", "maps_to_ac": "AC-6", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.sandbox.AllStoriesSnapshotTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-7", "type": "test_criterion", "description": "pnpm snapshots:check 0/0 sprint-04 templates", "maps_to_ac": "AC-7", "verify": "pnpm snapshots:check", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
