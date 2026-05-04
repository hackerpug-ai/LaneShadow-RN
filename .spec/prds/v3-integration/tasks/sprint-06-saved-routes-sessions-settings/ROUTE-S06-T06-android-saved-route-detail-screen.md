================================================================================
TASK: ROUTE-S05-T06 - Android SavedRouteDetailScreen + Plan again — variant of RouteDetailsScreen hydrated from saved snapshot
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: 0/6 AC

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

A rider taps a row in SavedRoutesListScreen, the SavedRouteDetailScreen opens as a variant of the RouteDetailsScreen template hydrated from the immutable saved snapshot, and the rider can Rename, Delete, or "Plan again" — which seeds a new planning session and routes to PlanningScreen.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST subscribe to `db.savedRoutes.getSavedRouteDetail({savedRouteId})` via SavedRouteRepository.subscribeToSavedRouteDetail(savedRouteId) returning `Flow<SavedRouteDetail?>`; null emission renders the "Route not found" state
- MUST reuse the existing v2 `RouteDetailsScreen` template UNCHANGED — adapt at the Route boundary (SavedRouteDetailRoute) by mapping `SavedRouteDetail` snapshot → the same `RouteDetailsScreenState` shape the template already consumes
- MUST replace the action row with a single primary `LSButton(label="Plan again", variant=Primary, fullWidth)` — Save / Ride This are hidden because saved routes are immutable
- MUST wire "Plan again" to `db.planningSessions.createSession({firstMessage="Re-plan from {savedRoute.name}"})` via SessionRepository.createSession(firstMessage) and then NavController.navigate(planningRoute(newSessionId)) with `popUpTo(SavedRoutes) { inclusive = false }`
- MUST render Rename + Delete actions in the LSTopBar trailing slot (compose two LSGlassPanel chrome chips if the slot accepts only one trailing) — Rename opens an LSBottomSheet with LSFormField; Delete opens an LSConfirmDialog whose primary button is destructive
- MUST hide the LSWeatherTimeline section when `savedRoute.weatherTimeline == null` (saved snapshots are frozen — never fabricate weather data)
- MUST display the saved-at timestamp (relative + absolute on long-press tooltip) in the LSRouteSheet metadata row
- MUST persist the saved snapshot polyline geometry on the LSMap using `RouteVariant.Best` polyline style (saved routes always render in best-color per ui-design § 1.E)
- NEVER hardcode color/typography literals — all surfaces resolve through `LocalLaneShadowTheme.current`
- NEVER mutate the v2 `ui/templates/RouteDetailsScreen.kt` — adapt at the Route layer
- NEVER call `db.savedRoutes.saveRoute` from this screen (already-saved by definition)
- NEVER touch `services/RideFlowReducer.kt`, `services/ChatViewModel.kt`, or `services/AppStateRepository.kt` — Sprint 04 inputs are read-only here
- STRICTLY follow architecture/ui-design.md § 1.E composition — saved-mode action row replacement, hidden weather section when nil, "Route not found" empty variant

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Detail subscribes to getSavedRouteDetail and hydrates LSRouteSheet from the snapshot (AC-1 PRIMARY)
- [ ] Action row rendered as single "Plan again" primary button (AC-2)
- [ ] Plan again invokes createSession + routes to PlanningScreen (AC-3)
- [ ] Rename action invokes renameRoute via inline LSBottomSheet (AC-4)
- [ ] Delete action invokes softDeleteRoute via LSConfirmDialog and pops back to list (AC-5)
- [ ] Null savedRouteId emission renders the "Route not found" empty state (AC-6)
- [ ] gradlew test + compileDebugKotlin clean
- [ ] Sandbox stories untouched + snapshots:check green
- [ ] TDD RED evidence per AC

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Detail subscribes to getSavedRouteDetail and hydrates the RouteDetailsScreen template state [PRIMARY]
  GIVEN: A SavedRouteDetailViewModel with savedRouteId="sr-1" and a fake SavedRouteRepository.subscribeToSavedRouteDetail emitting a SavedRouteDetail with name="Skyline Spine", distanceMeters=104607, durationSeconds=7800, elevationGainMeters=540, scenicScore=82, snapshot.polyline (encoded), snapshotMeta.savedAt=1717000000000
  WHEN:  viewModel.state is collected
  THEN:  First Loaded emission has routeDetailsScreenState.title="Skyline Spine", instrumentReadout(distanceKm=104.61, durationMinutes=130, elevationGainM=540, scenicScore=82), savedAtRelative resolved via stringResource (e.g., "Saved 4 days ago"), polyline decoded into PolylineData with `RouteVariant.Best`

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/savedroutedetail/SavedRouteDetailViewModelTest.kt
  TEST_FUNCTION: state_subscribesToDetail_hydratesScreenStateFromSnapshot

