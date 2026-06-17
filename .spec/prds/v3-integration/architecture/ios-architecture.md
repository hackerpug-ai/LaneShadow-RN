I have plenty of context. Now I'll write the comprehensive iOS architecture document for the v3-integration sprint.

# iOS Architecture: v3-integration

## Executive Summary

LaneShadow iOS has a complete v2 design system (60 atoms / 112 molecules / 13 organisms / 6 Navigator screens) all rendering from `MockProvider` fixtures in a sandbox host. Outside the sandbox, the app boots into a hello-world `ContentView` that subscribes to `hello:get`. v3 is the integration sprint that swaps mocks for real Convex/Clerk/Mapbox wiring.

This document is the iOS architecture spec for that integration. It assumes:

- **Min iOS deploy target: 17.0** (`project.yml` line: `IPHONEOS_DEPLOYMENT_TARGET: "17.0"`, Swift 6.0). The discovery doc claimed 16.0 — that is **stale**. Plans should treat iOS 17 as the floor and use `@Observable`, `Observation`, and the iOS 17 `NavigationStack` features freely.
- **All deps via SPM**, no CocoaPods (Mapbox is SPM `mapbox-maps-ios` 11.6.0+; Convex is SPM `convex-swift` 0.7.0+; the discovery doc claim of "CocoaPods/SPM hybrid" is stale).
- **Project generation via XcodeGen** (`ios/project.yml`). Anything that touches the Xcode project must update `project.yml` and regenerate (lefthook enforces this — `scripts/ios/check-project-generated.sh`).
- **Backend is production-ready**: Convex schema, Clerk JWT issuer wiring (`convex/auth.config.ts`), and all 8 query/6 mutation/2 action endpoints exist.
- **Appetite: 6 weeks** with one iOS implementer agent. Cut sequence (Section 12) bakes in slack.

---

## 1. App Entry & Routing

### 1.1 Replace `ContentView` with a real shell

The current `ContentView.swift` (33 lines) renders one Convex test value. It must be replaced with a routing shell that branches on Clerk auth state.

**New file**: `ios/LaneShadow/App/RootView.swift` (or repurpose `ContentView.swift`):

```swift
@MainActor
struct RootView: View {
    @State private var appState: AppState
    @Environment(\.theme) private var theme

    var body: some View {
        Group {
            switch appState.authStatus {
            case .loading:
                LaunchSplashView()                    // existing Launch/ artwork
            case .signedOut:
                AuthFlow()
                    .environment(appState)
            case .signedIn(let user):
                AppFlow(user: user)
                    .environment(appState)
            }
        }
        .task { await appState.bootstrap() }
        .onOpenURL { url in
            appState.handleDeepLink(url)              // OAuth callback, sandbox launch, magic links
        }
    }
}
```

- `AppState` is the top-level `@Observable` (Section 3).
- `AuthFlow` and `AppFlow` are SwiftUI views, not coordinators. They each own a `NavigationStack`.
- The Sandbox guard in `App.swift` continues to short-circuit to `LaneShadowSandboxEntry` in DEBUG when launch args are set — this stays exactly as-is.

### 1.2 NavigationStack architecture

iOS 17 `NavigationStack` with **typed destinations**. Each flow defines its own route enum and consumes it via `.navigationDestination(for:)`.

```swift
enum AppRoute: Hashable {
    case home
    case sessions
    case routeDetails(routePlanId: String)
    case savedRoutes
    case savedRouteDetail(savedRouteId: String)
    case settings
    case offlineRegions
    case offlineRegionSelector
}

enum AuthRoute: Hashable {
    case signIn
    case oauthLoading
}
```

**`AppFlow`** owns `@State var path: [AppRoute] = []` and renders one persistent `NavigationStack`. Push/pop is `path.append(...)` / `path.removeLast()`. **No coordinators, no `UINavigationController` bridging.**

The Navigator screens (`IdleScreen`, `PlanningScreen`, `RouteResultsScreen`, etc.) are **not separate destinations** — they render conditionally inside the `home` destination based on `ChatStore.flowState.phase` (Section 5). This mirrors the React Native single-screen pattern where one `(tabs)/index.tsx` switches between Idle/Planning/Results based on flow state.

### 1.3 Deep link handling

`onOpenURL { url in ... }` lives on `RootView` and routes by URL scheme:

| Scheme/Host | Handler | Used by |
|---|---|---|
| `laneshadow-sandbox://...` | `LaneShadowSandboxPresentation.from(url:)` (existing) | DEBUG sandbox |
| `laneshadow://oauth-callback?...` | `appState.clerk.completeOAuth(url:)` | Clerk OAuth web flow |
| `laneshadow://session/{id}` | `appState.openSession(id:)` | Future: notifications, share sheet |
| Universal Links `https://laneshadow.app/...` | Defer to v4 | — |

**`Info.plist` change**: add `laneshadow` to `CFBundleURLSchemes` array alongside the existing `laneshadow-sandbox` scheme.

### 1.4 Navigation graph (textual)

```
RootView
├── (loading) LaunchSplashView
├── (signedOut) AuthFlow
│    └── NavigationStack(path: $authPath)
│         ├── SignInScreen          (root, .signIn)
│         └── OAuthLoadingScreen    (.oauthLoading) — pushed during OAuth roundtrip
├── (signedIn) AppFlow
│    └── NavigationStack(path: $appPath)
│         ├── HomeScreen            (root, .home)
│         │    └── conditional: IdleScreen | PlanningScreen | RouteResultsScreen | RouteDetailsScreen | ErrorScreen (driven by ChatStore.flowState)
│         ├── SessionsScreen        (.sessions) — pushed from HomeScreen menu
│         ├── RouteDetailsScreen    (.routeDetails) — separate from in-flow details? See section 5.4
│         ├── SavedRoutesListScreen (.savedRoutes)
│         ├── SavedRouteDetailScreen(.savedRouteDetail)
│         ├── SettingsScreen        (.settings)
│         ├── OfflineRegionsScreen  (.offlineRegions)
│         └── OfflineRegionSelectorScreen (.offlineRegionSelector)
```

**Sheets** (modal, not pushed): `SaveFavoriteSheet`, `PlanRideSheet`, `RouteDetailsSheet` (the bottom drawer), `PlanningErrorSheet`. Each is presented via `.sheet(isPresented:)` or `.sheet(item:)` from the screen that triggers it.

---

## 2. Auth Stack (Clerk)

### 2.1 SDK choice — research result

**Decision: use Clerk's official `clerk-ios` SDK as the primary path, with `ASWebAuthenticationSession` as a fallback if the SDK doesn't ship a critical surface.**

Status (as of plan date 2026-04-27):

- Clerk maintains an official iOS SDK: [`clerk/clerk-ios`](https://github.com/clerk/clerk-ios) (SwiftUI, iOS 17+, Swift Package Manager). It supports email/password, social OAuth (Apple, Google), MFA, and session refresh. It is the documented production path for native iOS.
- It ships an `Environment(\.clerk)` injection pattern that mirrors what we already use for the theme — fits the v2 codebase naturally.
- The SDK exposes `Clerk.shared.session?.getToken()` which returns a JWT minted for the `convex` template (configured in the Clerk dashboard). This is exactly what the Convex Swift `AuthProvider` protocol needs (see Section 4.2).

If the SDK proves unstable on any specific surface (we need to verify in-sprint), the fallback is:

- Use `ASWebAuthenticationSession` to launch Clerk's hosted sign-in URL.
- Catch the redirect URI (`laneshadow://oauth-callback?...`) in `RootView.onOpenURL`.
- Exchange the code for a JWT via Clerk's REST API (`POST /v1/client/sign_ins` etc.).
- This is more code but uses only Foundation + AuthenticationServices — no third-party SDK risk.

The implementer should spike `clerk-ios` for **half a day** in week 1; if any of email/password, Google OAuth, or Apple OAuth fails the smoke test, fall back to `ASWebAuthenticationSession`. Document the choice in `ai-specs/v3-integration/decisions/auth-sdk.md`.

### 2.2 Files to create

| File | Purpose |
|---|---|
| `ios/LaneShadow/Auth/AuthService.swift` | `@Observable` wrapper over Clerk; exposes `signIn`, `signUp`, `signOut`, `currentUser`, `getJWT()` |
| `ios/LaneShadow/Auth/ClerkAuthProvider.swift` | Conforms to `ConvexMobile.AuthProvider`; bridges Clerk JWT into Convex |
| `ios/LaneShadow/Auth/Keychain.swift` | Thin wrapper over `kSecClassGenericPassword` for secrets that Clerk SDK doesn't already cache |
| `ios/LaneShadow/Auth/Views/SignInScreen.swift` | Composes `LSAuthCard` + `LSTextField` + `LSButton` for email path; Apple/Google buttons for social |
| `ios/LaneShadow/Auth/Views/OAuthLoadingScreen.swift` | Spinner + cancel button while OAuth roundtrip is in flight |

### 2.3 SignInScreen composition

The RN screen has four steps: `start` (social + email button) → `email` → `password` → `signUp`. Mirror that on iOS as a single SwiftUI view with a `@State var step: AuthStep` enum.

```swift
@MainActor
struct SignInScreen: View {
    @Environment(\.theme) private var theme
    @Environment(AppState.self) private var appState
    @State private var step: AuthStep = .start
    @State private var email = ""
    @State private var password = ""
    @State private var name = ""
    @State private var confirmPassword = ""
    @State private var error: String?
    @State private var isLoading = false

    var body: some View {
        ZStack {
            // Background image: ios/LaneShadow/Assets.xcassets/login_background.imageset
            Image("login_background")
                .resizable()
                .aspectRatio(contentMode: .fill)
                .ignoresSafeArea()

            ScrollView {
                LSAuthCard(title: "Lane Shadow", subtitle: "Sign in to save and replay rides") {
                    switch step {
                    case .start:    startStepView
                    case .email:    emailStepView
                    case .password: passwordStepView
                    case .signUp:   signUpStepView
                    }

                    if let error {
                        LSText(error, font: .caption, color: theme.colors.danger.default)
                    }
                    if step != .start {
                        LSButton(title: "Back", style: .glass) { step = .start; error = nil }
                    }
                }
                .padding(.horizontal, theme.space.md)
            }
        }
    }
}
```

Reuse: `LSAuthCard` (exists at `Views/Molecules/AuthCard.swift`), `LSTextField`, `LSButton`, `LSText`. **No new components** needed for the auth screens beyond the screen-level files themselves.

The `start` step needs three buttons — Apple, Google, "Login with Email" — with the same glass styling the RN screen uses (`Button variant="glass" size="xl"` in RN ≈ `LSButton(style: .glass, size: .xl)` on iOS). Apple/Google icons exist in design tokens; if not, stub with SF Symbols `applelogo` and `network` and replace before ship.

### 2.4 Token storage

Clerk's iOS SDK manages JWT storage internally via Keychain. We do **not** need our own Keychain wrapper for Clerk tokens. The `Keychain.swift` helper exists only for any LaneShadow-specific secrets we add (none currently — leave the file optional, defer to a later sprint if needed).

The Convex JWT is fetched on-demand via `Clerk.shared.session?.getToken(for: "convex")` and is cached internally by Clerk for ~50 seconds before refresh.

### 2.5 Auto-refresh

The Convex `AuthProvider` protocol takes a `getValidToken: () async throws -> String?` closure. Our implementation in `ClerkAuthProvider` is:

```swift
func getValidToken() async throws -> String? {
    guard let session = Clerk.shared.session else { return nil }
    return try await session.getToken(for: "convex", forceRefreshIfNeeded: true)
}
```

Clerk handles the actual refresh against its servers; our adapter just invokes it. The bridge inside `ConvexClientWithAuth` (visible in `convex-swift` source line 209 onwards as `AuthTokenProviderBridge`) caches the result and pulls a new one when the Rust client requests it via `forceRefresh: true`.

### 2.6 OAuth callback

For social sign-in:
- `clerk-ios` opens `ASWebAuthenticationSession` internally and resolves a `Session` once the callback fires.
- We do **not** need to register a custom URL scheme for this if we use the SDK's built-in flow (it uses `.com.googleusercontent.apps...` for Google and Apple's native sign-in for Apple).
- If using the manual fallback path, register `laneshadow://oauth-callback` in Info.plist and route it from `RootView.onOpenURL` to `appState.completeOAuth(url:)`.

