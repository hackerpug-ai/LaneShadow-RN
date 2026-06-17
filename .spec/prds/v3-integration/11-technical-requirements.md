---
stability: CONSTITUTION
last_validated: 2026-04-27
prd_version: 1.2.0
---

# Technical Requirements

This section codifies the cross-platform technical contracts. Per-platform details are in `architecture/ios-architecture.md` and `architecture/android-architecture.md`. UI design specs for new surfaces are in `architecture/ui-design.md`.

## System Components

| Component | Role |
|-----------|------|
| **iOS App Shell** (`ios/LaneShadow/App/`) | Top-level SwiftUI shell with NavigationStack, auth-gate routing, deep-link handling, environment injection of ConvexClient + Clerk + V3 stores |
| **Android App Shell** (`android/app/src/main/java/com/laneshadow/`) | `@HiltAndroidApp LaneShadowApp` + `@AndroidEntryPoint MainActivity` + Compose shell + Navigation Compose typed routes |
| **ConvexMobile Swift Client Wrapper** (`ios/LaneShadow/Services/ConvexClient+LaneShadow.swift`) | Wraps `convex-mobile` Swift SDK with typed Swift API (`subscribeToSessions() -> AsyncStream<[Session]>` etc.); handles `setAuth` callback to Clerk JWT |
| **ConvexMobile Kotlin Client Wrapper** (`android/app/src/main/.../services/ConvexClientProvider.kt`) | Wraps `convex-mobile` Kotlin SDK exposing `Flow<List<Session>>` from queries; Hilt @Singleton |
| **Clerk Auth Bridge — iOS** (`ios/LaneShadow/Services/ClerkAuth.swift`) | `clerk-ios` SDK adapter + `setAuth` token provider for Convex |
| **Clerk Auth Bridge — Android** (`android/app/src/main/.../services/ClerkAuth.kt`) | `clerk-android` SDK adapter + `CustomTabsAuthRepository` fallback; AuthRepository interface |
| **RideFlow Reducer (iOS)** (`ios/LaneShadow/Services/RideFlow.swift`) | `@Observable` state machine: IDLE → PLANNING → ROUTE_RESULTS → ROUTE_DETAILS → SESSION_HISTORY → ERROR → NAVIGATION_EXPORT |
| **RideFlow Reducer (Android)** (`android/app/src/main/.../services/RideFlowViewModel.kt`) | Sealed `RideFlowState` + `RideFlowAction` with pure `reduce()` function; ports RN `use-ride-flow.ts` 1:1 |
| **Camera Store** (per platform) | Per-session camera position cache; UserDefaults (iOS) / DataStore (Android) keyed by `sessionId`; `cameraMoveSource: .user | .programmatic` flag mirrors RN `isProgrammaticMoveRef` |
| **Type Generation Pipeline** (`scripts/generate-mobile-types.ts`) | Reads `_generated/api.d.ts` and emits Swift Codable + Kotlin @Serializable types into platform-specific Generated/ directories |
| **Mapbox Offline Manager (iOS)** (uses Mapbox iOS SDK 11.x `OfflineManager` + `TileStoreManager`) | Region descriptor + URLSession background config + checksum validation |
| **Mapbox Offline Manager (Android)** (`android/app/src/main/.../services/MapboxOfflineRepository.kt` wrapping Mapbox Android SDK 11.22.0) | WorkManager + ForegroundService (`dataSync` type) for downloads |
| **LaneShadowError** (per platform) | Typed error mapping from `ConvexClientError.errorData["code"]` (iOS) / `ConvexException.errorCode` (Android) to user-facing copy; mirrors RN `lib/convex-error.ts` |
| **Convex Backend** (`convex/`) | Production-ready 22-table schema; 2 minor V3 additions (see Schema Additions) |

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                       LaneShadow V3 Architecture                       │
└────────────────────────────────────────────────────────────────────────┘

   iOS App                                       Android App
   ┌─────────────────────┐                       ┌─────────────────────┐
   │  RootView           │                       │  LaneShadowApp      │
   │  (NavigationStack)  │                       │  (NavHost Compose)  │
   │                     │                       │                     │
   │  ┌───────────────┐  │                       │  ┌───────────────┐  │
   │  │ AuthGate      │  │                       │  │ AuthNavGraph  │  │
   │  │ ┌───────────┐ │  │                       │  │ ┌───────────┐ │  │
   │  │ │SignIn     │ │  │                       │  │ │SignIn     │ │  │
   │  │ │SignUp     │ │  │                       │  │ │SignUp     │ │  │
   │  │ └───────────┘ │  │                       │  │ └───────────┘ │  │
   │  │ MainNavGraph  │  │                       │  │ MainNavGraph  │  │
   │  │ ┌───────────┐ │  │                       │  │ ┌───────────┐ │  │
   │  │ │V2 Screens │ │  │                       │  │ │V2 Screens │ │  │
   │  │ │+ NEW (9)  │ │  │                       │  │ │+ NEW (9)  │ │  │
   │  │ └───────────┘ │  │                       │  │ └───────────┘ │  │
   │  └───────────────┘  │                       │  └───────────────┘  │
   │                     │                       │                     │
   │  ┌───────────────┐  │                       │  ┌───────────────┐  │
   │  │ AppEnvironment│  │                       │  │ Hilt DI Graph │  │
   │  │ + RideFlow    │  │                       │  │ + ViewModels  │  │
   │  │ + Stores      │  │                       │  │ + StateFlows  │  │
   │  └───────────────┘  │                       │  └───────────────┘  │
   │         │           │                       │         │           │
   │         ▼           │                       │         ▼           │
   │  ┌───────────────┐  │                       │  ┌───────────────┐  │
   │  │ConvexClient+  │  │                       │  │ConvexClient   │  │
   │  │LaneShadow.swift│ │                       │  │Provider.kt    │  │
   │  └───────────────┘  │                       │  └───────────────┘  │
   │         │           │                       │         │           │
   │  ┌───────────────┐  │                       │  ┌───────────────┐  │
   │  │ClerkAuth.swift│  │                       │  │ClerkAuth.kt + │  │
   │  │(clerk-ios)    │  │                       │  │CustomTabs ↩   │  │
   │  └───────────────┘  │                       │  └───────────────┘  │
   └──────────┬──────────┘                       └──────────┬──────────┘
              │                                             │
              │              {Clerk JWT}                    │
              │       ┌─────────────────────┐               │
              └──────►│   Clerk Cloud       │◄──────────────┘
                      │   (issuer config)   │
                      └─────────┬───────────┘
                                │ Clerk webhook → users table
                                ▼
              ┌─────────────────────────────────────────┐
              │         Convex Backend                  │
              │   ┌──────────────────────────────────┐  │
              │   │ ConvexMobile Swift + Kotlin SDK  │  │
              │   │ (WebSocket reactive subscribe)   │  │
              │   └──────────────────────────────────┘  │
              │   ┌──────────────────────────────────┐  │
              │   │ 22 Tables (planning_sessions,    │  │
              │   │ session_messages, route_plans,   │  │
              │   │ saved_routes, route_enrichments, │  │
              │   │ users, curated_routes, ...)      │  │
              │   └──────────────────────────────────┘  │
              │   ┌──────────────────────────────────┐  │
              │   │ Agent Actions:                   │  │
              │   │ - sendMessage (LLM orchestrator) │  │
              │   │ - planRide (manual mode)         │  │
              │   │ - 10+ tools (waypoints, weather, │  │
              │   │   elevation, curvature, OSM)     │  │
              │   └──────────────────────────────────┘  │
              │   ┌──────────────────────────────────┐  │
              │   │ V3 ADDITIONS:                    │  │
              │   │ - db.users.getCurrentUser query  │  │
              │   │ - sessionMessages.list +limit    │  │
              │   └──────────────────────────────────┘  │
              └─────────────────────────────────────────┘

   Mapbox Cloud (tiles + offline regions)
   ┌────────────────────────────────────────────────────────────────────┐
   │  Style URLs: laneshadow/copper-paper-light, copper-paper-dark      │
   │  Search API: place autocomplete for UC-CHAT-05 (manual mode)       │
   │  Offline regions: bbox tile packs for UC-MAP-02                    │
   └────────────────────────────────────────────────────────────────────┘