AC-2: Action row renders as single Plan again primary button (Save/Ride hidden)
  GIVEN: A composed SavedRouteDetailRoute with state Loaded
  WHEN:  the screen is rendered in a Compose UI test
  THEN:  Exactly one LSButton tagged `saved-route-plan-again` is visible with label resolved from `R.string.saved_route_plan_again`; LSButton tags `route-details-save` and `route-details-ride` are NOT present in the composition tree

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/savedroutedetail/SavedRouteDetailScreenTest.kt
  TEST_FUNCTION: actionRow_rendersOnlyPlanAgainButton_savedVariant

AC-3: Plan again invokes createSession + routes to PlanningScreen
  GIVEN: A SavedRouteDetailViewModel with state Loaded for savedRouteId="sr-1" name="Skyline Spine", and a fake SessionRepository.createSession returning Result.success("sess-99")
  WHEN:  viewModel.onPlanAgainTapped() is invoked
  THEN:  SessionRepository.createSession was called once with firstMessage starting with "Re-plan from Skyline Spine"; events SharedFlow emits SavedRouteDetailEvent.NavigateToPlanning("sess-99"); subsequent state emission has isCreatingSession=false

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/savedroutedetail/SavedRouteDetailViewModelTest.kt
  TEST_FUNCTION: onPlanAgainTapped_invokesCreateSessionAndEmitsNavigateEvent

AC-4: Rename action invokes renameRoute via inline LSBottomSheet
  GIVEN: A SavedRouteDetailViewModel with state Loaded for savedRouteId="sr-1" name="Skyline Spine", and a fake SavedRouteRepository.renameRoute returning Result.success(Unit)
  WHEN:  viewModel.onRenameSubmitted("North Coast Spine") is invoked
  THEN:  Optimistic emission updates name to "North Coast Spine"; renameRoute("sr-1", "North Coast Spine") was called once; on success the sheet visibility flag flips back to false

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/savedroutedetail/SavedRouteDetailViewModelTest.kt
  TEST_FUNCTION: onRenameSubmitted_invokesRenameRouteWithOptimisticUpdate

AC-5: Delete action invokes softDeleteRoute via LSConfirmDialog and pops back to list
  GIVEN: A SavedRouteDetailViewModel with state Loaded for savedRouteId="sr-1", and a fake SavedRouteRepository.softDeleteRoute returning Result.success(Unit)
  WHEN:  viewModel.onDeleteConfirmed() is invoked
  THEN:  softDeleteRoute("sr-1") was called once; events SharedFlow emits SavedRouteDetailEvent.PopBackToList("sr-1") within 200ms

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/savedroutedetail/SavedRouteDetailViewModelTest.kt
  TEST_FUNCTION: onDeleteConfirmed_invokesSoftDeleteAndEmitsPopBackEvent

AC-6: Null savedRouteId emission renders the "Route not found" empty state
  GIVEN: A SavedRouteDetailViewModel with savedRouteId="sr-missing" and a fake SavedRouteRepository.subscribeToSavedRouteDetail emitting null
  WHEN:  viewModel.state is collected
  THEN:  First emission is SavedRouteDetailUiState.NotFound; the composed screen renders an LSEmptyState with title resolved from `R.string.saved_route_not_found_title` and a primary "Back to saved" action that calls `navController.popBackStack()`

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/savedroutedetail/SavedRouteDetailViewModelTest.kt
  TEST_FUNCTION: state_nullDetail_emitsNotFoundUiState

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

