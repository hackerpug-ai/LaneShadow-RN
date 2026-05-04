================================================================================
TASK: ROUTE-S05-T02 - Android SaveFavoriteSheet — V2 LSBottomSheet composition + saveRoute mutation + already-saved fingerprint state
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

A rider taps Save on RouteDetailsScreen, the SaveFavoriteSheet bottom sheet opens with pre-populated name + LSInstrumentReadout metadata, and Save persists via db.savedRoutes.saveRoute or surfaces "Already saved" when the route fingerprint matches.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST compose the sheet from existing V2 atoms/molecules only — LSBottomSheet (detent=Medium) + LSText + LSFormField + LSInstrumentReadout + LSButton + LSToast — zero new primitives
- MUST wire Save tap to `db.savedRoutes.saveRoute({planInput, routeSnapshot, routeIndex, snapshotMeta})` via SavedRouteRepository.saveRoute(input) returning Result<String>
- MUST pre-populate the route name to `"{startLabel} → {destinationLabel}"` derived from the selected RouteOption + planInput; the rider may overwrite up to 100 chars
- MUST display distance, duration, elevation, scenic-score, and "Saved {now}" timestamp in LSInstrumentReadout metadata (4-column grid)
- MUST short-circuit save when `SavedRouteRepository.matchesFingerprint(routeIndex.fingerprint)` returns true: the primary button renders "Already saved" disabled and tap is a no-op
- MUST hoist sheet visibility from RouteDetailsViewModel.showSaveSheet (already wired in CHAT-S04-T08) — this task supplies the sheet body that flag presents
- MUST wrap the LSFormField in `Modifier.imePadding()` (KeyboardAvoidingInput pattern per MEMORY.md) so the keyboard does not occlude the input
- NEVER hardcode color literals (`Color(0xFF...)` or hex strings) — all surfaces resolve through `LocalLaneShadowTheme.current` semantic tokens
- NEVER mutate ChatStore / RideFlow state from the sheet — Save is an isolated side effect on SavedRouteRepository
- NEVER create a parallel ConvexClientWithAuth instance — extend existing SavedRouteRepository so a single Convex client owns saved-routes traffic
- NEVER ship without explicit `contentDescription` on icon-only buttons and sheet handles (TalkBack support)
- STRICTLY follow architecture/ui-design.md § 1.I composition order (header → caption → field + counter → metadata strip → action row)

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] SaveFavoriteSheet renders from RouteDetailsViewModel.showSaveSheet=true with pre-populated name + LSInstrumentReadout (AC-1 PRIMARY)
- [ ] Save tap invokes SavedRouteRepository.saveRoute and emits LSToast on success (AC-2)
- [ ] Already-saved fingerprint flips primary button to "Already saved" disabled state (AC-3)
- [ ] Empty name state disables Save button + shows helper text (AC-4)
- [ ] Save mutation failure keeps sheet open + surfaces inline error LSText (AC-5)
- [ ] Successful save persists across recompositions and the parent's Save button reflects "Saved" via fingerprint observation (AC-6)
- [ ] gradlew test + compileDebugKotlin clean
- [ ] Sandbox stories untouched + snapshots:check green
- [ ] TDD RED evidence per AC

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Sheet renders pre-populated name + metadata when visibility flag flips true [PRIMARY]
  GIVEN: A SaveFavoriteSheetViewModel seeded with sessionId="sess-1", routeOptionId="opt-best", planInput {start="Santa Cruz", destination="Big Sur"}, and a RouteOption with distanceMeters=104607, durationSeconds=7800, elevationGainMeters=540, scenicScore=82
  WHEN:  state is collected with showSaveSheet=true
  THEN:  Loaded emission has nameField="Santa Cruz → Big Sur", instrumentReadout.distanceKm=104.61, durationMinutes=130, elevationGainM=540, scenicScore=82, savedAtLabel formatted via stringResource (e.g., "Saved just now"), saveButtonState=NotSaved

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/sheets/SaveFavoriteSheetViewModelTest.kt
  TEST_FUNCTION: state_visibilityFlipsTrue_seedsPrePopulatedNameAndMetadata

