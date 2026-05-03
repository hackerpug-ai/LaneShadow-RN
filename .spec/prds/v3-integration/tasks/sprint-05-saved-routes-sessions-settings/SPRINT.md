# Sprint 05: Saved Routes, Sessions & Settings

**Sequence:** 5
**Timeline:** Phase 2 · Week 5
**Status:** In Progress (task expansion 2026-05-03)

## Overview

Sprint 05 wires the secondary persistent flows that surround the conversational planning loop shipped in Sprint 04 — saving routes, browsing the saved-routes library, switching sessions in the drawer, and changing app settings. Building on the auth + Convex foundation (Sprint 03) and the live RideFlow + ChatStore (Sprint 04), this sprint binds real `db.savedRoutes.*`, `db.planningSessions.*`, and theme persistence into the V2 native sandbox screens on both iOS and Android. By sprint end, a rider can save a planned route via the SaveFavoriteSheet, browse all saved routes in a dedicated list with search and soft-delete + undo, view a saved route's snapshot in detail, switch between past sessions in the SessionsDrawer with camera position restored, change theme in Settings, and sign out cleanly — all on real Convex data with V2 design fidelity.

The 10 tasks pair iOS (`swift-implementer`) and Android (`kotlin-implementer`) implementations 1:1 per RULES.md "Platform ownership rule for sprint execution". The ROUTE group (T01–T06) introduces three NEW screens — SaveFavoriteSheet, SavedRoutesListScreen, SavedRouteDetailScreen — each composed from V2 atoms/molecules (zero new primitives per `architecture/ui-design.md`). The SESS group (T07–T08) wires the V2 `LSSessionsDrawer` organism to real `db.planningSessions.listSessions` and adds per-session camera persistence with the `cameraMoveSource: .user | .programmatic` flag mirroring RN's `isProgrammaticMoveRef`. The APP group (T09–T10) ships the new `SettingsScreen` with theme picker, account row, sign-out flow (UC-AUTH-04), and the hamburger-menu drawer entries (UC-APP-04) that route to Home / Saved Routes / Sessions / Offline Regions / Settings.

## Human Testing Gate

**Gate:** A rider can save a planned route via the SaveFavoriteSheet, browse all saved routes in a dedicated list with search and soft-delete + undo, view a saved route's snapshot in detail, switch between past sessions in the SessionsDrawer with camera position restored, change theme in Settings, and sign out cleanly.

## Human Test Deliverable

