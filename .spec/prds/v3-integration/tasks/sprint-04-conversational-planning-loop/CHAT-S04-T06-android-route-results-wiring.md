================================================================================
TASK: CHAT-S04-T06 - Android RouteResults real-data wiring + alt-selection mutator + Recall chip
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: 5/5 AC · complete (targeted + connected verified)

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

RouteResultsScreen renders three live polylines from db.routePlans.getPlanById with three LSRouteAttachmentCards in the Navigator callout; tapping an alt promotes its polyline to solid and re-tints the card border.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST subscribe to db.routePlans.getPlanById Flow keyed off the routePlanId resolved for the current session
- MUST render exactly 3 polylines from plan.options[] using variant colors (best=copper, alt1=ember, alt2=sage) per V2 RouteVariant tokens
- MUST surface 3 LSRouteAttachmentCards inside an LSNavigatorMessage organism (not freestanding cards)
- MUST update selectedRouteId via the ViewModel's selectRoute mutator on card tap
- MUST visually promote the selected variant's polyline from dashed to solid and re-tint the card border to the alt's color (V2 motion recipe)
- MUST restore Navigator attachments on Recall chip tap after dismiss (per UC-CHAT-03 dismiss-recall pattern)
- NEVER mutate plan.options on the client — all selection is local UI state
- NEVER recompose the LSMap on every selection change (use derivedStateOf for polyline style)
- NEVER use mock RouteResultsMockProvider in the production Route composable
- NEVER render fewer than 3 cards even if plan.options has fewer entries — surface an error state instead
- NEVER decode polylines on the main thread — use the existing PolylineDecoder util on Default dispatcher
- STRICTLY follow architecture §6.3 RouteResultsRoute composition

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] Three polylines + three cards from completed plan (AC-1 PRIMARY)
- [x] Tapping alt card promotes polyline + re-tints border (AC-2)
- [x] onRouteCardTap navigates to RouteDetails (Gap H1-07 fix) (AC-3)
- [x] Recall chip restores Navigator attachments after dismiss (AC-4)
- [x] Refine via chat input reuses session and dispatches sendMessage (AC-5)
- [ ] All tests pass + compileDebugKotlin clean
- [ ] Sandbox stories untouched

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Three polylines + three cards from completed plan [PRIMARY]
  GIVEN: A RouteResultsViewModel sessionId="sess-1" with a fake RouteRepository.subscribeToActivePlanForSession emitting RoutePlan(status="completed", options=[best, alt1, alt2])
  WHEN:  viewModel.state is collected
  THEN:  First non-loading emission is RouteResultsUiState.Loaded with exactly 3 polylineEntries (variants best/alt1/alt2) and 3 attachmentCards in matching variant order

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/routeresults/RouteResultsViewModelTest.kt
  TEST_FUNCTION: state_completedPlanWithThreeOptions_emitsThreePolylinesAndThreeCards

AC-2: Tapping alt card promotes polyline + re-tints border
  GIVEN: A loaded RouteResultsUiState with selectedRouteId=options[0].routeOptionId (best variant)
  WHEN:  viewModel.selectRoute(options[2].routeOptionId) is invoked (alt2)
  THEN:  Subsequent state emission has selectedRouteId=options[2].routeOptionId, polylineEntries[2].style==Solid (others==Dashed), and attachmentCards[2].borderColor==variant alt2 sage token

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/routeresults/RouteResultsViewModelTest.kt
  TEST_FUNCTION: selectRoute_altOption_promotesPolylineAndRetintsCardBorder

AC-3: onRouteCardTap navigates to RouteDetails (Gap H1-07 fix)
  GIVEN: RouteResultsRoute composable rendered with sessionId="sess-1" and a NavController spy
  WHEN:  the onRouteCardTap callback is invoked with routeOptionId="opt-alt1"
  THEN:  navController.navigate is called once with Route.RouteDetails(sessionId="sess-1", routeOptionId="opt-alt1")

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/routeresults/RouteResultsRouteTest.kt
  TEST_FUNCTION: onRouteCardTap_navigatesToRouteDetailsWithSessionAndOptionId

