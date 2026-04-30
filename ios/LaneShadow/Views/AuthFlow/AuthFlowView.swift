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
        NavigationStack {
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
    }
}
