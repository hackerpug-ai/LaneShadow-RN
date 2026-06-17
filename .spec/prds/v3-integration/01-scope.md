---
stability: FEATURE_SPEC
last_validated: 2026-04-27
prd_version: 1.2.0
appetite_weeks: 6
---

# Scope

**Appetite**: 6 weeks (full feature)

The appetite covers shipping a real, usable LaneShadow native app on both iOS and Android — auth, the full Navigator conversational loop wired to real data, saved routes, sessions history, settings, Mapbox offline regions, **and design-fidelity remediations** so the V2 native components match the authoritative HTML design system. If scope grows, items are deferred (not extended), with Android as the explicit cuttable surface per HUMAN SIGNAL #4.

## In Scope

### Phase 0: Design-Fidelity Remediations (UC-FID-01, week 1, parallel with AUTH foundation)

Per the v1.1.0 frontend-designer team review, V2 native screens carry 98 catalogued visual / token / motion / variant gaps relative to `.spec/design/system/views/` + `/organisms/`. **All 98 gaps are scoped under a single umbrella UC `UC-FID-01: Achieve V2 design-system fidelity across all native components`** in `12-uc-fid.md`. The UC's acceptance criteria are organized by component (6 views + 7 organisms + sandbox stories + cross-platform parity) and trace back to gap IDs in the `remediations/` per-agent reports for full implementer traceability.

The single output of UC-FID-01 is: a native sandbox in which every story renders pixel-comparable to its HTML/PNG counterpart in `.spec/design/system/`, on both light and dark themes, on both iOS and Android, with cross-platform parity verified by `pnpm snapshots:check`.

Themes covered by UC-FID-01 acceptance criteria:

- **iOS typography fidelity**: Replace `heading.md` proxies with `opinion.{md,lg,xl}` Newsreader serif across 6 components (IdleScreen greeting, LSSessionsDrawer "Rides" title, LSInlineErrorCallout body, LSNavigatorMessage body, LSTopBar centered title, LSSectionHeader caps variant)
- **iOS map slot replacement**: Replace `LinearGradient` placeholders in IdleScreen / PlanningScreen / ErrorScreen with paper topographic substrate + favorite pin overlays
- **Sessions drawer container**: Both platforms — replace `LSGlassPanel.chrome` with solid `--surface-card` + `--elev-overlay` shadow + border-right separator
- **iOS LSRouteCard geometry**: Remove inner `clipShape`, switch to `aspect-ratio: 9/4`, zero outer card padding
- **iOS LSRouteSheet bottom-sheet shell**: Wrap in `LSBottomSheet`, add scenic-dot strip, fix subtitle typography, fix Save/Ride 1:2 button proportion, add Android `timeRange` prop
- **Token corrections**: Active stripe widths (3pt → `strokeWidth.lg`), `signal.whisper` semantic token for active row, ≥44pt hit targets on hamburger, drawer trailing shadow, Android pinned dot opacity, Android heart icon signal color, Android difficulty pills with status tints, baseline alignment on section header
- **Motion recipe wiring**: sketchPolylineLoop 1400ms linear, breathing head dot 1400ms ease, bestBadgeEnter 200ms scale+fade, drawer spring (Android), record dot pulse, chatOverlayEnter on suggestion chips, Android polyline animation architecture (Animatable instead of manual coroutine loop)
- **Sandbox story parity**: iOS view stories 1→7 per view, Android organism stories 0→22 (`AppStories.all = emptyList()` → registered for all 4 content organisms), all designed variants from spec (dark, edge states, detents, recovery, offline)
- **Missing view variants**: Idle V01-V03, Planning V01-V03, RouteResults S02/S04/V03, RouteDetails S03-S05/V01, Sessions S05 confirm + date grouping, Error S04 recovered + V01 offline + storm-gate + chip wrap layout
- **NavBar variants + build blockers**: Filter-chip row + search-slot variants on `LSNavBar`; Android `Session` data class declaration in `LSSessionsDrawer.kt`; Android `RouteDetailsScreen.kt` polyline decoding (currently `emptyList()` → blank map)

