================================================================================
TASK: CHAT-S04-R12 - Android instrumented E2E suite covering all 8 sprint-04 gate steps
================================================================================

TASK_TYPE:  TEST
STATUS:     REOPENED (round-3 RF-19, RF-21, RF-24)
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.e2e.sprint04.Sprint04GateE2ETest
  lint-test: cd android && ./gradlew test --tests com.laneshadow.e2e.sprint04.Sprint04ManualAnnotationLintTest
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: 0/9 AC · RF-19: ConvexClient.cancelPlan() stubbed; RF-24: Sprint04E2EHarness.kt, ScreenshotEvidence.kt, ConvexQueryProbe.kt, Sprint04ManualAnnotationLintTest.kt missing; RF-21: gate step 7 session reuse unverified

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

8 instrumented Compose UI tests (one per SPRINT.md gate step) execute on emulator against real Convex, capture screenshots, and emit MANUAL annotation block per RULES.md.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST give each of the 8 SPRINT.md gate steps a dedicated instrumented test method
- MUST use `createAndroidComposeRule<MainActivity>()` and existing Espresso/Compose harness pattern from `RootViewAuthGateEspressoTest.kt`
- MUST authenticate via Intent extra `LANESHADOW_UI_TEST_BYPASS_AUTH` (Android equivalent of iOS `-LaneShadowUITestBypassAuth`) wired through MainActivity
- MUST hit real Convex backend at `CONVEX_URL` env var — no mock client
- MUST capture screenshot evidence to `android/app/src/androidTest/screenshots/sprint-04-e2e/step-{N}/{phase}.png`
- MUST emit a MANUAL annotation block (Markdown comment in test file header) listing the manual real-device verification steps per RULES.md
- MUST fix detekt baseline failure at `LoginSmokeTest.kt:28` if any incidental edit lands there
- NEVER mock Convex client or stub network — violates Supreme Rule of real testing
- NEVER skip a gate step because emulator can't render it — escalate to user
- NEVER claim test 'passes' without screenshot evidence in target directory
- NEVER use `--no-verify` or `@Suppress` to bypass detekt; fix the underlying issue
- STRICTLY emulator runs are the automated tier; real-device evidence is recorded as MANUAL annotation only — never auto-claimed
- STRICTLY ACs map 1:1 to SPRINT.md gate steps 1-8 (paste verbatim into GIVEN/WHEN/THEN)
- STRICTLY test names follow form `gate_step_{N}_{slug}()` so reviewer can audit coverage

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Gate step 1 — User signs in and reaches IdleScreen with greeting (AC-1 PRIMARY)
- [ ] Gate step 2 — User submits chat prompt and PlanningScreen appears (AC-2)
- [ ] Gate step 3 — RouteResults displays alternates with selectable cards (AC-3)
- [ ] Gate step 4 — User taps a route card to open RouteDetails (AC-4)
- [ ] Gate step 5 — Dismiss callout reveals recall chip and recall restores it (AC-5)
- [ ] Gate step 6 — Refinement message updates routes (AC-6)
- [ ] Gate step 7 — User saves a route from RouteDetails (AC-7)
- [ ] Gate step 8 — Auth taxonomy errors surface ErrorScreen (AC-8)
- [ ] MANUAL annotation block present and complete (AC-9)
- [ ] All 8 instrumented tests pass on emulator
- [ ] Screenshot evidence written to androidTest/screenshots/sprint-04-e2e/step-{N}/

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Gate step 1 — User signs in and reaches IdleScreen with greeting [PRIMARY]
  GIVEN: Fresh app install on emulator with `LANESHADOW_UI_TEST_BYPASS_AUTH` Intent extra set and `CONVEX_URL` pointing at real Convex
  WHEN:  App launches and completes auth bootstrap
  THEN:  IdleScreen is displayed AND greeting text contains the test user's display name AND screenshot is captured to `android/app/src/androidTest/screenshots/sprint-04-e2e/step-1/idle-greeting.png`

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/e2e/sprint04/Sprint04GateE2ETest.kt
  TEST_FUNCTION: gate_step_1_signed_in_user_reaches_idle_with_greeting

AC-2: Gate step 2 — User submits chat prompt and PlanningScreen appears
  GIVEN: User is on IdleScreen post-auth
  WHEN:  User types a planning prompt into the input and taps Send
  THEN:  PlanningScreen is displayed within 5 seconds AND LSPhaseIndicator shows the canonical 'parsing' phase AND screenshot is captured to step-2/planning-parsing.png

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/e2e/sprint04/Sprint04GateE2ETest.kt
  TEST_FUNCTION: gate_step_2_chat_prompt_advances_to_planning

