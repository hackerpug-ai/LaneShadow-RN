================================================================================
TASK: ROUTE-S05-T04 - Android SavedRoutesListScreen — paginated list + search + long-press delete + undo + inline rename
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

PROGRESS: 0/7 AC

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

A rider opens "Saved Routes" from the hamburger drawer, sees a paginated list of saved routes with polyline thumbnails ordered by save date, can search/refresh, long-press to rename or soft-delete, and tap Undo on the toast within ~5s to restore.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST subscribe to `db.savedRoutes.getSavedRoutesList({searchQuery?, limit, beforeDate?})` via SavedRouteRepository.subscribeToSavedRoutesList(searchQuery, limit, beforeDate) returning `Flow<SavedRoutesPage>` with cursor pagination
- MUST compose each row from existing V2 atoms/molecules — LSListRow leading=compact LSMap (mode=Preview, polylines=[snapshot.polyline]) + center title/subtitle + LSPill scenic-score; zero new primitives
- MUST render LSEmptyState (icon=bookmark, title="No saved routes yet", body="Save a ride from the route details screen to see it here.", primary action="Plan a ride" routes to Route.Home) when the list is empty AND searchQuery is blank
- MUST render a filtered-empty variant (icon=search, title="No matches", body="Try adjusting your search.", ghost action="Clear search") when searchQuery is non-blank and results are empty
- MUST trigger long-press menu via `Modifier.combinedClickable(onLongClick = ...)` opening an LSBottomSheet (detent=Small) with three rows: Open / Rename / Delete (Open=primary tap target, Rename=opens inline LSFormField sheet, Delete=destructive)
- MUST wire Delete to `SavedRouteRepository.softDeleteRoute(savedRouteId)` with optimistic remove + LSToast(message="Route deleted", actionLabel="Undo") visible for ~5000ms; tap Undo invokes `undoDeleteRoute(savedRouteId)`
- MUST wire Rename to `SavedRouteRepository.renameRoute(savedRouteId, newName)` with optimistic update on the visible row; revert on failure via inline error toast
- MUST debounce searchQuery input by 250ms via Flow `debounce` operator before re-subscribing
- MUST trigger pagination by emitting a "load-more" intent when the LazyColumn approaches the last page item (lastVisibleIndex >= items.size - 5); next page uses `beforeDate = lastVisibleRow.createdAt - 1`
- MUST provide pull-to-refresh via `androidx.compose.material.pullrefresh` (Material 3 PullToRefreshBox) re-triggering the subscription
- NEVER hardcode color/typography literals — all surfaces resolve through `LocalLaneShadowTheme.current`
- NEVER block rendering on the polyline thumbnail — decode polylines on `Dispatchers.Default` and emit `PolylineData` through the StateFlow; show `LSPanel` placeholder while pending
- NEVER touch `services/RideFlowReducer.kt`, `services/ChatViewModel.kt`, or `services/AppStateRepository.kt` — Sprint 04 inputs are read-only here
- STRICTLY use `combinedClickable` for the long-press affordance — do NOT introduce `pointerInput` from scratch (accessibility regressions)

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] List subscribes to db.savedRoutes.getSavedRoutesList and renders rows ordered by createdAt desc (AC-1 PRIMARY)
- [ ] Search field debounced 250ms drives re-subscription with searchQuery (AC-2)
- [ ] Long-press opens action sheet with Open / Rename / Delete (AC-3)
- [ ] Delete invokes softDeleteRoute + emits LSToast with Undo action; Undo invokes undoDeleteRoute (AC-4)
- [ ] Rename via inline LSFormField sheet invokes renameRoute with optimistic update (AC-5)
- [ ] Empty state + filtered-empty state render correctly (AC-6)
- [ ] Pull-to-refresh re-fetches and pagination loads next page on scroll (AC-7)
- [ ] gradlew test + compileDebugKotlin clean
- [ ] Sandbox stories untouched + snapshots:check green
- [ ] TDD RED evidence per AC

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: List subscribes to getSavedRoutesList and orders by createdAt desc [PRIMARY]
  GIVEN: A SavedRoutesListViewModel and a fake SavedRouteRepository.subscribeToSavedRoutesList emitting a SavedRoutesPage with three rows {("r1", createdAt=300), ("r2", createdAt=200), ("r3", createdAt=100)} unsorted
  WHEN:  viewModel.state is collected
  THEN:  First Loaded emission has rows in order [r1, r2, r3] (createdAt desc), each with name + distanceKm + savedAtRelative + scenicScore + polyline decoded into PolylineData

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/savedroutes/SavedRoutesListViewModelTest.kt
  TEST_FUNCTION: state_subscribesToList_ordersByCreatedAtDesc

