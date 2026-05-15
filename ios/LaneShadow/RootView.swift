import Clerk
import SwiftUI

struct RootView: View {
    enum ActiveFlow {
        case auth
        case app
    }

    @Bindable var convexStore: ConvexStore
    @State private var appState: AppState
    @State private var hasBootstrappedAuth = true
    @Environment(\.appEnvironment) private var appEnvironment
    #if DEBUG
        @State private var didHandleUITestResetAuth = false
    #endif

    init(convexStore: ConvexStore, appState: AppState = AppState()) {
        _convexStore = Bindable(convexStore)
        _appState = State(initialValue: appState)
    }

    var body: some View {
        Group {
            #if DEBUG
                if Self.shouldRenderDirectIdleScreen() {
                    // Direct idle screen render for UI testing (bypass auth)
                    let viewModel = createDirectIdleViewModel()
                    IdleScreenContainer(viewModel: viewModel)
                } else if !hasBootstrappedAuth {
                    authBootstrapPlaceholder
                        .onAppear { NSLog("🟣 RootView.branch: authBootstrapPlaceholder appeared") }
                } else if activeFlow == .app {
                    authenticatedFlow
                        .onAppear { NSLog("🟣 RootView.branch: authenticatedFlow appeared") }
                } else {
                    AuthFlowView(
                        route: appState.authRoute,
                        appState: appState,
                        clerkAuth: appEnvironment.clerkAuth
                    )
                    .onAppear { NSLog("🟣 RootView.branch: AuthFlowView appeared") }
                }
            #else
                if !hasBootstrappedAuth {
                    authBootstrapPlaceholder
                        .onAppear { NSLog("🟣 RootView.branch: authBootstrapPlaceholder appeared") }
                } else if activeFlow == .app {
                    authenticatedFlow
                        .onAppear { NSLog("🟣 RootView.branch: authenticatedFlow appeared") }
                } else {
                    AuthFlowView(
                        route: appState.authRoute,
                        appState: appState,
                        clerkAuth: appEnvironment.clerkAuth
                    )
                    .onAppear { NSLog("🟣 RootView.branch: AuthFlowView appeared") }
                }
            #endif
        }
        .task {
            // Bootstrap-only — runs ONCE on view appear. Do NOT key this
            // on `clerkAuth.currentUser?.id`: keying caused SwiftUI to
            // cancel and re-fire the task whenever signIn/signOut mutated
            // currentUser, which then ran `completeAuthentication`
            // concurrently with the explicit calls inside the signIn
            // handlers. That race produced the visible flash between
            // login and the "good morning" landing after the user tapped
            // the E2E sign-in button. All signIn/signUp/OAuth callback
            // paths already invoke `appState.completeAuthentication`
            // themselves, so this task only owns initial bootstrap.
            NSLog("🟣 RootView.task: bootstrap start")
            await registerConvexUnauthenticatedHandler(
                clerkAuth: appEnvironment.clerkAuth,
                convexClient: appEnvironment.convexClient
            )
            hasBootstrappedAuth = true
            NSLog("🟣 RootView.task: hasBootstrappedAuth set to true before auth restore")
            #if DEBUG
                let didReset = await resetAuthForUITestingIfNeeded(
                    clerkAuth: appEnvironment.clerkAuth,
                    convexClient: appEnvironment.convexClient
                )
                NSLog("🟣 RootView.task: resetAuth didRun=\(didReset)")
            #endif
            await synchronizeAuthentication()
            NSLog("🟣 RootView.task: synchronizeAuthentication done; hasClerkSession=\(appState.hasClerkSession)")
        }
        .onChange(of: hasBootstrappedAuth) { _, newValue in
            NSLog("🟣 RootView.onChange: hasBootstrappedAuth=\(newValue)")
        }
        .onOpenURL { url in
            handleSystemOpenURL(url)
        }
    }

