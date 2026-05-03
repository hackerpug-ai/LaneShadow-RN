================================================================================
TASK: CHAT-S04-T08 - Android RouteDetails real-data wiring + enrichment + already-saved fingerprint + SaveFavoriteSheet entry
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Completed
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: 5/5 AC · approved

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

RouteDetailsScreen renders the selected route option with real distance/duration/elevation/scenic-score, a 6-hour weather timeline from db.routeEnrichments.list, an already-saved badge derived from the saved-route fingerprint, and a Save button that opens the SaveFavoriteSheet entry point.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST keep nav args as Route.RouteDetails(sessionId, routeOptionId); derive routePlanId from RouteRepository.subscribeToActiveRoutePlans(sessionId), then subscribe to RouteRepository.subscribeToPlanById(routePlanId) and select the option matching routeOptionId
- MUST subscribe to db.routeEnrichments:getByRoutePlanId({routePlanId}) through RouteRepository and bind the 6-hour weather window to LSWeatherTimeline
- MUST use SavedRouteRepository.matchesFingerprint(routeIndexFingerprint) to determine already-saved state and surface it on the Save button
- MUST wire the Save button to open the SaveFavoriteSheet bottom sheet (entry-point only — sheet implementation ships in Sprint 05; this task wires the click + sheet visibility flag)
- MUST populate LSInstrumentReadout with real distance (km), duration (minutes), elevationGain (m), and scenicScore (0-100) from the selected option
- MUST keep v2 RouteDetailsScreen template signature unmodified — adapt at the Route boundary
- NEVER block on the fingerprint query in the main rendering Flow — combine via combine() with a loading-tolerant default of false
- NEVER ship the SaveFavoriteSheet body in this task (Sprint 05 scope) — only the visibility hoist + onSave click handler
- NEVER use mock RouteDetailsMockProvider in the production Route composable
- NEVER hardcode unit suffixes ("km", "min") — use stringResource for i18n
- NEVER make the "Ride this" button do anything in V3 — it is a no-op placeholder
- STRICTLY follow architecture §6.4 RouteDetailsRoute composition

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] Selected option drives LSInstrumentReadout values (AC-1 PRIMARY)
- [x] 6-hour LSWeatherTimeline binds to db.routeEnrichments (AC-2)
- [x] Already-saved badge reflects fingerprint match (AC-3)
- [x] Tap Save raises showSaveSheet flag (AC-4)
- [x] Enrichment loading does not block instrument readout (AC-5)
- [ ] gradlew test + compileDebugKotlin clean ← PARTIAL: focused tests/compile/assemble pass; full gradlew test has 17 unchanged-suite baseline failures documented
- [x] No polyline decode during recomposition
- [x] RouteDetailsScreen tests assert behavior, not source comment markers
- [x] TDD RED evidence gate
- [x] Sandbox stories untouched

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Selected option drives LSInstrumentReadout values [PRIMARY]
  GIVEN: A RouteDetailsViewModel with sessionId="sess-1" and routeOptionId="opt-best", plus fake RouteRepository active-plan + subscribeToPlanById emissions whose selected option has distanceMeters=48280, durationSeconds=7200, elevationGainMeters=540, scenicScore=82
  WHEN:  viewModel.state is collected
  THEN:  First Loaded emission has instrumentReadout(distanceKm=48.28, durationMinutes=120, elevationGainM=540, scenicScore=82)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/routedetails/RouteDetailsViewModelTest.kt
  TEST_FUNCTION: state_selectedOption_populatesInstrumentReadoutWithRealMetrics

AC-2: 6-hour LSWeatherTimeline binds to db.routeEnrichments
  GIVEN: A RouteDetailsViewModel that derives routePlanId="plan-7" and a fake RouteRepository.subscribeToEnrichments("plan-7") emitting 6 hourly forecast slots
  WHEN:  viewModel.state is collected
  THEN:  First Loaded emission has weatherTimeline.size == 6 and the slots equal the fake-emitted values in order

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/routedetails/RouteDetailsViewModelTest.kt
  TEST_FUNCTION: state_enrichmentEmission_populatesSixHourWeatherTimeline

