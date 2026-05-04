================================================================================
TASK: ROUTE-S06-T01 - iOS SaveFavoriteSheet — name input + saveRoute mutation + already-saved fingerprint
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  test:      xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test
  typecheck: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  lint:      swiftformat --lint ios/

PROGRESS: 0/6 AC

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Replacing the SaveFavoriteSheetPlaceholder with a real LSBottomSheet body that captures a route name, displays metadata, and persists the route through `db.savedRoutes.saveRoute`, with an already-saved fingerprint short-circuit and success toast.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST replace `Features/RouteDetails/SaveFavoriteSheetPlaceholder.swift` with a real `SaveFavoriteSheet` composed from existing primitives (LSBottomSheet + LSFormField + LSInstrumentReadout + LSButton + LSToast) — zero new components
- MUST seed the route name from `"{startLabel} → {destinationLabel}"` (per UC-ROUTE-01 §AC) using the selected route option's `label` and `rationale` fields, falling back to "Saved route" when both are empty
- MUST call `db.savedRoutes.saveRoute` with the full payload `{name, planInput, routeSnapshot, routeIndex, snapshotMeta}` — every field validated server-side; missing any field is a P0 bug
- MUST query `db.savedRoutes.getRouteIndexFingerprint({routeIndex})` on sheet present and short-circuit save when fingerprint hits, rendering an inline "Already saved" state with disabled Save button (UC-ROUTE-01 §AC last bullet)
- MUST persist saveRoute via the typed `LaneShadowConvexMutation.saveRoute` helper added to `ConvexClient+LaneShadow.swift` — no raw string endpoint calls
- MUST present LSToast(message: "Route saved", variant: .success) on success and dismiss the sheet ~200ms after success per ui-design.md §1.I `success` state row
- NEVER hardcode color literals — semantic theme tokens only (lefthook `tokens:native-compliance` will reject hex)
- NEVER touch ios/LaneShadow.xcodeproj/** directly — generated; edit ios/project.yml + run scripts/ios/generate-project.sh
- NEVER modify ios/LaneShadow/Generated/** — types come from server/scripts/generate-mobile-types.ts
- NEVER modify Sprint-04 services (RideFlow.swift / ChatStore.swift / SessionStore.swift) — read-only inputs
- STRICTLY use semantic typography variants (`label.lg`, `body.md`, `body.sm`) and `theme.space.*` — never raw `Font` / `CGFloat` literals

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Sheet body composes LSBottomSheet(detent:.medium) with LSFormField + LSInstrumentReadout + LSButton row (AC-1 PRIMARY)
- [ ] Pre-populated name uses `"{startLabel} → {destinationLabel}"` derived from the selected route option (AC-2)
- [ ] Save tap calls saveRoute mutation with full payload + dismisses sheet + shows success LSToast (AC-3)
- [ ] Already-saved fingerprint short-circuits to inline disabled state, no mutation fires (AC-4)
- [ ] Save mutation failure surfaces inline error row, sheet stays open, button re-enables (AC-5)
- [ ] Empty name disables Save button via validating state (AC-6)
- [ ] Tests pass + build clean
- [ ] Scope compliance — git diff --name-only ⊆ writeAllowed

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Sheet body composes LSBottomSheet shell with name input + metadata + actions [PRIMARY]
  GIVEN: RouteDetailsViewModel.presentingSaveFavoriteSheet flips to true with a selected option (label="Skyline Spine", distance="42 km", time="1h 15m", elevation="850")
  WHEN:  SaveFavoriteSheet renders inside the .sheet(isPresented:) presentation
  THEN:  The sheet contains an LSBottomSheet with detent .medium, an LSFormField bound to the name state, an LSInstrumentReadout displaying [.dist, .time, .climb, .saved], and a row of [LSButton(.outline, "Cancel"), LSButton(.primary, "Save route")]; accessibilityIdentifier "savefavoritesheet" is set on the root container

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/SaveFavorite/SaveFavoriteSheetTests.swift
  TEST_FUNCTION: test_saveFavoriteSheet_composesShellWithFormFieldAndMetadata

AC-2: Pre-populated name uses startLabel → destinationLabel from selected option
  GIVEN: SaveFavoriteSheetViewModel initialized with a `PlannedRouteOptionView` whose `label = "Skyline Spine"` and a planInput payload with start.label="Santa Cruz" and end="Big Sur"
  WHEN:  Sheet appears (.task triggers `seedNameFromSelection`)
  THEN:  The LSFormField value-binding is "Santa Cruz → Big Sur"; if both labels are empty, the field falls back to "Saved route"

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/SaveFavorite/SaveFavoriteSheetViewModelTests.swift
  TEST_FUNCTION: test_saveFavorite_seedsNameFromStartAndEndLabels

AC-3: Save tap calls saveRoute mutation with full payload + success toast + dismiss
  GIVEN: User edits the name to "Coastal Loop"; selected option carries valid planInput, routeSnapshot, routeIndex, snapshotMeta; stub `saveRoute` mutation succeeds returning `{savedRouteId: "sr-1"}`
  WHEN:  User taps the Save button
  THEN:  StubLaneShadowConvexClient.saveRouteCalls contains exactly one entry with `name="Coastal Loop"` and full {planInput, routeSnapshot, routeIndex, snapshotMeta}; viewModel.successToastVisible flips true; sheet dismisses ~200ms after success (presentingSaveFavoriteSheet = false); LSToast appears with message "Route saved" and variant .success

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/SaveFavorite/SaveFavoriteSheetViewModelTests.swift
  TEST_FUNCTION: test_saveFavorite_saveTap_invokesMutation_andPresentsSuccessToast

AC-4: Already-saved fingerprint short-circuits to disabled inline state
  GIVEN: Stub `getRouteIndexFingerprint` returns a non-nil `SavedRoutesDocument` for the selected option's `routeOptionId`
  WHEN:  SaveFavoriteSheet appears and the viewModel runs `loadFingerprintState()`
  THEN:  viewModel.isAlreadySaved becomes true; the Save button renders with label "Already saved" and isDisabled=true; saveRoute is NEVER called even if the user taps Save (StubLaneShadowConvexClient.saveRouteCalls.isEmpty)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/SaveFavorite/SaveFavoriteSheetViewModelTests.swift
  TEST_FUNCTION: test_saveFavorite_alreadySavedFingerprint_disablesSaveAndSkipsMutation

AC-5: Save mutation failure surfaces inline error + sheet stays open
  GIVEN: User taps Save; stub `saveRoute` throws `LaneShadowError.server("conflict")`
  WHEN:  The mutation rejects
  THEN:  viewModel.errorMessage becomes "Failed to save. Try again." (per ui-design.md §1.I `error` row); viewModel.isSaving flips back to false; the Save button is re-enabled; `presentingSaveFavoriteSheet` stays true (sheet visible); accessibilityIdentifier "savefavoritesheet-error" is rendered

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/SaveFavorite/SaveFavoriteSheetViewModelTests.swift
  TEST_FUNCTION: test_saveFavorite_mutationFailure_keepsSheetOpenWithErrorState

AC-6: Empty name disables Save button via validating state
  GIVEN: User edits the name to "" (whitespace-only also counts as empty after trim)
  WHEN:  The viewModel evaluates `canSubmit`
  THEN:  Save button is disabled; tap is a no-op (no mutation fires); helper text reads "Enter a name to save" (per ui-design.md §1.I `validating` row)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/SaveFavorite/SaveFavoriteSheetViewModelTests.swift
  TEST_FUNCTION: test_saveFavorite_emptyName_disablesSaveButton

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

- TC-1 (maps_to_ac AC-1): Inspecting the rendered SaveFavoriteSheet yields an LSBottomSheet, an LSFormField, an LSInstrumentReadout, and two LSButtons.
- TC-2 (maps_to_ac AC-2): When start.label="Santa Cruz" and end="Big Sur", the seeded name string equals "Santa Cruz → Big Sur".
- TC-3 (maps_to_ac AC-3): After Save tap on a happy path, the stub records exactly 1 saveRoute call with all 5 fields populated, and the toast binding flips true.
- TC-4 (maps_to_ac AC-4): A non-nil fingerprint result causes isAlreadySaved=true and prevents any saveRoute call.
- TC-5 (maps_to_ac AC-5): A throwing saveRoute leaves the sheet open with an error message and re-enables the Save button.
- TC-6 (maps_to_ac AC-6): canSubmit is false when name.trimmingCharacters(.whitespaces).isEmpty.

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Features/SaveFavorite/SaveFavoriteSheet.swift (NEW — sheet body view)
- ios/LaneShadow/Features/SaveFavorite/SaveFavoriteSheetViewModel.swift (NEW — @Observable view model)
- ios/LaneShadow/Features/RouteDetails/SaveFavoriteSheetPlaceholder.swift (MODIFY — replace with thin wrapper that constructs SaveFavoriteSheet from selected option, OR delete and update RouteDetailsContainer.swift to present SaveFavoriteSheet directly; rationale: removes the V3 placeholder shipped in CHAT-S04-T07)
- ios/LaneShadow/Features/RouteDetails/RouteDetailsContainer.swift (MODIFY — swap placeholder for real SaveFavoriteSheet; rationale: the .sheet body is mounted from this container per existing pattern)
- ios/LaneShadow/Services/ConvexClient+LaneShadow.swift (MODIFY — add `LaneShadowConvexMutation.saveRoute` enum case + typed `saveRoute(name:planInput:routeSnapshot:routeIndex:snapshotMeta:)` helper if missing; rationale: typed wrapper, not raw string endpoint)
- ios/LaneShadowTests/Features/SaveFavorite/SaveFavoriteSheetTests.swift (NEW — view-level tests)
- ios/LaneShadowTests/Features/SaveFavorite/SaveFavoriteSheetViewModelTests.swift (NEW — VM tests)
- ios/LaneShadowTests/Helpers/StubLaneShadowConvexClient.swift (MODIFY — add `stubSaveRouteResult`, `stubSaveRouteError`, `saveRouteCalls`, and the `saveRoute(...)` stub method)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated; edit ios/project.yml + run scripts/ios/generate-project.sh
- ios/LaneShadow/Generated/** — generated by server/scripts/generate-mobile-types.ts
- ios/LaneShadow/Sandbox/MockProviders/** — sandbox stories keep their MockProviders
- ios/LaneShadow/Services/RideFlow.swift / ChatStore.swift / SessionStore.swift — Sprint 04 owners; read-only here
- ios/LaneShadow/Views/Templates/RouteDetailsScreen.swift — Sprint 04 (CHAT-S04-T07) owns the template; do not touch
- ios/LaneShadow/Features/RouteDetails/RouteDetailsViewModel.swift — Sprint 04 owns; do not modify (presentation flag already exists)
- ios/LaneShadow/Views/Molecules/LSBottomSheet.swift / LSFormField.swift / LSInstrumentReadout.swift / LSToast.swift — primitives; reuse only

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use existing LSBottomSheet, LSFormField, LSInstrumentReadout, LSButton, LSToast composition — no new components
- Trim the name with `.trimmingCharacters(in: .whitespacesAndNewlines)` before submission and validation
- Treat fingerprint query as one-shot per sheet appearance (called from `.task`)
- Call `LaneShadowConvexMutation.saveRoute` via the typed mutation enum

⚠️ Ask First:
- If the saved-route mutation requires a `routeProvenance` field that is not in the selected `PlannedRouteOptionView` payload (the server validator marks it `v.optional()` — leave nil unless type-gen says otherwise)
- If the LSToast surface needs a 5-second auto-dismiss instead of the default — defer to default unless ui-design.md changes
- If RouteDetailsViewModel already exposes a way to read the selected option's planInput/routeSnapshot/routeIndex/snapshotMeta (it currently exposes only viewState; you may need to extend the readable surface — keep it minimal and additive)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Features/SaveFavorite/SaveFavoriteSheet.swift (NEW): SwiftUI view composing LSBottomSheet shell with LSFormField + LSInstrumentReadout + LSButton row
- ios/LaneShadow/Features/SaveFavorite/SaveFavoriteSheetViewModel.swift (NEW): `@MainActor @Observable` VM exposing `name`, `isSaving`, `isAlreadySaved`, `errorMessage`, `successToastVisible`, `canSubmit`; methods `seedNameFromSelection`, `loadFingerprintState`, `submitSave`
- ios/LaneShadow/Features/RouteDetails/RouteDetailsContainer.swift (MODIFY): replace `SaveFavoriteSheetPlaceholder()` with `SaveFavoriteSheet(viewModel: SaveFavoriteSheetViewModel(...))`
- ios/LaneShadow/Features/RouteDetails/SaveFavoriteSheetPlaceholder.swift (MODIFY or DELETE): remove placeholder once real sheet is wired
- ios/LaneShadow/Services/ConvexClient+LaneShadow.swift (MODIFY): add `LaneShadowConvexMutation.saveRoute` enum case (already present at line 18 — verify) + typed `saveRoute(...)` helper that decodes `{savedRouteId: String}`
- ios/LaneShadowTests/Features/SaveFavorite/SaveFavoriteSheetTests.swift (NEW): view-level rendering tests (AC-1)
- ios/LaneShadowTests/Features/SaveFavorite/SaveFavoriteSheetViewModelTests.swift (NEW): VM behavior tests (AC-2..6)
- ios/LaneShadowTests/Helpers/StubLaneShadowConvexClient.swift (MODIFY): add saveRoute stub surface

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

[Standard RED → GREEN → REFACTOR per AC.]

1. RED: Write the failing test for AC-1 first (sheet composes shell). Confirm it fails because SaveFavoriteSheet does not exist.
2. GREEN: Create the minimal SaveFavoriteSheet.swift body needed to pass AC-1. Compile must succeed.
3. RED → GREEN for each subsequent AC in order (2, 3, 4, 5, 6). Capture RED replay output to `.tmp/ROUTE-S06-T01/red-{ac}-output.txt`.
4. REFACTOR: After all ACs green, extract any helper functions, ensure swiftformat lint passes, ensure all colors come from theme tokens, ensure accessibility identifiers and labels exist for VoiceOver navigation.
5. Confirm `Save` button has accessibilityLabel "Save route. Disabled until you enter a name." per ui-design.md §1.I accessibility row.
6. Run the full evidence gate sequence (test, build, lint, token-check, snapshots:check, scope diff).

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/architecture/ui-design.md [PRIMARY PATTERN]
   - Lines: 349-379
   - Focus: §1.I SaveFavoriteSheet composition + states (default, typing, validating, saving, error, success) + accessibility

2. ios/LaneShadow/Features/RouteDetails/SaveFavoriteSheetPlaceholder.swift
   - Lines: 1-56
   - Focus: Existing V3 placeholder shipped in CHAT-S04-T07 — replace with real body

3. ios/LaneShadow/Features/RouteDetails/RouteDetailsContainer.swift
   - Lines: 1-39
   - Focus: How `.sheet(isPresented: $viewModel.presentingSaveFavoriteSheet)` is wired — keep this entry point intact; only swap the body

4. ios/LaneShadow/Views/Molecules/LSBottomSheet.swift
   - Lines: 1-153
   - Focus: Detent enum + sheet surface chrome; the sheet wrapper is presented from the parent's `.sheet` modifier — `LSBottomSheet` is itself a body wrapper

5. .spec/prds/v3-integration/06-uc-route.md
   - Lines: 19-35
   - Focus: UC-ROUTE-01 acceptance criteria — every AC bullet must trace to one of this task's ACs

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence — TDD_STATE history per AC saved to `.tmp/ROUTE-S06-T01/red-{ac}-output.txt`
Gate 2: All tests pass — xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test (Exit 0)
Gate 3: Build — xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build (Exit 0)
Gate 4: Lint — swiftformat --lint ios/ (Exit 0)
Gate 5: Token compliance — scripts/tokens/enforce-native-compliance.sh (Exit 0)
Gate 6: Sandbox snapshots still pass — pnpm snapshots:check (Exit 0)
Gate 7: Scope compliance — git diff --name-only ⊆ writeAllowed
Per-AC verification: xcodebuild ... test -only-testing:LaneShadowTests/SaveFavoriteSheetViewModelTests/{test_function_name}

--------------------------------------------------------------------------------
REVIEW
--------------------------------------------------------------------------------

Must pass:
- All 6 ACs verified via per-AC test commands
- Token compliance (no hex literals; only `theme.*` and semantic typography variants)
- writeAllowed/writeProhibited respected (git diff verifies)
- Accessibility labels present on form field + buttons + sheet root

Should verify:
- Sheet auto-focuses the name field on present (per ui-design.md §1.I accessibility row)
- Character counter renders if implementer chose to expose it (counter is referenced in §1.I but the AC list does not require it — OK to defer to a follow-up)
- The 200ms post-success dismiss matches the §1.I "success" row spec
- Verdict: PENDING

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: CHAT-S04-T07 (RouteDetails wiring + SaveFavoriteSheetPlaceholder), CHAT-S04-T01 (RideFlow + ChatStore), AUTH-S03-T03 (ConvexClient+LaneShadow base)
Blocks: ROUTE-S06-T03 (SavedRoutesListScreen reads what saveRoute persists), ROUTE-S06-T05 (SavedRouteDetailScreen)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "ROUTE-S06-T01",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "SaveFavoriteSheet composes shell with name input + metadata + actions", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SaveFavoriteSheetTests/test_saveFavoriteSheet_composesShellWithFormFieldAndMetadata", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "Pre-populated name uses startLabel → destinationLabel from selected option", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SaveFavoriteSheetViewModelTests/test_saveFavorite_seedsNameFromStartAndEndLabels", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "Save tap calls saveRoute mutation with full payload + success toast + dismiss", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SaveFavoriteSheetViewModelTests/test_saveFavorite_saveTap_invokesMutation_andPresentsSuccessToast", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "Already-saved fingerprint short-circuits to disabled inline state", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SaveFavoriteSheetViewModelTests/test_saveFavorite_alreadySavedFingerprint_disablesSaveAndSkipsMutation", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "Save mutation failure surfaces inline error and keeps sheet open", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SaveFavoriteSheetViewModelTests/test_saveFavorite_mutationFailure_keepsSheetOpenWithErrorState", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "Empty name disables Save button via validating state", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SaveFavoriteSheetViewModelTests/test_saveFavorite_emptyName_disablesSaveButton", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Rendered sheet contains LSBottomSheet + LSFormField + LSInstrumentReadout + 2 LSButtons.", "maps_to_ac": "AC-1", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SaveFavoriteSheetTests/test_saveFavoriteSheet_composesShellWithFormFieldAndMetadata", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Seeded name equals 'Santa Cruz → Big Sur' for given fixture.", "maps_to_ac": "AC-2", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SaveFavoriteSheetViewModelTests/test_saveFavorite_seedsNameFromStartAndEndLabels", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "saveRouteCalls.count == 1 with full 5-field payload after Save tap; successToastVisible flips true.", "maps_to_ac": "AC-3", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SaveFavoriteSheetViewModelTests/test_saveFavorite_saveTap_invokesMutation_andPresentsSuccessToast", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "Non-nil fingerprint sets isAlreadySaved=true and prevents any saveRoute call.", "maps_to_ac": "AC-4", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SaveFavoriteSheetViewModelTests/test_saveFavorite_alreadySavedFingerprint_disablesSaveAndSkipsMutation", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "Throwing saveRoute leaves sheet open with errorMessage non-nil and isSaving=false.", "maps_to_ac": "AC-5", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SaveFavoriteSheetViewModelTests/test_saveFavorite_mutationFailure_keepsSheetOpenWithErrorState", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "canSubmit is false when trimmed name is empty.", "maps_to_ac": "AC-6", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SaveFavoriteSheetViewModelTests/test_saveFavorite_emptyName_disablesSaveButton", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