- TC-1 maps_to_ac=AC-1: Snapshot fields fully hydrate the RouteDetailsScreenState with polyline decoded as RouteVariant.Best
- TC-2 maps_to_ac=AC-2: Action row contains exactly the Plan again button — no Save / Ride affordances
- TC-3 maps_to_ac=AC-3: createSession invoked with firstMessage prefix "Re-plan from {name}"
- TC-4 maps_to_ac=AC-4: rename optimistic update precedes mutation completion AND sheet closes on success
- TC-5 maps_to_ac=AC-5: softDeleteRoute called once and PopBackToList event emitted exactly once
- TC-6 maps_to_ac=AC-6: null detail emission yields NotFound state and routes to empty state composition

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/savedroutedetail/SavedRouteDetailScreen.kt (NEW — Composable host that calls into the v2 RouteDetailsScreen template with a saved-variant override block; renders the "Plan again" action row, Rename / Delete top-bar chips, LSBottomSheet for rename, LSConfirmDialog for delete, LSEmptyState for NotFound)
- android/app/src/main/java/com/laneshadow/ui/savedroutedetail/SavedRouteDetailRoute.kt (NEW — route entry; hiltViewModel + NavController wiring; collects events for navigation)
- android/app/src/main/java/com/laneshadow/ui/savedroutedetail/SavedRouteDetailViewModel.kt (NEW — @HiltViewModel + @AssistedInject(savedRouteId))
- android/app/src/main/java/com/laneshadow/ui/savedroutedetail/SavedRouteDetailUiState.kt (NEW — sealed interface Loading/Loaded/NotFound/Error + SavedRouteDetailEvent.{NavigateToPlanning, PopBackToList, RenameError, DeleteError})
- android/app/src/main/java/com/laneshadow/data/savedroutes/SavedRouteRepository.kt (MODIFY — add `subscribeToSavedRouteDetail(savedRouteId): Flow<SavedRouteDetail?>`; reuse existing ConvexClientWithAuth wiring)
- android/app/src/main/java/com/laneshadow/data/savedroutes/SavedRouteDetail.kt (NEW — domain model: id, name, snapshot {polyline, distanceMeters, durationSeconds, elevationGainMeters, scenicScore, weatherTimeline?}, snapshotMeta {savedAt, overlayStatus}, planInput)
- android/app/src/main/java/com/laneshadow/data/dto/SavedRouteDetailDto.kt (NEW — DTO mirroring `db.savedRoutes.getSavedRouteDetail` return shape per `server/convex/db/savedRoutes.ts:385-396` validator)
- android/app/src/main/java/com/laneshadow/navigation/Route.kt (MODIFY — change `data object SavedRouteDetail` to `data class SavedRouteDetail(val savedRouteId: String)`; one-line rationale: the route now needs a path arg so the route entry can subscribe to a specific saved row)
- android/app/src/main/java/com/laneshadow/navigation/MainNavGraph.kt (MODIFY — wire `composable<Route.SavedRouteDetail> { SavedRouteDetailRoute(navController, savedRouteId = it.toRoute<Route.SavedRouteDetail>().savedRouteId) }`)
- android/app/src/main/res/values/strings.xml (MODIFY — add `saved_route_*` strings)
- android/app/src/test/java/com/laneshadow/ui/savedroutedetail/SavedRouteDetailViewModelTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/savedroutedetail/SavedRouteDetailScreenTest.kt (NEW — Compose UI test for AC-2)

