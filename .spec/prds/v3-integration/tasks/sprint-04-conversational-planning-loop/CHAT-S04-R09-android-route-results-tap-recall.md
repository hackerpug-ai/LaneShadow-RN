================================================================================
TASK: CHAT-S04-R09 - Android RouteResultsScreen route card tap forwarding + recall chip
================================================================================

TASK_TYPE:  FEATURE
STATUS:     NEEDS_REVISION
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

REOPENED_BY: red-hat round-2 review 2026-05-03T21:43:36Z
REOPEN_REASON: All 6 ACs use test theatre (stateOverride bypass, local data assertions instead of Compose semantics).
  - AC-1/AC-2: Tests assert against stateOverride path that bypasses ViewModel
  - AC-3: resolvedViewModel.selectRoute() never called in test path
  - AC-4/AC-5: Tests assert local Kotlin variables, not Compose semantics stateDescription
  - AC-6: RecompositionCounter measures wrapper, not internal RouteResultsRoute
  Prior APPROVED verdict (9 cycles) was unjustified — reviewer did not detect test doubles.

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.routeresults.RouteResultsScreenUiTest
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: 0/6 AC · pending

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Route card taps select route, dismiss hides callout and reveals recall chip, alt polyline promotes to solid stroke.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST hoist `isCalloutVisible` state via `rememberSaveable` so it survives config change
- MUST forward `onRouteCardTap` to `LSNavigatorMessage.onAttachmentTap` so `selectedAttachmentId` updates
- MUST promote alt polyline (dashed) to solid when `selectedRouteId` changes via `LaunchedEffect` on ViewModel state
- MUST match border tint of selected route card to the variant color emitted by the ViewModel
- MUST fix detekt baseline issue at `android/app/src/androidTest/java/com/laneshadow/LoginSmokeTest.kt:28` if this task touches that file (Boy Scout rule)
- NEVER trigger network calls from the Compose layer — dispatch `RideFlowAction.SelectRoute` to ViewModel
- NEVER use `mutableStateOf` without `remember`/`rememberSaveable` wrapper
- NEVER hardcode hex colors — use MaterialTheme.colorScheme + design tokens
- NEVER bypass detekt or use @Suppress to silence pre-existing warnings
- STRICTLY all state changes flow Composable → Action → ViewModel → State (UDF)
- STRICTLY `isCalloutVisible` toggle and recall chip are mutually exclusive — never visible together
- STRICTLY `LaunchedEffect` keyed on `selectedRouteId` to avoid recomposition leaks

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Dismiss hides callout and reveals recall chip (AC-1 PRIMARY) ← PARTIAL: Test uses production RouteResultsRoute; assertIsNotDisplayed fragility; device verification pending
- [ ] Recall chip click restores callout (AC-2) ← FAIL: isCalloutVisible always starts true; state.attachmentsDismissed never consumed by RouteResultsLoaded; test initial assertion recall-chip.assertIsDisplayed() will fail on device (RouteResultsRoute.kt:198)
- [ ] Route card tap dispatches `RideFlowAction.SelectRoute` (AC-3) ← PARTIAL: callback captured via onRouteCardTap but resolvedViewModel.selectRoute() at RouteResultsRoute.kt:97-99 never called in stateOverride path
- [ ] Alt polyline promotes to solid stroke on selection change (AC-4) ← FAIL: test theatre — asserts local Kotlin data variables (RouteResultsPolylineUiTest.kt:87-92,129-134), never reads semantics stateDescription from route-results-map node
- [ ] Selected card border tint matches variant color (AC-5) ← FAIL: test theatre — checks GeneratedTokens.color.Route.best != Color.Unspecified (RouteResultsScreenUiTest.kt:243-251) but never asserts card border color via LSRouteAttachmentCardBorderColorKey semantics
- [ ] No recomposition leak across selection cycles (AC-6) ← PARTIAL: RecompositionCounter wraps production RouteResultsRoute and counts wrapper recompositions; meaningful but measures external recompositions not internal RouteResultsRoute compositionDelta; device verification pending
- [x] gradlew compileDebugKotlin clean
- [x] detekt clean (any incidental fixes committed)
- [ ] Token compliance script passes ← PARTIAL: script not run (no evidence in diff)
- [x] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Dismiss hides callout and reveals recall chip [PRIMARY]
  GIVEN: RouteResultsScreen is rendered with isCalloutVisible = true and a non-null navigator message
  WHEN:  User taps the dismiss control on LSNavigatorMessage
  THEN:  LSNavigatorMessage is removed from composition AND LSRecallChip is rendered in its place at the same anchor

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/routeresults/RouteResultsScreenUiTest.kt
  TEST_FUNCTION: dismiss_hides_callout_and_shows_recall_chip

