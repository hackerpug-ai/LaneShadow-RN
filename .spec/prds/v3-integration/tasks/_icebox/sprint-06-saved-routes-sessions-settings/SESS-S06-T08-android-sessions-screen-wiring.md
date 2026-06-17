================================================================================
TASK: SESS-S06-T08 - Android SessionsScreen wiring + DataStore camera persistence + cameraMoveSource flag
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

A rider opens the LSSessionsDrawer to see real planning sessions grouped by date, taps a row to switch to that session's phase screen with camera position restored from per-session DataStore persistence, and the cameraMoveSource flag distinguishes user-driven map gestures from programmatic camera restores.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST subscribe to `db.planningSessions.listSessions` via `ConvexClientProvider.observePlanningSessions()` (already wired in Sprint 04) and group results into `SessionSection`s by createdAt date bucket: TODAY / YESTERDAY / THIS WEEK / EARLIER
- MUST compose the drawer using the existing v2 `LSSessionsDrawer` organism (`ui/organisms/LSSessionsDrawer.kt`) — pass the `sections: List<SessionSection>` parameter (already supported by the API since CHAT-S04-T02)
- MUST persist per-session camera position via `CameraRepository.setSessionCamera(sessionId, position)` — implementation backed by `AppStateRepository.setSessionCamera` (DataStore-Preferences keyed by `session_cameras`); already wired in Sprint 04
- MUST introduce a NEW `services/CameraRepository.kt` interface + impl with: `cameraForSession(sessionId): Flow<CameraPosition?>`, `setSessionCamera(sessionId, CameraPosition)`, `defaultCamera: Flow<CameraPosition?>`, AND `cameraMoveSource: StateFlow<CameraMoveSource>` where `CameraMoveSource = User | Programmatic` mirrors RN `isProgrammaticMoveRef`
- MUST emit `CameraMoveSource.Programmatic` for ~300ms while restoring a session camera, and `CameraMoveSource.User` immediately after — the LSMap host reads this StateFlow to decide whether to persist incoming `onCameraMove` callbacks (no persist while Programmatic)
- MUST wire row tap → ViewModel.onSelectSession(sessionId) → fetch session phase via `RouteRepository.subscribeToActiveRoutePlans(sessionId)` first emission → `AppStateRepository.setLastViewedSessionId(sessionId)` → restore camera via `CameraRepository.setProgrammaticRestore(sessionId)` → emit `SessionsEvent.NavigateToPhase(route)` via SharedFlow
- MUST wire `+ New session` row → SessionRepository.createSession(firstMessage="") → `AppStateRepository.setLastViewedSessionId(newId)` → emit `SessionsEvent.NavigateToPhase(Route.Home)` (Idle)
- MUST dismiss the drawer with the V2 `sidebarSlideOut` motion recipe BEFORE navigation occurs (250ms delay before SharedFlow emission so the animation starts first; Material3 `ModalNavigationDrawer.close()` provides this)
- NEVER hardcode color/typography literals — all surfaces resolve through `LocalLaneShadowTheme.current`
- NEVER replace `services/AppStateRepository.kt` — extend it via the NEW `CameraRepository` wrapper that delegates DataStore writes to AppStateRepository.setSessionCamera (one-line rationale: AppStateRepository is the canonical DataStore owner; CameraRepository adds the cameraMoveSource flag and the Flow surface)
- NEVER touch `services/RideFlowReducer.kt` or `services/ChatViewModel.kt` — Sprint 04 inputs (read-only here)
- NEVER introduce a parallel ConvexClientWithAuth instance for sessions — reuse existing ConvexClientProvider.observePlanningSessions()
- STRICTLY follow architecture/ui-design.md § 5 Extended LSSessionsDrawer IA + § 2.5 SessionsScreen live-data states (loading shimmer + grouped sections + active stripe)

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Drawer subscribes to listSessions and groups by date bucket (AC-1 PRIMARY)
- [ ] Tap a session row routes to the correct phase screen and restores camera (AC-2)
- [ ] cameraMoveSource flag flips to Programmatic during restore + back to User after (AC-3)
- [ ] LSMap onCameraMove suppresses persist while cameraMoveSource = Programmatic (AC-4)
- [ ] + New session creates fresh session + sets it active + routes to Idle (AC-5)
- [ ] Loading shimmer rows render before first emission; Empty state renders when zero sessions (AC-6)
- [ ] gradlew test + compileDebugKotlin clean
- [ ] Sandbox stories untouched + snapshots:check green
- [ ] TDD RED evidence per AC

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Drawer subscribes to listSessions and groups results by date bucket [PRIMARY]
  GIVEN: A SessionsViewModel with a fake ConvexGateway emitting four PlanningSession rows whose createdAt timestamps span Today, Yesterday, This Week, and Earlier (e.g., now, now-25h, now-4d, now-30d) and a fixed `clock: () -> Long` returning `now`
  WHEN:  viewModel.state is collected
  THEN:  First Loaded emission has `sections: List<SessionSection>` ordered [TODAY, YESTERDAY, THIS WEEK, EARLIER], each containing exactly the rows whose createdAt falls within that bucket; activeSessionId comes from `appState.lastViewedSessionId`

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/sessions/SessionsViewModelTest.kt
  TEST_FUNCTION: state_subscribesToListSessions_groupsByDateBucket