AC-3: Already-saved badge reflects fingerprint match
  GIVEN: A RouteDetailsViewModel with routeOptionId="opt-best" whose routeIndex fingerprint matches an existing saved_routes row, and a fake SavedRouteRepository.matchesFingerprint returning true
  WHEN:  viewModel.state is collected
  THEN:  Loaded emission has saveButtonState == SaveButtonState.AlreadySaved

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/routedetails/RouteDetailsViewModelTest.kt
  TEST_FUNCTION: state_fingerprintMatch_setsSaveButtonStateAlreadySaved

AC-4: Tap Save raises showSaveSheet flag
  GIVEN: A loaded RouteDetailsUiState with saveButtonState=SaveButtonState.NotSaved and showSaveSheet=false
  WHEN:  viewModel.onSaveTapped() is invoked
  THEN:  Subsequent state emission has showSaveSheet=true (the SaveFavoriteSheet body itself is Sprint 05; this task only hoists visibility)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/routedetails/RouteDetailsViewModelTest.kt
  TEST_FUNCTION: onSaveTapped_raisesShowSaveSheetFlag

AC-5: Enrichment loading does not block instrument readout
  GIVEN: A fake RouteRepository.subscribeToPlanById emitting a plan immediately while subscribeToEnrichments is still suspended (no emission yet)
  WHEN:  viewModel.state is collected within 100ms
  THEN:  An emission with instrumentReadout populated AND weatherTimeline=null/empty is produced (combine tolerates the slower stream)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/routedetails/RouteDetailsViewModelTest.kt
  TEST_FUNCTION: state_enrichmentDelayed_emitsInstrumentReadoutWithoutBlockingOnWeather

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/routedetails/RouteDetailsRoute.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/routedetails/RouteDetailsViewModel.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/routedetails/RouteDetailsUiState.kt (NEW)
- android/app/src/main/java/com/laneshadow/data/route/RouteRepository.kt (MODIFY — add subscribeToEnrichments(routePlanId))
- android/app/src/main/java/com/laneshadow/data/savedroutes/SavedRouteRepository.kt (NEW — interface + Impl with matchesFingerprint(routeIndex) only; full saved-routes CRUD ships in Sprint 05)
- android/app/src/main/java/com/laneshadow/data/dto/RouteEnrichmentDto.kt (NEW)
- android/app/src/main/java/com/laneshadow/data/dto/HourlyForecastDto.kt (NEW)
- android/app/src/main/java/com/laneshadow/navigation/MainNavGraph.kt (MODIFY — add Route.RouteDetails(sessionId, routeOptionId) -> RouteDetailsRoute wiring)
- android/app/src/test/java/com/laneshadow/ui/routedetails/RouteDetailsViewModelTest.kt (NEW)

