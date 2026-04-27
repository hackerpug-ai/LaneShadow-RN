---
stability: FEATURE_SPEC
last_validated: 2026-04-27
prd_version: 1.2.0
---

# Functional Groups

V3 organizes 25 use cases into 7 functional groups. Sized to fit the 6-week appetite with explicit cut authority on Android.

## Functional Groups Overview

| Group | Prefix | UCs | Description | What it delivers |
|-------|--------|-----|-------------|------------------|
| Design Fidelity | `FID` | 1 | Single umbrella UC scoping all 98 catalogued design-fidelity gaps to make V2 native screens match `.spec/design/system/` authoritative HTML/PNG specs — typography, map slot, glass-panel container, token corrections, motion recipes, sandbox stories, missing variants, NavBar variants, build blockers | The native sandbox stops looking "distorted" relative to the design — V2 visual fidelity is restored before real data wires in |
| Authentication & Session | `AUTH` | 4 | Clerk OAuth (email + social), sign-in/up screens, session persistence and restore, sign-out | Riders authenticate via email or social OAuth; sessions persist across app launches; sign-out cleanly clears state |
| Conversational Planning Flow | `CHAT` | 6 | The full Idle → Planning → Results → Details → Error state machine driven by real Convex data; optimistic message UI; cancel in-flight planning; manual mode (stretch) | The core navigator loop wired end-to-end on the six V2 Navigator screens |
| Saved Routes CRUD | `ROUTE` | 4 | Save planned route as immutable snapshot, browse list, view detail, rename, soft-delete with undo | Riders save planned routes and manage them in a dedicated list screen |
| Sessions History | `SESS` | 3 | Sessions drawer wired to real history; switch between sessions; per-session camera persistence | Riders see and resume past planning conversations with map state restored |
| Map & Offline | `MAP` | 3 | Real location tracking, recenter; offline Mapbox region download (list + bbox selector); background download resume | Map shows current location; tiles cached for poor-reception areas |
| Settings & App Infrastructure | `APP` | 4 | Settings (theme, sign-out, account), top-level auth-gate router, global error boundary, hamburger menu navigation | Riders configure theme; app gates auth correctly; errors are caught and surfaced; navigation between Home / Saved / Sessions / Offline / Settings |

## Use Case Summary

| Group | UCs | Total |
|-------|-----|-------|
| FID | UC-FID-01 (umbrella; ~70 acceptance criteria covering all 98 catalogued gaps) | 1 |
| AUTH | UC-AUTH-01, UC-AUTH-02, UC-AUTH-03, UC-AUTH-04 | 4 |
| CHAT | UC-CHAT-01, UC-CHAT-02, UC-CHAT-03, UC-CHAT-04, UC-CHAT-05, UC-CHAT-06 | 6 |
| ROUTE | UC-ROUTE-01, UC-ROUTE-02, UC-ROUTE-03, UC-ROUTE-04 | 4 |
| SESS | UC-SESS-01, UC-SESS-02, UC-SESS-03 | 3 |
| MAP | UC-MAP-01, UC-MAP-02, UC-MAP-03 | 3 |
| APP | UC-APP-01, UC-APP-02, UC-APP-03, UC-APP-04 | 4 |
| **Total** | | **25** |

## Group → V2 Screen Mapping

| Group | V2 screens used | New screens introduced |
|-------|------------------|------------------------|
| FID | All 6 V2 screens + all 7 V2 organisms (cross-cutting visual remediation) | (none — extends existing components only) |
| AUTH | (none — pre-auth flow) | SignInScreen, SignUpScreen, OAuthCallbackScreen |
| CHAT | IdleScreen, PlanningScreen, RouteResultsScreen, RouteDetailsScreen, ErrorScreen | PlanRideSheet (stretch), SaveFavoriteSheet (entry point) |
| ROUTE | RouteDetailsScreen (variant) | SavedRoutesListScreen, SavedRouteDetailScreen, SaveFavoriteSheet |
| SESS | SessionsScreen | (none) |
| MAP | (uses V2 LSMap atom + LSMapLayer organism) | OfflineRegionsListScreen, OfflineRegionSelectorScreen |
| APP | ErrorScreen (used as fallback by error boundary) | SettingsScreen |

## Cross-Group Concerns

- **FID is upstream of all other groups** — every CHAT/ROUTE/SESS/MAP/APP UC depends on a visually correct V2 design system. FID work runs as Phase 0 in week 1, in parallel with AUTH foundation work (different files; no merge conflicts). HIGH-severity FID items (typography fixes, glass-panel container, build blockers) MUST land before week 2.
- The `RideFlow` state machine (Swift `@Observable` / Kotlin `StateFlow` reducer) is shared across CHAT and SESS — it determines which V2 screen renders for a given session phase
- The Convex client wrapper is shared across AUTH, CHAT, ROUTE, SESS — single instance per app, injected via environment (iOS) / Hilt (Android)
- The hamburger menu (UC-APP-04) is the navigation entry point that ties Home (CHAT) → Saved (ROUTE) → Sessions (SESS) → Offline (MAP) → Settings (APP); LSNavBar filter+search variants from UC-FID-10 unblock future screens
- The auth gate (UC-APP-02 + UC-AUTH-04) is the runtime barrier: every non-AUTH UC requires authenticated session