---

## 3. State Management Architecture

### 3.1 Observation framework decision

**Use `@Observable` from the `Observation` framework everywhere.** Min target is iOS 17, so no `ObservableObject`/`@Published` fallback is needed. The existing `Sandbox/ConvexStore.swift` already uses `@Observable` — we match that pattern.

Rule:
- Stores that hold app state → `@Observable final class`, marked `@MainActor` if they touch UI.
- Pass them down via `.environment(store)` and pull them up with `@Environment(StoreType.self)`.
- For two-way bindings inside views, use `@Bindable var store: StoreType`.

### 3.2 Store inventory

| Store | Scope | Persistence | Notes |
|---|---|---|---|
| `AppState` | Root singleton | None (derived from sub-stores) | Owns auth status, exposes child stores |
| `AuthService` | Root singleton | Clerk-managed Keychain | Sign in/up/out, current user |
| `ConvexClient` | Root singleton | None | Wraps `ConvexClientWithAuth`; thin facade over `convex-swift` |
| `ChatStore` | Per-Home-screen instance | None (derived from Convex) | The `useRideFlow` state machine + `useChatPlanning` orchestration |
| `SessionStore` | Root singleton | UserDefaults (`laneshadow.session`) | Camera cache + lastViewedSessionId |
| `SettingsStore` | Root singleton | UserDefaults (`laneshadow.settings`) | themeMode, hasCompletedOnboarding |
| `LocationService` | Root singleton | None | `CLLocationManager` wrapper, async location stream |
| `OfflineRegionStore` | Root singleton | Mapbox-managed (TileStore) | Download progress, region list |
| `ToastCenter` | Root singleton | None | Inline toast queue (replaces RN `react-native-notifier`) |
| ~~`DownloadStore`~~ | — | — | **Cut** per signal #3 (local LLM out of scope) |

### 3.3 AppState (top-level @Observable)

```swift
@MainActor
@Observable
final class AppState {
    enum AuthStatus: Equatable {
        case loading
        case signedOut
        case signedIn(userId: String)
    }

    private(set) var authStatus: AuthStatus = .loading

    let auth: AuthService
    let convex: ConvexClient
    let session: SessionStore
    let settings: SettingsStore
    let location: LocationService
    let offlineRegions: OfflineRegionStore
    let toasts: ToastCenter

    init() {
        self.settings = SettingsStore()
        self.session = SessionStore()
        self.toasts = ToastCenter()
        self.location = LocationService()
        self.auth = AuthService()                     // wraps Clerk
        self.convex = ConvexClient(auth: auth)        // ConvexClientWithAuth under the hood
        self.offlineRegions = OfflineRegionStore()
    }

    func bootstrap() async {
        // 1. Hydrate persisted state
        await settings.hydrate()
        await session.hydrate()

        // 2. Try cached Clerk session
        let user = await auth.restoreFromCache()
        authStatus = user.map { .signedIn(userId: $0.id) } ?? .signedOut

        // 3. If signed in, prime convex auth (sets the AuthProvider so queries authenticate)
        if case .signedIn = authStatus {
            await convex.connect()
        }
    }

    func handleDeepLink(_ url: URL) {
        if LaneShadowSandboxPresentation.from(url: url) != nil { return }
        if url.scheme == "laneshadow", url.host == "oauth-callback" {
            Task { await auth.completeOAuth(url: url); await refreshAuthStatus() }
        }
    }
}
```

The `App.swift` change is minimal:

```swift
@main
struct LaneShadowApp: App {
    @State private var appState = AppState()
    @State private var sandboxPresentation = LaneShadowSandboxPresentation.initial()

    var body: some Scene {
        WindowGroup {
            Group {
                #if DEBUG
                if sandboxPresentation.isPresented {
                    LaneShadowSandboxEntry(selectedStoryId: sandboxPresentation.storyId)
                } else {
                    RootView()
                        .environment(appState)
                        .laneShadowTheme()
                }
                #else
                RootView()
                    .environment(appState)
                    .laneShadowTheme()
                #endif
            }
            .onOpenURL { url in
                #if DEBUG
                if let presentation = LaneShadowSandboxPresentation.from(url: url) {
                    sandboxPresentation = presentation
                    return
                }
                #endif
                appState.handleDeepLink(url)
            }
        }
    }
}
```

### 3.4 ChatStore — the ride-flow state machine