```

## Data Schema (Backend Additions)

### NEW: `db.users.getCurrentUser` query

```typescript
export const getCurrentUser = query({
  args: {},
  returns: v.union(v.null(), v.object({
    _id: v.id('users'),
    _creationTime: v.number(),
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    createdAt: v.number(),
    // ...other userValidator fields
  })),
  handler: async (ctx) => {
    const { clerkUserId } = await requireIdentity(ctx)
    const user = await ctx.db.query('users')
      .withIndex('by_clerkUserId', q => q.eq('clerkUserId', clerkUserId))
      .first()
    return user
  },
})
```

**Why**: Native client uses this as a "ready gate" — confirms the Clerk webhook has provisioned the Convex `users` row before opening the agent UI. RN sidesteps this because Clerk is its source of truth, but native benefits from explicit confirmation. ~30 LoC.

### MODIFIED: `db.sessionMessages.list` adds optional `limit`

```typescript
export const list = query({
  args: {
    sessionId: v.id('planning_sessions'),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const { clerkUserId } = await requireIdentity(ctx)
    const messages = await listHandler(ctx as any, args, clerkUserId)
    return args.limit ? messages.slice(-args.limit) : messages
  },
})
```

**Why**: For long sessions on slow devices, returning all messages is costly. Default behavior unchanged (RN keeps calling without `limit`); native opts-in to last-100 windowing. Backward-compatible. +5 LoC.

### NO OTHER SCHEMA CHANGES

The 22-table schema covers every native UI need. Validators in `convex/types.ts`, `models/route-plans.ts`, `models/saved-routes.ts` are authoritative for native type generation.

## API Design (Endpoints to Wire)

### Critical Path (Weeks 1-3)

| # | Convex path | Type | Args | Returns | Used in (UC) | Subscription | Effort |
|---|-------------|------|------|---------|--------------|--------------|--------|
| 1 | `db.users.getCurrentUser` | query | `{}` | `User \| null` | UC-AUTH-04, UC-CHAT-01, UC-APP-02 | live | S |
| 2 | `db.planningSessions.listSessions` | query | `{}` | `PlanningSession[]` | UC-SESS-01, UC-APP-02 | live | S |
| 3 | `db.planningSessions.createSession` | mutation | `{firstMessage?: string}` | `{sessionId}` | UC-CHAT-01, UC-SESS-03, UC-ROUTE-03 | n/a | S |
| 4 | `db.planningSessions.getSessionById` | query | `{sessionId}` | `PlanningSession` | UC-SESS-02 | live | S |
| 5 | `db.planningSessions.deleteSession` | mutation | `{sessionId}` | `null` | drawer | n/a | S |
| 6 | `db.sessionMessages.list` | query | `{sessionId, limit?}` | `SessionMessage[]` | UC-CHAT-02 | **live primary stream** | M |
| 7 | `db.sessionMessages.send` | mutation | `{sessionId, content}` | `{messageId}` | optimistic compose | n/a | S |
| 8 | `actions.agent.sendMessage.sendMessage` | **action** | `{sessionId, content, currentLocation?}` | `{response, messageId, attachments?}` | UC-CHAT-01, UC-CHAT-02, UC-CHAT-03 | fire-and-forget; observe via #6 | M |
| 9 | `db.routePlans.getActiveRoutePlansForSession` | query | `{sessionId}` | `[{_id, status}]` | UC-CHAT-02, UC-CHAT-03 | live | S |
| 10 | `db.routePlans.getPlanById` | query | `{routePlanId}` | `RoutePlan` | UC-CHAT-03, UC-CHAT-04, UC-ROUTE-03 | live | M |
| 11 | `db.routePlans.cancelPlan` | mutation | `{routePlanId}` | `null` | UC-CHAT-02 | n/a | S |

### Important (Weeks 3-5)

| Convex path | Type | Used in (UC) | Effort |
|-------------|------|--------------|--------|
| `db.savedRoutes.saveRoute` | mutation | UC-ROUTE-01 | S |
| `db.savedRoutes.getSavedRoutesList` | query (paginated) | UC-ROUTE-02 | M |
| `db.savedRoutes.getSavedRouteDetail` | query | UC-ROUTE-03 | S |
| `db.savedRoutes.renameRoute` | mutation | UC-ROUTE-04 | XS |
| `db.savedRoutes.softDeleteRoute` | mutation | UC-ROUTE-04 | S |
| `db.savedRoutes.undoDeleteRoute` | mutation | UC-ROUTE-04 | S |
| `db.savedRoutes.getRouteIndexFingerprint` | query | UC-CHAT-04 (already-saved state) | S |
| `db.routesPlan.getPlanInit` | query | UC-CHAT-05 (planning defaults) | XS |
| `db.routeEnrichments.list` | query | UC-CHAT-04 (weather/conditions) | M |
| `db.favoriteRoads.list` | query | UC-CHAT-05 (manual mode favorites) | S |
| `actions.agent.planRide.planRide` | action | UC-CHAT-05 (stretch) | M |

### Deferred (Out of V3 Scope)

`db.curated_routes.search`, `db.routeFeedback.*`, `db.community*`, `mapData` action — all `[DEFERRED: post-parity]` per `01-scope.md`.

### Internal-Only (Do NOT Call from Native)

`internalMutation` / `internalQuery` are not callable from clients. Examples server-side only:
- `db.planningSessions.updateLastKnownLocation`, `updateSessionTitle`, `cleanupOldEmptySessions`
- `db.sessionMessages.addSystemMessage`, `createPendingAssistantMessage`, `finalize*`, `appendStreamingChunk`, `createThinkingCard`, etc.
- `db.routePlans.updatePlanStatus`, `createForAgentInternal`, `mergeEnrichment`, `listBySession`

If any of these are needed from native, add a public `query`/`mutation` wrapper.

## External Dependencies

### iOS (Swift Package Manager)

| Dependency | Version | Documentation | Purpose |
|------------|---------|---------------|---------|
| `convex-mobile` (Swift product) | tagged release pinned at week 1 | https://github.com/get-convex/convex-mobile | Reactive Convex client |
| `clerk-ios` | latest stable at week 1 | https://github.com/clerk/clerk-ios | OAuth + session mgmt |
| `mapbox-maps-ios` | 11.6.0+ | https://docs.mapbox.com/ios/maps/guides/ | Map rendering + offline regions (already in V2) |
| `swift-snapshot-testing` | existing V2 dep | https://github.com/pointfreeco/swift-snapshot-testing | Existing visual regression tests |

### Android (Gradle Maven)

| Dependency | Version | Documentation | Purpose |
|------------|---------|---------------|---------|
| `dev.convex:android-convexmobile` | tagged release pinned at week 1 | https://github.com/get-convex/convex-mobile | Reactive Convex client |
| `com.clerk:clerk-android` | alpha at time of writing | https://docs.clerk.dev/sdks/android | OAuth + session mgmt |
| `com.mapbox.maps:android` | 11.22.0 (already in V2) | https://docs.mapbox.com/android/maps/guides/ | Map + offline (already in V2) |
| `com.google.dagger:hilt-android` | 2.52 (with KSP) | https://dagger.dev/hilt/ | DI container |
| `androidx.navigation:navigation-compose` | 2.8.0 | https://developer.android.com/jetpack/compose/navigation | Compose navigation |
| `androidx.security:security-crypto` | 1.1.0-alpha06 | https://developer.android.com/jetpack/androidx/releases/security | EncryptedSharedPreferences |
| `androidx.datastore:datastore-preferences` | 1.1.1 | https://developer.android.com/topic/libraries/architecture/datastore | Theme + session prefs |
| `androidx.work:work-runtime-ktx` | 2.9.0 | https://developer.android.com/topic/libraries/architecture/workmanager | Background offline downloads |
| `androidx.lifecycle:lifecycle-runtime-compose` | 2.8.3 | https://developer.android.com/jetpack/androidx/releases/lifecycle | `collectAsStateWithLifecycle` |
| `dropshots` | existing V2 dep | (existing) | Existing snapshot tests |

### Backend (Convex)

No new dependencies. Convex Clerk JWT integration already configured in `convex/auth.config.ts`.

### Type Generation Tooling

| Dependency | Purpose |
|------------|---------|
| `tsx` (Node) | Running `scripts/generate-mobile-types.ts` |
| Convex `_generated/api.d.ts` | Source of truth for type generation |

## UI Infrastructure

### V2 Tokens (Reused, NOT Extended)

V3 adds zero new design tokens. All new screens compose from existing V2 semantic tokens (`color.surface.*`, `color.signal.*`, `color.role.*`, `color.weather.*`, `color.route.*`, `color.status.*`, typography families, spacing/radius/motion).

### V2 Atoms (Reused)

All 60 V2 atoms are reused. Notably:
- `LSText` (3 typography families)
- `LSButton` (with leading icon slot — used by new `LSAuthProviderButton` molecule)
- `LSTextField`, `LSTextArea`
- `LSCard`, `LSPanel`, `LSGlassPanel`
- `LSPill`, `LSBadge`, `LSPhaseDot`, `LSScrim`
- `LSIcon` (design-owned 25-icon catalog)
- `LSMap` (Mapbox-backed) — extended with bbox-selector overlay for UC-MAP-02 (overlay is a new sub-component, not a new atom)
- `RoutePolyline`, `DeviationPolyline`

### V2 Molecules (Reused) + 2 NEW

**Reused** (40-100+ existing per platform):
- `LSChatInput`, `LSPhaseIndicator`, `LSWeatherBadge`, `LSWeatherTimeline`, `LSInstrumentReadout`
- `LSListRow`, `LSBottomSheet`, `LSToast`, `LSEmptyState`, `LSFormField`
- `LSTagPill`, `LSFilterChip`, `LSSuggestionChip`
- `LocationContextBar`, `RouteAttachmentCard`
- `LSNavHeader`, `LSToolbar`, `LSTabItem`, `LSModal`

**NEW (2 only)**:

#### LSDownloadProgressBar
- **Composition**: `LSPill` (status background) + `Progress` atom (0-100% bar) + `LSText` (size + percent)
- **Variants**: `paused`, `downloading`, `complete`, `error`
- **Used by**: `OfflineRegionsListScreen` (UC-MAP-02), background download status (UC-MAP-03)

#### LSAuthProviderButton
- **Composition**: `LSButton` with leading icon slot + provider logo (`LSIcon` extension or PNG asset)
- **Variants**: `apple`, `google`
- **Used by**: `SignInScreen`, `SignUpScreen` (UC-AUTH-02)

### V2 Organisms (Reused)

All 13 V2 organisms reused. Notably:
- `LSTopBar` — hamburger button now wired (UC-APP-04)
- `LSNavBar` — referenced in V2 but not the primary navigation in V3 (drawer-based IA per `architecture/ui-design.md`)
- `LSMapLayer` — used on every CHAT screen + offline screens
- `LSRouteSheet` — used on RouteDetailsScreen + SavedRouteDetailScreen
- `LSSessionsDrawer` — used as base for the new hamburger-menu drawer (extended pattern, not duplicated)
- `LSInlineErrorCallout` — used on ErrorScreen
- `LSNavigatorMessage` — used on RouteResultsScreen

### NEW Screens

9 new screens (10 if counting PlanRideSheet stretch). Each composed from V2 primitives + the 2 new molecules. Detailed design specs in `architecture/ui-design.md`. Per-screen design artifacts will be generated by the `/design` skill in a subsequent step.

## Authentication Flow (Cross-Platform Contract)

```
LOADING (Clerk hydrating from secure storage)
   │
   ├──► UNAUTHENTICATED ──► SignInScreen / SignUpScreen / OAuthCallbackScreen
   │
   └──► AUTHENTICATED ──► RootView/MainNavGraph (ConvexClient bound, queries open)
            │
            └─ on signOut() ──► UNAUTHENTICATED