AC-2: Save tap calls saveRoute and emits success toast
  GIVEN: A SaveFavoriteSheetViewModel in NotSaved state with name="Skyline Spine" and a fake SavedRouteRepository.saveRoute returning Result.success("saved-route-1")
  WHEN:  viewModel.onSaveTapped() is invoked
  THEN:  SavedRouteRepository.saveRoute is called exactly once with planInput + routeSnapshot + routeIndex + snapshotMeta whose `name` field equals "Skyline Spine", a subsequent state emission has saveButtonState=Saving then Saved, and `events: SharedFlow<SaveFavoriteEvent>` emits SaveFavoriteEvent.Saved("saved-route-1")

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/sheets/SaveFavoriteSheetViewModelTest.kt
  TEST_FUNCTION: onSaveTapped_invokesSaveRouteAndEmitsSavedEvent

AC-3: Already-saved fingerprint disables Save and shows "Already saved"
  GIVEN: A SaveFavoriteSheetViewModel for routeOptionId="opt-best" whose routeIndex fingerprint matches an existing saved_routes row, and a fake SavedRouteRepository.matchesFingerprint returning Flow.of(true)
  WHEN:  state is collected with showSaveSheet=true
  THEN:  Loaded emission has saveButtonState=AlreadySaved, button label is the resolved string for `R.string.save_favorite_already_saved` ("Already saved"), and onSaveTapped() is a no-op (saveRoute is never invoked)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/sheets/SaveFavoriteSheetViewModelTest.kt
  TEST_FUNCTION: state_fingerprintMatch_setsAlreadySavedAndDisablesSaveTap

AC-4: Empty name disables Save and shows helper text
  GIVEN: A SaveFavoriteSheetViewModel in NotSaved state
  WHEN:  viewModel.onNameChange("") is invoked
  THEN:  Subsequent Loaded emission has nameField="", saveButtonState=NotSaved, isSaveEnabled=false, helperText resolved from `R.string.save_favorite_name_required`

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/sheets/SaveFavoriteSheetViewModelTest.kt
  TEST_FUNCTION: onNameChange_emptyValue_disablesSaveAndShowsHelperText

AC-5: Save mutation failure keeps sheet open + surfaces inline error
  GIVEN: A SaveFavoriteSheetViewModel in NotSaved with name="Big Sur Loop" and a fake SavedRouteRepository.saveRoute returning Result.failure(IOException("network"))
  WHEN:  viewModel.onSaveTapped() is invoked
  THEN:  Subsequent emission has saveButtonState=NotSaved (sheet stays open), inlineError resolved via `ConvexErrorMapper.toUserMessage(IOException("network"))` ("You appear to be offline…"), and events SharedFlow does NOT emit Saved

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/sheets/SaveFavoriteSheetViewModelTest.kt
  TEST_FUNCTION: onSaveTapped_failure_keepsSheetOpenAndSurfacesInlineError

AC-6: Save success closes sheet and propagates Saved fingerprint upstream
  GIVEN: A composed SaveFavoriteSheetRoute mounted with showSaveSheet=true, fake SavedRouteRepository.saveRoute returning success("sr-1"), and a fake matchesFingerprint Flow that flips to true after save completes
  WHEN:  the rider taps Save in the Compose UI test (LSButton tagged `save-favorite-primary`)
  THEN:  Within 200ms a SaveFavoriteEvent.Saved is collected, RouteDetailsViewModel.onSaveSheetDismissed() is called, the LSBottomSheet `onDismiss` fires, an LSToast tagged `save-favorite-success-toast` becomes visible, and a subsequent collection of RouteDetails state shows saveButtonState=AlreadySaved (fingerprint propagation)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/sheets/SaveFavoriteSheetTest.kt
  TEST_FUNCTION: saveTap_success_dismissesSheetAndPropagatesAlreadySaved

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