writeProhibited:
- android/app/src/main/java/com/laneshadow/ui/templates/RouteDetailsScreen.kt — v2 template untouched (adapt at the Route layer per android-architecture § 6.4 + § 7.4)
- android/app/src/main/java/com/laneshadow/services/ChatViewModel.kt — Sprint 04 input (read-only)
- android/app/src/main/java/com/laneshadow/services/RideFlowReducer.kt — Sprint 04 input (read-only)
- android/app/src/main/java/com/laneshadow/services/AppStateRepository.kt — Sprint 04 input (read-only)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSConfirmDialog.kt — V2 molecule untouched
- android/app/src/main/java/com/laneshadow/ui/molecules/LSBottomSheet.kt — V2 molecule untouched
- android/app/src/main/java/com/laneshadow/ui/molecules/LSEmptyState.kt — V2 molecule untouched
- android/app/src/main/java/com/laneshadow/generated/** — generated by server/scripts/generate-mobile-types.ts
- android/app/src/debug/java/com/laneshadow/sandbox/** — sandbox stories stay golden
- Any iOS file under ios/**

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use `combine(savedRouteFlow, mutationStateFlow)` with `WhileSubscribed(5_000)`
- Decode polylines on `Dispatchers.Default`; emit decoded PolylineData through state
- Use stringResource for every visible label (i18n + accessibility)
- Use `@AssistedInject` factory for savedRouteId injection
- Map mutation throwables through ConvexErrorMapper
- Use `LSConfirmDialog` molecule for the destructive Delete confirmation (existing v2 component; matches android-architecture template)

⚠️ Ask First:
- If `db.savedRoutes.getSavedRouteDetail` return shape diverges from `savedRouteDetailViewValidator` in `server/convex/db/savedRoutes.ts:385`
- If LSTopBar trailing slot supports two action chips natively (per ui-design § 1.E open question) — fallback is `Row { LSGlassPanel.Chrome { LSIcon(.edit) }; LSGlassPanel.Chrome { LSIcon(.trash) } }`
- Whether "Plan again" should pass the saved route's polyline as a hard constraint to the new session vs free re-plan (current decision: free re-plan with `firstMessage="Re-plan from {name}"` text seed only)
- If RouteVariant.Best polyline color matches the saved-mode design intent (current decision: yes per ui-design § 1.E)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- SavedRouteDetailScreen.kt (Composable host: LSTopBar(back leading, name title, edit + trash chip trailing) + RouteDetailsScreen template via override slot OR direct LSMapLayer/LSRouteSheet composition + Plan again primary button + LSBottomSheet rename + LSConfirmDialog delete + LSEmptyState NotFound variant)
- SavedRouteDetailRoute.kt (Composable entry; hiltViewModel + NavController wiring; collects events for navigation)
- SavedRouteDetailViewModel.kt (@HiltViewModel + @AssistedInject; combines saved-route Flow + mutation state)
- SavedRouteDetailUiState.kt (sealed interface UiState + SavedRouteDetailEvent)
- SavedRouteDetail.kt (domain model)
- SavedRouteDetailDto.kt (DTO + mapping)
- SavedRouteRepository.kt (MODIFY): add subscribeToSavedRouteDetail
- Route.kt (MODIFY): SavedRouteDetail carries savedRouteId arg
- MainNavGraph.kt (MODIFY): wire SavedRouteDetail route
- strings.xml (MODIFY): saved_route_* strings
- SavedRouteDetailViewModelTest.kt (RED → GREEN per AC-1, 3, 4, 5, 6)
- SavedRouteDetailScreenTest.kt (Compose UI test for AC-2)

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

1. RED — Write SavedRouteDetailViewModelTest covering AC-1, 3, 4, 5, 6 with FakeSavedRouteRepository + FakeSessionRepository; verify all fail
2. GREEN — Add SavedRouteDetailUiState + SavedRouteDetail + SavedRouteDetailDto + repository extension; build SavedRouteDetailViewModel using combine + @AssistedInject; iterate until tests pass
3. RED — Write SavedRouteDetailScreenTest for AC-2 verifying the action row contains only "Plan again" (no Save / Ride)
4. GREEN — Build SavedRouteDetailScreen + SavedRouteDetailRoute composing v2 atoms/molecules around the existing RouteDetailsScreen template; modify Route.kt + MainNavGraph.kt to wire savedRouteId arg; verify the UI test passes
5. REFACTOR — Extract polyline decode to a memoized helper; ensure no hardcoded color/string literals; run detekt + tokens:native-compliance + snapshots:check

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/architecture/ui-design.md [PRIMARY PATTERN]
   - Lines: 196-225
   - Focus: § 1.E SavedRouteDetailScreen composition (saved-mode action row replacement, weather hidden when nil, NotFound state, RouteVariant.Best polyline)

2. .spec/prds/v3-integration/06-uc-route.md
   - Lines: 57-94
   - Focus: UC-ROUTE-03 + UC-ROUTE-04 acceptance criteria (Plan again, Rename, Delete)

3. .spec/prds/v3-integration/architecture/android-architecture.md
   - Lines: 928-948
   - Focus: § 7.4 SavedRouteDetailScreen reuses RouteDetailsScreen template; viewMode SavedView vs LiveView flag at Route boundary

4. android/app/src/main/java/com/laneshadow/ui/templates/RouteDetailsScreen.kt
   - Lines: 1-200
   - Focus: existing template signature for adapter mapping (RouteDetailsScreenState shape)

5. android/app/src/main/java/com/laneshadow/ui/routedetails/RouteDetailsRoute.kt
   - Lines: 1-100
   - Focus: existing Route boundary pattern to mirror (hiltViewModel injection, state collection, NavController wiring)

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence — TDD_STATE history per AC (commit references each AC's first failing test)
Gate 2: All tests pass — `cd android && ./gradlew test` (Exit 0)
Gate 3: Per-AC verification — `cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.savedroutedetail.SavedRouteDetailViewModelTest.{state_subscribesToDetail_hydratesScreenStateFromSnapshot,onPlanAgainTapped_invokesCreateSessionAndEmitsNavigateEvent,onRenameSubmitted_invokesRenameRouteWithOptimisticUpdate,onDeleteConfirmed_invokesSoftDeleteAndEmitsPopBackEvent,state_nullDetail_emitsNotFoundUiState}"` and `cd android && ./gradlew :app:connectedDebugAndroidTest --tests "com.laneshadow.ui.savedroutedetail.SavedRouteDetailScreenTest.actionRow_rendersOnlyPlanAgainButton_savedVariant"`
Gate 4: Type check — `cd android && ./gradlew :app:compileDebugKotlin` (Exit 0)
Gate 5: Static analysis — `cd android && ./gradlew detekt` (Exit 0)
Gate 6: Token compliance — `scripts/tokens/enforce-native-compliance.sh` (Exit 0)
Gate 7: Sandbox snapshots untouched — `pnpm snapshots:check` (Exit 0)
Gate 8: Scope compliance — `git diff --name-only` ⊆ writeAllowed

--------------------------------------------------------------------------------
REVIEW
--------------------------------------------------------------------------------

Must pass:
- Composition strictly per § 1.E (saved-mode action row replacement, weather hidden when nil, NotFound variant, RouteVariant.Best polyline)
- v2 RouteDetailsScreen template untouched — adaptation lives at the Route boundary
- Plan again routes through SessionRepository.createSession with the correct firstMessage seed
- Rename + Delete actions reachable from LSTopBar trailing slot with min 48dp touch targets
- Zero hardcoded color literals
- All user strings via stringResource

Should verify:
- TalkBack reads "Saved route, {name}, distance {distanceKm} kilometers, saved {relative}"
- Long-press on saved-at label optionally surfaces the absolute timestamp tooltip (nice-to-have; not blocking)
- LSConfirmDialog destructive button is reached via accessible focus order
- The screen survives configuration change without losing rename sheet state

Verdict: PENDING

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ROUTE-S05-T04 (Android SavedRoutesListScreen — list rows tap into this detail screen and supply savedRouteId)
Blocks: Sprint 06 (Map + Offline + Error Recovery — saved-route detail must be functional)
Paired with: ROUTE-S05-T05 (iOS SavedRouteDetailScreen — share UC-ROUTE-03 + UC-ROUTE-04 ACs)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "ROUTE-S05-T06",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN saved-route detail emission WHEN state collected THEN RouteDetailsScreenState fully hydrated from snapshot", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutedetail.SavedRouteDetailViewModelTest.state_subscribesToDetail_hydratesScreenStateFromSnapshot", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN composed screen WHEN rendered THEN action row contains only Plan again (no Save/Ride)", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.savedroutedetail.SavedRouteDetailScreenTest.actionRow_rendersOnlyPlanAgainButton_savedVariant", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN Plan again tap WHEN invoked THEN createSession called and navigation event emitted", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutedetail.SavedRouteDetailViewModelTest.onPlanAgainTapped_invokesCreateSessionAndEmitsNavigateEvent", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN rename submission WHEN invoked THEN renameRoute called with optimistic update", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutedetail.SavedRouteDetailViewModelTest.onRenameSubmitted_invokesRenameRouteWithOptimisticUpdate", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN delete confirmation WHEN invoked THEN softDeleteRoute called and PopBackToList event emitted", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutedetail.SavedRouteDetailViewModelTest.onDeleteConfirmed_invokesSoftDeleteAndEmitsPopBackEvent", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN null detail emission WHEN state collected THEN NotFound UiState rendered", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutedetail.SavedRouteDetailViewModelTest.state_nullDetail_emitsNotFoundUiState", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Snapshot fields fully hydrate the RouteDetailsScreenState with polyline decoded as RouteVariant.Best", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutedetail.SavedRouteDetailViewModelTest.state_subscribesToDetail_hydratesScreenStateFromSnapshot", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Action row contains exactly the Plan again button — no Save / Ride affordances", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.savedroutedetail.SavedRouteDetailScreenTest.actionRow_rendersOnlyPlanAgainButton_savedVariant", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "createSession invoked with firstMessage prefix Re-plan from {name}", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutedetail.SavedRouteDetailViewModelTest.onPlanAgainTapped_invokesCreateSessionAndEmitsNavigateEvent", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "Rename optimistic update precedes mutation completion", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutedetail.SavedRouteDetailViewModelTest.onRenameSubmitted_invokesRenameRouteWithOptimisticUpdate", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "softDeleteRoute called once and PopBackToList event emitted exactly once", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutedetail.SavedRouteDetailViewModelTest.onDeleteConfirmed_invokesSoftDeleteAndEmitsPopBackEvent", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "Null detail emission yields NotFound state", "maps_to_ac": "AC-6", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutedetail.SavedRouteDetailViewModelTest.state_nullDetail_emitsNotFoundUiState", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