AC-2: Search query debounced 250ms drives re-subscription
  GIVEN: A SavedRoutesListViewModel with a fake SavedRouteRepository capturing every subscribeToSavedRoutesList call's searchQuery argument, and a TestDispatcher virtual time clock
  WHEN:  viewModel.onSearchQueryChange("sky") then 100ms later onSearchQueryChange("skyl") then 300ms later collected
  THEN:  Repository was called exactly twice with searchQuery values [null, "skyl"] — the intermediate "sky" was elided by the 250ms debounce

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/savedroutes/SavedRoutesListViewModelTest.kt
  TEST_FUNCTION: onSearchQueryChange_debounces250ms_beforeReSubscribe

AC-3: Long-press opens action sheet with Open / Rename / Delete
  GIVEN: A composed SavedRoutesListScreen mounted with one saved row tagged "saved-row-r1"
  WHEN:  the rider performs a long-press gesture on `saved-row-r1`
  THEN:  An LSBottomSheet appears with three rows tagged `saved-row-action-open`, `saved-row-action-rename`, `saved-row-action-delete`; each carries a contentDescription readable by TalkBack

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/savedroutes/SavedRoutesListScreenTest.kt
  TEST_FUNCTION: longPress_row_opensActionSheetWithOpenRenameDelete

AC-4: Delete invokes softDeleteRoute + Undo restores via undoDeleteRoute
  GIVEN: A SavedRoutesListViewModel with rows [r1, r2] and a fake SavedRouteRepository whose softDeleteRoute returns Result.success(Unit) and undoDeleteRoute returns Result.success(Unit)
  WHEN:  viewModel.onDeleteTapped("r1") is invoked, then viewModel.onUndoTapped("r1") within 5000ms
  THEN:  Optimistic emission immediately removes "r1" from rows; softDeleteRoute("r1") was called once; events SharedFlow emitted SavedRoutesEvent.ToastUndo("r1", expiresAtMillis=now+5000); after onUndoTapped, undoDeleteRoute("r1") was called once and a subsequent emission re-includes "r1"

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/savedroutes/SavedRoutesListViewModelTest.kt
  TEST_FUNCTION: onDeleteTapped_thenOnUndoTapped_invokesSoftDeleteThenUndoAndRestoresRow

AC-5: Rename via inline LSFormField sheet invokes renameRoute with optimistic update
  GIVEN: A SavedRoutesListViewModel with row r1 currently named "Old Name", and a fake SavedRouteRepository.renameRoute returning Result.success(Unit)
  WHEN:  viewModel.onRenameSubmitted("r1", "New Name") is invoked
  THEN:  Optimistic emission immediately updates r1.name to "New Name"; renameRoute("r1", "New Name") was called once; on success the row remains "New Name"

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/savedroutes/SavedRoutesListViewModelTest.kt
  TEST_FUNCTION: onRenameSubmitted_invokesRenameRouteWithOptimisticUpdate