AC-2: Tap a session row routes to phase + restores camera
  GIVEN: A SessionsViewModel with sessionId="sess-A" present in state, fake RouteRepository.subscribeToActiveRoutePlans returning a RoutePlan with status="completed" and >1 options, and fake CameraRepository.cameraForSession("sess-A") emitting CameraPosition(lat=37.7, lng=-122.4, zoom=12f)
  WHEN:  viewModel.onSelectSession("sess-A") is invoked
  THEN:  AppStateRepository.setLastViewedSessionId was called once with "sess-A"; CameraRepository.setProgrammaticRestore("sess-A") was called once; events SharedFlow emits SessionsEvent.NavigateToPhase(Route.RouteResults("sess-A")) within 300ms; final cameraMoveSource emission is `User` (Programmatic auto-cleared after restore window)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/sessions/SessionsViewModelTest.kt
  TEST_FUNCTION: onSelectSession_routesToPhaseAndRestoresCamera

AC-3: cameraMoveSource flips to Programmatic during restore and back to User after window
  GIVEN: A CameraRepositoryImpl backed by FakeAppStateRepository and a TestDispatcher virtual clock
  WHEN:  cameraRepository.setProgrammaticRestore("sess-A") is invoked, then 200ms advances, then 400ms advances
  THEN:  cameraMoveSource emissions in order are [User (initial), Programmatic (immediately after call), Programmatic (at +200ms), User (at +400ms)]

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/CameraRepositoryTest.kt
  TEST_FUNCTION: setProgrammaticRestore_flipsCameraMoveSourceForRestoreWindowOnly

AC-4: LSMap onCameraMove suppresses persist while cameraMoveSource = Programmatic
  GIVEN: A SessionsViewModel + CameraRepository with cameraMoveSource = Programmatic and a recorded sequence of 5 onCameraMove(CameraPosition) calls inside the 300ms restore window
  WHEN:  the host invokes viewModel.onCameraMoved("sess-A", CameraPosition(...)) for each callback
  THEN:  AppStateRepository.setSessionCamera was NOT called for any of those 5 calls (suppressed by Programmatic flag); after the window expires (cameraMoveSource = User), the next onCameraMoved call DOES invoke setSessionCamera once with the latest position

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/sessions/SessionsViewModelTest.kt
  TEST_FUNCTION: onCameraMoved_suppressesPersistWhileProgrammaticAndPersistsAfterWindow