```

### iOS

```swift
@Observable
final class AppEnvironment {
    let convex: ConvexClient
    init() {
        self.convex = ConvexClient(deploymentUrl: ConvexConfig.deploymentUrl)
        self.convex.setAuth { forceRefresh in
            try await Clerk.shared.session?.getToken(template: "convex", skipCache: forceRefresh)
        }
    }
}
```

Inject via `.environment(\.appEnvironment, ...)` from `App.swift`.

### Android

```kotlin
@Provides @Singleton
fun provideConvexClient(authRepo: AuthRepository): ConvexClient {
    return ConvexClient(deploymentUrl = ConvexConfig.deploymentUrl).apply {
        setAuth { forceRefresh -> authRepo.getJwtForConvex(forceRefresh) }
    }
}
```

### Preflight Requirements (Week 1, Day 1)

1. Clerk dashboard JWT template named `convex` configured for the production Convex deployment with `aud = "convex"` claim
2. Clerk webhook registered for the production Convex deployment (creates `users` row on sign-up)
3. Both `convex-mobile` SDK versions resolved and pinned in SPM/Gradle

## Reactivity Patterns

### Three Subscription Tiers

| Tier | Pattern | Examples |
|------|---------|----------|
| **Long-lived** (entire screen) | Subscribe `onAppear`, cancel `onDisappear` (iOS); `stateIn(WhileSubscribed(5_000))` (Android) | `listSessions`, `sessionMessages.list` |
| **Per-row** (lazy) | Subscribe when row visible, cancel when scrolled off | `routePlans.getPlanById` per `routing_card` attachment (cap simultaneous at 5) |
| **One-shot** (`runQuery`) | Imperative call, no subscription | manual refresh, `routesPlan.getPlanInit` |

### State Machine Wiring

The `RideFlow` reducer (Swift `@Observable` + Kotlin `StateFlow`) is **client-only**. Server-side state lives in `route_plans.status` and is one input to client transitions. Bridging logic (mirrors RN `use-active-session-route.ts`):

```
[reactive callback] when activePlans is empty AND we previously had a running plan
                    AND latest route_plan for this session has status "completed":
                        dispatch(.planSuccess) → ROUTE_RESULTS
                    OR status "failed":
                        dispatch(.planFailed) → ERROR