- TC-1 maps_to_ac=AC-1: Pre-populated name uses "{startLabel} → {destinationLabel}" composition rule with arrow separator
- TC-2 maps_to_ac=AC-2: SavedRouteRepository.saveRoute receives args containing every required key (planInput, routeSnapshot, routeIndex, snapshotMeta)
- TC-3 maps_to_ac=AC-3: matchesFingerprint=true → button state is AlreadySaved AND onSaveTapped becomes a no-op
- TC-4 maps_to_ac=AC-4: Empty name produces isSaveEnabled=false AND helper text resolves from string resource (i18n)
- TC-5 maps_to_ac=AC-5: Failure path preserves sheet visibility + maps the throwable through ConvexErrorMapper, never silently
- TC-6 maps_to_ac=AC-6: End-to-end Compose UI test verifies sheet dismissal + parent-screen Saved propagation

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/sheets/SaveFavoriteSheet.kt (NEW — composable shell)
- android/app/src/main/java/com/laneshadow/ui/sheets/SaveFavoriteSheetViewModel.kt (NEW — @HiltViewModel + @AssistedInject sessionId+routeOptionId factory)
- android/app/src/main/java/com/laneshadow/ui/sheets/SaveFavoriteSheetUiState.kt (NEW — sealed interface Loading/Loaded; SaveButtonState NotSaved/Saving/Saved/AlreadySaved; SaveFavoriteEvent.Saved/Failed)
- android/app/src/main/java/com/laneshadow/data/savedroutes/SavedRouteRepository.kt (MODIFY — add `suspend fun saveRoute(input: SaveRouteInput): Result<String>`; existing matchesFingerprint untouched)
- android/app/src/main/java/com/laneshadow/data/savedroutes/SaveRouteInput.kt (NEW — domain DTO for the mutation payload mapping to PlanInput + RouteSnapshot + RouteIndex + SnapshotMeta)
- android/app/src/main/java/com/laneshadow/ui/routedetails/RouteDetailsRoute.kt (MODIFY — present SaveFavoriteSheet when showSaveSheet=true; one-line rationale: hosts the sheet via Compose ModalBottomSheet pattern, owns onDismiss callback into RouteDetailsViewModel)
- android/app/src/main/res/values/strings.xml (MODIFY — add `save_favorite_*` string resources for i18n)
- android/app/src/test/java/com/laneshadow/ui/sheets/SaveFavoriteSheetViewModelTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/sheets/SaveFavoriteSheetTest.kt (NEW — Compose UI test)