AC-2: Recall chip click restores callout
  GIVEN: RouteResultsScreen is rendered with isCalloutVisible = false and LSRecallChip visible
  WHEN:  User taps LSRecallChip
  THEN:  LSRecallChip is removed AND LSNavigatorMessage is re-rendered with the previously dismissed content

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/routeresults/RouteResultsScreenUiTest.kt
  TEST_FUNCTION: recall_chip_click_restores_callout

AC-3: Route card tap dispatches SelectRoute action
  GIVEN: RouteResultsScreen is rendered with three route cards (selectedRouteId = 'route-a')
  WHEN:  User taps the route card with id 'route-b'
  THEN:  ViewModel receives RideFlowAction.SelectRoute(routeOptionId = 'route-b') AND LSNavigatorMessage.onAttachmentTap is invoked with attachmentId 'route-b'

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/routeresults/RouteResultsScreenUiTest.kt
  TEST_FUNCTION: route_card_tap_dispatches_select_route_action

AC-4: Alt polyline promotes to solid stroke on selection change
  GIVEN: RouteResultsScreen renders selectedRouteId = 'route-a' (solid) and 'route-b' as dashed alt
  WHEN:  selectedRouteId state transitions from 'route-a' to 'route-b'
  THEN:  Polyline for 'route-b' renders with solid stroke AND polyline for 'route-a' renders with dashed stroke (verified via Compose semantics tag 'polyline-style-{routeId}')

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/routeresults/RouteResultsPolylineUiTest.kt
  TEST_FUNCTION: alt_polyline_promotes_to_solid_on_selection_change

AC-5: Selected card border tint matches variant color
  GIVEN: RouteResultsScreen renders three routes with variant colors (a=primary, b=secondary, c=tertiary)
  WHEN:  selectedRouteId changes to each route in turn
  THEN:  The selected card's border color equals the variant color emitted by the ViewModel for that route (no hardcoded hex)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/routeresults/RouteResultsScreenUiTest.kt
  TEST_FUNCTION: selected_card_border_matches_variant_color

AC-6: No recomposition leak across selection cycles
  GIVEN: RouteResultsScreen mounted with three routes
  WHEN:  Test cycles selectedRouteId across all three routes 10 times in succession
  THEN:  Composition counter for RouteResultsScreen root composable increments by ≤ 11 (initial + 10 keyed updates) AND no orphan LaunchedEffect remains active

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/routeresults/RouteResultsRecompositionTest.kt
  TEST_FUNCTION: no_recomposition_leak_across_selection_cycles

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Type |
|-----|-----------|---------|------|
| TC-1 | Compose UI test verifies dismiss removes callout and inserts LSRecallChip at same anchor | AC-1 | happy_path |
| TC-2 | Compose UI test verifies recall chip tap restores LSNavigatorMessage | AC-2 | happy_path |
| TC-3 | Compose UI test asserts ViewModel receives SelectRoute(routeOptionId) on card tap and onAttachmentTap fires | AC-3 | happy_path |
| TC-4 | Polyline UI test asserts dashed↔solid transition keyed on selectedRouteId | AC-4 | happy_path |
| TC-5 | Compose semantics test reads border color via testTag and equals variant color from ViewModel | AC-5 | happy_path |
| TC-6 | Recomposition counter test asserts bounded composition count and no orphan LaunchedEffect | AC-6 | edge_case |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsScreen.kt
- android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsViewModel.kt
- android/app/src/main/java/com/laneshadow/services/RideFlowState.kt
- android/app/src/androidTest/java/com/laneshadow/ui/routeresults/RouteResultsScreenUiTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/routeresults/RouteResultsPolylineUiTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/routeresults/RouteResultsRecompositionTest.kt (NEW)