AC-5: + New session creates session + sets active + routes to Idle
  GIVEN: A SessionsViewModel with fake SessionRepository.createSession(firstMessage="") returning Result.success("sess-new")
  WHEN:  viewModel.onNewSessionTapped() is invoked
  THEN:  SessionRepository.createSession was called once with firstMessage=""; AppStateRepository.setLastViewedSessionId was called once with "sess-new"; CameraRepository.setSessionCamera("sess-new", defaultCamera) was called once (preload default); events SharedFlow emits SessionsEvent.NavigateToPhase(Route.Home) within 200ms

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/sessions/SessionsViewModelTest.kt
  TEST_FUNCTION: onNewSessionTapped_createsSessionSetsActiveAndRoutesToIdle

AC-6: Loading shimmer + empty state render correctly
  GIVEN: A SessionsViewModel with a fake ConvexGateway whose listSessions Flow does not emit for 100ms then emits an empty list
  WHEN:  viewModel.state is collected
  THEN:  First emission is SessionsUiState.Loading (drawer renders 3 shimmer rows); after the empty emission, state is SessionsUiState.Loaded with sections=emptyList() and emptyState=true; drawer renders an LSEmptyState (icon=compass, title from `R.string.sessions_empty_title`)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/sessions/SessionsViewModelTest.kt
  TEST_FUNCTION: state_pendingThenEmpty_emitsLoadingThenEmptyVariant

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

- TC-1 maps_to_ac=AC-1: Sessions grouped by date bucket using injected clock; ordering [TODAY, YESTERDAY, THIS WEEK, EARLIER]
- TC-2 maps_to_ac=AC-2: Row tap sets lastViewedSessionId, restores camera, emits NavigateToPhase event
- TC-3 maps_to_ac=AC-3: cameraMoveSource transitions User → Programmatic → User across the restore window
- TC-4 maps_to_ac=AC-4: setSessionCamera is suppressed while Programmatic and resumes after window
- TC-5 maps_to_ac=AC-5: + New session round-trip persists sessionId, preloads default camera, routes to Idle
- TC-6 maps_to_ac=AC-6: Loading vs empty UiState differentiated; LSEmptyState rendered on empty

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/services/CameraRepository.kt (NEW — interface + Singleton @Inject impl exposing cameraMoveSource StateFlow + setProgrammaticRestore + cameraForSession + defaultCamera; delegates writes to AppStateRepository.setSessionCamera)
- android/app/src/main/java/com/laneshadow/ui/sessions/SessionsScreen.kt (NEW — Composable host: LSSessionsDrawer organism + Loading shimmer + LSEmptyState; collects events for navigation)
- android/app/src/main/java/com/laneshadow/ui/sessions/SessionsRoute.kt (NEW — route entry; hiltViewModel + NavController wiring; collects SessionsEvent SharedFlow)
- android/app/src/main/java/com/laneshadow/ui/sessions/SessionsViewModel.kt (NEW — @HiltViewModel + @Inject combining listSessions + appState + camera flows; injects `clock: () -> Long` for testable bucketing)
- android/app/src/main/java/com/laneshadow/ui/sessions/SessionsUiState.kt (NEW — sealed interface Loading/Loaded/Error + SessionSection grouping helper + SessionsEvent.NavigateToPhase / DismissDrawer)
- android/app/src/main/java/com/laneshadow/ui/sessions/SessionDateBucket.kt (NEW — pure helper: bucketOf(createdAt: Long, now: Long): SessionBucket = TODAY | YESTERDAY | THIS_WEEK | EARLIER)
- android/app/src/main/java/com/laneshadow/di/CameraModule.kt (NEW — @Module @InstallIn(SingletonComponent::class) binding CameraRepository → CameraRepositoryImpl)
- android/app/src/main/java/com/laneshadow/services/AppStateRepository.kt (MODIFY — `(MODIFY)` rationale: extend ONLY by adding `clearSessionCamera(sessionId: String)` if missing; no behavioral changes to existing setSessionCamera/setLastViewedSessionId; this preserves Sprint 04 ownership while letting CameraRepository delegate cleanly)
- android/app/src/main/java/com/laneshadow/navigation/MainNavGraph.kt (MODIFY — wire `composable<Route.Sessions> { SessionsRoute(navController) }` replacing the placeholder HomeLeafRoute)
- android/app/src/main/res/values/strings.xml (MODIFY — add `sessions_*` strings)
- android/app/src/test/java/com/laneshadow/ui/sessions/SessionsViewModelTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/services/CameraRepositoryTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/sessions/SessionDateBucketTest.kt (NEW — pure helper unit test)