writeProhibited:
- android/app/src/main/java/com/laneshadow/services/ChatViewModel.kt — owned by Sprint 04 (read-only)
- android/app/src/main/java/com/laneshadow/services/RideFlowReducer.kt — owned by Sprint 04 (read-only)
- android/app/src/main/java/com/laneshadow/services/AppStateRepository.kt — owned by Sprint 04 (read-only)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSBottomSheet.kt — V2 molecule untouched
- android/app/src/main/java/com/laneshadow/ui/molecules/LSInstrumentReadout.kt — V2 molecule untouched
- android/app/src/main/java/com/laneshadow/ui/molecules/LSFormField.kt — V2 molecule untouched
- android/app/src/main/java/com/laneshadow/ui/templates/RouteDetailsScreen.kt — V2 template untouched (adapt at the Route boundary)
- android/app/src/main/java/com/laneshadow/generated/** — generated by server/scripts/generate-mobile-types.ts
- android/app/src/debug/java/com/laneshadow/sandbox/** — sandbox stories stay golden
- Any iOS file under ios/**

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use existing LSBottomSheet detent=Medium with the existing drag handle + scrim
- Use stringResource for every user-visible label (i18n + accessibility)
- Use viewModelScope.launch with `SharingStarted.WhileSubscribed(5_000)` for state flows
- Wrap the input area in `Modifier.imePadding()` per KeyboardAvoidingInput rule
- Use `@AssistedInject` factory for sessionId + routeOptionId injection
- Map mutation throwables through ConvexErrorMapper (already lives in services/LaneShadowErrorMapper.kt)

⚠️ Ask First:
- If the saveRoute mutation Convex schema diverges from `{planInput, routeSnapshot, routeIndex, snapshotMeta}` validators in `server/convex/db/savedRoutes.ts:422`
- If RouteOption domain type lacks distanceMeters/durationSeconds/elevationGainMeters/scenicScore — escalate to type-gen
- Whether to expose `defaultName` derivation as a pure helper for unit testing (recommended yes; only ask if there is doubt)
- If matchesFingerprint must remain pull-based vs Flow-based for this sheet's lifecycle (current decision: Flow-based, drop subscription on dismiss)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- SaveFavoriteSheet.kt (Composable wrapping LSBottomSheet — header, caption, LSFormField + counter, LSInstrumentReadout, action row)
- SaveFavoriteSheetViewModel.kt (@HiltViewModel + @AssistedInject; combines RouteRepository.subscribeToPlanById + matchesFingerprint into Loaded state)
- SaveFavoriteSheetUiState.kt (sealed interface UiState + SaveButtonState enum + SaveFavoriteEvent sealed interface)
- SaveRouteInput.kt (domain DTO: planInput + routeSnapshot + routeIndex(fingerprint) + snapshotMeta)
- SavedRouteRepository.kt (MODIFY): add saveRoute(input) → Result<String>; mirrors matchesFingerprint() Convex client wiring pattern
- RouteDetailsRoute.kt (MODIFY): host SaveFavoriteSheet when showSaveSheet=true
- strings.xml (MODIFY): user-visible save_favorite_* strings
- SaveFavoriteSheetViewModelTest.kt (RED → GREEN per AC-1..AC-5)
- SaveFavoriteSheetTest.kt (Compose UI test for AC-6)

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

1. RED — Write SaveFavoriteSheetViewModelTest covering AC-1..AC-5 (use FakeSavedRouteRepository, FakeRouteRepository); confirm all fail with "unresolved reference" on the new types
2. GREEN — Add SaveFavoriteSheetUiState + SaveRouteInput + SavedRouteRepository.saveRoute stub returning Result.success; introduce SaveFavoriteSheetViewModel with combine() over plan + fingerprint flows; iterate until tests pass
3. RED — Write SaveFavoriteSheetTest (Compose) for AC-6 using ComposeTestRule with hiltAndroidRule + a fake SavedRouteRepository module
4. GREEN — Implement the SaveFavoriteSheet composable wrapping LSBottomSheet; modify RouteDetailsRoute to host it; verify the UI test passes
5. REFACTOR — Extract default-name composition into a pure helper; ensure no hardcoded colors/strings; run detekt + tokens:native-compliance + snapshots:check

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/architecture/ui-design.md [PRIMARY PATTERN]
   - Lines: 349-380
   - Focus: § 1.I SaveFavoriteSheet composition (header → caption → field + counter → metadata strip → action row), states table

2. .spec/prds/v3-integration/architecture/android-architecture.md
   - Lines: 986-1010
   - Focus: § 7.7 SaveFavoriteSheet — KeyboardAvoidingInput pattern, signature shape

3. .spec/prds/v3-integration/06-uc-route.md
   - Lines: 19-35
   - Focus: UC-ROUTE-01 acceptance criteria (fingerprint already-saved short-circuit)

4. android/app/src/main/java/com/laneshadow/data/savedroutes/SavedRouteRepository.kt
   - Lines: 1-153
   - Focus: existing ConvexClientWithAuth wiring pattern + matchesFingerprint to mirror for saveRoute

5. android/app/src/main/java/com/laneshadow/ui/routedetails/RouteDetailsRoute.kt
   - Lines: 1-100
   - Focus: existing presentation seam where the sheet must be hosted; showSaveSheet flag origin

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence — TDD_STATE history per AC (commit message references each AC's first failing test)
Gate 2: All tests pass — `cd android && ./gradlew test` (Exit 0)
Gate 3: Per-AC verification — `cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.sheets.SaveFavoriteSheetViewModelTest.{state_visibilityFlipsTrue_seedsPrePopulatedNameAndMetadata,onSaveTapped_invokesSaveRouteAndEmitsSavedEvent,state_fingerprintMatch_setsAlreadySavedAndDisablesSaveTap,onNameChange_emptyValue_disablesSaveAndShowsHelperText,onSaveTapped_failure_keepsSheetOpenAndSurfacesInlineError}"` and `cd android && ./gradlew :app:connectedDebugAndroidTest --tests "com.laneshadow.ui.sheets.SaveFavoriteSheetTest.saveTap_success_dismissesSheetAndPropagatesAlreadySaved"`
Gate 4: Type check — `cd android && ./gradlew :app:compileDebugKotlin` (Exit 0)
Gate 5: Static analysis — `cd android && ./gradlew detekt` (Exit 0)
Gate 6: Token compliance — `scripts/tokens/enforce-native-compliance.sh` (Exit 0)
Gate 7: Sandbox snapshots untouched — `pnpm snapshots:check` (Exit 0)
Gate 8: Scope compliance — `git diff --name-only` ⊆ writeAllowed

--------------------------------------------------------------------------------
REVIEW
--------------------------------------------------------------------------------

Must pass:
- Composition strictly per § 1.I (LSBottomSheet + LSText header + LSText caption + LSFormField + counter + LSInstrumentReadout + LSButton row)
- Zero hardcoded colors / hex / `Color(0xFF…)` literals
- AssistedInject factory for sessionId + routeOptionId
- All user strings via stringResource
- Modifier.imePadding() on the input area
- saveRoute payload validates against `server/convex/db/savedRoutes.ts:422` mutation args
- Already-saved short-circuit prevents the mutation from firing

Should verify:
- LSToast success toast appears with correct semantic role
- TalkBack reads "Save route, dismissible" on sheet open and announces character count updates
- Sheet survives configuration change (rotation) without losing in-progress text
- Loading state during save shows LSSpinner in the primary button trailing slot

Verdict: PENDING

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: CHAT-S04-T08 (Android RouteDetails wiring + showSaveSheet flag + matchesFingerprint integration)
Blocks: ROUTE-S05-T04 (saved-routes list reads what this task saves), ROUTE-S05-T06 (detail screen hydrates from saved snapshot)
Paired with: ROUTE-S05-T01 (iOS SaveFavoriteSheet — share UC-ROUTE-01 ACs)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "ROUTE-S05-T02",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN visibility flag true WHEN state collected THEN pre-populated name + LSInstrumentReadout metadata seeded", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.sheets.SaveFavoriteSheetViewModelTest.state_visibilityFlipsTrue_seedsPrePopulatedNameAndMetadata", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN NotSaved state WHEN onSaveTapped invoked THEN saveRoute called once and Saved event emitted", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.sheets.SaveFavoriteSheetViewModelTest.onSaveTapped_invokesSaveRouteAndEmitsSavedEvent", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN fingerprint match WHEN state collected THEN AlreadySaved + onSaveTapped no-op", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.sheets.SaveFavoriteSheetViewModelTest.state_fingerprintMatch_setsAlreadySavedAndDisablesSaveTap", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN empty name WHEN onNameChange invoked THEN isSaveEnabled=false + helper text from string resource", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.sheets.SaveFavoriteSheetViewModelTest.onNameChange_emptyValue_disablesSaveAndShowsHelperText", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN saveRoute failure WHEN onSaveTapped invoked THEN sheet stays open + inline error from ConvexErrorMapper", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.sheets.SaveFavoriteSheetViewModelTest.onSaveTapped_failure_keepsSheetOpenAndSurfacesInlineError", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN successful save WHEN user taps Save in UI test THEN sheet dismisses + LSToast visible + parent reflects AlreadySaved", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.sheets.SaveFavoriteSheetTest.saveTap_success_dismissesSheetAndPropagatesAlreadySaved", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Pre-populated name uses {startLabel} → {destinationLabel} composition rule", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.sheets.SaveFavoriteSheetViewModelTest.state_visibilityFlipsTrue_seedsPrePopulatedNameAndMetadata", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "saveRoute receives all required keys (planInput, routeSnapshot, routeIndex, snapshotMeta)", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.sheets.SaveFavoriteSheetViewModelTest.onSaveTapped_invokesSaveRouteAndEmitsSavedEvent", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "matchesFingerprint=true forces AlreadySaved and onSaveTapped no-op", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.sheets.SaveFavoriteSheetViewModelTest.state_fingerprintMatch_setsAlreadySavedAndDisablesSaveTap", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "Empty name produces isSaveEnabled=false and helper text resolves from string resource", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.sheets.SaveFavoriteSheetViewModelTest.onNameChange_emptyValue_disablesSaveAndShowsHelperText", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "Failure path preserves sheet visibility and routes the throwable through ConvexErrorMapper", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.sheets.SaveFavoriteSheetViewModelTest.onSaveTapped_failure_keepsSheetOpenAndSurfacesInlineError", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "End-to-end Compose UI test verifies sheet dismissal + parent-screen Saved propagation", "maps_to_ac": "AC-6", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.sheets.SaveFavoriteSheetTest.saveTap_success_dismissesSheetAndPropagatesAlreadySaved", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