AC-3: Gate step 3 — RouteResults displays alternates with selectable cards
  GIVEN: PlanningScreen has progressed through all 5 phases
  WHEN:  Backend emits routeOptions and RouteResultsScreen mounts
  THEN:  RouteResultsScreen displays at least 2 route option cards AND tapping the second card promotes its polyline to solid AND callout updates to show the selected route AND screenshot is captured to step-3/route-results-alt-selected.png

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/e2e/sprint04/Sprint04GateE2ETest.kt
  TEST_FUNCTION: gate_step_3_route_results_alt_selection

AC-4: Gate step 4 — User taps a route card to open RouteDetails
  GIVEN: RouteResultsScreen displays multiple route cards
  WHEN:  User taps the first route card
  THEN:  RouteDetailsScreen is displayed within 2 seconds AND header shows route distance, elevation, surface mix AND screenshot is captured to step-4/route-details-opened.png

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/e2e/sprint04/Sprint04GateE2ETest.kt
  TEST_FUNCTION: gate_step_4_route_card_opens_details

AC-5: Gate step 5 — Dismiss callout reveals recall chip and recall restores it
  GIVEN: RouteResultsScreen with navigator callout visible
  WHEN:  User taps dismiss on callout, then taps the recall chip that appears
  THEN:  After dismiss, LSRecallChip is visible (not LSNavigatorMessage) AND screenshot captured to step-5a/recall-chip.png; after recall tap, LSNavigatorMessage is restored AND screenshot captured to step-5b/callout-restored.png

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/e2e/sprint04/Sprint04GateE2ETest.kt
  TEST_FUNCTION: gate_step_5_dismiss_and_recall_callout

AC-6: Gate step 6 — Refinement message updates routes
  GIVEN: User is on RouteResultsScreen with initial route options
  WHEN:  User submits a refinement message via the chat affordance
  THEN:  PlanningScreen briefly re-mounts AND new RouteResultsScreen replaces routeOptions within 30 seconds AND at least one route differs from initial set AND screenshot captured to step-6/refined-routes.png

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/e2e/sprint04/Sprint04GateE2ETest.kt
  TEST_FUNCTION: gate_step_6_refinement_updates_routes

AC-7: Gate step 7 — User saves a route from RouteDetails
  GIVEN: User is on RouteDetailsScreen for a selected route
  WHEN:  User taps the Save action
  THEN:  Save button transitions to isSaved state AND backend rideRoutes mutation is observed (verified via Convex query probe) AND screenshot captured to step-7/route-saved.png

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/e2e/sprint04/Sprint04GateE2ETest.kt
  TEST_FUNCTION: gate_step_7_save_route

AC-8: Gate step 8 — Auth taxonomy errors surface ErrorScreen
  GIVEN: Test mode toggles auth taxonomy fault injection (depends on R03 auth taxonomy contract)
  WHEN:  Convex returns an unauthenticated error mid-session
  THEN:  ErrorScreen mounts with the canonical 'Session expired' label AND retry affordance present AND screenshot captured to step-8/error-screen.png

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/e2e/sprint04/Sprint04GateE2ETest.kt
  TEST_FUNCTION: gate_step_8_auth_error_surfaces_error_screen

AC-9: MANUAL annotation block present and complete per RULES.md
  GIVEN: Sprint04GateE2ETest.kt is loaded
  WHEN:  File header is parsed by the manual-annotation linter
  THEN:  File contains a Markdown comment block titled 'MANUAL REAL-DEVICE VERIFICATION' enumerating step-by-step instructions for a human running each gate step on a physical Pixel device AND each step references the RULES.md real-device E2E section

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/e2e/sprint04/Sprint04ManualAnnotationLintTest.kt
  TEST_FUNCTION: manual_annotation_block_present_and_complete

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Type |
|-----|-----------|---------|------|
| TC-1 | Step 1 instrumented test asserts IdleScreen + greeting + screenshot file written | AC-1 | happy_path |
| TC-2 | Step 2 instrumented test asserts PlanningScreen mount within 5s + canonical parsing phase visible | AC-2 | happy_path |
| TC-3 | Step 3 instrumented test asserts ≥2 route cards + alt selection promotes polyline + screenshot | AC-3 | happy_path |
| TC-4 | Step 4 instrumented test asserts RouteDetails opens within 2s with header data + screenshot | AC-4 | happy_path |
| TC-5 | Step 5 instrumented test asserts dismiss→chip and chip→callout cycle with two screenshots | AC-5 | happy_path |
| TC-6 | Step 6 instrumented test asserts refinement message updates routes within 30s + screenshot | AC-6 | integration |
| TC-7 | Step 7 instrumented test asserts Save toggles state and Convex query confirms persistence + screenshot | AC-7 | integration |
| TC-8 | Step 8 instrumented test asserts ErrorScreen mounts on auth taxonomy fault + screenshot | AC-8 | edge_case |
| TC-9 | Lint test asserts MANUAL REAL-DEVICE VERIFICATION block present in Sprint04GateE2ETest.kt header | AC-9 | happy_path |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/androidTest/java/com/laneshadow/e2e/sprint04/Sprint04GateE2ETest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/e2e/sprint04/Sprint04E2EHarness.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/e2e/sprint04/ScreenshotEvidence.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/e2e/sprint04/ConvexQueryProbe.kt (NEW)
- android/app/src/test/java/com/laneshadow/e2e/sprint04/Sprint04ManualAnnotationLintTest.kt (NEW)
- android/app/src/main/java/com/laneshadow/MainActivity.kt (MODIFY — wire LANESHADOW_UI_TEST_BYPASS_AUTH Intent extra)
- android/app/src/androidTest/java/com/laneshadow/LoginSmokeTest.kt (MODIFY only if detekt fix needed)