    private var authBootstrapPlaceholder: some View {
        ZStack {
            Color(.systemBackground).ignoresSafeArea()
            ProgressView()
        }
        .accessibilityIdentifier("auth.bootstrap.loading")
    }

    var activeFlow: ActiveFlow {
        appState.hasClerkSession ? .app : .auth
    }

    @ViewBuilder
    private var authenticatedFlow: some View {
        if appState.isAuthenticated || appState.hasClerkSession {
            switch appState.appRoute {
            case let .session(id):
                // Cycle 2: Legacy path for direct session navigation (e.g., deeplinks).
                // The modern path is idle→planning via MapApp state mutation.
                // This case will be removed in Cycle 3+ cleanup.
                AppFlowView(route: .session(id: id), appState: appState)
            case .home, .none:
                // Cycle 2: MapApp unified screen with planning state composition.
                // The idle→planning transition is now a state mutation (goToPlanning)
                // triggered by IdleViewModel's onSessionStarted callback,
                // not a NavigationLink or appRoute change.
                AuthenticatedMapAppView(
                    appState: appState,
                    environment: appEnvironment
                )
            }
        } else {
            ProgressView("Loading rider profile")
                .accessibilityIdentifier("auth.current-user.loading")
        }
    }

    func synchronizeAuthentication() async {
        if appEnvironment.clerkAuth.currentUser == nil {
            await appState.restoreAuthentication(
                clerkAuth: appEnvironment.clerkAuth,
                convexClient: appEnvironment.convexClient
            )
        } else {
            await appState.completeAuthentication(
                clerkAuth: appEnvironment.clerkAuth,
                convexClient: appEnvironment.convexClient
            )
        }
    }

    func registerConvexUnauthenticatedHandler(
        clerkAuth: ClerkAuth,
        convexClient: LaneShadowConvexClient
    ) async {
        await convexClient.setUnauthenticatedHandler {
            await appState.handleUnauthenticatedConvexError(
                clerkAuth: clerkAuth,
                convexClient: convexClient
            )
        }
    }

    func handleSystemOpenURL(_ url: URL) {
        handleSystemOpenURL(url, clerkAuth: appEnvironment.clerkAuth)
    }

    func handleSystemOpenURL(_ url: URL, clerkAuth: ClerkAuth) {
        handleIncomingURL(url, clerkAuth: clerkAuth)
    }

    func handleIncomingURL(_ url: URL, clerkAuth: ClerkAuth) {
        appState.handleDeepLink(url, clerkAuth: clerkAuth)
    }

    #if DEBUG
        static func shouldRenderDirectIdleScreen(arguments: [String] = ProcessInfo.processInfo.arguments) -> Bool {
            arguments.contains("-DirectIdleScreenUITest")
        }

        static func directIdleScreenVariant(arguments: [String] = ProcessInfo.processInfo.arguments) -> String? {
            arguments.first { $0.hasPrefix("-IdleStateVariant=") }?
                .replacingOccurrences(of: "-IdleStateVariant=", with: "")
        }

        static func shouldResetAuthForUITesting(arguments: [String] = ProcessInfo.processInfo.arguments) -> Bool {
            arguments.contains("-LaneShadowUITestResetAuth")
        }

        static func shouldEnableE2ESignInForUITesting(arguments: [String] = ProcessInfo.processInfo.arguments) -> Bool {
            arguments.contains("-LaneShadowUITestE2E")
        }

        private func createDirectIdleViewModel() -> IdleViewModel {
            let viewModel = IdleViewModel(
                chatStore: appEnvironment.chatStore,
                sessionStore: appEnvironment.sessionStore,
                convexClient: appEnvironment.convexClient,
                appState: appState,
                onSessionStarted: { _ in }
            )

            // Apply variant configuration if specified
            if let variant = Self.directIdleScreenVariant() {
                configureIdleViewModelForVariant(variant, viewModel: viewModel)
            }

            return viewModel
        }