```

## Error Handling Architecture

### Server Error Taxonomy

11 typed error codes from `convex/errors.ts`:
- `SESSION_NOT_FOUND`, `INVALID_CONTENT`, `RATE_LIMIT_EXCEEDED`, `PLAN_LIMIT_EXCEEDED`, `PLAN_ALREADY_ACTIVE`, `PLAN_NOT_FOUND`, `AGENTIC_PARSE_FAILED`, `LOW_CONFIDENCE_PARSE`, `GENERATION_FAILED`, `NO_ROUTES_GENERATED`, `AGENT_TIMEOUT`, `NETWORK_TIMEOUT`, `UNAUTHENTICATED`

Action `sendMessage` already maps these to user-friendly strings server-side via `getConversationalErrorMessage` (`sendMessage.ts:545-587`). For other queries/mutations, the client maps via `LaneShadowError`.

### iOS — `LaneShadowError` Enum

```swift
enum LaneShadowError: Error, LocalizedError {
    case sessionNotFound
    case rateLimitExceeded
    case planAlreadyActive
    case planLimitExceeded
    case agentTimeout
    case networkTimeout
    case unauthenticated
    case unknown(String)

    init(convexError: ConvexClientError) { /* map errorData["code"] */ }

    var errorDescription: String? { /* user-facing copy */ }
}
```

Centralized in `ios/LaneShadow/Services/LaneShadowError.swift`. Mirrors RN `react-native/lib/convex-error.ts` 1:1.

### Android — `LaneShadowError` Sealed Class

```kotlin
sealed class LaneShadowError(open val userMessage: String) : Throwable() {
    object SessionNotFound : LaneShadowError("Session not found")
    object RateLimitExceeded : LaneShadowError("You've used all 5 monthly plans. Upgrade for unlimited.")
    // ...
    companion object {
        fun from(t: Throwable): LaneShadowError = when (t) {
            is ConvexException -> when (t.errorCode) {
                "SESSION_NOT_FOUND" -> SessionNotFound
                "RATE_LIMIT_EXCEEDED", "PLAN_LIMIT_EXCEEDED" -> RateLimitExceeded
                else -> Unknown(t.message ?: "Unknown error")
            }
            else -> Unknown(t.message ?: "Unknown error")
        }
    }
}
```

### Error → UI Mapping

| Error class | UI surface | V2 Component |
|-------------|------------|-------------|
| `unauthenticated` | route to SignInScreen (with intent preservation) | App shell redirect |
| `rateLimitExceeded` / `planLimitExceeded` | banner with upgrade CTA | `Banner` molecule |
| `sessionNotFound` | toast + back to IDLE | `LSToast` |
| `planAlreadyActive` | inline disabled state on send | `LSChatInput` disabled |
| `agentTimeout` / `networkTimeout` | banner with retry | `LSInlineErrorCallout` |
| `invalidContent` (validation) | inline FormField error | `LSFormField` error variant |
| Unknown / network | generic toast | `LSToast` |

### Auth-Error Single-Path Handler

Any `UNAUTHENTICATED` from Convex MUST flow through one deterministic codepath (`signOutFlow()`):
1. Cancel all subscriptions
2. Reset `RideFlow` to IDLE
3. Trigger Clerk `signOut()`
4. Navigate to `SignInScreen`

This avoids duplicate redirects and zombie subscription state.

## Offline & Caching

### ConvexMobile Offline Support

**Last-known-result caching** at SDK level — if the WebSocket drops, the next subscribe call replays the last value immediately. **NO persistent disk cache.** **NO offline mutations** (queue + reconcile is a 4-week project on its own and is OUT of V3).

**Implication**: Treat the app as online-required. Show offline banner + read-only mode for the few cached values. Don't queue mutations offline.

### Mapbox Offline (Per Platform)

| | iOS | Android |
|--|-----|---------|
| API | `OfflineManager` + `TileStoreManager` (Mapbox iOS SDK 11.x) | `OfflineManager` + `TileStore` (Mapbox Android SDK 11.22.0) |
| Region descriptor | bbox + zoom range + style URL | bbox + zoom range + style URL |
| Background fetch | `URLSessionConfiguration.background(withIdentifier:)` | `WorkManager` + `ForegroundService` (`dataSync` type API 34+) |
| Permissions | (none additional beyond location) | `POST_NOTIFICATIONS` runtime permission for foreground notification |

### Local Persistence (Minimal)

| Need | iOS | Android |
|------|-----|---------|
| Theme mode | `UserDefaults` | `DataStore (preferences)` |
| `hasCompletedOnboarding` | `UserDefaults` | `DataStore` |
| Last viewed sessionId | `UserDefaults` | `DataStore` |
| Per-session camera position | `UserDefaults` (JSON-encoded `[sessionId: Camera]`) | `DataStore` |
| Auth tokens | (Clerk SDK, Keychain) | (Clerk SDK, EncryptedSharedPreferences) |
| Saved routes / messages | **NO local cache for V3** | **NO local cache for V3** |

The "no local cache for V3" decision is deliberate — adding Core Data / Room and reconciling against Convex reactivity is a large effort, and the RN reference does not do this either.

## Testing Strategy

Per the SUPREME RULE in `~/.claude/CLAUDE.md`:

> A testing task is NOT complete until functionality is verified with REAL SERVICES.

### Tests That MUST Hit Real Services

- **Integration tests for ConvexClient wrappers** (Swift + Kotlin) — hit a real Convex dev deployment. No mocks.
- **AuthRepository integration tests** — hit a real Clerk dev environment. No mocks.
- **End-to-end smoke tests** — sign-in → first plan → save (real Convex + Clerk + Mapbox dev).

### Tests Where Mocks Are Acceptable

- ViewModel / Store unit tests (mock the ConvexClient interface; test reducer logic in isolation)
- RideFlow reducer pure-function tests (no I/O dependencies)
- Compose UI tests for visual structure (mock the data layer)

### Existing V2 Tests

- iOS: `swift-snapshot-testing` golden snapshots — kept; new screens add snapshots
- Android: `dropshots` golden snapshots — kept (cuttable per Cut Layer 1); new screens add snapshots
- Cross-platform parity manifest — extended for new screens (cuttable per Cut Layer 1)

### New Tests Required

| Test | Type | Real-services? |
|------|------|----------------|
| `RideFlowReducerTest` (per platform) | Unit | No (pure function) |
| `ConvexClientWrapperIntegrationTest` (per platform) | Integration | **YES** (real Convex dev) |
| `AuthRepositoryIntegrationTest` (per platform) | Integration | **YES** (real Clerk dev) |
| `SignInScreen UI test` (per platform) | UI | No (mocked auth) |
| `IdleScreen → PlanningScreen → RouteResults E2E` | E2E | **YES** (real Convex + Clerk + Mapbox dev) |
| `Save route → reload → see in saved list E2E` | E2E | **YES** (real Convex dev) |

## Build & Deployment

### iOS

- **SPM-only** dependency management (NOT CocoaPods despite stale V2 docs)
- Project generated via XcodeGen from `ios/project.yml`; lefthook enforces re-generation
- Update `Generated/ConvexConfig.generated.swift` for prod URL injection
- Add Clerk publishable key as `Info.plist` build setting
- Bundle ID: `com.laneshadow.app` (unchanged)
- Min iOS: **17.0** (per `project.yml` — supersedes V2 doc claim of 16)

### Android

- Gradle Kotlin DSL (already in V2)
- Application ID: `com.laneshadow.app` (unchanged)
- Min SDK: 26 / Target SDK: 34 / Compile SDK: 36 (unchanged)
- Hilt KSP plugin added to root + app `build.gradle.kts`
- Application class: `LaneShadowApp` already exists; add `@HiltAndroidApp` annotation

### Backend

- Convex deploy via `pnpm server:deploy` (existing)
- Type-gen runs as part of `pnpm server:codegen`

## Cut Sequence (Per HUMAN SIGNAL #4)

Defined in `01-scope.md`. Three layers:
1. **Cut Layer 1**: Drop Android snapshot parity tests (week 1)
2. **Cut Layer 2**: Stop Android UI gap-fills (new screens iOS-only) (week 2 checkpoint)
3. **Cut Layer 3**: Drop Android implementation entirely (week 3 escalation)

The week-2 mechanical checkpoint is OWNED by `product-manager` (the orchestrator) — escalate to user with cut recommendation if Android `UC-CHAT-02` is not green.

### Backend Impact of Android Cut

**Zero.** The Convex backend is platform-agnostic. The 2 V3 backend additions ship regardless of which platforms ship.

### Type Generation Across Platforms

Type generation runs for both Swift and Kotlin even if Android is cut — the Kotlin types are still useful for the V2 sandbox and for re-introducing Android in a v3.1 follow-up. The script is platform-agnostic.

## Risks Inventory

Top concerns (from `architecture/ios-architecture.md` and `architecture/android-architecture.md`):

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Clerk Android SDK feature gap | M | M | Verify week 1 spike; fallback `CustomTabsAuthRepository` ready as `@Binds` swap |
| `convex-mobile` API churn (pre-1.0) | M | M | Pin SDK versions; do NOT upgrade mid-sprint |
| Reactive subscription leaks crashing iOS | M | H | Tasks with explicit cancellation; lint rule against fire-and-forget subscriptions |
| Optimistic UI reconciliation on `session_messages` | H | M | Match RN's temp-ID pattern; budget 2 days for this |
| Mapbox offline tile UX cross-platform | M | M | Time-box to 1 week; if not done, ship online-only |
| Type drift between server validators and native types | H | M | Type-gen script ships before any data-binding work |
| Clerk JWT template misconfigured | L | H | Preflight check week 1 day 1 |
| Multi-attachment subscription fan-out | M | M | Cap simultaneous per-row subscriptions at 5 |
| Agent action errors silently failing | M | M | Always wrap `sendMessage` in try/catch; log to `performance` table |
| Subagent fabrication (per `MEMORY.md`) | M | H | Verify subagent commits independently per project rule |
| Android dropped from scope mid-sprint | H | L (per cut rule) | Sequence iOS first so Android cut is clean |
| ForegroundService policy compliance API 34 | M | M | Use `dataSync` foreground service type, request `POST_NOTIFICATIONS` |
