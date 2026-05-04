================================================================================
TASK: SESS-S06-T07 - iOS SessionsScreen wiring — listSessions + date groups + camera persist + cameraMoveSource flag
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

SessionsScreen subscribes to `db.planningSessions.listSessions`, groups rows by date bucket, switches the active session on tap (restoring camera from per-session cache), creates a fresh session on "+ New session", and a new `CameraStore` enforces the `cameraMoveSource: .user | .programmatic` flag mirroring RN's `isProgrammaticMoveRef` (Gap A1-10 fix).

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST replace SessionsScreen's MockProvider data source with a `SessionsViewModel` that subscribes via the existing `subscribeToSessions()` helper on `LaneShadowConvexClient` (Sprint 04 typed wrapper) — no raw string endpoints
- MUST group sessions into 4 buckets — TODAY / YESTERDAY / THIS WEEK / EARLIER — based on `Session.createdAt` and the user's local calendar (use `Calendar.current.dateComponents([.day], from:to:)`); do not bucket by absolute time-of-day
- MUST add a new `Services/CameraStore.swift` `@MainActor @Observable` class exposing `cameraForSession(_:) -> CameraPosition?`, `setCamera(_:forSession:)`, `defaultCamera`, and `cameraMoveSource: .user | .programmatic` published flag (per Gap A1-10 fix mirroring RN `isProgrammaticMoveRef.current`)
- MUST persist per-session camera positions to `UserDefaults` keyed by `cameraStore.session.{sessionId}` with values encoded as JSON-decoded `CameraPosition` (lat / lon / zoom / bearing) — UserDefaults is the storage layer per ui-design.md §UC-SESS-02 + 11-tech §Camera Store row
- MUST honor `cameraMoveSource == .programmatic` to suppress the next persistence write and reset to `.user` on the subsequent move — exactly mirroring the RN `isProgrammaticMoveRef.current = true` → reset pattern referenced in ios-architecture.md §8.2.2
- MUST handle "+ New session" via the existing `createPlanningSession(firstMessage:)` helper (passing empty string when `firstMessage` is required by the validator; backend generates the title later)
- MUST extend `LSSessionsDrawer` consumption (the organism already takes `[SessionSection]`) to render multiple buckets — no organism modification needed
- NEVER touch ios/LaneShadow.xcodeproj/** directly — generated; edit ios/project.yml + run scripts/ios/generate-project.sh
- NEVER modify ios/LaneShadow/Generated/** — types come from server/scripts/generate-mobile-types.ts
- NEVER modify Sprint-04 services (RideFlow.swift / SessionStore.swift) — read-only inputs
- NEVER modify the LSSessionsDrawer organism in this task — pass section data through its existing initializer
- STRICTLY use semantic theme tokens; lefthook hook `tokens:native-compliance` will reject any hex literal

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] SessionsScreen subscribes to listSessions and renders rows grouped into 4 buckets (AC-1 PRIMARY)
- [ ] Tap a session row sets active session, restores camera from CameraStore, dismisses drawer (AC-2)
- [ ] "+ New session" tap creates fresh session and routes to IdleScreen with default camera (AC-3)
- [ ] Per-session camera position persists to UserDefaults on user-driven moves (AC-4)
- [ ] cameraMoveSource = .programmatic suppresses the next persistence write (AC-5)
- [ ] CameraStore.cameraForSession returns nil for unknown session and previously-saved CameraPosition for known session (AC-6)
- [ ] Tests pass + build clean
- [ ] Scope compliance — git diff --name-only ⊆ writeAllowed

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: SessionsScreen subscribes and renders bucketed sessions [PRIMARY]
  GIVEN: Stub `subscribeToSessions()` yields five Session entries with createdAt timestamps spanning today, yesterday, 4 days ago, 12 days ago, 60 days ago (one per bucket plus one extra in TODAY)
  WHEN:  SessionsScreenContainer mounts and the viewModel observes
  THEN:  SessionsScreen renders LSSessionsDrawer with 4 SessionSection entries labeled "TODAY", "YESTERDAY", "THIS WEEK", "EARLIER" — each containing only the sessions in that bucket; active-session indicator highlights `chatStore.flowState.sessionId` when present in any bucket

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/Sessions/SessionsViewModelTests.swift
  TEST_FUNCTION: test_sessionsScreen_subscribes_andGroupsByDateBucket

AC-2: Tap session row switches active session, restores camera, dismisses drawer
  GIVEN: SessionsScreen rendered; CameraStore previously stored a CameraPosition(lat:34.0, lon:-118.0, zoom:11) for sessionId="session-7"
  WHEN:  User taps the row for "session-7"; the onSelect closure fires
  THEN:  viewModel.handleSelect("session-7") sets cameraStore.cameraMoveSource = .programmatic; dispatches `chatStore.dispatch(...)` to switch the active session (or invokes the supplied `onSessionSelected("session-7")` closure when chatStore-loadSession is not yet wired); cameraStore.cameraForSession("session-7") returns the stored CameraPosition; the supplied `onDismiss()` closure is invoked once

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/Sessions/SessionsViewModelTests.swift
  TEST_FUNCTION: test_sessionsScreen_tapRow_switchesAndRestoresCamera

AC-3: "+ New session" tap creates fresh session and routes to IdleScreen
  GIVEN: SessionsScreen rendered; stub `createPlanningSession(firstMessage:"")` returns `{sessionId:"session-99"}`
  WHEN:  User taps "+ NEW" in the drawer header (the LSSessionsDrawer's onNew callback)
  THEN:  StubLaneShadowConvexClient.createPlanningSessionCalls contains exactly one entry with firstMessage == ""; supplied `onSessionCreated("session-99")` closure invoked once; cameraStore.cameraMoveSource flips to .programmatic so the next IdleScreen camera move does NOT save the default camera over a stale slot

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/Sessions/SessionsViewModelTests.swift
  TEST_FUNCTION: test_sessionsScreen_newSession_createsAndRoutes

AC-4: User-driven camera move persists to UserDefaults
  GIVEN: CameraStore initialized with an in-memory UserDefaults; cameraMoveSource is .user (default)
  WHEN:  cameraStore.recordCameraMove(CameraPosition(lat:37.7, lon:-122.4, zoom:12), forSession:"session-7") is invoked
  THEN:  cameraStore.cameraForSession("session-7") returns the new CameraPosition; the underlying UserDefaults dictionary contains the JSON-encoded value at key "cameraStore.session.session-7"; cameraMoveSource remains .user (no auto-reset on user moves)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Services/CameraStoreTests.swift
  TEST_FUNCTION: test_cameraStore_userMove_persistsToUserDefaults

AC-5: Programmatic move suppresses next persistence write and resets the flag
  GIVEN: CameraStore.cameraMoveSource is set to .programmatic by viewModel.handleSelect (per AC-2)
  WHEN:  cameraStore.recordCameraMove(CameraPosition(lat:34.0, lon:-118.0, zoom:11), forSession:"session-7") fires (simulating Mapbox callback after the programmatic camera change settled)
  THEN:  UserDefaults at key "cameraStore.session.session-7" remains unchanged from its prior value; cameraMoveSource resets to .user (so the NEXT move is treated as user-initiated and persists); cameraStore.cameraForSession("session-7") still returns the prior persisted value, NOT the suppressed programmatic value

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Services/CameraStoreTests.swift
  TEST_FUNCTION: test_cameraStore_programmaticMove_suppressesPersistAndResetsFlag

AC-6: CameraStore returns nil for unknown session and stored value for known session
  GIVEN: CameraStore initialized with empty UserDefaults
  WHEN:  cameraStore.cameraForSession("unknown") is invoked, then cameraStore.recordCameraMove(...) for "session-7" is invoked, then cameraStore.cameraForSession("session-7") is invoked
  THEN:  First call returns nil; final call returns the stored CameraPosition; cameraStore.defaultCamera returns a non-nil CameraPosition (San Francisco fallback per ios-architecture.md §IdleScreen wiring) when no per-session value exists

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Services/CameraStoreTests.swift
  TEST_FUNCTION: test_cameraStore_unknownSessionReturnsNil_knownReturnsStored

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

- TC-1 (maps_to_ac AC-1): Sessions are partitioned into 4 SessionSections with the correct labels and members.
- TC-2 (maps_to_ac AC-2): handleSelect sets cameraMoveSource=.programmatic, restores stored camera, invokes onSessionSelected + onDismiss closures.
- TC-3 (maps_to_ac AC-3): createPlanningSessionCalls.count == 1 with firstMessage=""; onSessionCreated invoked with returned sessionId; cameraMoveSource is .programmatic.
- TC-4 (maps_to_ac AC-4): After user move, UserDefaults contains the encoded CameraPosition; cameraForSession returns it.
- TC-5 (maps_to_ac AC-5): After programmatic move, UserDefaults is unchanged; cameraMoveSource resets to .user.
- TC-6 (maps_to_ac AC-6): cameraForSession is nil for unknown id; non-nil after recordCameraMove; defaultCamera is non-nil.

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Features/Sessions/SessionsScreenContainer.swift (NEW — owns viewModel, mounts screen)
- ios/LaneShadow/Features/Sessions/SessionsViewModel.swift (NEW — `@MainActor @Observable` VM)
- ios/LaneShadow/Services/CameraStore.swift (NEW — `@MainActor @Observable` class with cameraMoveSource flag + UserDefaults persistence)
- ios/LaneShadow/Services/CameraPosition+Codable.swift (NEW — Codable conformance for the CameraPosition type if not already Codable; consult LSMap.swift for the exact CameraPosition origin and avoid duplicating the type)
- ios/LaneShadow/Views/Templates/SessionsScreen.swift (MODIFY — add a new ViewState-driven init alongside the legacy MockProvider init; the new init takes `[SessionSection<Session>]` and `activeSessionId` directly; the rationale matches CHAT-S04-T07's RouteDetailsScreen MockProvider/ViewState dual-init pattern)
- ios/LaneShadow/Services/ChatStore.swift (MODIFY — add a `loadSession(sessionId:)` method that dispatches the existing `.loadSession` action with the latest planning state for that session; rationale: SESS-S06-T07 owns the session-switching surface and ChatStore previously had no public switching method per its 132-line surface; mirror RN's loadSession flow per ios-architecture.md §5.5)
- ios/LaneShadowTests/Features/Sessions/SessionsViewModelTests.swift (NEW — VM tests for AC-1..3)
- ios/LaneShadowTests/Services/CameraStoreTests.swift (NEW — AC-4..6 unit tests with in-memory UserDefaults via `UserDefaults(suiteName:)`)
- ios/LaneShadowTests/Helpers/StubLaneShadowConvexClient.swift (MODIFY — extend the sessions stub surface as needed; existing `subscribeToSessions` and `createPlanningSession` are already present)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated; edit ios/project.yml + run scripts/ios/generate-project.sh
- ios/LaneShadow/Generated/** — generated by server/scripts/generate-mobile-types.ts
- ios/LaneShadow/Services/RideFlow.swift — Sprint 04 (CHAT-S04-T01) owner; read-only here
- ios/LaneShadow/Services/SessionStore.swift — Sprint 04 owner; read-only here
- ios/LaneShadow/Sandbox/MockProviders/SessionsMockProvider.swift — sandbox keeps mocks intact
- ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift — primitive; reuse only without modification
- ios/LaneShadow/Models/AppState.swift — owned by AUTH-S03-T07; the screen receives navigation closures rather than mutating AppState directly

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Inject `UserDefaults` into CameraStore for testability (default to `.standard`); tests pass `UserDefaults(suiteName: "test-cameraStore")`
- Reset cameraMoveSource to .user inside `recordCameraMove` after suppressing exactly once
- Use `Calendar.current.dateComponents([.day], from:to:)` semantics for "yesterday" (1-day delta), "this week" (2..7 days), "earlier" (>7 days)
- Pass section data through `LSSessionsDrawer(sections:activeSessionId:onSelect:onNew:onDismiss:)` initializer

⚠️ Ask First:
- If `ChatStore` should expose a real `loadSession(_:)` method or whether the session-switching belongs to a higher-level coordinator — current architecture says ChatStore owns the action dispatch (ios-architecture.md §5.5); confirm before reaching into RideFlow.dispatch directly
- If the bucket boundaries should be locale-aware (e.g., "weekend" semantics) — current spec uses simple day-delta; defer locale-awareness to a follow-up
- If CameraPosition is already Codable elsewhere — avoid duplicating the conformance; if it is not, place the conformance in a small extension file
- If the Sandbox SessionsScreen story should also work with the new ViewState init — current scope keeps the MockProvider init intact

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Features/Sessions/SessionsScreenContainer.swift (NEW): authenticated wrapper, owns viewModel, mounts SessionsScreen with the new ViewState init
- ios/LaneShadow/Features/Sessions/SessionsViewModel.swift (NEW): `@MainActor @Observable` VM exposing `sections: [SessionSection<Session>]`, `activeSessionId`, `loadState`; methods `observe`, `handleSelect`, `handleNewSession`, `handleDismiss`
- ios/LaneShadow/Services/CameraStore.swift (NEW): `@MainActor @Observable` class with `cameraForSession`, `recordCameraMove`, `defaultCamera`, `cameraMoveSource` (enum CameraMoveSource: .user | .programmatic). Backed by injected UserDefaults
- ios/LaneShadow/Services/CameraPosition+Codable.swift (NEW or in CameraStore): Codable conformance for the CameraPosition type (only if not already Codable on the type; CameraPosition originates in LSMap.swift)
- ios/LaneShadow/Views/Templates/SessionsScreen.swift (MODIFY): add ViewState-driven `init(sections:activeSessionId:onSelect:onNew:onDismiss:)` alongside the existing MockProvider init (do not delete the MockProvider init — the sandbox depends on it)
- ios/LaneShadow/Services/ChatStore.swift (MODIFY): add `func loadSession(sessionId: String) async` that dispatches the appropriate `.loadSession` action — per ios-architecture.md §5.5
- ios/LaneShadowTests/Features/Sessions/SessionsViewModelTests.swift (NEW): AC-1..3 VM tests
- ios/LaneShadowTests/Services/CameraStoreTests.swift (NEW): AC-4..6 unit tests
- ios/LaneShadowTests/Helpers/StubLaneShadowConvexClient.swift (MODIFY): expand sessions stub if needed (most surfaces already exist)

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

[Standard RED → GREEN → REFACTOR per AC.]

1. RED for AC-4 first: write CameraStore unit test with an injected UserDefaults; confirm fails because CameraStore type does not exist.
2. GREEN: implement minimum CameraStore with recordCameraMove + cameraForSession. Add JSON encode/decode for CameraPosition.
3. RED → GREEN for AC-5 (programmatic suppression), AC-6 (nil/known semantics) — all CameraStore behavior.
4. RED → GREEN for AC-1 (SessionsViewModel bucketing): use a deterministic clock; freeze "now" via an injected `Date` provider closure to make day-delta math testable.
5. RED → GREEN for AC-2 (handleSelect), AC-3 (handleNewSession).
6. Capture RED replay output to `.tmp/SESS-S06-T07/red-{ac}-output.txt` per AC.
7. REFACTOR: ensure the bucketing function is pure (`func bucket(sessions:[Session], now: Date) -> [SessionSection<Session>]`) so it is unit-testable without time mocking.
8. Run the full evidence gate sequence (test, build, lint, token-check, snapshots:check, scope diff).

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/architecture/ios-architecture.md [PRIMARY PATTERN]
   - Lines: 1015-1020 + 841-867
   - Focus: §8.2.2 isProgrammaticMoveRef pattern (how to mirror with `cameraMoveSource`); §5.5 SessionsScreen wiring (loadSession flow)

2. ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift
   - Lines: 1-51 + 222-230
   - Focus: Initializer that takes `[SessionSection<Session>]` (line 37-51) — pass multi-bucket sections through this init

3. .spec/prds/v3-integration/architecture/ui-design.md
   - Lines: 485-501 + 627-654
   - Focus: §2.5 SessionsScreen live-data states + §5 Extended LSSessionsDrawer IA

4. .spec/prds/v3-integration/07-uc-sess.md
   - Lines: 18-67
   - Focus: UC-SESS-01, 02, 03 acceptance criteria — every AC bullet must trace to one of this task's ACs

5. ios/LaneShadow/Views/Templates/SessionsScreen.swift
   - Lines: 1-170
   - Focus: Existing MockProvider init + drawer composition; add a new ViewState init alongside (do not delete the existing init)

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence — TDD_STATE history per AC saved to `.tmp/SESS-S06-T07/red-{ac}-output.txt`
Gate 2: All tests pass — xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test (Exit 0)
Gate 3: Build — xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build (Exit 0)
Gate 4: Lint — swiftformat --lint ios/ (Exit 0)
Gate 5: Token compliance — scripts/tokens/enforce-native-compliance.sh (Exit 0)
Gate 6: Sandbox snapshots still pass — pnpm snapshots:check (Exit 0)
Gate 7: Scope compliance — git diff --name-only ⊆ writeAllowed
Per-AC verification: xcodebuild ... test -only-testing:LaneShadowTests/CameraStoreTests/{test_function_name} (AC-4..6) and xcodebuild ... test -only-testing:LaneShadowTests/SessionsViewModelTests/{test_function_name} (AC-1..3)

--------------------------------------------------------------------------------
REVIEW
--------------------------------------------------------------------------------

Must pass:
- All 6 ACs verified via per-AC test commands
- Token compliance (no hex literals; only `theme.*` / `LaneShadowTheme.color.*`)
- writeAllowed/writeProhibited respected (git diff verifies)
- CameraStore is `@MainActor` and uses `@Observable`; UserDefaults is injected for tests
- Bucketing is timezone-stable: tests pass an injected `now: Date` to freeze "today" boundary

Should verify:
- The cameraMoveSource flag is reset to .user *exactly once* — never auto-resets across multiple programmatic moves in flight
- SessionsScreen MockProvider init still works after the ViewState init is added (sandbox snapshots remain green)
- CameraPosition Codable conformance does not duplicate an existing conformance in the codebase
- Verdict: PENDING

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: CHAT-S04-T01 (RideFlow + ChatStore reducer), CHAT-S04-T03 (Idle/Planning wiring + IdleScreen reads CameraStore.defaultCamera), AUTH-S03-T03 (ConvexClient+LaneShadow base)
Blocks: APP-S06-T09 (SettingsScreen integrates with the same hamburger-drawer that SessionsScreen presents), Sprint 07 (Map sessions context awareness)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "SESS-S06-T07",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "SessionsScreen subscribes and renders bucketed sessions", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SessionsViewModelTests/test_sessionsScreen_subscribes_andGroupsByDateBucket", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "Tap session row switches active session, restores camera, dismisses drawer", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SessionsViewModelTests/test_sessionsScreen_tapRow_switchesAndRestoresCamera", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "+ New session tap creates fresh session and routes to IdleScreen", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SessionsViewModelTests/test_sessionsScreen_newSession_createsAndRoutes", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "User-driven camera move persists to UserDefaults", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/CameraStoreTests/test_cameraStore_userMove_persistsToUserDefaults", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "Programmatic move suppresses next persistence write and resets the flag", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/CameraStoreTests/test_cameraStore_programmaticMove_suppressesPersistAndResetsFlag", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "CameraStore returns nil for unknown session and stored value for known session", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/CameraStoreTests/test_cameraStore_unknownSessionReturnsNil_knownReturnsStored", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Sessions partition into 4 SessionSections labeled TODAY/YESTERDAY/THIS WEEK/EARLIER with correct membership.", "maps_to_ac": "AC-1", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SessionsViewModelTests/test_sessionsScreen_subscribes_andGroupsByDateBucket", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "handleSelect sets cameraMoveSource=.programmatic, restores stored camera, invokes navigation closures.", "maps_to_ac": "AC-2", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SessionsViewModelTests/test_sessionsScreen_tapRow_switchesAndRestoresCamera", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "createPlanningSessionCalls.count == 1 with firstMessage=''; onSessionCreated invoked with returned sessionId.", "maps_to_ac": "AC-3", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SessionsViewModelTests/test_sessionsScreen_newSession_createsAndRoutes", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "After user move, UserDefaults at cameraStore.session.<id> contains JSON-encoded CameraPosition; cameraForSession returns it.", "maps_to_ac": "AC-4", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/CameraStoreTests/test_cameraStore_userMove_persistsToUserDefaults", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "After programmatic move, UserDefaults is unchanged AND cameraMoveSource resets to .user.", "maps_to_ac": "AC-5", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/CameraStoreTests/test_cameraStore_programmaticMove_suppressesPersistAndResetsFlag", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "cameraForSession nil for unknown id; non-nil after recordCameraMove; defaultCamera non-nil.", "maps_to_ac": "AC-6", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/CameraStoreTests/test_cameraStore_unknownSessionReturnsNil_knownReturnsStored", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