writeProhibited:
- android/build/** — generated
- android/app/build/** — generated
- android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt — out of scope
- ios/** — iOS handled by R08

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use `rememberSaveable` for any state that survives config change
- Compose state-hoisting: Composables stateless where possible; state lives in ViewModel
- No hardcoded colors — MaterialTheme.colorScheme tokens only
- LaunchedEffect keys are explicit and minimal

⚠️ Ask First:
- Adding new RideFlowAction cases (SelectRoute should already exist)
- Restructuring LSNavigatorMessage component API

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsScreen.kt (MODIFY): wire dismiss, recall chip, card tap forwarding, polyline restyle
- android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsViewModel.kt (MODIFY): expose selectedRouteId state + selectRoute action handler
- android/app/src/main/java/com/laneshadow/services/RideFlowState.kt (MODIFY only if needed): SelectRoute action shape
- android/app/src/androidTest/java/com/laneshadow/ui/routeresults/* (NEW): 3 test files for AC-1..AC-6

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH AC:

### RED PHASE
- READ: AC, current RouteResultsScreen.kt:67 (onRouteCardTap dropped) + L172 (onDismiss not toggled)
- WRITE: ONE Compose UI test
- RUN: `./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=...`
- VERIFY: Test FAILS

### GREEN PHASE
- WRITE: minimal Composable + ViewModel changes
- RUN: instrumented test
- VERIFY: Test PASSES

### REFACTOR PHASE
- READ: full Composable
- RUN: full instrumented suite + detekt + token compliance
- VERIFY: still green

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsScreen.kt [PRIMARY PATTERN]
   - Lines: 1-220
   - Focus: Current onDismiss/onRouteCardTap wiring at L67 and L172; identify hoist points for isCalloutVisible

2. android/app/src/main/java/com/laneshadow/ui/molecules/LSNavigatorMessage.kt
   - Lines: all
   - Focus: onDismiss + onAttachmentTap signatures to forward correctly

3. android/app/src/main/java/com/laneshadow/ui/molecules/LSRecallChip.kt
   - Lines: all
   - Focus: Render contract for chip (anchor, click handler)

4. android/app/src/main/java/com/laneshadow/services/RideFlowState.kt
   - Lines: all
   - Focus: RideFlowAction.SelectRoute signature; selectedRouteId in state

5. .spec/reviews/red-hat-sprint-04-2026-05-03T14-19-50Z.md
   - Lines: F-18 section
   - Focus: Finding details and expected behavior contract

6. .spec/prds/v3-integration/tasks/sprint-04-conversational-planning-loop/SPRINT.md
   - Lines: gate steps 3 + 5
   - Focus: What user must observe

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: TDD_STATE values show each test went red before green.

Gate 2: Each AC has a test
  Verify: Test files contain one test per AC.

Gate 3: All instrumented tests pass
  Command: cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.routeresults.RouteResultsScreenUiTest && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.routeresults.RouteResultsPolylineUiTest && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.routeresults.RouteResultsRecompositionTest
  Expected: Exit 0; all 6 tests passing.

Gate 4: Compile clean
  Command: cd android && ./gradlew :app:compileDebugKotlin
  Expected: Exit 0.

Gate 5: detekt clean
  Command: cd android && ./gradlew detekt
  Expected: Exit 0 (fix LoginSmokeTest:28 if touched).

Gate 6: Token compliance
  Command: scripts/tokens/enforce-native-compliance.sh
  Expected: Exit 0.

Gate 7: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: (none)
Blocks:     CHAT-S04-R12 (Android instrumented E2E gate steps 3 + 5 need this wiring)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-R09",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "Dismiss hides callout and reveals recall chip at same anchor", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.routeresults.RouteResultsScreenUiTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "Recall chip tap restores callout", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.routeresults.RouteResultsScreenUiTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "Route card tap dispatches RideFlowAction.SelectRoute and forwards onAttachmentTap", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.routeresults.RouteResultsScreenUiTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "Alt polyline promotes from dashed to solid when selectedRouteId changes", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.routeresults.RouteResultsPolylineUiTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "Selected card border tint matches variant color from ViewModel", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.routeresults.RouteResultsScreenUiTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "No recomposition leak across selection cycles", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.routeresults.RouteResultsRecompositionTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Compose UI test for dismiss → callout hidden + recall chip visible", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.routeresults.RouteResultsScreenUiTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Compose UI test for chip tap → callout restored", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.routeresults.RouteResultsScreenUiTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "Compose UI test asserts ViewModel SelectRoute action and forwarded attachment tap", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.routeresults.RouteResultsScreenUiTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "Polyline UI test asserts dashed↔solid transition keyed on selectedRouteId", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.routeresults.RouteResultsPolylineUiTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "Compose semantics test reads border color and equals variant color from ViewModel", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.routeresults.RouteResultsScreenUiTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "Recomposition counter test asserts bounded composition count", "maps_to_ac": "AC-6", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.routeresults.RouteResultsRecompositionTest", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