writeProhibited:
- android/app/src/main/java/com/laneshadow/ui/templates/RouteDetailsScreen.kt — v2 template untouched
- android/app/src/main/java/com/laneshadow/ui/sheets/SaveFavoriteSheet.kt — Sprint 05 scope (this task only hoists visibility flag)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSInstrumentReadout.kt — molecule already shipped
- android/app/src/main/java/com/laneshadow/ui/molecules/LSWeatherTimeline.kt — molecule already shipped
- android/app/src/debug/java/com/laneshadow/sandbox/** — sandbox stories stay golden
- Any iOS file under ios/**

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use combine(planFlow, enrichmentFlow, fingerprintFlow) with loading-tolerant defaults
- Use kotlinx.coroutines.flow.stateIn with WhileSubscribed(5_000) for the public state
- Use stringResource for unit suffixes and date/time formatting
- Use AssistedInject for sessionId+routeOptionId factory pattern

⚠️ Ask First:
- If routeIndexFingerprint is missing from selected option data — escalate before inventing a Convex query
- If LSWeatherTimeline molecule expects a different forecast slot count than 6 — coordinate before adapting
- Whether to emit a Loading state for fingerprint vs default to NotSaved (current decision: default NotSaved, flip on emission)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- RouteDetailsRoute.kt (Composable + hiltViewModel injection)
- RouteDetailsViewModel.kt (@AssistedInject sessionId+routeOptionId factory)
- RouteDetailsUiState.kt (Loading/Loaded/Error + InstrumentReadoutData + HourlyForecast + SaveButtonState)
- RouteRepository.kt (MODIFY): add subscribeToEnrichments
- SavedRouteRepository.kt (NEW): minimal interface with matchesFingerprint
- MainNavGraph.kt (MODIFY): wire Route.RouteDetails

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

[Standard RED -> GREEN -> REFACTOR per AC.]

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/architecture/android-architecture.md [PRIMARY PATTERN]
   - Lines: 840-855
   - Focus: RouteDetailsRoute composition

2. .spec/prds/v3-integration/architecture/android-architecture.md
   - Lines: 986-1010
   - Focus: SaveFavoriteSheet contract — only the visibility hoist this sprint

3. .spec/prds/v3-integration/05-uc-chat.md
   - Lines: 77-95
   - Focus: UC-CHAT-04 acceptance criteria

4. android/app/src/main/java/com/laneshadow/ui/templates/RouteDetailsScreen.kt
   - Lines: 1-200
   - Focus: Existing template signature for adapter mapping

5. android/app/src/main/java/com/laneshadow/ui/molecules/LSInstrumentReadout.kt
   - Lines: 1-150
   - Focus: InstrumentReadout molecule signature for binding

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence — TDD_STATE history per AC
Gate 2: All tests pass — cd android && ./gradlew test (Exit 0)
Gate 3: Type check — cd android && ./gradlew :app:compileDebugKotlin (Exit 0)
Gate 4: Static analysis — cd android && ./gradlew detekt (skip if not enabled)
Gate 5: Token compliance — scripts/tokens/enforce-native-compliance.sh (Exit 0)
Gate 6: Sandbox stories untouched — git diff --name-only android/app/src/debug/ (no diff)
Gate 7: Scope compliance — git diff --name-only ⊆ writeAllowed

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: CHAT-S04-T02 (RideFlowState), CHAT-S04-T04 (Repository scaffolding), CHAT-S04-T06 (Route.RouteDetails nav arg), Sprint 03 backend queries
Blocks: CHAT-S04-T10b, Sprint 05 SaveFavoriteSheet body

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-T08",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN selected option WHEN state collected THEN instrumentReadout populated with real metrics", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.routedetails.RouteDetailsViewModelTest.state_selectedOption_populatesInstrumentReadoutWithRealMetrics", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN enrichment emission WHEN state collected THEN weatherTimeline has 6 entries", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.routedetails.RouteDetailsViewModelTest.state_enrichmentEmission_populatesSixHourWeatherTimeline", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN fingerprint match WHEN state collected THEN saveButtonState=AlreadySaved", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.routedetails.RouteDetailsViewModelTest.state_fingerprintMatch_setsSaveButtonStateAlreadySaved", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN loaded state WHEN onSaveTapped invoked THEN showSaveSheet=true", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.routedetails.RouteDetailsViewModelTest.onSaveTapped_raisesShowSaveSheetFlag", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN delayed enrichment WHEN state collected THEN instrument data emits without waiting for weather", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.routedetails.RouteDetailsViewModelTest.state_enrichmentDelayed_emitsInstrumentReadoutWithoutBlockingOnWeather", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Instrument readout binding", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.routedetails.RouteDetailsViewModelTest.state_selectedOption_populatesInstrumentReadoutWithRealMetrics", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Weather timeline binding", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.routedetails.RouteDetailsViewModelTest.state_enrichmentEmission_populatesSixHourWeatherTimeline", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "Already-saved fingerprint check", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.routedetails.RouteDetailsViewModelTest.state_fingerprintMatch_setsSaveButtonStateAlreadySaved", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "Save sheet entry-point hoist", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.routedetails.RouteDetailsViewModelTest.onSaveTapped_raisesShowSaveSheetFlag", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "Combine tolerance for delayed enrichment", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.routedetails.RouteDetailsViewModelTest.state_enrichmentDelayed_emitsInstrumentReadoutWithoutBlockingOnWeather", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