AC-6: Empty + filtered-empty states render correctly
  GIVEN: A SavedRoutesListViewModel where the fake repository emits an empty SavedRoutesPage; first with searchQuery=null, then with searchQuery="zz"
  WHEN:  state is collected
  THEN:  First Loaded has emptyState=EmptyVariant.NoRoutes (title resolves to `R.string.saved_routes_empty_title`); on the second emission emptyState=EmptyVariant.NoMatches (title resolves to `R.string.saved_routes_no_matches_title`)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/savedroutes/SavedRoutesListViewModelTest.kt
  TEST_FUNCTION: state_emptyResults_renderEmptyOrNoMatchesByQuery

AC-7: Pull-to-refresh re-fetches and pagination loads next page on scroll
  GIVEN: A SavedRoutesListViewModel with a fake repository whose first page returns 50 rows and second page (beforeDate=lastRow.createdAt-1) returns 20 more rows
  WHEN:  viewModel.onRefresh() is invoked, and then viewModel.onLoadMore() after the rider has scrolled to within 5 of the last visible row
  THEN:  The repository was called with (searchQuery=null, beforeDate=null) on refresh, and a second call with `beforeDate = 50thRow.createdAt - 1`; final emission has 70 rows total in createdAt-desc order; isPaginating=false at end

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/savedroutes/SavedRoutesListViewModelTest.kt
  TEST_FUNCTION: onRefreshThenLoadMore_paginatesUsingBeforeDateCursor

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

- TC-1 maps_to_ac=AC-1: subscribeToSavedRoutesList Flow emissions are sorted by createdAt desc and decoded polylines are non-null
- TC-2 maps_to_ac=AC-2: 250ms debounce filters intermediate keystrokes; only the latest searchQuery hits the repository
- TC-3 maps_to_ac=AC-3: long-press opens an LSBottomSheet with all three actions and accessible labels
- TC-4 maps_to_ac=AC-4: optimistic delete + Undo round-trip invokes both repository methods exactly once
- TC-5 maps_to_ac=AC-5: rename optimistic update precedes mutation completion; revert on failure
- TC-6 maps_to_ac=AC-6: empty vs no-matches differentiated by searchQuery presence
- TC-7 maps_to_ac=AC-7: pagination uses `beforeDate = lastRow.createdAt - 1` cursor (matches backend contract)

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/savedroutes/SavedRoutesListScreen.kt (NEW — top-level Composable: LSTopBar + search row + LazyColumn + empty/loading variants + bottom-sheet hosts)
- android/app/src/main/java/com/laneshadow/ui/savedroutes/SavedRoutesListRoute.kt (NEW — route entry, hiltViewModel injection, NavController wiring)
- android/app/src/main/java/com/laneshadow/ui/savedroutes/SavedRoutesListViewModel.kt (NEW — @HiltViewModel + @Inject)
- android/app/src/main/java/com/laneshadow/ui/savedroutes/SavedRoutesListUiState.kt (NEW — sealed interface Loading/Loaded/Error + SavedRoutesRowUiState + EmptyVariant)
- android/app/src/main/java/com/laneshadow/ui/savedroutes/SavedRoutesEvent.kt (NEW — sealed interface ToastUndo / RenameError / DeleteError)
- android/app/src/main/java/com/laneshadow/data/savedroutes/SavedRouteRepository.kt (MODIFY — add subscribeToSavedRoutesList(searchQuery, limit, beforeDate), renameRoute, softDeleteRoute, undoDeleteRoute; existing matchesFingerprint untouched)
- android/app/src/main/java/com/laneshadow/data/dto/SavedRouteDto.kt (NEW — DTO mirroring Convex savedRoutes row shape)
- android/app/src/main/java/com/laneshadow/data/savedroutes/SavedRoutesPage.kt (NEW — domain page model: rows + nextBeforeDate)
- android/app/src/main/java/com/laneshadow/navigation/MainNavGraph.kt (MODIFY — wire `composable<Route.SavedRoutes> { SavedRoutesListRoute(...) }` replacing the placeholder HomeLeafRoute)
- android/app/src/main/res/values/strings.xml (MODIFY — add `saved_routes_*` strings for i18n)
- android/app/src/test/java/com/laneshadow/ui/savedroutes/SavedRoutesListViewModelTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/savedroutes/SavedRoutesListScreenTest.kt (NEW — Compose UI test for AC-3)