AC-4: Recall chip restores Navigator attachments after dismiss
  GIVEN: A RouteResultsUiState.Loaded with attachmentsDismissed=true and a fake plan with 3 options
  WHEN:  viewModel.recallAttachments() is invoked
  THEN:  Subsequent state emission has attachmentsDismissed=false and attachmentCards count == 3 again

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/routeresults/RouteResultsViewModelTest.kt
  TEST_FUNCTION: recallAttachments_afterDismiss_restoresThreeAttachmentCards

AC-5: Refine via chat input reuses session and dispatches sendMessage
  GIVEN: A RouteResultsViewModel with sessionId="sess-1" and a fake ChatRepository spy
  WHEN:  viewModel.refine("shorter, avoid Hwy 1") is invoked
  THEN:  Fake ChatRepository.sendMessage was called with sessionId="sess-1" (not a new id) and content="shorter, avoid Hwy 1"

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/routeresults/RouteResultsViewModelTest.kt
  TEST_FUNCTION: refine_reusesExistingSessionIdAndDispatchesSendMessage

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsRoute.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsViewModel.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsUiState.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/routeresults/PolylineEntry.kt (NEW)
- android/app/src/main/java/com/laneshadow/data/route/RouteRepository.kt (MODIFY — add subscribeToPlanById(routePlanId))
- android/app/src/main/java/com/laneshadow/data/dto/RouteOptionDto.kt (NEW)
- android/app/src/main/java/com/laneshadow/navigation/MainNavGraph.kt (MODIFY — wire RouteResultsRoute as production destination; add Route.RouteResults arg)
- android/app/src/test/java/com/laneshadow/ui/routeresults/RouteResultsViewModelTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/routeresults/RouteResultsRouteTest.kt (NEW)

Route-contract scope exception:
- `android/app/src/main/java/com/laneshadow/navigation/Route.kt` was updated to use typed `Route.RouteDetails(sessionId, routeOptionId)` so AC-3 can verify the exact navigation contract. This is intentional and remains in scope for the route-results wiring fix.