**Test Steps:**
1. From RouteDetailsScreen, tap "Save"; confirm SaveFavoriteSheet opens with pre-populated name; submit → see toast + Save button flip to "Saved" + saved route appears in SavedRoutesListScreen
2. Open hamburger menu → "Saved Routes"; see paginated list ordered by save date with search field; type a query and confirm `db.savedRoutes.getSavedRoutesList` filters results
3. Swipe (iOS) / long-press (Android) a saved row → Delete → confirm soft-delete via `softDeleteRoute`; tap "Undo" in toast within ~5s → confirm `undoDeleteRoute` restores the route
4. Tap a saved route row → confirm SavedRouteDetailScreen opens hydrated from snapshot; tap "Plan again" → confirm new session created with seeded `planInput`
5. Open hamburger menu → "Sessions"; see grouped sessions (TODAY / YESTERDAY / THIS WEEK / EARLIER); tap a past session → confirm app routes to that session's phase screen with camera position restored from per-session cache
6. Open Settings → toggle theme between Light / Dark / Auto; confirm app theme switches immediately without restart and persists across app close
7. Tap "Sign out" in Settings → confirm dialog → confirm tokens clear + chat camera cache wipes + redirected to SignInScreen
8. Verify hamburger menu navigation works from every CHAT/ROUTE/SESS screen, with the active menu entry highlighted using `surface.role.agent.accent`

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| ROUTE-S05-T01 | iOS SaveFavoriteSheet — V2 LSBottomSheet shell + LSTextField name input + LSInstrumentReadout metadata + Save/Cancel actions; `db.savedRoutes.saveRoute` mutation with `planInput` + `routeSnapshot` + `routeIndex` (fingerprint) + `snapshotMeta`; already-saved fingerprint state | swift-implementer | 180 min |
| ROUTE-S05-T02 | Android SaveFavoriteSheet — same composition + mutation; already-saved fingerprint state | kotlin-implementer | 180 min |
| ROUTE-S05-T03 | iOS SavedRoutesListScreen — `db.savedRoutes.getSavedRoutesList` paginated subscription with search; LSListRow per row (polyline thumbnail, name, distance, saved date, scenic-score pill); LSEmptyState; pull-to-refresh; swipe-to-delete with `softDeleteRoute` + LSToast undo button → `undoDeleteRoute`; rename via `renameRoute` mutation | swift-implementer | 360 min |
| ROUTE-S05-T04 | Android SavedRoutesListScreen — paginated query + search + long-press delete + undo; rename inline | kotlin-implementer | 360 min |
| ROUTE-S05-T05 | iOS SavedRouteDetailScreen — variant of RouteDetailsScreen template hydrated from `db.savedRoutes.getSavedRouteDetail` snapshot; Rename + Delete actions in toolbar; "Plan again" button calls `db.planningSessions.createSession` with seeded `planInput` | swift-implementer | 180 min |
| ROUTE-S05-T06 | Android SavedRouteDetailScreen + Plan again | kotlin-implementer | 180 min |
| SESS-S05-T07 | iOS SessionsScreen wiring — V2 LSSessionsDrawer subscribed to `db.planningSessions.listSessions`; date-grouped sections; tap row switches active session + routes to phase screen + restores camera from `cameraStore.cameraForSession(sessionId)`; `+ New session` creates fresh session; `Services/CameraStore.swift` with `cameraMoveSource: .user | .programmatic` flag (Gap A1-10 fix mirroring RN `isProgrammaticMoveRef`) | swift-implementer | 240 min |
| SESS-S05-T08 | Android SessionsScreen wiring + DataStore camera persistence + cameraMoveSource flag | kotlin-implementer | 240 min |
| APP-S05-T09 | iOS SettingsScreen — sections via LSSectionHeader (Account: avatar + email + Sign Out; Appearance: theme picker chips Light/Dark/Auto persisted to UserDefaults; Storage: link to Offline Regions; About: version + terms + privacy); hamburger menu navigation with all 5 entries (Home / Saved / Sessions / Offline / Settings); UC-APP-04 wiring | swift-implementer | 240 min |
| APP-S05-T10 | Android SettingsScreen + theme persistence via DataStore + sign-out + hamburger menu navigation | kotlin-implementer | 240 min |

### Task Files

Generated by /kb-sprint-tasks-plan on 2026-05-03 using project-local specialist planners (`swift-planner` for iOS, `kotlin-planner` for Android — invoked in parallel).

- [ROUTE-S05-T01-ios-save-favorite-sheet.md](ROUTE-S05-T01-ios-save-favorite-sheet.md) (swift-implementer, 180 min, 6 ACs / 6 TCs)
- [ROUTE-S05-T02-android-save-favorite-sheet.md](ROUTE-S05-T02-android-save-favorite-sheet.md) (kotlin-implementer, 180 min, 6 ACs / 6 TCs)
- [ROUTE-S05-T03-ios-saved-routes-list-screen.md](ROUTE-S05-T03-ios-saved-routes-list-screen.md) (swift-implementer, 360 min, 7 ACs / 7 TCs)
- [ROUTE-S05-T04-android-saved-routes-list-screen.md](ROUTE-S05-T04-android-saved-routes-list-screen.md) (kotlin-implementer, 360 min, 7 ACs / 7 TCs)
- [ROUTE-S05-T05-ios-saved-route-detail-screen.md](ROUTE-S05-T05-ios-saved-route-detail-screen.md) (swift-implementer, 180 min, 5 ACs / 5 TCs)
- [ROUTE-S05-T06-android-saved-route-detail-screen.md](ROUTE-S05-T06-android-saved-route-detail-screen.md) (kotlin-implementer, 180 min, 6 ACs / 6 TCs)
- [SESS-S05-T07-ios-sessions-screen-wiring.md](SESS-S05-T07-ios-sessions-screen-wiring.md) (swift-implementer, 240 min, 6 ACs / 6 TCs)
- [SESS-S05-T08-android-sessions-screen-wiring.md](SESS-S05-T08-android-sessions-screen-wiring.md) (kotlin-implementer, 240 min, 6 ACs / 6 TCs)
- [APP-S05-T09-ios-settings-screen.md](APP-S05-T09-ios-settings-screen.md) (swift-implementer, 240 min, 6 ACs / 6 TCs)
- [APP-S05-T10-android-settings-screen.md](APP-S05-T10-android-settings-screen.md) (kotlin-implementer, 240 min, 6 ACs / 6 TCs)

### Planner Concerns / Escalations Surfaced

