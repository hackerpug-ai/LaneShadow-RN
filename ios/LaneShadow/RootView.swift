import Clerk
import SwiftUI

struct RootView: View {
    enum ActiveFlow {
        case auth
        case app
    }

    @Bindable var convexStore: ConvexStore
    @State private var appState: AppState
    @State private var hasBootstrappedAuth = false
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
            if !hasBootstrappedAuth {
                authBootstrapPlaceholder
            } else if activeFlow == .app {
                authenticatedFlow
            } else {
                AuthFlowView(
                    route: appState.authRoute,
                    appState: appState,
                    clerkAuth: appEnvironment.clerkAuth
                )
            }
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
            #if DEBUG
                let didReset = await resetAuthForUITestingIfNeeded(
                    clerkAuth: appEnvironment.clerkAuth,
                    convexClient: appEnvironment.convexClient
                )
                NSLog("🟣 RootView.task: resetAuth didRun=\(didReset)")
            #endif
            await synchronizeAuthentication()
            NSLog("🟣 RootView.task: synchronizeAuthentication done; hasClerkSession=\(appState.hasClerkSession)")
            hasBootstrappedAuth = true
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
                AppFlowView(route: .session(id: id), appState: appState)
            case .home, .none:
                AuthenticatedLandingView(
                    environment: appEnvironment,
                    appState: appState,
                    onSessionStarted: { sessionID in
                        Task { @MainActor in
                            appState.appRoute = .session(id: sessionID)
                        }
                    }
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
        static func shouldResetAuthForUITesting(arguments: [String] = ProcessInfo.processInfo.arguments) -> Bool {
            arguments.contains("-LaneShadowUITestResetAuth")
        }

        static func shouldEnableE2ESignInForUITesting(arguments: [String] = ProcessInfo.processInfo.arguments) -> Bool {
            arguments.contains("-LaneShadowUITestE2E")
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
