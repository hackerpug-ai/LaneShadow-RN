================================================================================
TASK: ROUTE-S06-T05 - iOS SavedRouteDetailScreen — snapshot hydration + Rename/Delete + Plan again
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     S
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  test:      xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test
  typecheck: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  lint:      swiftformat --lint ios/

PROGRESS: 0/5 AC

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

A new SavedRouteDetailScreen hydrates RouteDetailsScreen's template from `db.savedRoutes.getSavedRouteDetail`, exposes Rename and Delete in the toolbar, and a "Plan again" button that creates a fresh planning session with the saved `planInput`.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST reuse `Views/Templates/RouteDetailsScreen.swift`'s ViewState-driven body — no new template; pass a `RouteDetailsViewState` derived from the saved snapshot
- MUST add a typed `getSavedRouteDetail(savedRouteId:)` helper to `ConvexClient+LaneShadow.swift` returning the typed `SavedRouteDetailView` shape from the Convex query
- MUST hide the LSWeatherTimeline when the snapshot has no cached weather (saved snapshots may or may not have it; do NOT fabricate stale weather) — per ui-design.md §1.E
- MUST replace the action row Save / Ride buttons with a single full-width "Plan again" primary button per ui-design.md §1.E variant change for saved-mode
- MUST wire "Plan again" to `db.planningSessions.createSession` with a seeded `firstMessage` derived from the saved route's start/end labels (e.g., `"Plan from {startLabel} to {endLabel}"`); on success, dispatch the new session through the navigation host (`appState.appRoute = .session(id: newSessionId)`)
- MUST present `Rename` via the same LSBottomSheet rename flow used by ROUTE-S06-T03 (extract or share the rename sheet view) and `Delete` via `LSModal` confirmation, on confirm calling `softDeleteRoute` and navigating back to the list
- NEVER create a new template — variant on the existing `RouteDetailsScreen`
- NEVER touch ios/LaneShadow.xcodeproj/** directly — generated; edit ios/project.yml + run scripts/ios/generate-project.sh
- NEVER modify ios/LaneShadow/Generated/** — types come from scripts/generate-mobile-types.ts
- NEVER modify Sprint-04 services (RideFlow.swift / ChatStore.swift / SessionStore.swift) — read-only inputs
- STRICTLY use semantic theme tokens; no hex literals; lefthook hook `tokens:native-compliance` will reject

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Screen subscribes to `db.savedRoutes.getSavedRouteDetail({savedRouteId})` and renders RouteDetailsScreen with hydrated viewState (AC-1 PRIMARY)
- [ ] Toolbar exposes Rename + Delete actions; Rename opens the rename sheet, Delete opens an LSModal confirmation (AC-2)
- [ ] "Plan again" tap calls createSession with seeded firstMessage and routes the app to that session (AC-3)
- [ ] Delete confirmation calls softDeleteRoute and navigates back to the list (AC-4)
- [ ] Not-found result renders LSEmptyState "Route not found" with a Back action (AC-5)
- [ ] Tests pass + build clean
- [ ] Scope compliance — git diff --name-only ⊆ writeAllowed

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Screen hydrates from saved snapshot via getSavedRouteDetail [PRIMARY]
  GIVEN: Stub `getSavedRouteDetail(savedRouteId: "sr-1")` returns a SavedRouteDetailView with `name="Skyline Spine"`, `planInput.start.label="Santa Cruz"`, planInput.end="Big Sur", `routeSnapshot` carrying bounds + overviewGeometry
  WHEN:  SavedRouteDetailContainer mounts and the viewModel runs `observe()`
  THEN:  RouteDetailsScreen renders with viewState whose routeTitle == "Skyline Spine", distanceKm derives from the saved snapshot's distance (or "—" if not present), durationFormatted is derived similarly; the LSWeatherTimeline is hidden when the snapshot's overlays.weather is nil (no fabricated entries)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/SavedRoutes/SavedRouteDetailViewModelTests.swift
  TEST_FUNCTION: test_savedRouteDetail_hydratesViewState_fromSnapshot

AC-2: Toolbar Rename + Delete chips open rename sheet and delete modal
  GIVEN: AC-1 has rendered
  WHEN:  User taps the Rename toolbar chip, then dismisses, then taps the Delete toolbar chip
  THEN:  viewModel.isRenameSheetPresented flips true on rename tap (and back to false on dismiss); viewModel.isDeleteModalPresented flips true on delete tap; the rename sheet body contains an LSFormField pre-populated with "Skyline Spine"; the delete modal renders title "Delete this route?" and body matching ui-design.md §1.E delete flow ("This will move it to recently deleted for 30 days.")

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/SavedRoutes/SavedRouteDetailViewModelTests.swift
  TEST_FUNCTION: test_savedRouteDetail_toolbarActions_presentRenameAndDeleteFlows

AC-3: "Plan again" calls createSession with seeded firstMessage and routes to session
  GIVEN: AC-1 has rendered; user taps "Plan again"; stub `createPlanningSession` returns `{sessionId: "session-9"}`
  WHEN:  viewModel.handlePlanAgainTap is invoked
  THEN:  StubLaneShadowConvexClient.createPlanningSessionCalls contains exactly one entry with firstMessage == "Plan from Santa Cruz to Big Sur"; the supplied `onSessionCreated(sessionId:)` closure is invoked with "session-9" exactly once; the closure caller is responsible for setting `appState.appRoute = .session(id:)` (the screen does not own AppState)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/SavedRoutes/SavedRouteDetailViewModelTests.swift
  TEST_FUNCTION: test_savedRouteDetail_planAgain_createsSessionAndRoutes

AC-4: Delete confirmation calls softDeleteRoute + navigates back
  GIVEN: viewModel.isDeleteModalPresented is true; user taps the destructive primary "Delete" button in the modal
  WHEN:  viewModel.confirmDelete is invoked
  THEN:  StubLaneShadowConvexClient.softDeleteRouteCalls contains exactly one entry with savedRouteId == "sr-1"; the supplied `onDeleted()` closure is invoked exactly once; viewModel.isDeleteModalPresented becomes false

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/SavedRoutes/SavedRouteDetailViewModelTests.swift
  TEST_FUNCTION: test_savedRouteDetail_deleteConfirm_callsMutation_andNavigatesBack

AC-5: Not-found result renders LSEmptyState with Back action
  GIVEN: Stub `getSavedRouteDetail(savedRouteId: "sr-missing")` returns nil
  WHEN:  SavedRouteDetailContainer mounts
  THEN:  The screen renders an LSEmptyState with title "Route not found", body "This route may have been deleted.", and primary action labeled "Back to saved" that invokes the supplied `onDeleted` closure (back navigation) per ui-design.md §1.E `not-found` row

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/SavedRoutes/SavedRouteDetailScreenTests.swift
  TEST_FUNCTION: test_savedRouteDetail_notFound_rendersEmptyStateBack

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

- TC-1 (maps_to_ac AC-1): viewState.routeTitle == "Skyline Spine"; weather entries empty when snapshot has none.
- TC-2 (maps_to_ac AC-2): isRenameSheetPresented and isDeleteModalPresented flip on respective taps; rename sheet field pre-populates with current name; modal copy matches §1.E.
- TC-3 (maps_to_ac AC-3): createPlanningSessionCalls.count == 1 with firstMessage seed; onSessionCreated closure invoked with returned sessionId.
- TC-4 (maps_to_ac AC-4): softDeleteRouteCalls.count == 1; onDeleted closure invoked.
- TC-5 (maps_to_ac AC-5): With nil result, LSEmptyState in hierarchy with title "Route not found".

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Features/SavedRoutes/SavedRouteDetailScreen.swift (NEW — wraps RouteDetailsScreen with toolbar overrides + Plan-again action row)
- ios/LaneShadow/Features/SavedRoutes/SavedRouteDetailContainer.swift (NEW — owns viewModel, mounts screen, handles navigation closures)
- ios/LaneShadow/Features/SavedRoutes/SavedRouteDetailViewModel.swift (NEW — `@MainActor @Observable` VM)
- ios/LaneShadow/Features/SavedRoutes/SavedRouteDetailViewState.swift (NEW — adapter struct that converts SavedRouteDetailView → RouteDetailsViewState)
- ios/LaneShadow/Services/ConvexClient+LaneShadow.swift (MODIFY — add `getSavedRouteDetail(savedRouteId:)` query helper + `getSavedRouteDetail` enum case in LaneShadowConvexQuery)
- ios/LaneShadowTests/Features/SavedRoutes/SavedRouteDetailScreenTests.swift (NEW — view-level tests for AC-5)
- ios/LaneShadowTests/Features/SavedRoutes/SavedRouteDetailViewModelTests.swift (NEW — VM tests for AC-1..4)
- ios/LaneShadowTests/Helpers/StubLaneShadowConvexClient.swift (MODIFY — add savedRouteDetail stub surface; reuse softDeleteRoute/createPlanningSession surfaces from prior tasks)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated; edit ios/project.yml + run scripts/ios/generate-project.sh
- ios/LaneShadow/Generated/** — generated by scripts/generate-mobile-types.ts
- ios/LaneShadow/Sandbox/MockProviders/** — sandbox stories keep their MockProviders
- ios/LaneShadow/Services/RideFlow.swift / ChatStore.swift / SessionStore.swift — Sprint 04 owners; read-only here
- ios/LaneShadow/Views/Templates/RouteDetailsScreen.swift — Sprint 04 (CHAT-S04-T07) owns; reuse via existing ViewState init only
- ios/LaneShadow/Features/RouteDetails/** — Sprint 04 owns; do not modify

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Reuse `RouteDetailsScreen(viewState:onSave:onRide:onDismiss:)` initializer with onSave passed as a no-op (or replaced with Plan-again wiring at the container level)
- Use `RouteDetailsViewState` adapter — a saved snapshot does not carry the runtime PlannedRouteOption shape; the adapter normalizes
- Treat the snapshot as immutable: never mutate the source view state once observed
- Use the same Rename sheet view from ROUTE-S06-T03 (import or share via an internal `SavedRouteRenameSheet` type)

⚠️ Ask First:
- If the action row in `LSRouteSheet` (existing organism) supports replacing the Save/Ride buttons with a single "Plan again" CTA without modifying the organism — if not, render the action row inline and pass an empty Save/Ride pair (defer plan-again to a separate button below the sheet) and confirm with reviewer
- If the rename sheet should be re-extracted from ROUTE-S06-T03 to a shared `Features/SavedRoutes/Shared/` directory — recommend yes, but verify the Sprint-04 placeholder isn't blocking
- If the snapshot's overviewGeometry decode requires a new polyline decoder beyond what RouteResults uses — escalate

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Features/SavedRoutes/SavedRouteDetailScreen.swift (NEW): SwiftUI wrapper around RouteDetailsScreen with toolbar Rename/Delete chips + Plan-again CTA
- ios/LaneShadow/Features/SavedRoutes/SavedRouteDetailContainer.swift (NEW): owns viewModel, mounts screen, takes `onSessionCreated(String)` and `onDeleted()` navigation closures
- ios/LaneShadow/Features/SavedRoutes/SavedRouteDetailViewModel.swift (NEW): `@MainActor @Observable` VM exposing `viewState`, `isRenameSheetPresented`, `isDeleteModalPresented`, `loadState`; methods `observe`, `presentRename`, `presentDelete`, `confirmRename`, `confirmDelete`, `handlePlanAgainTap`
- ios/LaneShadow/Features/SavedRoutes/SavedRouteDetailViewState.swift (NEW): adapter struct converting SavedRouteDetailView → RouteDetailsViewState (extracts distance/duration/elevation strings, builds empty WeatherEntry array if no overlays.weather, sets `isSaved=true`)
- ios/LaneShadow/Services/ConvexClient+LaneShadow.swift (MODIFY): add LaneShadowConvexQuery.getSavedRouteDetail enum case + typed `getSavedRouteDetail(savedRouteId:)` helper that decodes nullable SavedRouteDetailView
- ios/LaneShadowTests/Features/SavedRoutes/SavedRouteDetailScreenTests.swift (NEW): AC-5 not-found rendering test
- ios/LaneShadowTests/Features/SavedRoutes/SavedRouteDetailViewModelTests.swift (NEW): AC-1..4 VM behavior tests
- ios/LaneShadowTests/Helpers/StubLaneShadowConvexClient.swift (MODIFY): add `stubSavedRouteDetail`, `getSavedRouteDetailCalls`, and the `getSavedRouteDetail(savedRouteId:)` stub method

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

[Standard RED → GREEN → REFACTOR per AC.]

1. RED for AC-1: write VM observation test asserting viewState binding from a stub-yielded snapshot. Confirm fails because VM does not exist.
2. GREEN: implement SavedRouteDetailViewModel + SavedRouteDetailViewState adapter to pass AC-1.
3. RED → GREEN for AC-2 (toolbar flags), AC-3 (plan again), AC-4 (delete confirm), AC-5 (not-found) in order.
4. Capture RED replay output to `.tmp/ROUTE-S06-T05/red-{ac}-output.txt` per AC.
5. REFACTOR: ensure the SavedRouteDetailViewState adapter is pure (struct + static factory function takes SavedRouteDetailView, returns RouteDetailsViewState) so it is fully unit-testable; ensure swiftformat lint passes.
6. Run the full evidence gate sequence (test, build, lint, token-check, snapshots:check, scope diff).

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/architecture/ui-design.md [PRIMARY PATTERN]
   - Lines: 196-225
   - Focus: §1.E SavedRouteDetailScreen variant — saved-mode action row, weather-timeline gating, Rename + Delete chips, not-found state

2. ios/LaneShadow/Views/Templates/RouteDetailsScreen.swift
   - Lines: 41-55, 89-109, 187-209
   - Focus: ViewState-driven init (line 42-55) + viewStateBody + viewStateRouteSheet — reuse without modification

3. ios/LaneShadow/Features/RouteDetails/RouteDetailsViewModel.swift
   - Lines: 1-100
   - Focus: Pattern reference for `@MainActor @Observable` VM; mirror but for saved snapshot source

4. .spec/prds/v3-integration/06-uc-route.md
   - Lines: 56-94
   - Focus: UC-ROUTE-03 + UC-ROUTE-04 acceptance criteria — every AC bullet must trace to one of this task's ACs

5. convex/db/savedRoutes.ts
   - Lines: 385-475
   - Focus: getSavedRouteDetail return validator + softDeleteRoute + renameRoute exact arg signatures

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence — TDD_STATE history per AC saved to `.tmp/ROUTE-S06-T05/red-{ac}-output.txt`
Gate 2: All tests pass — xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test (Exit 0)
Gate 3: Build — xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build (Exit 0)
Gate 4: Lint — swiftformat --lint ios/ (Exit 0)
Gate 5: Token compliance — scripts/tokens/enforce-native-compliance.sh (Exit 0)
Gate 6: Sandbox snapshots still pass — pnpm snapshots:check (Exit 0)
Gate 7: Scope compliance — git diff --name-only ⊆ writeAllowed
Per-AC verification: xcodebuild ... test -only-testing:LaneShadowTests/SavedRouteDetailViewModelTests/{test_function_name}

--------------------------------------------------------------------------------
REVIEW
--------------------------------------------------------------------------------

Must pass:
- All 5 ACs verified via per-AC test commands
- Token compliance (no hex literals; only `theme.*` / `LaneShadowTheme.color.*`)
- writeAllowed/writeProhibited respected (git diff verifies)
- Reuses RouteDetailsScreen template (no new template invented)

Should verify:
- The "Plan again" CTA is exactly one full-width primary button (not a Save/Ride pair)
- Weather timeline is hidden when snapshot has no cached weather (do not fabricate stale entries)
- Delete modal copy matches §1.E exactly: title "Delete this route?", body "This will move it to recently deleted for 30 days."
- Verdict: PENDING

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ROUTE-S06-T03 (SavedRoutesListScreen tap → detail), ROUTE-S06-T01 (saveRoute persists what this screen reads), CHAT-S04-T07 (RouteDetailsScreen ViewState init), AUTH-S03-T03 (ConvexClient+LaneShadow base)
Blocks: Sprint 07 (Map deep-linking from saved-route URL)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "ROUTE-S06-T05",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "Screen hydrates from saved snapshot via getSavedRouteDetail", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRouteDetailViewModelTests/test_savedRouteDetail_hydratesViewState_fromSnapshot", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "Toolbar Rename + Delete chips open rename sheet and delete modal", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRouteDetailViewModelTests/test_savedRouteDetail_toolbarActions_presentRenameAndDeleteFlows", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "Plan again calls createSession with seeded firstMessage and routes to session", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRouteDetailViewModelTests/test_savedRouteDetail_planAgain_createsSessionAndRoutes", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "Delete confirmation calls softDeleteRoute and navigates back", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRouteDetailViewModelTests/test_savedRouteDetail_deleteConfirm_callsMutation_andNavigatesBack", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "Not-found result renders LSEmptyState with Back action", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRouteDetailScreenTests/test_savedRouteDetail_notFound_rendersEmptyStateBack", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "viewState fields equal expected derivations from SavedRouteDetailView fixture; weather hidden when snapshot lacks overlays.weather.", "maps_to_ac": "AC-1", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRouteDetailViewModelTests/test_savedRouteDetail_hydratesViewState_fromSnapshot", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Toolbar tap toggles isRenameSheetPresented / isDeleteModalPresented; rename field pre-populated with current name.", "maps_to_ac": "AC-2", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRouteDetailViewModelTests/test_savedRouteDetail_toolbarActions_presentRenameAndDeleteFlows", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "createPlanningSessionCalls.count == 1 with firstMessage seed; onSessionCreated closure invoked with sessionId.", "maps_to_ac": "AC-3", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRouteDetailViewModelTests/test_savedRouteDetail_planAgain_createsSessionAndRoutes", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "softDeleteRouteCalls.count == 1; onDeleted closure invoked once; isDeleteModalPresented becomes false.", "maps_to_ac": "AC-4", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRouteDetailViewModelTests/test_savedRouteDetail_deleteConfirm_callsMutation_andNavigatesBack", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "Nil result yields LSEmptyState with title 'Route not found' and primary action label 'Back to saved'.", "maps_to_ac": "AC-5", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRouteDetailScreenTests/test_savedRouteDetail_notFound_rendersEmptyStateBack", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
