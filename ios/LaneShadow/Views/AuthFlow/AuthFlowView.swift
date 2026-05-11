import SwiftUI

struct AuthFlowView: View {
    @Environment(\.appEnvironment) private var appEnvironment

    let route: AppState.AuthRoute?
    let appState: AppState
    let clerkAuth: ClerkAuth

    init(route: AppState.AuthRoute? = nil, appState: AppState, clerkAuth: ClerkAuth) {
        self.route = route
        self.appState = appState
        self.clerkAuth = clerkAuth
    }

    var body: some View {
        // NavigationStack removed: auth routing uses appState.authRoute (not push/pop),
        // and NavigationStack + .navigationTitle + .toolbar(.hidden) was generating
        // expensive preference combining that overflowed the main-thread stack on
        // iOS 18 real devices (1MB stack vs 8MB simulator). See debug log 2026-05-09.
        Group {
            if route == .signUp {
                SignUpView(appState: appState)
            } else if case let .oauthCallback(callbackURL) = route {
                OAuthCallbackScreen(callbackURL: callbackURL) { _ in
                    _ = await OAuthCallbackCompletion.complete(
                        callbackURL: callbackURL,
                        appState: appState,
                        auth: clerkAuth,
                        convexClient: appEnvironment.convexClient
                    )
                }
            } else {
                SignInView(appState: appState)
            }
        }
        .onAppear { NSLog("🟣 AuthFlowView.appeared route=\(String(describing: route))") }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
