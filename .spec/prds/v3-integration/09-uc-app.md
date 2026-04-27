---
stability: FEATURE_SPEC
last_validated: 2026-04-27
prd_version: 1.0.0
functional_group: APP
---

# Use Cases: Settings & App Infrastructure (APP)

| ID | Title | Description |
|----|-------|-------------|
| UC-APP-01 | Settings screen with theme and sign-out | Minimal SettingsScreen — theme picker (light/dark/auto), sign-out, account info |
| UC-APP-02 | Top-level routing with auth gate | App-level navigation; unauthenticated → SignInScreen; authenticated → IdleScreen or last-viewed session |
| UC-APP-03 | Global error boundary | Top-level error boundary catches uncaught render/query errors and renders ErrorScreen |
| UC-APP-04 | Hamburger menu navigation | LSTopBar hamburger button opens menu with Home / Saved Routes / Sessions / Offline / Settings |

---

## UC-APP-01: Settings screen with theme and sign-out

Minimal SettingsScreen matching RN's `app/(app)/(tabs)/settings.tsx` scope. Sections (using V2 LSSectionHeader): Account (avatar + name + email + Sign Out button), Appearance (theme picker — Light / Dark / Auto with V2 LSToolbar chip group), Storage (link to OfflineRegionsListScreen — UC-MAP-02), About (version, terms link, privacy link).

- **Maps to**: NEW screen — SettingsScreen
- **Local persistence**: theme mode → UserDefaults (iOS) / DataStore (Android); applied via Theme environment / CompositionLocalProvider
- **Sign-out**: invokes UC-AUTH-04 sign-out flow (clears Clerk tokens, Convex auth, local state)

### Acceptance Criteria

- ☐ User can navigate to SettingsScreen from the hamburger menu (UC-APP-04)
- ☐ User can toggle theme between Light, Dark, and Auto using the LSToolbar chip group, with the choice persisted to local storage immediately
- ☐ User can view the signed-in account's email displayed in the Account section row
- ☐ User can tap "Sign out" to confirm via a destructive-style modal and execute the UC-AUTH-04 sign-out flow
- ☐ System applies the chosen theme immediately across all screens without restart, using the Theme environment / CompositionLocalProvider

---

## UC-APP-02: Top-level routing with auth gate

App-level navigation. Unauthenticated launches route to SignInScreen. Authenticated launches with a `lastViewedSessionId` route to the appropriate phase screen for that session (using UC-SESS-02 logic). Authenticated launches without a recent session route to IdleScreen. Auth-token expiration mid-session redirects to SignInScreen and preserves session intent (so user lands back where they were after re-auth).

- **Maps to**: App-level routing — `RootView.swift` (iOS) / `LaneShadowApp` Compose (Android), no dedicated screen
- **iOS**: `NavigationStack` with auth-gate switch in `RootView`
- **Android**: `NavHost` with sealed `Route` interface, `AuthNavGraph` vs `MainNavGraph` selection
- **Auth state source**: Clerk SDK's `@Observable Clerk` (iOS) / `Clerk.session` Flow (Android)

### Acceptance Criteria

- ☐ System routes unauthenticated launches to SignInScreen
- ☐ System routes authenticated launches with a non-null `lastViewedSessionId` to the appropriate phase screen for that session (per UC-SESS-02 routing logic)
- ☐ System routes authenticated launches with a null `lastViewedSessionId` to IdleScreen
- ☐ User can navigate from any screen back to IdleScreen via the hamburger > Home menu entry (UC-APP-04)
- ☐ System redirects to SignInScreen when Convex returns `UNAUTHENTICATED` for any query mid-session, preserving the intended target screen so the user resumes after re-auth

---

## UC-APP-03: Global error boundary

Top-level error boundary catches uncaught render exceptions and uncaught query/subscription errors and renders the V2 ErrorScreen with diagnostic info. In release builds, stack traces are NOT leaked to the user. The error is logged with full stack trace to the Convex `performance` table for monitoring (existing infra).

- **Maps to**: V2 ErrorScreen used as a fallback (variant: source = error boundary, not session-state-machine error)
- **iOS**: `try { } catch { }` wrappers around top-level Tasks; `ErrorBoundary` view-modifier pattern
- **Android**: `CoroutineExceptionHandler` on top-level scope; Compose `ErrorBoundary` Composable wrapper

### Acceptance Criteria

- ☐ System catches uncaught exceptions in the rendering tree and routes to ErrorScreen with the V2 LSInlineErrorCallout describing a generic recovery message
- ☐ System displays a generic error message ("Something went wrong") without leaking stack traces in release builds
- ☐ System logs the error with full stack trace and context to the Convex `performance` table for monitoring
- ☐ User can tap "Restart" on the error screen to reset app state and route to IdleScreen (clearing all in-memory stores)
- ☐ User can tap "Sign out" on the error screen as a recovery option for auth-related errors that the boundary can't classify

---

## UC-APP-04: Hamburger menu navigation

The hamburger button on V2 LSTopBar opens a side drawer (extending the V2 LSSessionsDrawer pattern with additional navigation entries). Menu entries: Home, Saved Routes, Sessions, Offline Regions, Settings. Active entry is highlighted. Drawer dismisses on selection or outside tap.

- **Maps to**: V2 LSTopBar (real wiring of menu button) → side drawer (NEW menu, extends V2 LSSessionsDrawer pattern)
- **Composition**: V2 LSScrim + LSGlassPanel + LSListRow per menu entry + LSIcon
- **Motion**: V2 `sidebarSlideIn` (open) + `sidebarSlideOut` (close) recipes

### Acceptance Criteria

- ☐ User can tap the hamburger icon on the V2 LSTopBar to open the navigation menu drawer with the `sidebarSlideIn` motion recipe
- ☐ User can navigate to Home (IdleScreen), Saved Routes (SavedRoutesListScreen), Sessions (SessionsScreen), Offline Regions (OfflineRegionsListScreen), and Settings (SettingsScreen) from the menu
- ☐ System highlights the currently-active menu item in the drawer using the V2 surface.role.agent.accent token
- ☐ System dismisses the menu on selection or outside tap with the `sidebarSlideOut` motion recipe
- ☐ System adapts the menu to omit Saved Routes / Offline Regions entries on Android when Cut Layer 2 is invoked (per HUMAN SIGNAL #4 cut authority)
