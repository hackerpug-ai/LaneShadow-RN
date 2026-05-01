import SwiftUI

struct RootView: View {
    enum ActiveFlow {
        case auth
        case app
    }

    @Bindable var convexStore: ConvexStore
    @State private var appState: AppState
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
            await registerConvexUnauthenticatedHandler(
                clerkAuth: appEnvironment.clerkAuth,
                convexClient: appEnvironment.convexClient
            )
            #if DEBUG
                if await resetAuthForUITestingIfNeeded(
                    clerkAuth: appEnvironment.clerkAuth,
                    convexClient: appEnvironment.convexClient
                ) {
                    return
                }
            #endif
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
        if appState.isAuthenticated || appState.hasClerkSession {
            switch appState.appRoute {
            case let .session(id):
                AppFlowView(route: .session(id: id))
            case .home, .none:
                AuthenticatedLandingView(
                    displayName: authenticatedDisplayName,
                    isHydratingCurrentUser: appState.isHydratingCurrentUser,
                    authMessage: appState.authMessage,
                    onLogout: signOut
                )
            }
        } else {
            ProgressView("Loading rider profile")
                .accessibilityIdentifier("auth.current-user.loading")
        }
    }

    private var authenticatedDisplayName: String {
        if let displayName = appState.currentUser?.displayName, !displayName.isEmpty {
            return displayName
        }

        if let displayName = appEnvironment.clerkAuth.currentUser?.displayName, !displayName.isEmpty {
            return displayName
        }

        return "rider"
    }

    func synchronizeAuthentication() async {
        #if DEBUG
            // Bypass-mode tests stamp authenticated state synthetically; never
            // re-run real auth restoration, otherwise it would clobber the
            // bypassed `appState.isAuthenticated` and route back to sign-in.
            if Self.shouldBypassAuthForUITesting(), appState.isAuthenticated {
                return
            }
        #endif

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

    func signOut() {
        Task {
            await appState.signOut(
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

        static func shouldBypassAuthForUITesting(arguments: [String] = ProcessInfo.processInfo.arguments) -> Bool {
            arguments.contains("-LaneShadowUITestBypassAuth")
        }

        func resetAuthForUITestingIfNeeded(
            clerkAuth: ClerkAuth,
            convexClient: LaneShadowConvexClient
        ) async -> Bool {
            guard Self.shouldResetAuthForUITesting(), !didHandleUITestResetAuth else {
                return false
            }

            didHandleUITestResetAuth = true
            await appState.signOut(clerkAuth: clerkAuth, convexClient: convexClient)
            return true
        }
    #endif
}

private struct AuthenticatedLandingView: View {
    let displayName: String
    let isHydratingCurrentUser: Bool
    let authMessage: String?
    let onLogout: () -> Void

    var body: some View {
        ZStack {
            IdleScreen()

            VStack(alignment: .leading, spacing: 16) {
                Text("Signed in")
                    .font(.caption.weight(.semibold))
                    .textCase(.uppercase)
                    .foregroundStyle(.secondary)

                Text("Where are we riding today, \(displayName)?")
                    .font(.title2.weight(.semibold))
                    .foregroundStyle(.primary)
                    .accessibilityIdentifier("idlescreen-current-user-greeting")

                if isHydratingCurrentUser {
                    Text("Loading rider profile")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                } else if let authMessage, !authMessage.isEmpty {
                    Text(authMessage)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Button("Log out", action: onLogout)
                    .buttonStyle(.borderedProminent)
                    .accessibilityIdentifier("auth.landing.logout")
            }
            .padding(20)
            .frame(maxWidth: 360, alignment: .leading)
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(.quaternary, lineWidth: 1)
            )
            .padding()
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier("auth.landing.root")
        }
    }
}