These were flagged at expansion time and require user/reviewer judgment before/during execution:

- **iOS APP-S05-T09 — `surface.role.agent.accent` token availability**: ui-design.md §1.D + UC-APP-04 reference this token for active-menu highlight; it may not exist in the iOS theme under this exact alias. Task forbids introducing a new token; falls back to closest existing accent (likely `signal.default` low-alpha or `signal.whisper`). Review at first menu-highlight implementation.
- **iOS APP-S05-T09 — AppRoute extension scope**: Existing `AppState.AppRoute` has only `.home` and `.session(id:)`. Adding 5 cases would mutate AUTH-S03-T07's contract. Task introduces a sibling `MenuEntry` enum and lets RootView translate to routes; flagged for approval.
- **iOS SESS-S05-T07 — ChatStore.loadSession addition**: Sprint 04 `ChatStore` is read-only by sprint policy. Task includes `Services/ChatStore.swift (MODIFY)` to add a public `loadSession(_:)` method; uses the prompt's explicit carve-out for SESS-S05-T07.
- **iOS ROUTE-S05-T03 — LSMap thumbnails deferred**: ui-design.md §1.D specifies 56×56 LSMap thumbnails per row; task uses `LSListRow(leading: .icon(.bookmark))` to keep performance scope tight. Real polyline thumbnails deferred to follow-up.
- **iOS APP-S05-T09 — Storage row stub**: Offline Regions ships in Sprint 06; tap is a "Coming soon" toast in the meantime.
- **Android ROUTE-S05-T06 — Route.SavedRouteDetail signature**: must change from `data object` to `data class SavedRouteDetail(val savedRouteId: String)`; minimal `navigation/Route.kt` + `MainNavGraph.kt` edits in writeAllowed.
- **Android APP-S05-T10 — Route.Offline placeholder**: introduces `data object Offline : Route` with a temporary HomeLeafRoute placeholder so menu's 5th entry resolves. Sprint 06 swaps in the real composable.
- **Android SESS-S05-T08 — AppStateRepository extension**: writeAllowed includes `AppStateRepository.kt (MODIFY)` for an additive `clearSessionCamera` only; new `CameraRepository` owns `cameraMoveSource` and delegates DataStore writes back to AppStateRepository to honor the Sprint 04 boundary.
- **Android APP-S05-T10 — HamburgerMenu reuse (Rule of 2)**: T10 extracts `HamburgerMenu.kt` as the second consumer; SESS-S05-T08 (drawer host) is the first. If T08 ships before T10, treat HamburgerMenu as NEW under T10's writeAllowed.
- **Android APP-S05-T10 — `surface.role.agent.accent` parity**: same token-availability concern as iOS T09; T10 escalates to design rather than substituting silently.

**Note:** All 10 task files end with a valid `<!-- REQUIREMENT-CONTRACT v1 -->` block. Stable AC-N / TC-N ids; no gaps; every TC carries `maps_to_ac`. Per-AC `verify` commands target real test classes (xcodebuild for iOS, gradle for Android) and follow project verification command discipline.

## Source Coverage

- UC-ROUTE-01 (Save a planned route as favorite)
- UC-ROUTE-02 (View list of saved routes — search + pagination)
- UC-ROUTE-03 (View saved route detail — snapshot hydration + Plan again)
- UC-ROUTE-04 (Rename, delete, and undo-delete a saved route)
- UC-SESS-01 (Open sessions drawer with real history)
- UC-SESS-02 (Switch to a prior session — camera restore)
- UC-SESS-03 (Start a new session from drawer)
- UC-APP-01 (Settings screen — theme + sign out)
- UC-APP-04 (Hamburger menu navigation — 5 entries)
- `architecture/ios-architecture.md` § 1.D / 1.E / 1.F / 1.I + per-screen wiring
- `architecture/android-architecture.md` § Per-screen wiring + Persistence
- `architecture/ui-design.md` § 1.D SavedRoutesListScreen, § 1.E SavedRouteDetailScreen, § 1.F SettingsScreen, § 1.I SaveFavoriteSheet, § 2.5 SessionsScreen live-data, § 5 Extended LSSessionsDrawer IA
- `11-technical-requirements.md` § API Endpoints (Important tier — savedRoutes.*, planningSessions.*, theme persistence)

## Blocks

- Blocks: Sprint 06 (Map, Offline, Error Recovery & Ship Gate)
- Dependent on: Sprint 04 (Conversational Planning Loop)
