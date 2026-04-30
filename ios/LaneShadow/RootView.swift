import SwiftUI

struct RootView: View {
    enum ActiveFlow {
        case auth
        case app
    }

    @Bindable var convexStore: ConvexStore
    @State private var appState: AppState
    @Environment(\.appEnvironment) private var appEnvironment

    init(convexStore: ConvexStore, appState: AppState = AppState()) {
        _convexStore = Bindable(convexStore)
        _appState = State(initialValue: appState)
    }

    var body: some View {
        Group {
            if activeFlow == .app {
                authenticatedFlow
            } else {
                AuthFlowView(
                    route: appState.authRoute,
                    appState: appState,
                    clerkAuth: appEnvironment.clerkAuth
                )
            }
        }
        .onAppear {
            appState.updateAuthenticationState(from: appEnvironment.clerkAuth)
        }
        .task(id: appEnvironment.clerkAuth.currentUser?.id) {
            await synchronizeAuthentication()
        }
        .onOpenURL { url in
            handleSystemOpenURL(url)
        }
    }

    var activeFlow: ActiveFlow {
        appState.hasClerkSession ? .app : .auth
    }

    @ViewBuilder
    private var authenticatedFlow: some View {
        if appState.isAuthenticated, let currentUser = appState.currentUser {
            switch appState.appRoute {
            case let .session(id):
                AppFlowView(route: .session(id: id))
            case .home, .none:
                IdleScreen()
                    .overlay(alignment: .topLeading) {
                        Text("Where are we riding today, \(currentUser.displayName)?")
                            .font(.headline)
                            .padding(12)
                            .background(.ultraThinMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                            .padding()
                            .accessibilityIdentifier("idlescreen-current-user-greeting")
                    }
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

    func handleConvexError(
        _ error: Error,
        clerkAuth: ClerkAuth,
        convexClient: LaneShadowConvexClient
    ) async {
        guard LaneShadowError.map(error).isUnauthenticated else {
            return
        }

        clerkAuth.clearLocalSession()
        try? await convexClient.logout()
        appState.handleUnauthenticatedConvexError()
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
}