The RN `useRideFlow` hook is a pure reducer over 7 phases (IDLE → PLANNING → ROUTE_RESULTS → ROUTE_DETAILS → SESSION_HISTORY → ERROR → NAVIGATION_EXPORT). We mirror it as an `@Observable` class. **NAVIGATION_EXPORT can be deferred** (the RN screen for it is barely used and signal #2 is "feature parity" — flag it for follow-up but not blocking).

```swift
enum RideFlowPhase: Equatable {
    case idle(IdleState)
    case planning(PlanningState)
    case routeResults(RouteResultsState)
    case routeDetails(RouteDetailsState)
    case sessionHistory(SessionHistoryState)
    case error(ErrorState)
}

struct IdleState: Equatable { ... }
struct PlanningState: Equatable {
    let sessionId: String
    var currentPhase: String       // "analyzing" | "sketching" | etc.
    var routeOptions: PlannedRouteOptions?
    var selectedRouteId: String?
}
// ... mirror types from use-ride-flow.ts

enum RideFlowAction {
    case sendMessage(String)
    case planningSuccess(PlannedRouteOptions)
    case planningError(String)
    case cancelPlanning
    case selectRoute(String)
    case viewHistory
    case closeHistory
    case newSession
    case loadSession(sessionId: String, options: PlannedRouteOptions, selectedRouteId: String?)
    case clearError
}

@MainActor
@Observable
final class ChatStore {
    private(set) var flowState: RideFlowPhase = .idle(IdleState())
    private(set) var optimisticMessages: [OptimisticMessage] = []
    private(set) var isSending = false

    private let convex: ConvexClient
    private var planSubscription: Task<Void, Never>?
    private var messageSubscription: Task<Void, Never>?

    init(convex: ConvexClient) { self.convex = convex }

    func dispatch(_ action: RideFlowAction) {
        flowState = Self.reduce(state: flowState, action: action)
    }

    static func reduce(state: RideFlowPhase, action: RideFlowAction) -> RideFlowPhase {
        // Pure switch over (state, action), mirroring rideFlowReducer in use-ride-flow.ts
    }

    /// Orchestration — equivalent to useChatPlanning.sendPlanningMessage
    func sendPlanningMessage(_ content: String, currentLocation: LatLng?) async {
        guard !isSending else { return }
        isSending = true
        defer { isSending = false }

        let tempId = "temp-\(Date().now.timeIntervalSince1970)"
        optimisticMessages.append(OptimisticMessage(id: tempId, role: .rider, content: content))
        dispatch(.sendMessage(content))

        do {
            let sessionId = try await ensureSession()
            try await convex.action("agent:sendMessage:sendMessage", with: [
                "sessionId": sessionId,
                "content": content,
                "currentLocation": currentLocation?.encoded()
            ])
            optimisticMessages.removeAll { $0.id == tempId }
        } catch {
            optimisticMessages.removeAll { $0.id == tempId }
            dispatch(.planningError(humanize(error)))
        }
    }

    func cancel() async {
        // Mirror useChatPlanning.cancel
    }
}
```

The reducer is **pure** and unit-tested. The orchestration methods (`sendPlanningMessage`, `cancel`) wrap the reducer with side effects.

### 3.5 SessionStore — camera cache

Mirrors RN `useChatSessionStore`. Backed by `UserDefaults` (one JSON blob under `laneshadow.session`).

```swift
struct CameraSlot: Codable, Equatable {
    let centerLat: Double
    let centerLon: Double
    let zoom: Double
}

@MainActor
@Observable
final class SessionStore {
    private(set) var defaultCamera: CameraSlot?
    private(set) var cameraBySession: [String: CameraSlot] = [:]
    private(set) var lastViewedSessionId: String?
    private(set) var isHydrated = false

    private let defaults = UserDefaults.standard
    private let key = "laneshadow.session.v1"

    func hydrate() async {
        if let data = defaults.data(forKey: key),
           let snapshot = try? JSONDecoder().decode(Snapshot.self, from: data) {
            defaultCamera = snapshot.defaultCamera
            cameraBySession = snapshot.cameraBySession
            lastViewedSessionId = snapshot.lastViewedSessionId
        }
        isHydrated = true
    }

    func setCamera(sessionId: String?, slot: CameraSlot) {
        if let sessionId { cameraBySession[sessionId] = slot }
        else { defaultCamera = slot }
        persist()
    }

    func camera(for sessionId: String?) -> CameraSlot? {
        if let sessionId { return cameraBySession[sessionId] ?? defaultCamera }
        return defaultCamera
    }

    func setLastViewedSession(_ id: String?) {
        lastViewedSessionId = id
        persist()
    }

    private func persist() {
        let snap = Snapshot(defaultCamera: defaultCamera,
                            cameraBySession: cameraBySession,
                            lastViewedSessionId: lastViewedSessionId)
        defaults.set(try? JSONEncoder().encode(snap), forKey: key)
    }

    private struct Snapshot: Codable {
        let defaultCamera: CameraSlot?
        let cameraBySession: [String: CameraSlot]
        let lastViewedSessionId: String?
    }
}
```

### 3.6 SettingsStore

Mirrors RN `useSettingsStore`. UserDefaults JSON blob under `laneshadow.settings`.

```swift
enum ThemeMode: String, Codable, CaseIterable { case light, dark, auto }

@MainActor
@Observable
final class SettingsStore {
    private(set) var themeMode: ThemeMode = .auto
    private(set) var hasCompletedOnboarding = false
    private(set) var isHydrated = false
    // … standard hydrate/persist methods backed by UserDefaults
}
```

### 3.7 ToastCenter

The Navigator screens already render `LSToast` / `ErrorToast` molecules. We need a queue + auto-dismiss layer. Simple `@Observable` with a stack of typed toast events; bind a top-overlay view (or use `LSToast` directly) at app root.

---

## 4. Convex Client Wrapper

### 4.1 Why we need a wrapper

The Convex Swift SDK exposes `ConvexClient.subscribe(to:with:yielding:)` returning `AnyPublisher<T, ClientError>`. This is fine, but:

1. SwiftUI views want `AsyncStream` or direct `@Observable` properties, not raw Combine.
2. Endpoint names are stringly-typed (`"db/savedRoutes:getSavedRoutesList"`). We want enums and typed args to prevent typos.
3. We need a single place to catch errors, route them to `ToastCenter`, and surface offline state.
4. We need typed Decodable models that match the Convex backend types (e.g. `SavedRouteDetailView`, `PlannedRouteOptionsView`).

### 4.2 Architecture

```swift
@MainActor
@Observable
final class ConvexClient {
    enum ConnectionState: Equatable { case disconnected, connecting, connected, error(String) }

    private(set) var connectionState: ConnectionState = .disconnected

    private let inner: ConvexClientWithAuth<ClerkUser>
    private let auth: AuthService
    private var stateCancellable: AnyCancellable?

    init(auth: AuthService, deploymentURL: String = ConvexConfig.deploymentURL) {
        self.auth = auth
        let provider = ClerkAuthProvider(auth: auth)
        self.inner = ConvexClientWithAuth(deploymentUrl: deploymentURL, authProvider: provider)
    }

    func connect() async {
        connectionState = .connecting
        let result = await inner.loginFromCache()
        switch result {
        case .success: connectionState = .connected
        case .failure(let err): connectionState = .error(err.localizedDescription)
        }
        // Subscribe to web socket state for offline indicator
        stateCancellable = inner.watchWebSocketState().sink { [weak self] state in
            // map to ConnectionState
        }
    }

    // Generic typed query subscription
    func subscribe<T: Decodable & Sendable>(
        _ endpoint: ConvexQuery,
        args: [String: ConvexEncodable?] = [:],
        yielding: T.Type = T.self
    ) -> AsyncThrowingStream<T, Error> {
        AsyncThrowingStream { continuation in
            let cancellable = inner.subscribe(to: endpoint.rawValue, with: args, yielding: T.self)
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let err) = completion { continuation.finish(throwing: err) }
                        else { continuation.finish() }
                    },
                    receiveValue: { value in continuation.yield(value) }
                )
            continuation.onTermination = { _ in cancellable.cancel() }
        }
    }

    // Typed mutations
    func mutation<T: Decodable & Sendable>(_ endpoint: ConvexMutation,
                                           args: [String: ConvexEncodable?] = [:]) async throws -> T {
        try await inner.mutation(endpoint.rawValue, with: args)
    }

    func mutation(_ endpoint: ConvexMutation, args: [String: ConvexEncodable?] = [:]) async throws {
        try await inner.mutation(endpoint.rawValue, with: args)
    }

    // Typed actions
    func action<T: Decodable & Sendable>(_ endpoint: ConvexAction,
                                         args: [String: ConvexEncodable?] = [:]) async throws -> T {
        try await inner.action(endpoint.rawValue, with: args)
    }

    func action(_ endpoint: ConvexAction, args: [String: ConvexEncodable?] = [:]) async throws {
        try await inner.action(endpoint.rawValue, with: args)
    }
}

enum ConvexQuery: String {
    case listSessions          = "db/planningSessions:listSessions"
    case listMessages          = "db/sessionMessages:list"
    case activeRoutePlans      = "db/routePlans:getActiveRoutePlansForSession"
    case savedRoutesList       = "db/savedRoutes:getSavedRoutesList"
    case savedRouteDetail      = "db/savedRoutes:getSavedRouteDetail"
    case favoriteRoadsList     = "db/favoriteRoads:list"
    case planInit              = "db/routesPlan:getPlanInit"
    case enrichmentStatus      = "db/route_enrichments:getEnrichmentStatus"
}

enum ConvexMutation: String {
    case createSession         = "db/planningSessions:createSession"
    case saveRoute             = "db/savedRoutes:saveRoute"
    case renameRoute           = "db/savedRoutes:renameRoute"
    case softDeleteRoute       = "db/savedRoutes:softDeleteRoute"
    case undoDeleteRoute       = "db/savedRoutes:undoDeleteRoute"
    case cancelPlan            = "db/routePlans:cancelPlan"
}

enum ConvexAction: String {
    case sendMessage           = "actions/agent/sendMessage:sendMessage"
    case planRide              = "actions/agent/planRide:planRide"
}
```

### 4.3 `ClerkAuthProvider` (the bridge)

Conforms to `ConvexMobile.AuthProvider`. Returned by `AuthService` so the `AppState` can construct the `ConvexClientWithAuth`.

```swift
final class ClerkAuthProvider: AuthProvider {
    typealias T = ClerkUser

    private let auth: AuthService

    init(auth: AuthService) { self.auth = auth }

    func login(onIdToken: @Sendable @escaping (String?) -> Void) async throws -> ClerkUser {
        let user = try await auth.signInInteractive()
        let token = try await auth.getJWT()
        onIdToken(token)
        return user
    }

    func loginFromCache(onIdToken: @Sendable @escaping (String?) -> Void) async throws -> ClerkUser {
        guard let user = await auth.restoreFromCache() else {
            throw AuthError.noCachedSession
        }
        let token = try await auth.getJWT()
        onIdToken(token)
        return user
    }

    func logout() async throws { try await auth.signOut() }

    func extractIdToken(from authResult: ClerkUser) -> String { authResult.cachedJWT }
}
```

### 4.4 Decodable models

We do **not** auto-generate Swift types from the Convex schema in v3. Hand-write the subset of types iOS consumes, kept in `ios/LaneShadow/Convex/Models/`. They mirror the existing `Sandbox/MockProviders/NavigatorDomain.swift` shapes, with field-name fidelity to the backend.

| Model | Backend source | Used by |
|---|---|---|
| `PlanningSession` | `planning_sessions` table | Sessions screen |
| `SessionMessage` | `session_messages` table | Planning, RouteResults |
| `RoutePlan` | `route_plans` table | RouteResults, RouteDetails |
| `PlannedRouteOptions` | `routePlanResult` (in route_plans.result) | RouteResults |
| `SavedRoute` (list view) | `saved_routes` (subset for list) | SavedRoutesList |
| `SavedRouteDetail` (full view) | `saved_routes` + enrichment join | SavedRouteDetail |
| `FavoriteRoad` | `favorite_roads` | Plan ride sheet |
| `EnrichmentStatus` | `route_enrichments` | RouteDetails badge |
| `RouteSnapshot`, `RouteIndex`, `SnapshotMeta`, `PlanInput` | nested types in `saved_routes` | Save flow |

The existing `NavigatorDomain.swift` types (Route, Session, NavigatorMessage, RouteAttachment, etc.) are **fixture types** for the sandbox. The integration sprint introduces a **parallel set** of Convex-backed types in `Convex/Models/`. The screens then have an **adapter layer** that converts Convex types → Navigator domain types — see Section 5 per-screen wiring.

### 4.5 Reactive view bindings

Pattern for a screen that subscribes to a query:

```swift
@MainActor
@Observable
final class SessionsViewModel {
    private(set) var sessions: [PlanningSession] = []
    private(set) var loadState: LoadState = .idle

    private let convex: ConvexClient
    private var subscriptionTask: Task<Void, Never>?

    init(convex: ConvexClient) { self.convex = convex }

    func subscribe() {
        subscriptionTask?.cancel()
        loadState = .loading
        subscriptionTask = Task { [weak self] in
            guard let self else { return }
            do {
                for try await sessions in convex.subscribe(.listSessions, yielding: [PlanningSession].self) {
                    guard !Task.isCancelled else { return }
                    self.sessions = sessions
                    self.loadState = .loaded
                }
            } catch {
                self.loadState = .error(error.localizedDescription)
            }
        }
    }

    deinit { subscriptionTask?.cancel() }
}
```

Each screen owns its `*ViewModel` as `@State` and calls `viewModel.subscribe()` from `.task { … }`. **Subscriptions auto-cancel when the view disappears** because the `Task` is owned by the `@State` instance and `deinit` cancels it.

---

## 5. Per-Screen Wiring Plan

This section maps each existing v2 screen to the Convex queries/mutations it needs, the mock provider methods being replaced, and the migration path.

### 5.1 IdleScreen

**File**: `ios/LaneShadow/Views/Templates/IdleScreen.swift` (existing, lines 8-152)

| Aspect | Mock (current) | Live (target) |
|---|---|---|
| Greeting meta ("FRIDAY · 68°F · CLEAR") | `IdleMockProvider.value().greeting.meta` | Compose from `Date()` + reverse-geocoded location + current weather (use existing weather endpoint or skip weather for v3) |
| Greeting headline | static string | Static or per-time-of-day string. **Defer** server-driven copy to v4. |
| Suggestion chips | `IdleMockProvider.value().suggestions` | Hardcode `IDLE_SUGGESTIONS` array (mirrors RN — "Plan a scenic ride", "Ride to the coast", etc.). Defer dynamic chips. |
| Location context badge | `IdleMockProvider.value().locationContext` | `LocationService.currentPlaceLabel` (reverse-geocode of GPS) |
| Map | `LinearGradient` placeholder | `LSMap(mode: .interactive, camera: SessionStore.camera ?? defaultSF, showFavorites: true)` |
| Send button | Closure stub | `await chatStore.sendPlanningMessage(text, currentLocation: location.current)` |
| Suggestion tap | Updates `chatInputValue` | Same, then send |
| Menu button | Stub | `appPath.append(.sessions)` to push SessionsScreen |

**Migration path**:

1. Replace `IdleMockProvider.value(variant:)` with an `IdleViewModel` that exposes the same shape via a struct `IdleScreenState` (rename the mock type or keep the same name and make the VM produce it). The view body changes only one line: `private let state = viewModel.state` instead of `state = provider.value(...)`.
2. Pull `LSMap(...)` directly into the `mapView` body — replacing the placeholder gradient.
3. Wire `LSChatInput.onSend` to `chatStore.sendPlanningMessage`. When `ChatStore.flowState` transitions out of `.idle`, the parent `HomeScreen` swaps the body to `PlanningScreen` (Section 5.2).

**New file**: `ios/LaneShadow/Views/Templates/IdleScreen+ViewModel.swift` (or inline as nested type).

### 5.2 PlanningScreen

**File**: `ios/LaneShadow/Views/Templates/PlanningScreen.swift` (existing, 311 lines)

| Aspect | Mock | Live |
|---|---|---|
| Phase indicator | Static phases array, `activePhase` int prop | Subscribe to `.listMessages` for `sessionId`; map message status (`running`/`streaming`/`complete`) to LSPhaseIndicator phases. The Convex agent emits `thinkingSteps` per message that we render directly. |
| Header text ("Three loops are forming…") | `phaseHeader` switch on `activePhase` | Use the agent's most recent thinking step `step.label`, or if none, fallback to `"Let me think on that…"` |
| Sketching polyline animation | `SketchingPolyline` view (decorative) | **Keep as-is** — it's a visual indicator that the agent is working. Continues to animate while `flowState == .planning`. |
| Cancel button (chat input) | Stub | `await chatStore.cancel()` → fires `cancelPlan` mutation, transitions to `.idle` or `.routeResults` |

**Trigger to leave PLANNING**:

```swift
// PlanningViewModel watches active route plans
for try await plans in convex.subscribe(.activeRoutePlans, args: ["sessionId": sessionId], yielding: [RoutePlan].self) {
    if let completed = plans.first(where: { $0.status == "completed" }), let result = completed.result {
        chatStore.dispatch(.planningSuccess(result))
    } else if let failed = plans.first(where: { $0.status == "failed" }) {
        chatStore.dispatch(.planningError(failed.errorMessage ?? "Planning failed"))
    }
}
```

This mirrors `useActiveSessionRoute` in RN.

### 5.3 RouteResultsScreen

**File**: `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` (existing, 259 lines)

| Aspect | Mock | Live |
|---|---|---|
| 3 polylines | `state.routes` from `RouteResultsMockProvider` | `chatStore.flowState.routeOptions.options` mapped to `[PolylineData]` |
| Polyline decoding | Hardcoded triangle in `decodePolyline(_:)` | Use existing polyline-decode helper. **Note**: `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` line 131 has a placeholder decoder — must be replaced. **Action**: port `react-native/shared/lib/polyline.ts` decoder logic to Swift in `Convex/Polyline.swift` (or use an existing Swift lib like `Polyline` from cocoapods/SPM if approved). |
| Navigator message body | static prose | The most recent assistant message body from `.listMessages` — first non-thinking-only `agent` message |
| Tap card → details | Stub `onSelect` | `chatStore.dispatch(.selectRoute(routeId))` → flowState transitions to `.routeDetails`, parent re-renders to `RouteDetailsScreen` |
| Refine chat input | Stub `onSend` | `await chatStore.sendPlanningMessage(text, currentLocation:)` — reuses session, transitions back to `.planning` |
| Pin / dismiss Navigator message | Stub | `pinned` flag is currently a mock-level concept; **defer** server-side pin to v4. Use local `@State var pinned: Bool` for now. |

**Polyline animation timing**: The current `startRouteDrawAnimation()` (line 141) uses `DispatchQueue.main.asyncAfter`. **Refactor to `Task { try await Task.sleep(...) }`** for Swift 6 concurrency safety.

### 5.4 RouteDetailsScreen

**File**: `ios/LaneShadow/Views/Templates/RouteDetailsScreen.swift` (existing, 134 lines)

This screen has **two roles** in the live app:

1. **Inline details** (in the chat flow, after selecting a route from Results) — shown via `flowState == .routeDetails`, no NavigationStack push.
2. **Saved-route details** (browsing a previously bookmarked route) — pushed via `appPath.append(.savedRouteDetail(id))`.

These have different data sources but share the same view (or the same composition of LSRouteSheet + LSMap).

| Aspect | Mock | Live (Inline) | Live (Saved) |
|---|---|---|---|
| Route geometry | Hardcoded coords | `flowState.routeOptions.options[selected]` | `convex.subscribe(.savedRouteDetail, args: ["savedRouteId": id])` |
| Weather timeline | `data.weatherTimeline` | Pulled from `EnrichmentStatus.result.weather` | Same |
| Save button | Stub | Open `SaveFavoriteSheet` → `convex.mutation(.saveRoute, ...)` | Disabled (already saved) |
| Ride button | Stub | **Defer** — RN's NAVIGATION_EXPORT is rarely used. Stub for v3, hide or grey out. | Stub, same |
| Best badge | static `data.route.isBest` | `selectedRoute.isBest` from PlannedRouteOption | `savedRoute.routeSnapshot.isBest` |

**Approach**: keep one `RouteDetailsScreen` view, parameterize it by an enum:

```swift
enum RouteDetailsSource {
    case planning(routeOptions: PlannedRouteOptions, selectedId: String)
    case saved(savedRouteId: String)
}

public struct RouteDetailsScreen: View {
    let source: RouteDetailsSource
    @State private var viewModel: RouteDetailsViewModel
    init(source: RouteDetailsSource, convex: ConvexClient) {
        self.source = source
        self._viewModel = State(initialValue: RouteDetailsViewModel(source: source, convex: convex))
    }
    // ...
}
```

The VM subscribes to the right query based on `source`. The view body is the same: `LSMap` + `LSRouteSheet` (existing).

### 5.5 SessionsScreen

**File**: `ios/LaneShadow/Views/Templates/SessionsScreen.swift` (existing, 132 lines)

| Aspect | Mock | Live |
|---|---|---|
| Session list | `SessionsMockProvider.value().sessions` | `convex.subscribe(.listSessions, yielding: [PlanningSession].self)` |
| Active session highlight | `state.activeSessionId` | `chatStore.flowState.sessionId` (where applicable) or `sessionStore.lastViewedSessionId` |
| Group label ("THIS WEEK") | static | Compute from `session.createdAt` (today / yesterday / this week / older) |
| Tap session | `onSelect(id)` stub | `await chatStore.loadSession(id)` then `appPath.removeLast()` to pop back to Home; `sessionStore.setLastViewedSession(id)` |
| New button | `onNew` stub | `chatStore.dispatch(.newSession)` then pop to Home |
| Drawer dismiss (scrim tap) | Animates out + `onDismiss()` | Same, plus `appPath.removeLast()` if pushed |

**Loading session detail**: when user taps a session, we need its associated route plan. The `loadSession` flow:

```swift
func loadSession(_ sessionId: String) async {
    let plans: [RoutePlan] = try await convex.action(...)  // or one-shot query
    guard let plan = plans.first, let result = plan.result else {
        dispatch(.newSession)
        return
    }
    dispatch(.loadSession(sessionId: sessionId, options: result, selectedRouteId: nil))
}
```

Convex query subscriptions are streaming, but we can also do a one-shot `await` with `.first()` on the publisher if we just want the latest snapshot.

### 5.6 ErrorScreen

**File**: `ios/LaneShadow/Views/Templates/ErrorScreen.swift` (existing, 127 lines)

| Aspect | Mock | Live |
|---|---|---|
| Error body / detail | `ErrorMockProvider.value().error` | `flowState.error.errorMessage` (when `flowState == .error`) |
| Suggestion chips | `state.suggestions` | Static array of recovery prompts. Defer server-driven recovery suggestions. |
| Retry via chat input | Stub | `await chatStore.sendPlanningMessage(text)` — same path as fresh send; the reducer handles error → planning transition |
| Suggestion tap | Stub | Sets `chatInputValue` and immediately sends |

**ErrorScreen shows when**: `chatStore.flowState == .error(_)`. The parent `HomeScreen` switch picks this branch.

### 5.7 HomeScreen wrapper

**New file**: `ios/LaneShadow/Views/Screens/HomeScreen.swift`

```swift
struct HomeScreen: View {
    @State private var chatStore: ChatStore
    @Environment(AppState.self) private var appState

    init(appState: AppState) {
        self._chatStore = State(initialValue: ChatStore(convex: appState.convex))
    }

    var body: some View {
        switch chatStore.flowState {
        case .idle:           IdleScreen(viewModel: IdleViewModel(...))
        case .planning:       PlanningScreen(viewModel: PlanningViewModel(...))
        case .routeResults:   RouteResultsScreen(viewModel: RouteResultsViewModel(...))
        case .routeDetails:   RouteDetailsScreen(source: .planning(...))
        case .sessionHistory: EmptyView() // pushed as separate destination instead
        case .error:          ErrorScreen(viewModel: ErrorViewModel(...))
        }
    }
}
```

This is the single screen that lives at `AppRoute.home`. **No tabs** — RN had a tab bar that was hidden via `display: 'none'`. We don't reproduce the tab bar; settings/saved-routes are pushed onto the stack instead.

---

## 6. Missing UI Surfaces (No v2 Equivalent)

For each surface below, the table lists what design tokens/atoms/molecules suffice and what new components are needed. **Most of these compose existing v2 atoms — very few brand-new components are required.**

| Surface | New file | Atoms / Molecules used | New components needed |
|---|---|---|---|
| **SignInScreen** | `Auth/Views/SignInScreen.swift` | `LSAuthCard`, `LSTextField`, `LSButton`, `LSText`, `LSDivider`, `LSIcon` | Auth-screen background image asset (`login_background`); Apple/Google logo assets in `Assets.xcassets` if not present |
| **SignUpScreen** | Reuses SignInScreen with `step == .signUp` | Same as SignIn | None |
| **OAuthLoadingScreen** | `Auth/Views/OAuthLoadingScreen.swift` | `LSSpinner`, `LSText`, `LSButton` (Cancel) | None |
| **SavedRoutesListScreen** | `Views/Screens/SavedRoutesListScreen.swift` | `LSListRow`, `LSCard`, `LSEmptyState`, `LSToolbar` (search bar slot), `SearchBar` molecule, `LSPill` (filter chips) | `SwipeActionRow` if we want swipe-to-delete (or use SwiftUI's `.swipeActions`) |
| **SavedRouteDetailScreen** | Reuse `RouteDetailsScreen` with `source: .saved` | Same as v2 RouteDetailsScreen | None |
| **SettingsScreen** | `Views/Screens/SettingsScreen.swift` | `LSListRow`, `LSToggle`, `LSButton`, `LSDivider`, `SectionHeader` | `ThemePicker` segmented control (3 mini phone cards in RN — for v3, simpler 3-button segmented control is fine) |
| **OfflineRegionsListScreen** | `Views/Screens/OfflineRegionsListScreen.swift` | `LSListRow`, `LSEmptyState`, `LSButton`, `DownloadProgressBanner` (existing molecule) | None |
| **OfflineRegionSelectorScreen** | `Views/Screens/OfflineRegionSelectorScreen.swift` | `LSMap` (with bounds-rectangle overlay), `LSButton`, `LSFormField` (region name) | `MapBoundsRectangleOverlay` — a draggable rectangle on top of the map. **This is the only new map atom needed.** Use `MapboxMaps.PolygonAnnotation` to draw a 4-corner rectangle. |
| **SaveFavoriteSheet** | `Views/Sheets/SaveFavoriteSheet.swift` | `LSBottomSheet` (existing), `LSFormField`, `BottomSheetInput` (existing), `LSButton`, `LSIcon` | None — this is purely a composition |
| **PlanRideSheet** (manual mode) | `Views/Sheets/PlanRideSheet.swift` | `LSBottomSheet`, `LSFormField`, `LocationInput`, `DepartureTimeSelector`, `LSToggle`, `LSPill` (favorite roads), `LSButton` | None — every needed molecule already exists |
| **DevMenu** | `Views/Sheets/DevMenu.swift` (DEBUG only) | `LSListRow`, `LSButton` | None |

**Auth-screen background**: RN uses `assets/images/login_background.png`. **Action**: copy that file to `ios/LaneShadow/Assets.xcassets/login_background.imageset/` (with `Contents.json` for 1x/2x/3x). Verify it renders at iPhone screen sizes.

**Apple/Google logos**: SF Symbols includes `applelogo`. Google does NOT have an SF Symbol — we need to add a Google `G` logo to `Assets.xcassets/google_logo.imageset/` (Google has brand-asset rules — use their official monochrome SVG converted to PDF for Asset Catalog).

---

## 7. Persistence Strategy

### 7.1 UserDefaults

| Key | Type | Owner | Purpose |
|---|---|---|---|
| `laneshadow.session.v1` | JSON blob | `SessionStore` | `defaultCamera`, `cameraBySession`, `lastViewedSessionId` |
| `laneshadow.settings.v1` | JSON blob | `SettingsStore` | `themeMode`, `hasCompletedOnboarding` |
| `laneshadow.devmenu` | bool dict | `DevMenu` (DEBUG) | Feature flags |

Serialize as a single `Codable` snapshot per store. Bump the `.v1` suffix if the schema breaks (allows graceful drop on old data).

### 7.2 Keychain

Clerk SDK manages its own Keychain entries. We do **not** add our own. If a future feature needs a secret (e.g., Mapbox download access tokens beyond the public one), add a `Keychain.swift` wrapper at that point.

### 7.3 SwiftData / Core Data

**Decision: do NOT use SwiftData or Core Data in v3.**

Reasoning:
- Convex SDK already caches query results in memory between subscription updates (the WebSocket `convex-rs` core handles this).
- The RN app has no offline cache for sessions/routes — feature parity does not require it.
- All data the user creates is server-authoritative. Adding a local mirror introduces consistency bugs for marginal offline benefit.
- Mapbox manages its own offline tile storage via `TileStore`.

If a future version wants offline-viewable saved routes, add SwiftData then. **Not now.**

### 7.4 File system

- **Mapbox tile storage** is owned by Mapbox SDK (`TileStore` writes to its own directory in Application Support).
- **Image cache**: SwiftUI's `AsyncImage` is sufficient for avatar/login background; no custom cache.
- **Model files** (local LLM): out of scope per signal #3.

---

## 8. Mapbox Integration Tasks

### 8.1 What `LSMap` already does

`ios/LaneShadow/Views/Atoms/LSMap.swift` (500 lines) and `LSMapUIViewRepresentable.swift` already render:
- Style URI switching (light/dark via `colorScheme`)
- `mode: .preview | .interactive` (gestures on/off)
- `cameraFit: .static | .polyline | .polylines` (with padding tokens)
- Multiple polylines with `RouteVariant` (best, alt1, alt2, custom)
- Annotations (start, end, waypoint)
- Tap callback `onTap: ((LatLng) -> Void)?`
- Offline-aware fallback views for missing token / no network

This is **already production-grade**. The integration sprint adds wiring, not new map primitives, with one exception (region-selector rectangle overlay — Section 6).

### 8.2 Camera persistence per session

```swift
// In HomeScreen / IdleScreen
LSMap(
    mode: .interactive,
    camera: sessionStore.camera(for: chatStore.activeSessionId)?.toCameraPosition()
            ?? .default,
    cameraFit: .static,
    polylines: livePolylines,
    onTap: { _ in /* deselect search results */ }
)
.onCameraMove { newCamera in     // hypothetical hook — see 8.2.1
    sessionStore.setCamera(
        sessionId: chatStore.activeSessionId,
        slot: CameraSlot(centerLat: newCamera.center.lat,
                         centerLon: newCamera.center.lon,
                         zoom: newCamera.zoom)
    )
}
```

#### 8.2.1 Camera-move callback (gap)

`LSMap` does **not currently expose** an `onCameraMove` callback. **Action: add one.** The Mapbox `MapView` exposes `mapboxMap.onCameraChanged` — wire it through `LSMapUIViewRepresentable.Coordinator` and surface as a `LSMap` parameter. Keep it optional so existing callers (sandbox stories) don't change.

This is the single biggest map-atom gap; budget half a day in week 1 to close it.

#### 8.2.2 isProgrammaticMoveRef pattern

The RN code uses `isProgrammaticMoveRef.current = true` before programmatic camera changes (e.g., switching sessions) so the move callback skips persistence. Mirror this with a `@State var suppressNextCameraSave: Bool` in HomeScreen. When session changes, set true; the next camera-move callback ignores and resets to false.

### 8.3 Multiple polyline rendering

**Already supported**. `RouteResultsScreen` line 79 builds `[PolylineData]` from mock data; live integration just changes the source. The `cameraFit: .polylines(padding: .spacing4)` already calls `mapView.camera.fitToCoordinates(...)` correctly.

### 8.4 Offline region download UI

**New work**:

| File | Purpose |
|---|---|
| `Mapbox/OfflineRegionService.swift` | `@Observable` wrapper over `MapboxMaps.OfflineManager` and `TileStore`. Methods: `downloadRegion(name:bounds:)`, `cancelDownload(_:)`, `removeRegion(_:)`, `listRegions() -> [OfflineRegion]`. Exposes `progressByRegion: [String: Double]`. |
| `Views/Screens/OfflineRegionsListScreen.swift` | Lists existing regions; "Add region" button pushes selector |
| `Views/Screens/OfflineRegionSelectorScreen.swift` | Map + draggable rectangle + "Download" button |

**Mapbox API surface**:
- `OfflineManager.loadStylePack(for:loadOptions:progress:completion:)` — downloads style assets
- `TileStore.shared(for:).loadTileRegion(forId:loadOptions:progress:completion:)` — downloads vector tiles for a bounding-box geometry
- `TileStore.shared(for:).allTileRegions(completion:)` — list existing
- `TileStore.shared(for:).removeTileRegion(forId:)` — delete

**Design**: regions are user-named (e.g., "Big Sur Coast"). Each region downloads:
1. Style pack (one global, shared across regions; downloaded once)
2. Tile region with bounding-box geometry derived from the user's drawn rectangle

**Progress UI**: reuse existing `DownloadProgressBanner` and `DownloadProgressIndicator` molecules. They were built for the (now-cut) model download UI but work fine for tile downloads.

### 8.5 Long-press segment handler

The RN `RoutePolyline` component supports `onLongPress` to open `SaveFavoriteSheet` on a specific waypoint. **iOS implementation**:

`LSMap.onTap` already exists. Add `onLongPress: ((LatLng) -> Void)?` parameter that hooks `UILongPressGestureRecognizer` on the underlying `MapView`. Forward the lat/lng of the touch point.

In `RouteResultsScreen` and `RouteDetailsScreen`, wire `onLongPress` to `appState.toasts.push(.savePromptAt(latLng))` or directly open a sheet. Decision: keep it simple in v3 — long-press opens `SaveFavoriteSheet` to save the *whole route*, not just a segment. Defer per-segment favorites to v4 (the `favorite_roads` table supports it but the UX is more complex).

### 8.6 Search markers

The `LocationSearchCard` molecule (existing) needs a service backing it: `MapboxSearchService` using Mapbox Search SDK or the Geocoding API.

**File**: `ios/LaneShadow/Mapbox/MapboxSearchService.swift`

```swift
@Observable
final class MapboxSearchService {
    private(set) var results: [SearchResult] = []
    private(set) var selectedId: String?

    func autocomplete(_ query: String, near: LatLng?) async {
        // Use mapbox-search-ios SDK (separate SPM) OR the Geocoding API directly:
        // https://api.mapbox.com/search/searchbox/v1/suggest?q={query}&access_token={token}&proximity={lat,lon}
    }
}
```

Mapbox Search SDK for iOS exists (`mapbox-search-ios`) but is a separate SPM dep. Decision: **use the Geocoding REST API directly** (URLSession + JSON) — fewer dependencies, simpler to debug, sufficient for autocomplete. Add SDK in v4 only if richer features are needed.

---

## 9. Background Tasks

### 9.1 Mapbox offline downloads in background

Use `BGProcessingTaskRequest` to allow tile downloads to continue when the user backgrounds the app during a download.

```swift
// In AppState.bootstrap or AppDelegate equivalent
BGTaskScheduler.shared.register(
    forTaskWithIdentifier: "com.laneshadow.app.tile-download",
    using: nil
) { task in
    Task {
        await offlineRegions.resumePendingDownloads()
        task.setTaskCompleted(success: true)
    }
}
```

**Info.plist additions**:
```xml
<key>BGTaskSchedulerPermittedIdentifiers</key>
<array>
    <string>com.laneshadow.app.tile-download</string>
</array>
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>processing</string>
</array>
```

**Note**: Realistically, users download a region while looking at the screen. Background-task support is nice-to-have; if it slips, a foreground-only download is acceptable for v3. **Mark as DEFERRABLE** in the cut sequence.

### 9.2 BGAppRefreshTask for enrichment polling

**Not needed.** Convex live queries push updates over WebSocket; when the app is foregrounded, subscriptions reconnect and pull fresh data. If the user wants notifications when an enrichment completes while backgrounded, that's a v4 push-notification feature.

### 9.3 Push notifications

**Out of scope for v3.** RN doesn't have them either.

---

## 10. Testing Strategy

### 10.1 Existing infrastructure to keep

- **Snapshot tests**: `swift-snapshot-testing` already wired. All v2 stories have golden PNGs. `pnpm snapshots:check` is non-bypassable per RULES.md.
- **Sandbox host**: every screen renders in the sandbox under multiple variants. Keep the sandbox stories pointing at `MockProvider` types — that's where the design system testing lives. **Do not gut mock providers.** Live wiring goes alongside, not in place of.
- **ViewInspector**: SPM dep already resolved. Available for view tree assertions.

### 10.2 New test layers

| Layer | Tool | Files | Coverage |
|---|---|---|---|
| **Pure reducer tests** | Swift Testing (iOS 17+) | `LaneShadowTests/ChatStoreReducerTests.swift` | Every `(state, action) → state'` transition; mirrors `use-ride-flow.test.ts` |
| **ViewModel unit tests** | Swift Testing | `LaneShadowTests/ViewModels/*Tests.swift` | Per-screen VMs with a stub `ConvexClient` (protocol-extracted) |
| **Convex integration tests** | XCTest (because async test setup) | `LaneShadowTests/Integration/ConvexClientIntegrationTests.swift` | Hit a **real Convex dev deployment** — see SUPREME RULE in global CLAUDE.md |
| **Auth integration tests** | XCTest | `LaneShadowTests/Integration/ClerkAuthTests.swift` | Real Clerk dev tenant — sign in with test account, fetch JWT, verify Convex accepts it |
| **Snapshot tests for new screens** | swift-snapshot-testing | `LaneShadowTests/Snapshots/*Tests.swift` | SignInScreen, SettingsScreen, SavedRoutesListScreen, OfflineRegionsListScreen, OfflineRegionSelectorScreen, SaveFavoriteSheet |
| **E2E** | XCUITest | `LaneShadowUITests/SignInFlowTests.swift`, `LaneShadowUITests/PlanRideFlowTests.swift` | 2 happy paths: (1) launch → sign in → see Idle; (2) sign in → send "Plan a ride" → see Planning → wait for routes → see RouteResults |

### 10.3 Convex integration — real services

Per the global SUPREME RULE: **integration tests must hit real services.**

Setup:
1. `ConvexConfig.test.deploymentURL` points to a dedicated test/dev deployment (e.g., `https://laneshadow-test.convex.cloud`). Provision via `npx convex dev --configure`.
2. Tests use a Clerk test user (email/password seeded). Credentials in env via Xcode scheme settings, **not committed** — read from `ProcessInfo.processInfo.environment["CLERK_TEST_EMAIL"]` etc.
3. Tests run sequentially (XCTest serial queue) to avoid mutating shared state across runs.
4. Each test uses a unique `sessionId` to isolate.
5. Cleanup: delete created planning_sessions and saved_routes in `tearDown`.

Example:
```swift
final class ConvexClientIntegrationTests: XCTestCase {
    var convex: ConvexClient!
    var auth: AuthService!

    override func setUp() async throws {
        auth = AuthService(test: true)
        try await auth.signIn(email: testEmail, password: testPassword)
        convex = ConvexClient(auth: auth, deploymentURL: testDeploymentURL)
        await convex.connect()
    }

    func test_createSession_andListSessions_returnsCreatedSession() async throws {
        let result: CreateSessionResponse = try await convex.mutation(
            .createSession,
            args: ["firstMessage": "Test ride"]
        )
        let sessions: [PlanningSession] = try await convex.subscribe(.listSessions)
            .first(where: { sessions in sessions.contains(where: { $0.id == result.sessionId }) })
        XCTAssertNotNil(sessions)
    }
}
```

### 10.4 Keep tests fast

- Snapshot + reducer + VM unit tests should run in <5s — these are the fast feedback loop.
- Convex integration tests are slow (real WebSocket); tag them and run only on CI / pre-push.

### 10.5 Lefthook

Existing `lefthook.yml` runs `xcodebuild ... build` on staged Swift. Add a `pre-push` hook that runs the unit-test target only (skip integration to keep pre-push fast). Integration runs on CI per PR.

---

## 11. Build & Deployment

### 11.1 SPM dependency additions

Update `ios/project.yml` `packages:` block:

```yaml
packages:
  ConvexMobile:
    url: https://github.com/get-convex/convex-swift
    from: 0.7.0
  Clerk:
    url: https://github.com/clerk/clerk-ios
    from: 0.30.0          # verify latest at time of implementation
  LaneShadowTheme:
    path: ../tokens/platforms/swift
  NativeSandbox:
    path: /Users/justinrich/Projects/native-sandbox/ios
  MapboxMaps:
    url: https://github.com/mapbox/mapbox-maps-ios
    from: 11.6.0
  SnapshotTesting:
    url: https://github.com/pointfreeco/swift-snapshot-testing
    from: 1.15.0
  ViewInspector:
    url: https://github.com/nalexn/ViewInspector
    from: 0.9.0
```

After editing, run `pnpm exec xcodegen generate` (or whatever the project's regenerate script is) — `lefthook` blocks commits with stale generated project. The check script is `scripts/ios/check-project-generated.sh`.

### 11.2 Configuration injection

| Config | Mechanism | File |
|---|---|---|
| Convex deployment URL | Codegen | `Generated/ConvexConfig.generated.swift` (already exists) |
| Mapbox access token | Codegen | `Generated/MapboxConfig.generated.swift` (already exists) |
| **Clerk publishable key** | Codegen — new file | `Generated/ClerkConfig.generated.swift` |

The Clerk publishable key is **not a secret** (it's safe to ship in the binary). Add to the same codegen script that produces `ConvexConfig.generated.swift`. Source from `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` env (matches RN env var name) or a new `IOS_CLERK_PUBLISHABLE_KEY`.

**Action**: locate the existing token-codegen script (likely `tokens/scripts/` per `ios-current-state.md` section 4) and add a Clerk-config emitter. **Or** add a small new `ios/LaneShadow/Scripts/generate-clerk-config.sh`.

### 11.3 Info.plist additions

Append to existing `Info.plist`:

```xml
<!-- Mapbox runtime config -->
<key>MBXAccessToken</key>
<string>$(MAPBOX_ACCESS_TOKEN)</string>          <!-- already in Generated; resolve via xcconfig -->

<!-- Background tasks (Section 9) -->
<key>BGTaskSchedulerPermittedIdentifiers</key>
<array><string>com.laneshadow.app.tile-download</string></array>
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>processing</string>
</array>

<!-- Location (Section 5.1) -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>LaneShadow uses your location to plan rides from where you are and to show local conditions.</string>

<!-- Deep links -->
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>laneshadow-sandbox</string>      <!-- existing -->
            <string>laneshadow</string>              <!-- new for OAuth callback / future deep links -->
        </array>
    </dict>
</array>
```

### 11.4 Code signing & App Store

- Bundle ID: `com.laneshadow.app` (existing, no change).
- **Sign in with Apple** capability is required since SignInScreen offers Apple OAuth. Add to Signing & Capabilities. (Apple's App Store Review Guideline 4.8 mandates SIWA whenever third-party social logins are offered — we're already in scope by adding Google.)
- App Store metadata (screenshots, description) is unchanged for v3 — existing record in App Store Connect.

### 11.5 Asset audit

Per the planner protocol, audit assets explicitly:

| Asset | Location | Status | Fix required |
|---|---|---|---|
| **Login background** (PNG, 3 scales) | `Assets.xcassets/login_background.imageset/` | Missing — RN has it; iOS has not yet copied | Copy from `react-native/assets/images/login_background.png`, generate @1x/@2x/@3x with sips |
| **Google logo** (PDF/SVG) | `Assets.xcassets/google_logo.imageset/` | Missing | Add Google's official monochrome `G` (per brand guidelines) |
| **Apple logo** | SF Symbol `applelogo` | Built-in | None |
| **Fonts** | Already registered? | **Verify** in `LaneShadowFontRegistry.swift` and `Info.plist` `UIAppFonts` | If custom fonts are referenced in tokens but not registered, they fall back silently — audit and add `UIAppFonts` entries before live wiring lands |
| **Map markers** (start, end, waypoint pins) | Drawn programmatically in `LSMapUIViewRepresentable` | Complete | None |

**Action item**: run a one-time grep to catch hardcoded `Color(red:green:blue:)` or `Color.blue`/`.red` in Auth and new screens — none should exist. Reuse `theme.colors.*` everywhere.

---

## 12. Cut Sequence (Per Signal #4 — Android May Be Cut)

### 12.1 What "cut Android" means for iOS

If Android is cut, the iOS path **does not change**. The iOS plan stands on its own — there are no Android-pair tasks in the iOS sprint plan that would otherwise be dropped.

The only impact is on the **sprint cadence around cross-platform validation**:
- The parity manifest (`pnpm snapshots:check`) which compares iOS and Android sandbox stories becomes moot.
- The `cross-platform-component-parity` workflow in RULES.md no longer applies for new screens.
- iOS can ship without waiting on Android sandbox stories for new auth/saved-routes/offline screens.

### 12.2 Per-feature cut order (if 6 weeks proves too tight even for iOS)

If iOS itself cannot fit feature parity in 6 weeks, cut from the bottom of this list **first** (i.e., these are the items shipped last and are safest to drop):

1. **Background tile downloads** (Section 9.1) — foreground-only acceptable
2. **Long-press segment save** (Section 8.5) — long-press just opens save-route flow on the whole route in v3
3. **NAVIGATION_EXPORT phase** of the chat flow (rarely used in RN)
4. **DevMenu** (Section 6) — replace with hardcoded debug-build conditionals
5. **OfflineRegionSelectorScreen** + **OfflineRegionsListScreen** (Section 8.4) — push to v4
6. **PlanRideSheet** (manual mode) — RN's manual planning flow is a fallback that the chat-driven flow makes redundant for most users
7. **Saved-route soft-delete + undo** — mutation exists; UX simplifies to permanent delete in v3

Items 1-3 are safe drops. Items 4-7 are noticeable feature gaps; flag with the user before cutting.

### 12.3 Hard floor (cannot cut)

Must-ship for v3 to be useful:
- Auth (sign in / out)
- Convex live queries for sessions + messages + route_plans + saved_routes
- IdleScreen → PlanningScreen → RouteResultsScreen → RouteDetailsScreen flow with real data
- Save route mutation + SavedRoutesListScreen + SavedRouteDetailScreen
- SettingsScreen with theme picker + sign-out
- SessionsScreen with session switching

Without these, v3 is a sandbox with auth bolted on — not feature parity.

---

## 13. Risk Inventory

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | **Clerk-iOS SDK gaps** (e.g., missing OAuth provider, broken custom token templates) | Medium | High — auth is week-1 work, blocks everything | Spike on day 1; fall back to `ASWebAuthenticationSession` + Clerk REST. Document in DECISIONS.md. Budget 2 days for the spike before committing. |
| 2 | **ConvexMobile reactivity edge cases** (e.g., subscription doesn't reconnect after backgrounding, JWT refresh races) | Medium | High | Convex Swift SDK 0.7 is recent; test backgrounding and 8-hour token expiry explicitly. Add a regression test in `ConvexClientIntegrationTests`. |
| 3 | **Mapbox offline UX** (downloading regions has many failure modes: no network mid-download, disk full, tile-pack quota) | Medium | Medium | Cut to v4 if needed (item 5 in cut sequence). MVP shows error toast + "retry" button without sophisticated recovery. |
| 4 | **Background download lifecycle** (BGTaskScheduler is unreliable on iOS — tasks may never fire) | High | Low | Treat as nice-to-have; don't depend on it for correctness. Foreground download path must always work. |
| 5 | **iOS 17 minimum** alienates older devices | Low | Low | Already established by current `IPHONEOS_DEPLOYMENT_TARGET: "17.0"` in `project.yml`. Confirm with PM; iOS 17+ covers ~95% of active iPhones in 2026. |
| 6 | **Polyline decoder fidelity** — RN uses `decodePolylineGeometry` from `shared/lib/polyline.ts`; iOS port may have rounding drift | Medium | Medium | Port the decoder verbatim; add round-trip unit tests with fixtures shared between iOS and the server (encode in TS, decode in Swift, assert equality within epsilon). |
| 7 | **Camera-move callback gap** in `LSMap` (Section 8.2.1) | Low | Medium — required for camera persistence | Schedule the API addition in week 1 before any screen wiring depends on it. |
| 8 | **Real Convex test deployment cost** for integration tests | Low | Low | Use the existing dev deployment; tests delete after themselves. |
| 9 | **Sandbox parity drift** — adding live wiring may tempt the implementer to skip sandbox stories for new screens | Medium | Medium — RULES.md mandates parity for sandbox-listed components; new screens should still ship sandbox stories | Bake into per-task acceptance criteria: "MockProvider variants exist; sandbox snapshot tests pass" alongside live integration. |
| 10 | **Chat-mode/map-mode crossfade** (RN line 75-99 in `(tabs)/index.tsx`) | Low | Low — defer | RN renders chat transcript and map separately and crossfades. v2 iOS doesn't have this overlay yet. Defer the chat-transcript overlay to v4; v3 displays only the bottom chat input above the map. |

---

## 14. File Inventory — New Files & Touched Files

### 14.1 New files

```
ios/LaneShadow/
├── App/
│   ├── RootView.swift                      # NEW — replaces ContentView routing
│   ├── AuthFlow.swift                      # NEW — NavigationStack for unauthenticated
│   ├── AppFlow.swift                       # NEW — NavigationStack for authenticated
│   ├── HomeScreen.swift                    # NEW — wraps the v2 Navigator screens with live state
│   └── AppState.swift                      # NEW — top-level @Observable
├── Auth/
│   ├── AuthService.swift                   # NEW — Clerk wrapper
│   ├── ClerkAuthProvider.swift             # NEW — Convex AuthProvider conformance
│   ├── ClerkConfig.swift                   # NEW — typed config + bridge to generated
│   └── Views/
│       ├── SignInScreen.swift              # NEW
│       └── OAuthLoadingScreen.swift        # NEW
├── Convex/
│   ├── ConvexClient.swift                  # NEW — replaces ConvexStore.swift
│   ├── Endpoints.swift                     # NEW — ConvexQuery/Mutation/Action enums
│   ├── Polyline.swift                      # NEW — decoder port from shared/lib/polyline.ts
│   └── Models/
│       ├── PlanningSession.swift           # NEW
│       ├── SessionMessage.swift            # NEW
│       ├── RoutePlan.swift                 # NEW
│       ├── PlannedRouteOptions.swift       # NEW
│       ├── SavedRoute.swift                # NEW
│       ├── FavoriteRoad.swift              # NEW
│       ├── EnrichmentStatus.swift          # NEW
│       └── PlanInput.swift                 # NEW
├── State/
│   ├── ChatStore.swift                     # NEW — @Observable rideflow + orchestration
│   ├── ChatStoreReducer.swift              # NEW — pure reducer (testable)
│   ├── SessionStore.swift                  # NEW — UserDefaults-backed camera cache
│   ├── SettingsStore.swift                 # NEW — UserDefaults-backed prefs
│   ├── ToastCenter.swift                   # NEW
│   └── LocationService.swift               # NEW — CLLocationManager wrapper
├── Mapbox/
│   ├── OfflineRegionService.swift          # NEW — TileStore wrapper
│   └── MapboxSearchService.swift           # NEW — Geocoding REST API
├── Views/
│   ├── ViewModels/                         # NEW directory
│   │   ├── IdleViewModel.swift
│   │   ├── PlanningViewModel.swift
│   │   ├── RouteResultsViewModel.swift
│   │   ├── RouteDetailsViewModel.swift
│   │   ├── SessionsViewModel.swift
│   │   └── ErrorViewModel.swift
│   ├── Screens/                            # NEW directory
│   │   ├── SavedRoutesListScreen.swift
│   │   ├── SettingsScreen.swift
│   │   ├── OfflineRegionsListScreen.swift
│   │   └── OfflineRegionSelectorScreen.swift
│   └── Sheets/                             # NEW directory
│       ├── SaveFavoriteSheet.swift
│       ├── PlanRideSheet.swift             # OPTIONAL per cut sequence
│       └── DevMenu.swift                   # DEBUG only
└── Generated/
    └── ClerkConfig.generated.swift         # NEW — emit publishable key
```

### 14.2 Modified files

| File | Modification |
|---|---|
| `ios/LaneShadow/App.swift` | Add `.environment(appState)`; route deep links through `AppState.handleDeepLink` (sandbox handler still wins in DEBUG) |
| `ios/LaneShadow/ContentView.swift` | **Delete** (or repurpose as `RootView.swift`) |
| `ios/LaneShadow/ConvexStore.swift` | **Delete** (replaced by `Convex/ConvexClient.swift`) |
| `ios/LaneShadow/Info.plist` | Add `laneshadow` URL scheme, `NSLocationWhenInUseUsageDescription`, `BGTaskSchedulerPermittedIdentifiers`, `UIBackgroundModes` |
| `ios/LaneShadow/Views/Atoms/LSMap.swift` | Add `onCameraMove`, `onLongPress` callbacks |
| `ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift` | Wire camera-move and long-press through Coordinator |
| `ios/LaneShadow/Views/Templates/IdleScreen.swift` | Inject `IdleViewModel`; replace `LinearGradient` placeholder with `LSMap`; wire onSend / onSuggestionTap to ChatStore |
| `ios/LaneShadow/Views/Templates/PlanningScreen.swift` | Inject `PlanningViewModel`; subscribe to messages + active route plans |
| `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` | Inject `RouteResultsViewModel`; replace placeholder polyline decoder; wire selection / refine |
| `ios/LaneShadow/Views/Templates/RouteDetailsScreen.swift` | Add `source: RouteDetailsSource`; subscribe based on source |
| `ios/LaneShadow/Views/Templates/SessionsScreen.swift` | Inject `SessionsViewModel`; subscribe to listSessions; wire onSelect/onNew |
| `ios/LaneShadow/Views/Templates/ErrorScreen.swift` | Inject `ErrorViewModel`; bind error from ChatStore.flowState |
| `ios/project.yml` | Add `Clerk` SPM dep; bump `MapboxMaps` if newer minor available |
| `ios/LaneShadow/Sandbox/MockProviders/*.swift` | **No changes** — keep mocks for sandbox stories |
| `tokens/scripts/...` | Add Clerk publishable key codegen entry |

### 14.3 Files NOT touched

The 60 atoms, 112 molecules, 13 organisms — **none change** in v3 except `LSMap` (one atom). The design system holds. This is a wiring sprint, not a redesign sprint.

---

## 15. Acceptance Criteria (Sprint-Level Highlights)

These are sprint-level ACs that subsequent task plans break down further. Each AC is testable.

### AC-1: Auth roundtrip
- **Given** the app is launched signed-out
- **When** user enters email + password (test account) and taps "Sign In"
- **Then** the app transitions to the Idle screen with the user's actual greeting and (where supported) location-based context bar.
- **Test**: XCUITest `SignInFlowTests.test_signIn_then_idle`.

### AC-2: Live planning roundtrip
- **Given** the app is on the Idle screen, user is signed in
- **When** user types "Plan a scenic ride" and taps Send
- **Then** the app transitions to PlanningScreen, the agent processes (≤30s), and the app transitions to RouteResultsScreen showing 1-3 polylines on the map.
- **Test**: XCUITest `PlanRideFlowTests.test_planRide_happyPath` against a real Convex dev deployment.

### AC-3: Save and re-view a route
- **Given** the user is on RouteDetailsScreen for a planned route
- **When** user taps Save, enters a name, and confirms
- **Then** the route appears in SavedRoutesListScreen, and tapping it opens SavedRouteDetailScreen with the same map polyline.
- **Test**: XCUITest plus integration test for `convex.mutation(.saveRoute, ...)`.

### AC-4: Session persistence across app launches
- **Given** the user has used the app and viewed a session, then killed and relaunched the app
- **When** the app finishes booting
- **Then** the app restores the last-viewed session and the last camera position for that session.
- **Test**: Integration test `SessionStoreIntegrationTests.test_lastViewed_restoresOnLaunch`.

### AC-5: Theme picker persists
- **Given** the user changes theme to "Light" in SettingsScreen
- **When** the user kills and relaunches
- **Then** the app boots in light mode regardless of system appearance.
- **Test**: Snapshot + persistence test on `SettingsStore`.

### AC-6: Offline region downloaded and used
- **Given** the user downloads a region "Big Sur Coast"
- **When** the user disables network and pans to that region
- **Then** tiles render from the offline cache (no blue empty tiles).
- **Test**: Manual test plus integration test verifying tiles persist through `TileStore.allTileRegions`.

### AC-7: Sandbox stories continue to pass
- **Given** all v2 sandbox stories pre-integration
- **When** v3 integration is complete
- **Then** `pnpm snapshots:check` passes with zero diffs (mock-driven stories never see live data).
- **Test**: snapshot CI gate.

### AC-8: Sign out clears state
- **Given** the user is signed in with cached sessions and saved routes visible
- **When** the user taps Sign Out in Settings
- **Then** the app returns to SignInScreen, in-memory caches clear, Convex client disconnects, but `UserDefaults` (theme, etc.) persists.
- **Test**: Integration test plus XCUITest.

---

## 16. Open Questions for the User

Before sprint kickoff, decide:

1. **Min iOS target**: confirm 17.0 (current) or raise/lower? Plan assumes 17.0.
2. **Clerk SDK vs custom OAuth**: approve the half-day spike on `clerk-ios` in week 1 with `ASWebAuthenticationSession` fallback, or pre-commit to one path?
3. **Manual PlanRideSheet**: include in v3 (week 5 work) or cut to v4? RN has it; usage is low.
4. **Background tile downloads**: include or defer? (Item 1 in cut sequence.)
5. **Notifications**: confirmed out of scope per discovery doc — restate in PRD?
6. **Clerk test account**: who provisions the dev tenant + test user creds? Where do test creds live (1Password? Xcode scheme env? CI secrets manager)?
7. **App Store SIWA capability**: confirm App Store Connect record will be updated in time for first TestFlight build with auth.
8. **Test Convex deployment**: dedicated test deployment, or shared dev? Dedicated avoids data pollution but costs setup time.

---

## 17. Six-Week Phasing (For PRD Reference)

| Week | Focus | Key deliverables |
|---|---|---|
| **1** | Foundations | `AppState`, `RootView`, `LSMap.onCameraMove`, ClerkSDK spike + decision, `AuthService` skeleton, `Generated/ClerkConfig` |
| **2** | Auth complete | SignInScreen with email + Apple + Google, OAuthLoadingScreen, `ClerkAuthProvider`, `ConvexClient.connect()` working with real JWT |
| **3** | Core loop wiring | Convex models + Polyline decoder; ChatStore reducer + tests; IdleScreen and PlanningScreen wired live; first end-to-end "send a message → see planning" |
| **4** | Route flow | RouteResultsScreen + RouteDetailsScreen wired; SaveFavoriteSheet; saveRoute mutation; SessionsScreen + session switching with camera persistence |
| **5** | Missing surfaces | SavedRoutesListScreen, SavedRouteDetailScreen, SettingsScreen, ErrorScreen polish, ToastCenter integration, optional PlanRideSheet |
| **6** | Offline + polish | OfflineRegionsListScreen, OfflineRegionSelectorScreen, background-download (if time), bug bash, snapshot regression sweep, integration test suite green, App Store TestFlight build |

Cut points:
- End of week 4: if behind, drop OfflineRegionSelector + PlanRideSheet (items 5-6 in cut sequence). v3 ships without offline downloads.
- End of week 5: if behind, drop background downloads + DevMenu (items 1, 4 in cut sequence).
- End of week 6: hard ship date; whatever is in must be production-ready.

---

## 18. Architecture Principles Recap

This plan adheres to the iOS Architecture Principles in `brain/docs/mobile-architecture/ios-principles.md`:

- **State scope**: per-view `@State`, screen-level `@Bindable` ViewModels, app-wide `@Environment(AppState.self)` injection.
- **Concurrency**: `@MainActor` on all UI-facing stores; async/await for I/O; structured task cancellation via `@State`-owned `Task`.
- **Data layer**: Repository pattern around `ConvexClient`, hand-written `Decodable` models, no SwiftData (Convex is the source of truth + cache).
- **Observation**: `@Observable` macro everywhere; no `ObservableObject`/`@Published` since min target is iOS 17.
- **Performance**: small body sizes per screen; ViewModels expose computed properties so SwiftUI invalidations are minimal; `LSMap` already heavily optimized via `UIViewRepresentable`.
- **Modular design**: every new screen reuses existing atoms/molecules from the v2 design system; **only one atom change required (`LSMap` callbacks).** No design-system regressions.

---

## Relevant absolute file paths (for downstream agents)

Key files referenced in this plan:

- `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/App.swift`
- `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/ContentView.swift`
- `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/ConvexStore.swift`
- `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Info.plist`
- `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Generated/ConvexConfig.generated.swift`
- `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Generated/MapboxConfig.generated.swift`
- `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/IdleScreen.swift`
- `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/PlanningScreen.swift`
- `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/RouteResultsScreen.swift`
- `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/RouteDetailsScreen.swift`
- `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/SessionsScreen.swift`
- `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/ErrorScreen.swift`
- `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Atoms/LSMap.swift`
- `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Molecules/AuthCard.swift`
- `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Molecules/LSChatInput.swift`
- `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Sandbox/MockProviders/NavigatorDomain.swift`
- `/Users/justinrich/Projects/LaneShadow/ios/project.yml`
- `/Users/justinrich/Projects/LaneShadow/convex/auth.config.ts`
- `/Users/justinrich/Projects/LaneShadow/convex/db/planningSessions.ts`
- `/Users/justinrich/Projects/LaneShadow/convex/db/savedRoutes.ts`
- `/Users/justinrich/Projects/LaneShadow/react-native/app/_layout.tsx`
- `/Users/justinrich/Projects/LaneShadow/react-native/app/(app)/_layout.tsx`
- `/Users/justinrich/Projects/LaneShadow/react-native/app/(auth)/sign-in.tsx`
- `/Users/justinrich/Projects/LaneShadow/react-native/app/(app)/(tabs)/index.tsx`
- `/Users/justinrich/Projects/LaneShadow/react-native/hooks/use-ride-flow.ts`
- `/Users/justinrich/Projects/LaneShadow/react-native/hooks/use-chat-planning.ts`
- `/Users/justinrich/Projects/LaneShadow/react-native/lib/clerk-token-cache.ts`
- `/Users/justinrich/Projects/LaneShadow/react-native/stores/chat-session-store.ts`
- `/Users/justinrich/Projects/LaneShadow/react-native/stores/settings-store.ts`
- `/Users/justinrich/Projects/LaneShadow/.spec/research/v3-integration-discovery/01-react-native-business-logic.md`
- `/Users/justinrich/Projects/LaneShadow/.spec/research/v3-integration-discovery/02-native-current-state.md`
- `/Users/justinrich/Projects/LaneShadow/RULES.md`
- `/Users/justinrich/Projects/LaneShadow/ios/build/DerivedData/SourcePackages/checkouts/convex-swift/Sources/ConvexMobile/ConvexMobile.swift` (SDK reference)