writeProhibited:
- android/app/src/main/java/com/laneshadow/services/ChatViewModel.kt — Sprint 04 input (read-only)
- android/app/src/main/java/com/laneshadow/services/RideFlowReducer.kt — Sprint 04 input (read-only)
- android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt — Sprint 04 input (read-only; observePlanningSessions already exists)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt — V2 organism untouched
- android/app/src/main/java/com/laneshadow/ui/organisms/Session.kt — V2 type untouched
- android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt — V2 atom untouched (this task does not add onCameraMove; the existing API is the contract)
- android/app/src/main/java/com/laneshadow/generated/** — generated by scripts/generate-mobile-types.ts
- android/app/src/debug/java/com/laneshadow/sandbox/** — sandbox stories stay golden
- Any iOS file under ios/**

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Inject `clock: () -> Long` into SessionsViewModel for testable date bucketing (default `System.currentTimeMillis`)
- Use `combine(sessionsFlow, appStateFlow, cameraMoveSourceFlow)` with `WhileSubscribed(5_000)`
- Use `kotlinx.coroutines.flow.SharedFlow` for navigation events (replay=0, extraBufferCapacity=1)
- Use stringResource for every visible label (i18n + accessibility)
- Use `androidx.compose.material3.ModalNavigationDrawer` for the drawer host or honor the existing v2 motion recipe `sidebarSlideIn` / `sidebarSlideOut` if a custom container exists
- Inject `CameraMoveSource` change with TestDispatcher.advanceTimeBy in tests so virtual time controls the 300ms restore window

⚠️ Ask First:
- If `Session` (V2 organism type in `ui/organisms/Session.kt`) lacks `createdAt: Long` (it does carry `createdAt: String`) — confirm whether to parse string or extend the DTO mapper
- If LSSessionsDrawer's loading shimmer state is supplied by the organism or must be rendered by this host (current decision: host renders 3 placeholder rows when state=Loading)
- If `CameraMoveSource = User | Programmatic` should be a sealed interface vs enum (current decision: enum)
- Whether the route-determination logic (PlanningScreen vs RouteResultsScreen vs RouteDetailsScreen vs Idle) belongs in SessionsViewModel or a dedicated SessionPhaseResolver helper — recommendation: extract a small pure helper for testability

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- CameraRepository.kt (interface + @Singleton impl; cameraMoveSource StateFlow; setProgrammaticRestore with 300ms window via viewModelScope.launch + delay; delegates persistence to AppStateRepository)
- SessionsScreen.kt (Composable: LSSessionsDrawer with sections + Loading shimmer + LSEmptyState)
- SessionsRoute.kt (Composable entry; hiltViewModel + NavController wiring; collects SessionsEvent SharedFlow)
- SessionsViewModel.kt (@HiltViewModel; combines listSessions + appState + cameraMoveSource flows; injects clock)
- SessionsUiState.kt (sealed interface UiState + SessionsEvent)
- SessionDateBucket.kt (pure helper for date bucketing)
- CameraModule.kt (Hilt binding for CameraRepository)
- AppStateRepository.kt (MODIFY): add clearSessionCamera if needed; no behavioral changes to existing methods
- MainNavGraph.kt (MODIFY): wire Route.Sessions → SessionsRoute
- strings.xml (MODIFY): sessions_* strings
- SessionsViewModelTest.kt (RED → GREEN per AC-1, 2, 4, 5, 6)
- CameraRepositoryTest.kt (RED → GREEN per AC-3)
- SessionDateBucketTest.kt (pure helper unit tests)

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

1. RED — Write SessionDateBucketTest covering Today/Yesterday/This Week/Earlier boundary cases; verify failures
2. GREEN — Implement SessionDateBucket pure helper; tests pass
3. RED — Write CameraRepositoryTest for AC-3 (Programmatic window timing) with TestDispatcher virtual clock; verify failures
4. GREEN — Implement CameraRepository + CameraModule; tests pass
5. RED — Write SessionsViewModelTest covering AC-1, 2, 4, 5, 6 with fakes for ConvexGateway, AppStateRepository, RouteRepository, SessionRepository, CameraRepository; verify failures
6. GREEN — Implement SessionsViewModel + SessionsUiState; modify MainNavGraph to wire Route.Sessions; tests pass
7. RED → GREEN — Write/implement SessionsScreen + SessionsRoute composables hosting LSSessionsDrawer
8. REFACTOR — Extract any duplicated bucketing or event emission helpers; ensure no hardcoded color/string literals; run detekt + tokens:native-compliance + snapshots:check

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/architecture/ui-design.md [PRIMARY PATTERN]
   - Lines: 485-503 + 627-653
   - Focus: § 2.5 SessionsScreen live-data states + § 5 Extended LSSessionsDrawer IA composition

2. .spec/prds/v3-integration/07-uc-sess.md
   - Lines: 18-67
   - Focus: UC-SESS-01 + UC-SESS-02 + UC-SESS-03 acceptance criteria (date bucketing, camera restore, + New session)

3. .spec/prds/v3-integration/architecture/android-architecture.md
   - Lines: 572-595 + 1059-1080
   - Focus: § 4.4 SessionViewModel pattern (WhileSubscribed + combine) + § 9.1 LSMap onCameraMove debounce + cameraMoveSource flag rationale

4. android/app/src/main/java/com/laneshadow/services/AppStateRepository.kt
   - Lines: 1-153
   - Focus: existing DataStore-Preferences wiring for setSessionCamera + setLastViewedSessionId — CameraRepository must delegate, not duplicate

5. android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt
   - Lines: 100-180
   - Focus: V2 organism signature (sections parameter, activeSessionId, onSelect/onNew/onDismiss callbacks)

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence — TDD_STATE history per AC (commit references each AC's first failing test)
Gate 2: All tests pass — `cd android && ./gradlew test` (Exit 0)
Gate 3: Per-AC verification —
  - `cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.sessions.SessionsViewModelTest.{state_subscribesToListSessions_groupsByDateBucket,onSelectSession_routesToPhaseAndRestoresCamera,onCameraMoved_suppressesPersistWhileProgrammaticAndPersistsAfterWindow,onNewSessionTapped_createsSessionSetsActiveAndRoutesToIdle,state_pendingThenEmpty_emitsLoadingThenEmptyVariant}"`
  - `cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.services.CameraRepositoryTest.setProgrammaticRestore_flipsCameraMoveSourceForRestoreWindowOnly"`
Gate 4: Type check — `cd android && ./gradlew :app:compileDebugKotlin` (Exit 0)
Gate 5: Static analysis — `cd android && ./gradlew detekt` (Exit 0)
Gate 6: Token compliance — `scripts/tokens/enforce-native-compliance.sh` (Exit 0)
Gate 7: Sandbox snapshots untouched — `pnpm snapshots:check` (Exit 0)
Gate 8: Scope compliance — `git diff --name-only` ⊆ writeAllowed
Gate 9: AppStateRepository diff is additive only — no behavioral changes to existing methods (`git diff android/app/src/main/java/com/laneshadow/services/AppStateRepository.kt` shows only added members)

--------------------------------------------------------------------------------
REVIEW
--------------------------------------------------------------------------------

Must pass:
- CameraRepository delegates DataStore writes to AppStateRepository (no parallel DataStore instance)
- cameraMoveSource flag transitions verified in CameraRepositoryTest with TestDispatcher virtual clock
- Date bucketing helper is pure (no system clock dependency; takes injected `now`)
- + New session preloads default camera before navigation
- Drawer dismissal motion completes before navigation event fires
- Zero hardcoded color literals
- All user strings via stringResource

Should verify:
- TalkBack reads each session row as "{title}, {preview}, {whenLabel}, double-tap to switch"
- Active session row stripe is reachable by accessibility focus and announced as "Active"
- Loading shimmer rows respect 48dp minimum height (accessibility touch-target invariant)
- The screen survives configuration change without losing the drawer-open state

Verdict: PENDING

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: CHAT-S04-T02 (RideFlowState + AppStateRepository camera/lastViewedSessionId surface), CHAT-S04-T04 (Idle/Planning wiring uses lastViewedSessionId)
Blocks: APP-S06-T10 (hamburger menu integrates with this drawer for Sessions entry), Sprint 07 (Map screens read camera persistence)
Paired with: SESS-S06-T07 (iOS SessionsScreen wiring — share UC-SESS-01 + UC-SESS-02 + UC-SESS-03 ACs and the camera-source-flag pattern)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "SESS-S06-T08",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN listSessions emissions WHEN state collected THEN sessions grouped by date bucket TODAY/YESTERDAY/THIS WEEK/EARLIER", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.sessions.SessionsViewModelTest.state_subscribesToListSessions_groupsByDateBucket", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN session row tap WHEN onSelectSession invoked THEN navigation event emitted and camera restored", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.sessions.SessionsViewModelTest.onSelectSession_routesToPhaseAndRestoresCamera", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN setProgrammaticRestore WHEN window expires THEN cameraMoveSource transitions User->Programmatic->User", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.services.CameraRepositoryTest.setProgrammaticRestore_flipsCameraMoveSourceForRestoreWindowOnly", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN onCameraMoved during Programmatic window WHEN invoked THEN setSessionCamera suppressed; resumes after window", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.sessions.SessionsViewModelTest.onCameraMoved_suppressesPersistWhileProgrammaticAndPersistsAfterWindow", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN + New session tap WHEN invoked THEN createSession called and Navigate(Home) emitted", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.sessions.SessionsViewModelTest.onNewSessionTapped_createsSessionSetsActiveAndRoutesToIdle", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN pending then empty emission WHEN state collected THEN Loading then Empty UiState rendered", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.sessions.SessionsViewModelTest.state_pendingThenEmpty_emitsLoadingThenEmptyVariant", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Sessions grouped by date bucket using injected clock; ordering [TODAY, YESTERDAY, THIS WEEK, EARLIER]", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.sessions.SessionsViewModelTest.state_subscribesToListSessions_groupsByDateBucket", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Row tap sets lastViewedSessionId, restores camera, emits NavigateToPhase event", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.sessions.SessionsViewModelTest.onSelectSession_routesToPhaseAndRestoresCamera", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "cameraMoveSource transitions User -> Programmatic -> User across the restore window", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.services.CameraRepositoryTest.setProgrammaticRestore_flipsCameraMoveSourceForRestoreWindowOnly", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "setSessionCamera is suppressed while Programmatic and resumes after window", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.sessions.SessionsViewModelTest.onCameraMoved_suppressesPersistWhileProgrammaticAndPersistsAfterWindow", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "+ New session round-trip persists sessionId, preloads default camera, routes to Idle", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.sessions.SessionsViewModelTest.onNewSessionTapped_createsSessionSetsActiveAndRoutesToIdle", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "Loading vs empty UiState differentiated; LSEmptyState rendered on empty", "maps_to_ac": "AC-6", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.sessions.SessionsViewModelTest.state_pendingThenEmpty_emitsLoadingThenEmptyVariant", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
