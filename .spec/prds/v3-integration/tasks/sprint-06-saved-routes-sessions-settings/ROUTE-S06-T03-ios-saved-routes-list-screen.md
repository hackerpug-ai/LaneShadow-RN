================================================================================
TASK: ROUTE-S05-T03 - iOS SavedRoutesListScreen — paginated list + search + swipe-delete + undo + rename
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

PROGRESS: 0/7 AC

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

A new SavedRoutesListScreen subscribes to `db.savedRoutes.getSavedRoutesList`, renders LSListRow rows with search, pull-to-refresh, swipe-to-delete + undo toast, and rename via inline sheet.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST add a typed Convex helper `subscribeToSavedRoutesList(searchQuery:)` to `ConvexClient+LaneShadow.swift` (yielding the typed list view shape) — no raw string endpoint calls
- MUST render zero state via existing `LSEmptyState` molecule with action "Plan a ride" routing to Home/Idle (UC-ROUTE-02 §AC) — no new empty-state components
- MUST implement swipe-to-delete using SwiftUI `.swipeActions` calling `softDeleteRoute` mutation, with optimistic removal followed by an LSToast "Route deleted" carrying an "Undo" action button visible for 5 seconds; undo calls `undoDeleteRoute` and re-inserts the row at its prior position (UC-ROUTE-04 §AC)
- MUST implement rename via `LSBottomSheet(detent: .small)` containing `LSFormField(label: "Route name", value: $name)` + Save / Cancel buttons calling `renameRoute` (per ui-design.md §1.E rename flow — same flow used here)
- MUST debounce `searchQuery` mutations to ~250ms and re-subscribe with the new arg when the user pauses typing — never fire a new subscription per keystroke
- MUST preserve token compliance — no hardcoded color literals; only `theme.*` and semantic typography variants
- NEVER call internal-only mutations like `internalSavedRoutes.*` — only public `db.savedRoutes.*` from the technical-requirements §API table
- NEVER touch ios/LaneShadow.xcodeproj/** directly — generated; edit ios/project.yml + run scripts/ios/generate-project.sh
- NEVER modify ios/LaneShadow/Generated/** — types come from server/scripts/generate-mobile-types.ts
- NEVER modify Sprint-04 services (RideFlow.swift / ChatStore.swift / SessionStore.swift) — read-only inputs
- STRICTLY use the LSListRow leading `.icon` slot for placeholder thumbnail — defer the LSMap-based polyline thumbnail to a follow-up task; using LSMap inside a List row is performance-sensitive and not in this task's scope

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Screen subscribes to `db.savedRoutes.getSavedRoutesList` and renders rows with name + distance + saved-at date (AC-1 PRIMARY)
- [ ] Search field filters via re-subscription with `searchQuery` after 250ms debounce (AC-2)
- [ ] Pull-to-refresh re-fetches the subscription (AC-3)
- [ ] Swipe-to-delete optimistically removes the row, calls `softDeleteRoute`, and shows the undo toast (AC-4)
- [ ] Tap "Undo" in toast within 5s calls `undoDeleteRoute` and restores the row (AC-5)
- [ ] Rename sheet calls `renameRoute` and updates the row name with optimistic update (AC-6)
- [ ] Empty result + no search renders LSEmptyState with primary action "Plan a ride" (AC-7)
- [ ] Tests pass + build clean
- [ ] Scope compliance — git diff --name-only ⊆ writeAllowed

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Screen subscribes and renders saved routes ordered by save date [PRIMARY]
  GIVEN: Stub `subscribeToSavedRoutesList` yields three SavedRoutesListView entries [{name:"Skyline Spine", createdAt:T-1d, ...}, {name:"Coastal Loop", createdAt:T-2d, ...}, {name:"Inland Twist", createdAt:T-7d, ...}] (server orders desc by createdAt)
  WHEN:  SavedRoutesListScreen mounts and the viewModel's observation task runs
  THEN:  The list renders three LSListRow instances in order [Skyline Spine, Coastal Loop, Inland Twist]; each row shows the name (title), the distance + duration string (subtitle), and a saved-at relative date label

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/SavedRoutes/SavedRoutesListViewModelTests.swift
  TEST_FUNCTION: test_savedRoutesList_subscribes_andRendersRowsInServerOrder

AC-2: Search query debounces and re-subscribes
  GIVEN: User types "sky" into the search LSFormField; debounce window is 250ms
  WHEN:  The user pauses for ≥250ms after the final keystroke
  THEN:  StubLaneShadowConvexClient.savedRoutesListSubscriptionArgs ends with one entry containing `searchQuery: "sky"`; multi-keystroke typing within the debounce window does NOT cause more than 1 subscription per pause; the resulting list yields rows filtered by the stub's queryArgs

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/SavedRoutes/SavedRoutesListViewModelTests.swift
  TEST_FUNCTION: test_savedRoutesList_searchQuery_debouncesAndResubscribes

AC-3: Pull-to-refresh re-fetches subscription
  GIVEN: List currently shows 3 rows; user pulls to refresh
  WHEN:  The viewModel's `refresh()` is invoked from `.refreshable`
  THEN:  StubLaneShadowConvexClient.savedRoutesListSubscriptionCalls increments by 1; if the stub yields a new payload of 5 rows, the list updates to show 5 rows after the await completes

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/SavedRoutes/SavedRoutesListViewModelTests.swift
  TEST_FUNCTION: test_savedRoutesList_pullToRefresh_resubscribes

AC-4: Swipe-to-delete optimistically removes + calls softDeleteRoute + shows undo toast
  GIVEN: List rendered with 3 rows; user swipes "Skyline Spine" and taps the destructive Delete swipe action
  WHEN:  The .swipeActions handler invokes `viewModel.delete(id: "sr-1")`
  THEN:  The row is removed from the rendered list immediately (optimistic update — viewModel.routes.count == 2); StubLaneShadowConvexClient.softDeleteRouteCalls contains exactly one entry with `savedRouteId: "sr-1"`; viewModel.toastBinding.message == "Route deleted" and toastBinding.actionLabel == "Undo"; toast variant is .default per ui-design.md §1.D swipe-to-delete row

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/SavedRoutes/SavedRoutesListViewModelTests.swift
  TEST_FUNCTION: test_savedRoutesList_swipeDelete_optimisticallyRemovesAndShowsUndo

AC-5: Undo within 5s calls undoDeleteRoute and restores row
  GIVEN: AC-4 just fired; the undo toast is visible; user taps "Undo" within 5 seconds
  WHEN:  The toast's action handler invokes `viewModel.undoDelete(id: "sr-1")`
  THEN:  StubLaneShadowConvexClient.undoDeleteRouteCalls contains exactly one entry with `savedRouteId: "sr-1"`; viewModel.routes count restores to 3; the restored row is at its previous index; toast dismisses

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/SavedRoutes/SavedRoutesListViewModelTests.swift
  TEST_FUNCTION: test_savedRoutesList_undoTap_callsUndoAndRestoresRow

AC-6: Rename sheet calls renameRoute and updates name optimistically
  GIVEN: User opens the rename action from the row's swipe menu; the rename LSBottomSheet is presented with current name "Skyline Spine"
  WHEN:  User edits the field to "Skyline Highline" and taps Save
  THEN:  StubLaneShadowConvexClient.renameRouteCalls contains exactly one entry with `savedRouteId: "sr-1", name: "Skyline Highline"`; viewModel.routes[index].name == "Skyline Highline" optimistically; on stub failure, the name reverts to "Skyline Spine" and an error toast surfaces with variant .error

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/SavedRoutes/SavedRoutesListViewModelTests.swift
  TEST_FUNCTION: test_savedRoutesList_rename_callsMutation_optimisticAndRevertsOnFailure

AC-7: Empty result with no search shows LSEmptyState
  GIVEN: Stub yields an empty `SavedRoutesListView{routes:[]}` with no active search query
  WHEN:  SavedRoutesListScreen mounts
  THEN:  The screen renders an LSEmptyState with title "No saved routes yet", body "Save a ride from the route details screen to see it here.", and action label "Plan a ride"; tapping the action invokes the supplied `onNavigateHome` closure exactly once

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/SavedRoutes/SavedRoutesListScreenTests.swift
  TEST_FUNCTION: test_savedRoutesList_zeroResult_rendersEmptyState

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

- TC-1 (maps_to_ac AC-1): viewModel.routes contains 3 entries in server order after stub yield.
- TC-2 (maps_to_ac AC-2): Within 250ms of last keystroke, a single re-subscription with searchQuery="sky" is observed.
- TC-3 (maps_to_ac AC-3): refresh() invokes the subscription path one additional time and surfaces the new payload.
- TC-4 (maps_to_ac AC-4): After delete tap, viewModel.routes.count is 2, softDeleteRouteCalls.count == 1, toast binding shows "Route deleted" + "Undo".
- TC-5 (maps_to_ac AC-5): undoDelete tap fires undoDeleteRouteCalls.count == 1, viewModel.routes.count restores to 3, prior index preserved.
- TC-6 (maps_to_ac AC-6): rename tap fires renameRouteCalls.count == 1; on success, name updates; on failure, name reverts.
- TC-7 (maps_to_ac AC-7): With routes=[] and no searchQuery, the LSEmptyState is in the rendered hierarchy with the expected title/body/action label.

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Features/SavedRoutes/SavedRoutesListScreen.swift (NEW — SwiftUI screen)
- ios/LaneShadow/Features/SavedRoutes/SavedRoutesListContainer.swift (NEW — owns viewModel, mounts screen)
- ios/LaneShadow/Features/SavedRoutes/SavedRoutesListViewModel.swift (NEW — `@MainActor @Observable` VM)
- ios/LaneShadow/Features/SavedRoutes/SavedRouteRenameSheet.swift (NEW — small bottom sheet for inline rename)
- ios/LaneShadow/Services/ConvexClient+LaneShadow.swift (MODIFY — add query/mutation enum cases for getSavedRoutesList, softDeleteRoute, undoDeleteRoute, renameRoute + typed `subscribeToSavedRoutesList`, `softDeleteRoute`, `undoDeleteRoute`, `renameRoute` helpers)
- ios/LaneShadowTests/Features/SavedRoutes/SavedRoutesListScreenTests.swift (NEW — view-level tests)
- ios/LaneShadowTests/Features/SavedRoutes/SavedRoutesListViewModelTests.swift (NEW — VM tests)
- ios/LaneShadowTests/Helpers/StubLaneShadowConvexClient.swift (MODIFY — add savedRoutesList subscription stub + delete/undo/rename mutation stubs)
- ios/LaneShadow/Services/LaneShadowSavedRoutesProtocol.swift (NEW — protocol extracted for testable mocking; the screen depends on this protocol; conformance is added to LaneShadowConvexClient via extension)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated; edit ios/project.yml + run scripts/ios/generate-project.sh
- ios/LaneShadow/Generated/** — generated by server/scripts/generate-mobile-types.ts
- ios/LaneShadow/Sandbox/MockProviders/** — sandbox stories keep their MockProviders
- ios/LaneShadow/Services/RideFlow.swift / ChatStore.swift / SessionStore.swift — Sprint 04 owners; read-only here
- ios/LaneShadow/Views/Templates/** — existing templates owned by their respective tasks
- ios/LaneShadow/Views/Molecules/LSListRow.swift / LSEmptyState.swift / LSToast.swift / LSBottomSheet.swift / LSFormField.swift — primitives; reuse only

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Reuse `LSListRow(leading: .icon(.bookmark), title: name, subtitle: subtitle, trailing: .chevron, onTap: …)` for rows
- Use `.swipeActions(edge: .trailing, allowsFullSwipe: false)` to expose Rename + Delete buttons
- Trim search input with `.trimmingCharacters(in: .whitespacesAndNewlines)` before issuing a subscription
- Cancel the previous observation task before starting a new one (search debounce, refresh)

⚠️ Ask First:
- If the LSMap-thumbnail per row is mandatory in this task (ui-design.md §1.D recommends it; we are deferring to keep performance scope tight) — confirm before pulling LSMap into list rows
- If swipe-to-delete should require a confirmation modal first (current spec says optimistic delete + undo toast — no confirm modal)
- If the `routePreview.distanceMiles` field name in the typed list-view payload differs from what the helper expects — escalate to type-gen
- If the screen needs to support dynamic pagination (cursor + infinite scroll) — UC-ROUTE-02 mentions paginated query but acceptance criteria only require pull-to-refresh and search; defer infinite scroll to a follow-up unless the type signature already requires cursor handling

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Features/SavedRoutes/SavedRoutesListScreen.swift (NEW): SwiftUI screen composing LSTopBar + search field + ScrollView of LSListRow + LSEmptyState + LSToast wiring
- ios/LaneShadow/Features/SavedRoutes/SavedRoutesListContainer.swift (NEW): Authenticated wrapper, owns viewModel
- ios/LaneShadow/Features/SavedRoutes/SavedRoutesListViewModel.swift (NEW): `@MainActor @Observable` VM exposing `routes`, `searchQuery`, `loadState`, `toastState`, `renameSheetState`; methods `observe`, `refresh`, `setSearchQuery`, `delete`, `undoDelete`, `presentRenameSheet`, `submitRename`
- ios/LaneShadow/Features/SavedRoutes/SavedRouteRenameSheet.swift (NEW): Small bottom sheet body for rename
- ios/LaneShadow/Services/LaneShadowSavedRoutesProtocol.swift (NEW): Protocol with `subscribeToSavedRoutesList`, `softDeleteRoute`, `undoDeleteRoute`, `renameRoute`; conformance on LaneShadowConvexClient
- ios/LaneShadow/Services/ConvexClient+LaneShadow.swift (MODIFY): add query/mutation enum cases + typed helpers (each helper decodes the typed payload from Generated/ConvexTypes.generated.swift — types like SavedRoutesDocument already exist)
- ios/LaneShadowTests/Features/SavedRoutes/SavedRoutesListScreenTests.swift (NEW): view-level tests for AC-1 + AC-7
- ios/LaneShadowTests/Features/SavedRoutes/SavedRoutesListViewModelTests.swift (NEW): VM tests for AC-2..6
- ios/LaneShadowTests/Helpers/StubLaneShadowConvexClient.swift (MODIFY): add subscribeToSavedRoutesList continuation, savedRoutesListSubscriptionCalls, softDeleteRouteCalls, undoDeleteRouteCalls, renameRouteCalls, stub error fields

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

[Standard RED → GREEN → REFACTOR per AC.]

1. RED for AC-1: write the VM observation test first; confirm it fails because the VM type doesn't exist.
2. GREEN: implement the minimum viewModel + container that subscribes and renders.
3. RED → GREEN for AC-2 (debounce), AC-3 (refresh), AC-4 (delete + toast), AC-5 (undo), AC-6 (rename), AC-7 (empty state) in order.
4. Capture RED replay output to `.tmp/ROUTE-S05-T03/red-{ac}-output.txt` per AC.
5. REFACTOR: extract the rename sheet to its own SwiftUI file once green; ensure swipe-action accessibility hint matches ui-design.md §1.D — "Double-tap to view route, swipe right with three fingers to delete".
6. Verify token compliance — every color resolves through `theme.*` or `LaneShadowTheme.color.*`.
7. Run the full evidence gate sequence (test, build, lint, token-check, snapshots:check, scope diff).

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/architecture/ui-design.md [PRIMARY PATTERN]
   - Lines: 148-192
   - Focus: §1.D SavedRoutesListScreen composition + swipe-to-delete + empty state + accessibility

2. ios/LaneShadow/Views/Molecules/LSListRow.swift
   - Lines: 1-100
   - Focus: Row composition API (leading, title, subtitle, trailing, onTap) — reuse without modification

3. .spec/prds/v3-integration/06-uc-route.md
   - Lines: 38-94
   - Focus: UC-ROUTE-02, UC-ROUTE-04 acceptance criteria — every AC bullet must trace to one of this task's ACs

4. server/convex/db/savedRoutes.ts
   - Lines: 327-477
   - Focus: getSavedRoutesList, getSavedRouteDetail, saveRoute, renameRoute, softDeleteRoute, undoDeleteRoute exact arg + return signatures

5. ios/LaneShadow/Services/ConvexClient+LaneShadow.swift
   - Lines: 1-30 + 644-668
   - Focus: Existing typed wrapper enum + helper pattern (e.g., `subscribeToRouteEnrichments`, `getRouteIndexFingerprint`) — match the pattern for new helpers

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence — TDD_STATE history per AC saved to `.tmp/ROUTE-S05-T03/red-{ac}-output.txt`
Gate 2: All tests pass — xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test (Exit 0)
Gate 3: Build — xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build (Exit 0)
Gate 4: Lint — swiftformat --lint ios/ (Exit 0)
Gate 5: Token compliance — scripts/tokens/enforce-native-compliance.sh (Exit 0)
Gate 6: Sandbox snapshots still pass — pnpm snapshots:check (Exit 0)
Gate 7: Scope compliance — git diff --name-only ⊆ writeAllowed
Per-AC verification: xcodebuild ... test -only-testing:LaneShadowTests/SavedRoutesListViewModelTests/{test_function_name}

--------------------------------------------------------------------------------
REVIEW
--------------------------------------------------------------------------------

Must pass:
- All 7 ACs verified via per-AC test commands
- Token compliance (no hex literals; only `theme.*` / `LaneShadowTheme.color.*`)
- writeAllowed/writeProhibited respected (git diff verifies)
- Accessibility hint on rows reads "Double-tap to view route, swipe right with three fingers to delete" (per ui-design.md §1.D)

Should verify:
- Rename sheet auto-focuses the field on present and pre-populates with the current name
- Search debounce window is exactly 250ms
- Empty state action button is the LSEmptyState's primary slot, not a separate button
- 5-second undo toast window is enforced via Task.sleep — undo tap before the timeout calls undoDeleteRoute
- Verdict: PENDING

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ROUTE-S05-T01 (saveRoute persists what this screen reads), AUTH-S03-T03 (ConvexClient+LaneShadow base), CHAT-S04-T07 (RouteDetails wiring — the entry point users come from)
Blocks: ROUTE-S05-T05 (SavedRouteDetailScreen — list rows tap into detail), Sprint 06 (Map / Offline)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "ROUTE-S05-T03",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "Screen subscribes and renders saved routes ordered by save date", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRoutesListViewModelTests/test_savedRoutesList_subscribes_andRendersRowsInServerOrder", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "Search query debounces and re-subscribes", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRoutesListViewModelTests/test_savedRoutesList_searchQuery_debouncesAndResubscribes", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "Pull-to-refresh re-fetches subscription", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRoutesListViewModelTests/test_savedRoutesList_pullToRefresh_resubscribes", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "Swipe-to-delete optimistically removes + calls softDeleteRoute + shows undo toast", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRoutesListViewModelTests/test_savedRoutesList_swipeDelete_optimisticallyRemovesAndShowsUndo", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "Undo within 5s calls undoDeleteRoute and restores row", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRoutesListViewModelTests/test_savedRoutesList_undoTap_callsUndoAndRestoresRow", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "Rename sheet calls renameRoute and updates name optimistically", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRoutesListViewModelTests/test_savedRoutesList_rename_callsMutation_optimisticAndRevertsOnFailure", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-7", "type": "acceptance_criterion", "description": "Empty result with no search shows LSEmptyState", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRoutesListScreenTests/test_savedRoutesList_zeroResult_rendersEmptyState", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "viewModel.routes equals stub-yielded array, in server order.", "maps_to_ac": "AC-1", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRoutesListViewModelTests/test_savedRoutesList_subscribes_andRendersRowsInServerOrder", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Search keystrokes within 250ms produce 1 subscription with the final searchQuery.", "maps_to_ac": "AC-2", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRoutesListViewModelTests/test_savedRoutesList_searchQuery_debouncesAndResubscribes", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "refresh() increments savedRoutesListSubscriptionCalls by 1.", "maps_to_ac": "AC-3", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRoutesListViewModelTests/test_savedRoutesList_pullToRefresh_resubscribes", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "After delete: routes.count -= 1; softDeleteRouteCalls.count == 1; toast binding shows undo action.", "maps_to_ac": "AC-4", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRoutesListViewModelTests/test_savedRoutesList_swipeDelete_optimisticallyRemovesAndShowsUndo", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "After undo tap: undoDeleteRouteCalls.count == 1; routes restored at prior index.", "maps_to_ac": "AC-5", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRoutesListViewModelTests/test_savedRoutesList_undoTap_callsUndoAndRestoresRow", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "After rename: renameRouteCalls.count == 1; name updates optimistically; reverts on stub failure.", "maps_to_ac": "AC-6", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRoutesListViewModelTests/test_savedRoutesList_rename_callsMutation_optimisticAndRevertsOnFailure", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-7", "type": "test_criterion", "description": "With empty routes and no search, LSEmptyState appears with title='No saved routes yet' and action='Plan a ride'.", "maps_to_ac": "AC-7", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SavedRoutesListScreenTests/test_savedRoutesList_zeroResult_rendersEmptyState", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