writeProhibited:
- android/build/** — generated
- android/app/build/** — generated
- android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt — touched only via DI wiring; do not refactor
- android/app/src/main/java/com/laneshadow/ui/** — production composables out of scope
- ios/** — iOS handled by R08
- convex/** — server out of scope

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use `createAndroidComposeRule<MainActivity>()` (never `createComposeRule()` — no Activity context)
- Real touch + real text entry via Compose semantics tree
- Screenshots via Espresso Screenshot or `androidx.test.runner.screenshot.Screenshot` API
- Convex query probe runs in instrumentation context to verify backend persistence

⚠️ Ask First:
- Adding new Intent extras to MainActivity beyond the bypass-auth flag
- Modifying ConvexClientProvider DI wiring

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- Sprint04GateE2ETest.kt (NEW): 8 gate-step methods + MANUAL annotation header block
- Sprint04E2EHarness.kt (NEW): shared test harness (auth bootstrap, real Convex client wiring)
- ScreenshotEvidence.kt (NEW): screenshot capture helper writing to deterministic paths
- ConvexQueryProbe.kt (NEW): instrumentation-side Convex queries for persistence verification (gate step 7)
- Sprint04ManualAnnotationLintTest.kt (NEW): asserts manual-annotation block presence
- MainActivity.kt (MODIFY): bypass-auth Intent extra wiring

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH AC (gate step):

### RED PHASE
- READ: AC, SPRINT.md verbatim step, existing RootViewAuthGateEspressoTest pattern
- WRITE: ONE instrumented test method `gate_step_N_<slug>`
- RUN: `./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=...#gate_step_N_<slug>`
- VERIFY: Test FAILS

### GREEN PHASE
- WRITE: minimal harness + helpers + accessibility identifiers
- RUN: instrumented test
- VERIFY: Test PASSES with screenshot artifact present

### REFACTOR PHASE
- READ: shared harness
- RUN: full instrumented suite + MANUAL annotation lint + detekt
- VERIFY: still green

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/tasks/sprint-04-conversational-planning-loop/SPRINT.md [PRIMARY PATTERN]
   - Lines: Human Test Deliverable section
   - Focus: Verbatim 8 gate steps to copy into AC GIVEN/WHEN/THEN

2. android/app/src/androidTest/java/com/laneshadow/SmokeInstrumentedTest.kt
   - Lines: all
   - Focus: Existing instrumented test pattern + MainActivity entry

3. android/app/src/androidTest/java/com/laneshadow/RootViewAuthGateEspressoTest.kt
   - Lines: all
   - Focus: Auth-aware Espresso test pattern + Compose interop

4. android/app/src/main/java/com/laneshadow/MainActivity.kt
   - Lines: all
   - Focus: Wire LANESHADOW_UI_TEST_BYPASS_AUTH Intent extra into auth bootstrap

5. ios/LaneShadowUITests/Sprint04/Sprint04GateE2ETests.swift (after R08)
   - Lines: all
   - Focus: iOS XCUITest pattern using -LaneShadowUITestBypassAuth — mirror it

6. RULES.md
   - Lines: Real Device E2E Testing section
   - Focus: Real-device verification protocol + MANUAL annotation requirement

7. .spec/reviews/red-hat-sprint-04-2026-05-03T14-19-50Z.md
   - Lines: all
   - Focus: Red-hat findings driving E2E gaps

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Each AC has a test mapping 1:1 to SPRINT.md step
  Verify: 8 gate-step test methods present + 1 manual-annotation-lint test.

Gate 2: All 8 instrumented tests pass on emulator
  Command: cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.e2e.sprint04.Sprint04GateE2ETest
  Expected: Exit 0; 8 tests reported passing.

Gate 3: Manual annotation lint passes
  Command: cd android && ./gradlew test --tests com.laneshadow.e2e.sprint04.Sprint04ManualAnnotationLintTest
  Expected: Exit 0.

Gate 4: Evidence artifacts present per step
  Command: ls -la android/app/src/androidTest/screenshots/sprint-04-e2e/step-1 .../step-2 .../step-3 .../step-4 .../step-5a .../step-5b .../step-6 .../step-7 .../step-8
  Expected: Each directory contains at least one .png screenshot.

Gate 5: No mocks in production E2E paths
  Command: grep -rn "Mock\|Stub\|Fixture" android/app/src/androidTest/java/com/laneshadow/e2e/sprint04/ || true
  Expected: Empty output.

Gate 6: Compile clean
  Command: cd android && ./gradlew :app:compileDebugKotlin
  Expected: Exit 0.

Gate 7: detekt clean
  Command: cd android && ./gradlew detekt
  Expected: Exit 0 (fix LoginSmokeTest:28 if touched).

Gate 8: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: CHAT-S04-R01 (routeEnrichments:list), CHAT-S04-R02 (savedRoutes fingerprint), CHAT-S04-R03 (auth taxonomy — needed for step 8), CHAT-S04-R09 (RouteResults card tap + recall — needed for steps 3 + 5), CHAT-S04-R10 (sandbox stories), CHAT-S04-R11 (canonical phase labels — needed for step 2)
Blocks:     (none — final gate evidence)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-R12",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "SPRINT.md step 1 — sign-in lands on IdleScreen with greeting", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.e2e.sprint04.Sprint04GateE2ETest#gate_step_1_signed_in_user_reaches_idle_with_greeting", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "SPRINT.md step 2 — chat prompt advances to PlanningScreen", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.e2e.sprint04.Sprint04GateE2ETest#gate_step_2_chat_prompt_advances_to_planning", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "SPRINT.md step 3 — RouteResults alt selection", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.e2e.sprint04.Sprint04GateE2ETest#gate_step_3_route_results_alt_selection", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "SPRINT.md step 4 — route card opens RouteDetails", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.e2e.sprint04.Sprint04GateE2ETest#gate_step_4_route_card_opens_details", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "SPRINT.md step 5 — dismiss → recall chip → callout cycle", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.e2e.sprint04.Sprint04GateE2ETest#gate_step_5_dismiss_and_recall_callout", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "SPRINT.md step 6 — refinement updates routes", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.e2e.sprint04.Sprint04GateE2ETest#gate_step_6_refinement_updates_routes", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-7", "type": "acceptance_criterion", "description": "SPRINT.md step 7 — save route persists via Convex", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.e2e.sprint04.Sprint04GateE2ETest#gate_step_7_save_route", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-8", "type": "acceptance_criterion", "description": "SPRINT.md step 8 — auth taxonomy fault surfaces ErrorScreen", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.e2e.sprint04.Sprint04GateE2ETest#gate_step_8_auth_error_surfaces_error_screen", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-9", "type": "acceptance_criterion", "description": "MANUAL REAL-DEVICE VERIFICATION block present per RULES.md", "verify": "cd android && ./gradlew test --tests com.laneshadow.e2e.sprint04.Sprint04ManualAnnotationLintTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Step 1 instrumented test", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.e2e.sprint04.Sprint04GateE2ETest#gate_step_1_signed_in_user_reaches_idle_with_greeting", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Step 2 instrumented test", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.e2e.sprint04.Sprint04GateE2ETest#gate_step_2_chat_prompt_advances_to_planning", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "Step 3 instrumented test", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.e2e.sprint04.Sprint04GateE2ETest#gate_step_3_route_results_alt_selection", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "Step 4 instrumented test", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.e2e.sprint04.Sprint04GateE2ETest#gate_step_4_route_card_opens_details", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "Step 5 instrumented test", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.e2e.sprint04.Sprint04GateE2ETest#gate_step_5_dismiss_and_recall_callout", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "Step 6 instrumented test", "maps_to_ac": "AC-6", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.e2e.sprint04.Sprint04GateE2ETest#gate_step_6_refinement_updates_routes", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-7", "type": "test_criterion", "description": "Step 7 instrumented test with Convex query verification", "maps_to_ac": "AC-7", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.e2e.sprint04.Sprint04GateE2ETest#gate_step_7_save_route", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-8", "type": "test_criterion", "description": "Step 8 instrumented test for auth fault", "maps_to_ac": "AC-8", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.e2e.sprint04.Sprint04GateE2ETest#gate_step_8_auth_error_surfaces_error_screen", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-9", "type": "test_criterion", "description": "Lint test for MANUAL annotation block", "maps_to_ac": "AC-9", "verify": "cd android && ./gradlew test --tests com.laneshadow.e2e.sprint04.Sprint04ManualAnnotationLintTest", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