writeProhibited:
- android/app/src/main/java/com/laneshadow/services/ChatViewModel.kt — Sprint 04 input (read-only)
- android/app/src/main/java/com/laneshadow/services/RideFlowReducer.kt — Sprint 04 input (read-only)
- android/app/src/main/java/com/laneshadow/services/AppStateRepository.kt — Sprint 04 input (read-only)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSListRow.kt — V2 molecule untouched
- android/app/src/main/java/com/laneshadow/ui/molecules/LSBottomSheet.kt — V2 molecule untouched
- android/app/src/main/java/com/laneshadow/ui/molecules/LSEmptyState.kt — V2 molecule untouched
- android/app/src/main/java/com/laneshadow/ui/molecules/LSToast.kt — V2 molecule untouched
- android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt — V2 atom untouched
- android/app/src/main/java/com/laneshadow/generated/** — generated by server/scripts/generate-mobile-types.ts
- android/app/src/debug/java/com/laneshadow/sandbox/** — sandbox stories stay golden
- Any iOS file under ios/**

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use `combine(searchFlow, paginationFlow, mutationsFlow)` to derive the StateFlow with `WhileSubscribed(5_000)`
- Decode polylines on `Dispatchers.Default`; render an `LSPanel` placeholder until decoded
- Use stringResource for every visible string (i18n + accessibility)
- Use `Modifier.combinedClickable(onLongClick = ...)` for the long-press affordance
- Honor 48dp minimum touch targets (LSListRow already enforces this; do not override)
- Use `androidx.compose.material3.pulltorefresh.PullToRefreshBox` for the refresh interaction
- Map mutation throwables through ConvexErrorMapper in `services/LaneShadowErrorMapper.kt`

⚠️ Ask First:
- If the Convex `getSavedRoutesList` paginated return shape diverges from `{routes: [...], nextBeforeDate?}` (escalate to type-gen)
- If the LSMap atom emits unexpected behavior at 56×56 dp thumbnail size (Mapbox view recycling)
- If the rider should be able to multi-select rows for batch delete (out of scope; defer to v3.1 unless explicitly asked)
- If the LSPill scenic-score color tint should be derived from score range (current decision: signal.default at 22% per design § 1.D)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- SavedRoutesListScreen.kt (Composable: LSTopBar(hamburger leading, "Saved" title) + LSFormField(search) + LazyColumn(rows) + LSEmptyState variants + LSBottomSheet(action menu) + LSBottomSheet(rename) + LSToast host)
- SavedRoutesListRoute.kt (Composable entry; hiltViewModel + NavController back/menu wiring)
- SavedRoutesListViewModel.kt (@HiltViewModel; combine search + pagination + optimistic mutations into Loaded state)
- SavedRoutesListUiState.kt (sealed interface UiState + SavedRoutesRowUiState + EmptyVariant.{NoRoutes, NoMatches})
- SavedRoutesEvent.kt (sealed interface SavedRoutesEvent.{ToastUndo, RenameError, DeleteError})
- SavedRouteRepository.kt (MODIFY): add subscribeToSavedRoutesList + renameRoute + softDeleteRoute + undoDeleteRoute (mirror existing ConvexClientWithAuth wiring)
- SavedRouteDto.kt + SavedRoutesPage.kt (DTO + domain page mapping)
- MainNavGraph.kt (MODIFY): wire Route.SavedRoutes → SavedRoutesListRoute
- strings.xml (MODIFY): saved_routes_* strings
- SavedRoutesListViewModelTest.kt (RED → GREEN per AC-1, 2, 4, 5, 6, 7)
- SavedRoutesListScreenTest.kt (Compose UI test for AC-3)

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

1. RED — Write SavedRoutesListViewModelTest covering AC-1, 2, 4, 5, 6, 7 with FakeSavedRouteRepository and `kotlinx-coroutines-test` TestDispatcher; verify all fail
2. GREEN — Add SavedRoutesListUiState + SavedRoutesPage + DTO + repository extensions; build SavedRoutesListViewModel using combine+debounce+stateIn; iterate until tests pass
3. RED — Write SavedRoutesListScreenTest (Compose UI test) for AC-3 long-press menu visibility
4. GREEN — Build SavedRoutesListScreen + SavedRoutesListRoute composing V2 atoms/molecules; wire MainNavGraph; verify the UI test passes
5. REFACTOR — Extract polyline decode to a memoized helper; ensure no hardcoded color/string literals; run detekt + tokens:native-compliance + snapshots:check

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/architecture/ui-design.md [PRIMARY PATTERN]
   - Lines: 148-194
   - Focus: § 1.D SavedRoutesListScreen composition (search row, filter toolbar, LSListRow with compact LSMap thumbnail, empty + filtered-empty states, long-press menu)

2. .spec/prds/v3-integration/06-uc-route.md
   - Lines: 38-94
   - Focus: UC-ROUTE-02 + UC-ROUTE-04 acceptance criteria (search, soft-delete + undo, rename, optimistic update)

3. .spec/prds/v3-integration/architecture/android-architecture.md
   - Lines: 907-927
   - Focus: § 7.3 SavedRoutesScreen signature + repository pattern; § 7.4 detail screen relationship

4. android/app/src/main/java/com/laneshadow/data/savedroutes/SavedRouteRepository.kt
   - Lines: 1-153
   - Focus: existing ConvexClientWithAuth wiring + matchesFingerprint pattern to mirror for new methods

5. android/app/src/main/java/com/laneshadow/ui/molecules/LSListRow.kt
   - Lines: 100-200
   - Focus: LSListRow signature (leading slot variants, trailing slot variants, onTap callback) for binding row composition

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence — TDD_STATE history per AC (commit references each AC's first failing test)
Gate 2: All tests pass — `cd android && ./gradlew test` (Exit 0)
Gate 3: Per-AC verification — `cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.savedroutes.SavedRoutesListViewModelTest.{state_subscribesToList_ordersByCreatedAtDesc,onSearchQueryChange_debounces250ms_beforeReSubscribe,onDeleteTapped_thenOnUndoTapped_invokesSoftDeleteThenUndoAndRestoresRow,onRenameSubmitted_invokesRenameRouteWithOptimisticUpdate,state_emptyResults_renderEmptyOrNoMatchesByQuery,onRefreshThenLoadMore_paginatesUsingBeforeDateCursor}"` and `cd android && ./gradlew :app:connectedDebugAndroidTest --tests "com.laneshadow.ui.savedroutes.SavedRoutesListScreenTest.longPress_row_opensActionSheetWithOpenRenameDelete"`
Gate 4: Type check — `cd android && ./gradlew :app:compileDebugKotlin` (Exit 0)
Gate 5: Static analysis — `cd android && ./gradlew detekt` (Exit 0)
Gate 6: Token compliance — `scripts/tokens/enforce-native-compliance.sh` (Exit 0)
Gate 7: Sandbox snapshots untouched — `pnpm snapshots:check` (Exit 0)
Gate 8: Scope compliance — `git diff --name-only` ⊆ writeAllowed

--------------------------------------------------------------------------------
REVIEW
--------------------------------------------------------------------------------

Must pass:
- Composition strictly per § 1.D (LSTopBar + LSFormField + LSListRow rows + LSPill + LSEmptyState + LSBottomSheet menus)
- Long-press affordance via Modifier.combinedClickable (no custom pointerInput)
- 250ms debounce on search query before re-subscribing
- Pagination uses `beforeDate = lastRow.createdAt - 1` cursor
- Undo window of ~5000ms backed by a SharedFlow event with explicit expiresAtMillis
- All user strings via stringResource
- Zero hardcoded color literals

Should verify:
- TalkBack reads each row as "{name}, {distanceKm} kilometers, saved {relative}, scenic score {score}, double-tap to view, long-press for actions"
- Pull-to-refresh interaction is reachable by gesture and triggers exactly one re-subscription
- LazyColumn key=savedRouteId so optimistic delete does not flicker
- LSMap thumbnail does not crash when polyline decoding yields zero points (fall back to LSPanel placeholder)

Verdict: PENDING

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ROUTE-S05-T02 (Android SaveFavoriteSheet — produces the saved_routes rows this list reads)
Blocks: ROUTE-S05-T06 (saved-route detail screen tap target originates here), Sprint 06 (Offline + Map closure)
Paired with: ROUTE-S05-T03 (iOS SavedRoutesListScreen — share UC-ROUTE-02 + UC-ROUTE-04 ACs)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "ROUTE-S05-T04",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN repository emissions WHEN state collected THEN rows ordered by createdAt desc with decoded polylines", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutes.SavedRoutesListViewModelTest.state_subscribesToList_ordersByCreatedAtDesc", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN rapid keystrokes WHEN onSearchQueryChange called THEN repository called only after 250ms debounce", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutes.SavedRoutesListViewModelTest.onSearchQueryChange_debounces250ms_beforeReSubscribe", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN composed screen WHEN long-press row THEN action sheet with Open/Rename/Delete is visible", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.savedroutes.SavedRoutesListScreenTest.longPress_row_opensActionSheetWithOpenRenameDelete", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN delete then undo WHEN invoked within window THEN softDeleteRoute then undoDeleteRoute called and row restored", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutes.SavedRoutesListViewModelTest.onDeleteTapped_thenOnUndoTapped_invokesSoftDeleteThenUndoAndRestoresRow", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN rename submission WHEN invoked THEN renameRoute called with optimistic UI update", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutes.SavedRoutesListViewModelTest.onRenameSubmitted_invokesRenameRouteWithOptimisticUpdate", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN empty results WHEN searchQuery null vs non-blank THEN EmptyVariant.NoRoutes vs NoMatches", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutes.SavedRoutesListViewModelTest.state_emptyResults_renderEmptyOrNoMatchesByQuery", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN refresh then load-more WHEN invoked THEN repository called with beforeDate cursor", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutes.SavedRoutesListViewModelTest.onRefreshThenLoadMore_paginatesUsingBeforeDateCursor", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "List rows ordered by createdAt desc with decoded polylines", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutes.SavedRoutesListViewModelTest.state_subscribesToList_ordersByCreatedAtDesc", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Search debounce filters intermediate keystrokes", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutes.SavedRoutesListViewModelTest.onSearchQueryChange_debounces250ms_beforeReSubscribe", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "Long-press opens action sheet with all three actions and accessible labels", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.savedroutes.SavedRoutesListScreenTest.longPress_row_opensActionSheetWithOpenRenameDelete", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "Optimistic delete + Undo invokes both repository methods exactly once each", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutes.SavedRoutesListViewModelTest.onDeleteTapped_thenOnUndoTapped_invokesSoftDeleteThenUndoAndRestoresRow", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "Rename optimistic update precedes mutation completion", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutes.SavedRoutesListViewModelTest.onRenameSubmitted_invokesRenameRouteWithOptimisticUpdate", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "Empty vs no-matches differentiated by searchQuery presence", "maps_to_ac": "AC-6", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutes.SavedRoutesListViewModelTest.state_emptyResults_renderEmptyOrNoMatchesByQuery", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-7", "type": "test_criterion", "description": "Pagination uses beforeDate = lastRow.createdAt - 1 cursor", "maps_to_ac": "AC-7", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.savedroutes.SavedRoutesListViewModelTest.onRefreshThenLoadMore_paginatesUsingBeforeDateCursor", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