UC-FID-01 acceptance criteria are split internally between HIGH-severity (must close week 1, ~36 ACs), MED-severity (~42 ACs covering missing variants, motion, secondary tokens), and LOW-severity (~20 ACs polish). Sprint planning will sequence ACs by severity into the first 5 weeks.

### Foundation (weeks 1-2)

- **ConvexMobile SDK integration**: Swift package and Kotlin module from `https://github.com/get-convex/convex-mobile`, pinned to specific tagged releases. Replaces `ios/LaneShadow/ConvexStore.swift` stub on iOS; first Convex client in app on Android.
- **Clerk OAuth on both platforms**:
  - iOS: `clerk-ios` SDK for email/password + social (Apple Sign-In native sheet, Google OAuth)
  - Android: `clerk-android` alpha SDK; `Custom Tabs + ASWebAuthenticationSession`-equivalent fallback ready if SDK proves immature
- **Type generation pipeline**: `scripts/generate-mobile-types.ts` emits `ios/LaneShadow/Generated/ConvexTypes.generated.swift` (Codable structs) and `android/app/src/main/.../generated/ConvexTypes.kt` (`@Serializable` data classes) from `_generated/api.d.ts`. Wired into `pnpm server:codegen`.
- **Top-level app shell**:
  - iOS: `App.swift` + `RootView.swift` with `NavigationStack`, auth-gate, environment injection of `ConvexClient` + `Clerk` + V3 stores
  - Android: `MainActivity` + `LaneShadowApp` Compose shell, `androidx.navigation:navigation-compose` typed routes (sealed `Route` interface), Hilt + KSP DI graph
- **Auth gate routing**: Unauthenticated → `SignInScreen`; authenticated → either `IdleScreen` or last-viewed session phase (per `lastViewedSessionId` in UserDefaults / DataStore).
- **Secure token storage**: Keychain (iOS) and EncryptedSharedPreferences (Android), via the respective Clerk SDKs by default.
- **Backend additions** (server-side, ~50 LoC):
  - `db.users.getCurrentUser` public query
  - Optional `limit` arg on `db.sessionMessages.list`

### Conversational Planning Loop (weeks 2-3)

- **All six V2 Navigator screens wired to real Convex data**:
  - IdleScreen: greeting from `users.getCurrentUser.name`; chat input creates session + sends message
  - PlanningScreen: subscribes to `db.sessionMessages.list` and `db.routePlans.getActiveRoutePlansForSession`; phase indicator reflects message status; cancel button calls `db.routePlans.cancelPlan`
  - RouteResultsScreen: subscribes to `db.routePlans.getPlanById` for completed plan; renders three real polylines from `route_plans.options[]`; tap card → RouteDetails
  - RouteDetailsScreen: bound to selected `route_plans.options[i]`; subscribes to `db.routeEnrichments.list` for weather/conditions; save button opens SaveFavoriteSheet
  - SessionsScreen: subscribes to `db.planningSessions.listSessions`; tap row switches active session
  - ErrorScreen: surfaces typed errors from `LaneShadowError`; recovery chips dispatch retry / sign-in / start-over events
- **State machine**: `RideFlow` reducer (Swift `@Observable` + Kotlin `StateFlow`) with pure `reduce(state, event) → state`, ports RN `use-ride-flow.ts` 1:1
- **Optimistic message UI**: temp IDs + reconciliation by `(sessionId, content, role, timestamp)` proximity, mirroring RN behavior
- **Cancel in-flight planning**: cancel button on LSChatInput calls `db.routePlans.cancelPlan`

### Saved Routes & Sessions (weeks 3-4)