        private func configureIdleViewModelForVariant(_ variant: String, viewModel: IdleViewModel) {
            switch variant {
            case "default":
                // Default: favoriteLocations≥1, locationLabel set, no advisory, recent sessions
                viewModel.locationLabel = "Santa Cruz, CA"
                viewModel.greetingScope = .today
                viewModel.greetingDisplayName = "rider"
                viewModel.weatherAdvisory = nil
                viewModel.metaRow = "WED · 72°F · SUNNY"
                viewModel.favoriteLocations = [FavoriteLocation(id: "1", lat: 36.97, lon: -122.03, label: "Local Loop")]
                viewModel.recentSessions = [mockSession()]

            case "typingSend":
                // Same as default + chat input has pre-typed text
                viewModel.locationLabel = "Santa Cruz, CA"
                viewModel.greetingScope = .today
                viewModel.greetingDisplayName = "rider"
                viewModel.weatherAdvisory = nil
                viewModel.metaRow = "WED · 72°F · SUNNY"
                viewModel.favoriteLocations = [FavoriteLocation(id: "1", lat: 36.97, lon: -122.03, label: "Local Loop")]
                viewModel.recentSessions = [mockSession()]
                viewModel.autocompletePrimedInputValue = "scenic"

            case "filterSheet":
                // Same as default + filter sheet visible (indicated by isAutocompleteQueryActive=true)
                viewModel.locationLabel = "Santa Cruz, CA"
                viewModel.greetingScope = .today
                viewModel.greetingDisplayName = "rider"
                viewModel.weatherAdvisory = nil
                viewModel.metaRow = "WED · 72°F · SUNNY"
                viewModel.favoriteLocations = [FavoriteLocation(id: "1", lat: 36.97, lon: -122.03, label: "Local Loop")]
                viewModel.recentSessions = [mockSession()]
                viewModel.isAutocompleteQueryActive = true

            case "noLocation":
                // locationLabel=nil, locationUnavailable=true
                viewModel.locationLabel = nil
                viewModel.locationUnavailable = true
                viewModel.favoriteLocations = [FavoriteLocation(id: "1", lat: 36.97, lon: -122.03, label: "Local Loop")]
                viewModel.recentSessions = [mockSession()]
                viewModel.weatherAdvisory = nil

            case "firstRide":
                // recentSessions=[], favoriteLocations=[]
                viewModel.locationLabel = "Santa Cruz, CA"
                viewModel.greetingScope = .today
                viewModel.greetingDisplayName = "rider"
                viewModel.weatherAdvisory = nil
                viewModel.metaRow = "WED · 72°F · SUNNY"
                viewModel.favoriteLocations = []
                viewModel.recentSessions = []

            case "weatherAdvisory":
                // weatherAdvisory non-nil (severity advisory)
                viewModel.locationLabel = "Santa Cruz, CA"
                viewModel.greetingScope = .today
                viewModel.greetingDisplayName = "rider"
                viewModel.metaRow = "WED · 62°F · RAIN · 45%"
                viewModel.weatherAdvisory = WeatherAdvisory(
                    label: "ADVISORY",
                    body: "Weather conditions may affect your ride."
                )
                viewModel.favoriteLocations = [FavoriteLocation(id: "1", lat: 36.97, lon: -122.03, label: "Local Loop")]
                viewModel.recentSessions = [mockSession()]

            case "chatFocused":
                // Same as default + chat input is_active
                viewModel.locationLabel = "Santa Cruz, CA"
                viewModel.greetingScope = .today
                viewModel.greetingDisplayName = "rider"
                viewModel.weatherAdvisory = nil
                viewModel.metaRow = "WED · 72°F · SUNNY"
                viewModel.favoriteLocations = [FavoriteLocation(id: "1", lat: 36.97, lon: -122.03, label: "Local Loop")]
                viewModel.recentSessions = [mockSession()]
                viewModel.isAutocompleteQueryActive = true

            default:
                break
            }
        }