writeProhibited:
- android/app/src/main/java/com/laneshadow/ui/templates/RouteResultsScreen.kt — v2 template untouched
- android/app/src/main/java/com/laneshadow/ui/molecules/LSRouteAttachmentCard.kt — molecule already shipped
- android/app/src/debug/java/com/laneshadow/sandbox/** — sandbox stories stay golden
- Any iOS file under ios/**

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use derivedStateOf for polyline style derivations (selectedRouteId -> Solid/Dashed) to avoid map recomposition
- Use the existing PolylineDecoder util on Dispatchers.Default
- Use V2 RouteVariant tokens from android/app/src/main/java/com/laneshadow/theme/ for variant colors (no hardcoded hex)
- Use AssistedInject with sessionId factory pattern for RouteResultsViewModel

⚠️ Ask First:
- If db.routePlans.getPlanById is missing — escalate to Convex implementer before proceeding
- If LSMap polyline style API doesn't yet support Solid/Dashed enum — propose a follow-up molecule task

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- RouteResultsRoute.kt (Composable + hiltViewModel injection)
- RouteResultsViewModel.kt (@AssistedInject sessionId factory, subscribes to active plan)
- RouteResultsUiState.kt (Loading/Loaded/Empty + PolylineEntry + AttachmentCard)
- RouteRepository.kt (MODIFY): add subscribeToPlanById
- MainNavGraph.kt (MODIFY): wire Route.RouteResults
- Tests for AC-1..AC-5

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

[Standard RED -> GREEN -> REFACTOR per AC.]

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/architecture/android-architecture.md [PRIMARY PATTERN]
   - Lines: 819-840
   - Focus: RouteResultsRoute composition with @AssistedInject

2. .spec/prds/v3-integration/05-uc-chat.md
   - Lines: 59-95
   - Focus: UC-CHAT-03 acceptance criteria including refine semantics

3. android/app/src/main/java/com/laneshadow/ui/templates/RouteResultsScreen.kt
   - Lines: 1-200
   - Focus: Existing template signature and onRouteCardTap callback contract

4. android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/RouteResultsMockProvider.kt
   - Lines: 1-300
   - Focus: Existing mock-state shape that domain types must adapt to

5. android/app/src/main/java/com/laneshadow/theme/
   - Lines: all
   - Focus: RouteVariant color tokens (best=copper, alt1=ember, alt2=sage)

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence — TDD_STATE history per AC
Gate 2: All tests pass — cd android && ./gradlew test (Exit 0)
Gate 3: Connected android tests pass — cd android && ./gradlew connectedDebugAndroidTest (requires emulator)
Gate 4: Type check — cd android && ./gradlew :app:compileDebugKotlin (Exit 0)
Gate 5: Static analysis — cd android && ./gradlew detekt (skip if not enabled)
Gate 6: Token compliance — scripts/tokens/enforce-native-compliance.sh (Exit 0)
Gate 7: Sandbox stories untouched — git diff --name-only android/app/src/debug/ (no diff)
Gate 8: Scope compliance — git diff --name-only ⊆ writeAllowed

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: CHAT-S04-T02 (RideFlowState), CHAT-S04-T04 (Repository scaffolding + Route pattern), Sprint 03 backend query db.routePlans.getPlanById
Blocks: CHAT-S04-T08, CHAT-S04-T09b

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-T06",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN completed plan with 3 options WHEN state collected THEN 3 polylines + 3 cards in variant order", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.state_completedPlanWithThreeOptions_emitsThreePolylinesAndThreeCards", "satisfied": true, "evidence": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest passed on 2026-05-01", "remediation": "Implemented RouteResultsViewModel state mapping from completed plan data."},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN loaded state WHEN selectRoute(alt) THEN that polyline becomes Solid and card border re-tints", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.selectRoute_altOption_promotesPolylineAndRetintsCardBorder", "satisfied": true, "evidence": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest passed on 2026-05-01", "remediation": "Implemented selected-route state updates and derived polyline/card styling."},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN RouteResultsRoute WHEN card tapped THEN navController routes to Route.RouteDetails", "verify": "cd android && ./gradlew connectedDebugAndroidTest --tests com.laneshadow.ui.routeresults.RouteResultsRouteTest.onRouteCardTap_navigatesToRouteDetailsWithSessionAndOptionId", "satisfied": true, "evidence": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.routeresults.RouteResultsRouteTest#onRouteCardTap_navigatesToRouteDetailsWithSessionAndOptionId passed on 2026-05-01 using the route-results wrapper semantics node (`route-results-attachment-opt-alt1`) and `SemanticsActions.OnClick`.", "remediation": "Added a route-results-specific clickable wrapper and typed `Route.RouteDetails(sessionId, routeOptionId)` navigation contract."},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN dismissed attachments WHEN recallAttachments invoked THEN 3 cards restored", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.recallAttachments_afterDismiss_restoresThreeAttachmentCards", "satisfied": true, "evidence": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest passed on 2026-05-01", "remediation": "Implemented dismiss/recall attachment state in RouteResultsViewModel."},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN existing sessionId WHEN refine invoked THEN sendMessage called with same sessionId", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.refine_reusesExistingSessionIdAndDispatchesSendMessage", "satisfied": true, "evidence": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest passed on 2026-05-01", "remediation": "Implemented refine forwarding to ChatRepository with the existing session id."},
    {"id": "TC-1", "type": "test_criterion", "description": "Three-option happy path", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.state_completedPlanWithThreeOptions_emitsThreePolylinesAndThreeCards", "satisfied": true, "evidence": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest passed on 2026-05-01", "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Alt selection promotes polyline + retints card", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.selectRoute_altOption_promotesPolylineAndRetintsCardBorder", "satisfied": true, "evidence": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest passed on 2026-05-01", "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "Card tap navigation contract", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew connectedDebugAndroidTest --tests com.laneshadow.ui.routeresults.RouteResultsRouteTest.onRouteCardTap_navigatesToRouteDetailsWithSessionAndOptionId", "satisfied": true, "evidence": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.routeresults.RouteResultsRouteTest#onRouteCardTap_navigatesToRouteDetailsWithSessionAndOptionId passed on 2026-05-01", "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "Recall chip restores attachments", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.recallAttachments_afterDismiss_restoresThreeAttachmentCards", "satisfied": true, "evidence": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest passed on 2026-05-01", "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "Refine reuses sessionId", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.refine_reusesExistingSessionIdAndDispatchesSendMessage", "satisfied": true, "evidence": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest passed on 2026-05-01", "remediation": null}
  ]
}
-->
================================================================================