- **SavedRoutesListScreen** (NEW UI): paginated list of saved routes with search field; LSListRow per row with polyline thumbnail, name, distance, saved date; LSEmptyState when zero saved
- **SavedRouteDetail** (variant of RouteDetailsScreen): hydrates from `savedRoutes.getSavedRouteDetail` snapshot; rename + delete actions; "Plan again" button seeds a new session with the saved `planInput`
- **SaveFavoriteSheet** (NEW UI): bottom sheet using V2 LSBottomSheet; pre-populated name field; calls `savedRoutes.saveRoute`; toast on success
- **Soft-delete + undo**: `softDeleteRoute` + `undoDeleteRoute` mutations with 30-day toast-undo window
- **Rename**: inline `renameRoute` mutation
- **Sessions drawer wired**: `listSessions` query bound to V2 LSSessionsDrawer; tap → switch session
- **Per-session camera persistence**: UserDefaults (iOS) / DataStore (Android) keyed by sessionId, only saved on user-initiated camera moves (mirrors RN `isProgrammaticMoveRef`)
- **New session creation** from drawer (`createSession` mutation)

### Map & Offline (week 5)

- **Real location**: CoreLocation (iOS) / FusedLocationProvider (Android) with permission flow + recenter button + denied-state Settings deep-link
- **OfflineRegionsListScreen** (NEW UI): list of downloaded Mapbox regions with name, size, last-updated, status badge; swipe-to-delete
- **OfflineRegionSelectorScreen** (NEW UI): map + bounding-box selector + name field + estimated size + Download button
- **Background downloads**: URLSession background config (iOS) / WorkManager + ForegroundService with `dataSync` type and `POST_NOTIFICATIONS` permission (Android)
- **Resume on reconnect**: paused regions auto-resume

### Settings & App Infrastructure (weeks 5-6)

- **SettingsScreen** (NEW UI): theme picker (light/dark/auto, persists immediately), sign-out button (with confirmation), account info row (email)
- **Theme persistence**: UserDefaults / DataStore; `_hydrated` gating to prevent flash
- **Top-level routing** with auth gate, last-viewed session restore, deep-link handling for OAuth callback (`laneshadow://oauth-callback`)
- **Global error boundary**: catches uncaught render/query errors, routes to ErrorScreen with diagnostic info; logs stack trace to Convex `performance` table
- **Hamburger menu** on V2 LSTopBar: Home / Saved Routes / Sessions / Offline Regions / Settings; uses V2 `sidebarSlideIn` motion recipe

### New Molecules (2 only)

- **LSDownloadProgressBar**: composed of LSPill + Progress atom + LSText; states: paused / downloading / complete / error
- **LSAuthProviderButton**: composed of LSButton with leading icon slot + provider logo; variants: Apple, Google

### New Screens (9 total)

| Screen | Function | Variant of |
|--------|----------|------------|
| SignInScreen | email/password + OAuth | NEW |
| SignUpScreen | account creation | NEW |
| OAuthCallbackScreen | loading + redirect handler | NEW |
| SavedRoutesListScreen | browse bookmarks | NEW |
| SavedRouteDetailScreen | view saved snapshot | Variant of RouteDetailsScreen |
| SettingsScreen | theme + sign-out + account | NEW |
| OfflineRegionsListScreen | manage offline regions | NEW |
| OfflineRegionSelectorScreen | bbox selector + download | NEW |
| SaveFavoriteSheet | save route modal | NEW (composes LSBottomSheet) |
| PlanRideSheet [STRETCH] | manual planning form | NEW (composes LSBottomSheet) |

### Quality Gates

- Every new screen has a paired iOS test (XCTest) and Android test (JUnit + Compose UI) verifying it renders in both light and dark theme
- All V2 screens maintain visual consistency post-wiring (no V2 sandbox snapshot regressions)
- Cross-platform parity manifest extended to cover new screens (modulo cut authority — see Cut Order)
- Integration tests for ConvexClient wrapper and AuthRepository hit a real Convex dev deployment + real Clerk dev environment per the SUPREME RULE in `~/.claude/CLAUDE.md`

## Out of Scope