        private func mockSession() -> Session {
            // Create a mock session matching the Sandbox Session structure
            Session(
                id: "1",
                title: "Morning Ride",
                preview: "Scenic loop",
                meta: "3 routes · Active",
                when: "Today",
                active: false,
                routeIds: [],
                createdAt: ISO8601DateFormatter().string(from: Date())
            )
        }

        func resetAuthForUITestingIfNeeded(
            clerkAuth: ClerkAuth,
            convexClient: LaneShadowConvexClient
        ) async -> Bool {
            guard Self.shouldResetAuthForUITesting(), !didHandleUITestResetAuth else {
                return false
            }

            didHandleUITestResetAuth = true
            // Ensure Clerk SDK has loaded before sign-out to avoid leaving the
            // SDK in a broken state where subsequent sign-ins fail with 401.
            // (storywright pattern: only sign out if there is an active session.)
            try? await Clerk.shared.load()
            if Clerk.shared.session != nil {
                await appState.signOut(clerkAuth: clerkAuth, convexClient: convexClient)
            }
            // If no session exists, no need to sign out — Clerk is already in
            // signed-out state and ready for a fresh sign-in.
            return true
        }
    #endif
}

private struct AuthenticatedMapAppView: View {
    @State private var mapAppViewModel: MapAppViewModel
    let appState: AppState
    let environment: AppEnvironment

    init(appState: AppState, environment: AppEnvironment) {
        self.appState = appState
        self.environment = environment

        // Create MapAppViewModel with IdleViewModel that transitions to planning
        let idleViewModel = IdleViewModel(
            chatStore: environment.chatStore,
            sessionStore: environment.sessionStore,
            convexClient: environment.convexClient,
            appState: appState,
            onSessionStarted: { _ in }  // Callback will be captured below
        )

        let mapAppVM = MapAppViewModel(idleViewModel: idleViewModel)

        // Wire the IdleViewModel's onSessionStarted callback to trigger planning state transition.
        // This is done via a captured reference to mapAppVM in a separate step.
        _mapAppViewModel = State(initialValue: mapAppVM)
    }

    var body: some View {
        MapApp(viewModel: mapAppViewModel)
            .onChange(of: mapAppViewModel.idleViewModel.isSubmitting, initial: false) { _, newValue in
                // When a session starts (triggered by suggestion chip tap), the IdleViewModel
                // calls its onSessionStarted callback. Since we can't capture mapAppViewModel
                // in the IdleViewModel init, we observe isSubmitting state change and when it
                // becomes false after a session was created, we check chatStore.flowState.
                if !newValue {
                    // The planning session was created; check if we need to transition
                    if let sessionId = environment.chatStore.flowState.sessionId,
                       case .idle = mapAppViewModel.currentState
                    {
                        mapAppViewModel.goToPlanning(sessionId: sessionId)
                    }
                }
            }
    }
}

private struct AuthenticatedLandingView: View {
    @State private var viewModel: IdleViewModel
    let environment: AppEnvironment
    let onSessionStarted: @MainActor @Sendable (String) -> Void

    init(
        environment: AppEnvironment,
        appState: AppState,
        onSessionStarted: @escaping @MainActor @Sendable (String) -> Void
    ) {
        self.environment = environment
        self.onSessionStarted = onSessionStarted

        _viewModel = State(
            initialValue: IdleViewModel(
                chatStore: environment.chatStore,
                sessionStore: environment.sessionStore,
                convexClient: environment.convexClient,
                appState: appState,
                onSessionStarted: onSessionStarted
            )
        )
    }

    var body: some View {
        // Render IdleScreenContainer directly without a wrapping
        // accessibilityIdentifier — applying one here clobbers the
        // child IdleScreen's "idlescreen" id (the outer modifier wins
        // when stacked through @ViewBuilder), which broke
        // Sprint04GateE2ETests' authenticateAndReachIdleScreen wait.
        IdleScreenContainer(viewModel: viewModel)
    }
}