### Deferred for Later Initiatives (Per HUMAN SIGNAL #3)

- `[DEFERRED: HUMAN SIGNAL #3]` Local LLM / MLX / GGUF on-device inference. Explicit non-goal. Android `models/` MLX-related code (33 files) becomes dead code; v3.1 cleanup will sweep.
- `[DEFERRED: HUMAN SIGNAL #3]` Voice input / speech-to-intent / on-device speech models.
- `[DEFERRED: only-needed-by-MLX]` Model setup / download UI / model gatekeeper / `useModelSetup` hook port.

### Deferred Post-Parity (Lower Priority)

- `[DEFERRED: post-parity]` Long-press route segment to save (RN secondary save path; SaveFavoriteSheet covers main flow)
- `[DEFERRED: post-parity]` Curated route discovery browser (vector search via `db.curated_routes.search`)
- `[DEFERRED: post-parity]` Push notifications (RN has minimal usage)
- `[DEFERRED: post-parity]` Deep linking from external URLs (RN uses internal `sessionId` query params only)
- `[DEFERRED: post-parity]` Dev menu / debug tools
- `[DEFERRED: post-parity]` Waypoints CRUD UI (RN has `components/waypoints/` but not in default flow)
- `[DEFERRED: post-parity]` Favorite roads CRUD (separate from saved routes)
- `[DEFERRED: post-parity]` Turn-by-turn navigation export ("Ride this" → Apple/Google Maps URL handoff)
- `[DEFERRED: post-parity]` Multi-tenancy (orgs / org_memberships) — schema supports, no UI surface
- `[DEFERRED: post-parity]` Analytics instrumentation
- `[DEFERRED: post-parity]` Offline mutations queue + reconciliation (ConvexMobile SDK pre-1.0 doesn't support; would be a 4-week project)
- `[DEFERRED: post-parity]` Persistent route/message cache to disk (Convex SDK has in-memory last-known-result cache; that's enough for V3)
- `[DEFERRED: post-parity]` MFA support
- `[DEFERRED: rn-retirement-followon]` `react-native/` directory deletion. RN preserved as parity reference; v2 Sprint 7 deferred until V3 ships.

### Deferred Earlier (V2 Constraints That Carry Forward)

- `[DEFERRED: web-rebuild]` Web platform (V2 deferred; V3 inherits)
- `[DEFERRED: accessibility-initiative]` Full WCAG 2.1 AA audit (V3 ships a11y basics — touch targets, semantic labels, Dynamic Type / font-scale)
- `[DEFERRED: platform-specific]` Desktop

### Not Part of This Initiative

- New product features beyond RN parity
- Backend / Convex schema changes beyond the two minor additions documented above
- New atoms or design tokens (V3 uses V2 atoms verbatim)
- Visual design exploration (V2 `concepts/designs.html` remains authoritative for the six Navigator screens; new surfaces extend the Copper palette via `architecture/ui-design.md`)
- Internationalization / localization (English copy hard-coded; same posture as V2)
- Migration of legacy native UI from before V2 (already deleted in V2 SBX-05)

## Appetite Fit Check

**Six weeks budget** worked by parallel agent pairs (swift-implementer + kotlin-implementer + convex-implementer + ui-designer for new specs):

| Week | Focus | Critical UCs / AC subsets | Cut decision gate |
|------|-------|---------------------------|-------------------|
| 1 | **UC-FID-01 HIGH-severity ACs** (typography fixes, glass-panel container, map slot, build blockers) + Convex SDK + Clerk auth foundations both platforms; type-gen; auth-gate router | UC-FID-01 (HIGH subset); UC-AUTH-01..04, UC-APP-02 | Is Android Convex client functional? Have HIGH-severity FID ACs closed? |
| 2 | UC-FID-01 MED-severity ACs (geometry, motion, token corrections) + Core navigator loop wiring (Idle + Planning); location services; hamburger menu | UC-FID-01 (MED subset); UC-CHAT-01, UC-CHAT-02, UC-MAP-01, UC-APP-04 | **CHECKPOINT** — Is Android UC-CHAT-02 streaming messages? If no → escalate Cut Layer 1/2 |
| 3 | Route results + details; saved routes save + detail | UC-CHAT-03, UC-CHAT-04, UC-ROUTE-01, UC-ROUTE-03 | Are saved-routes mutations working both platforms? |
| 4 | Saved routes list + sessions drawer wiring + manual mode (stretch) + UC-FID-01 variant + sandbox story ACs | UC-ROUTE-02, UC-ROUTE-04, UC-SESS-01..03, UC-CHAT-05, UC-FID-01 (sandbox + missing variants subsets) | Is sessions switching working? |
| 5 | Offline regions + settings + error boundary + error screen recovery + UC-FID-01 LOW-severity ACs | UC-MAP-02, UC-MAP-03, UC-APP-01, UC-APP-03, UC-CHAT-06, UC-FID-01 (LOW subset) | Is offline UI functional? If no → defer offline to v3.1 |
| 6 | Hardening, snapshot test updates, parity verification, polish | (all UCs) | Ship gate |

If any UC or AC overruns its week, it is **dropped**, not extended — preferring to cut UC-FID-01 LOW-severity ACs before MED; PlanRideSheet before SavedRoutes; SavedRoutes before Sessions; Sessions before the core six-screen wiring; UC-FID-01 HIGH-severity ACs and HIGH-severity integration UCs are NOT cuttable.

## Cut Order (Per HUMAN SIGNAL #4)

The user pre-authorized cutting Android if cross-platform testing burdens scope. Three cut layers, applied in order:

### Cut Layer 1: Drop Android snapshot parity tests + Android FID story implementation
- **What stays**: Android implementation, sandbox stories registered manually, manual visual verification, Android FID HIGH-severity remediations (build blockers, glass-panel container, signal-whisper token)
- **What's dropped**: dropshots Android snapshot tests, `pnpm snapshots:check` Android side, `pnpm snapshots:parity-report` cross-platform diff, Android organism story implementations (`AppStories.all` stays empty for content organisms — UC-FID-08 Android side flagged `[ANDROID-CUT-CANDIDATE]`)
- **Trigger**: end of week 1, if iOS+Android parity manifest extension is taking >1 day per new screen, OR if `AppStories.all = emptyList()` regression on Android takes >2 days to remediate across 4 organisms

### Cut Layer 2: Drop Android UI gap-fills (new screens iOS-only)
- **What stays**: V2 Android sandbox screens preserved; iOS gets all 9 new screens
- **What's dropped**: SignIn, SignUp, OAuthCallback, SavedRoutesListScreen, SettingsScreen, OfflineRegionsListScreen, OfflineRegionSelectorScreen, SaveFavoriteSheet, PlanRideSheet on Android
- **Trigger**: end of week 2 checkpoint, if Android `UC-CHAT-02` (session messages streaming) is not green

### Cut Layer 3: Drop Android implementation entirely
- **What stays**: Android codebase frozen at end-of-V2 state (sandbox + design system)
- **What's dropped**: all Android implementation in V3, all Android tests, Android branch of every dual-platform task
- **Trigger**: end of week 3, if Android still cannot complete UC-AUTH-01 + UC-CHAT-01 + UC-CHAT-02

### What stays no matter what

- Convex backend (already complete; no V3 changes besides 2 minor additions)
- Token pipeline (shared)
- Mapbox style URLs (shared)
- V2 design system on iOS (fully preserved)
- All 24 UCs delivered on iOS

### Decision protocol

The week-2 checkpoint is a **mechanical contract**, not a discussion. If Android isn't on track, the orchestrator escalates to the user with the recommended cut layer. The user confirms or overrides; the team adjusts the sprint plan in the same session and continues.

This avoids the failure mode where Android slowly drags the sprint and forces last-minute panic cuts.
