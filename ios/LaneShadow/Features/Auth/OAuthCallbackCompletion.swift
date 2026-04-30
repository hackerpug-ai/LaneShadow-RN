import Foundation

enum OAuthCallbackCompletion {
    enum Result: Equatable {
        case success
        case missingToken
    }

    @MainActor
    static func complete(
        callbackURL: URL?,
        appState: AppState,
        auth: ClerkAuth,
        convexClient: LaneShadowConvexClient
    ) async -> Result {
        guard let token = OAuthCallbackScreen.parseToken(from: callbackURL) else {
            return .missingToken
        }

        await auth.completeOAuthCallback(token: token)
        await appState.completeAuthentication(clerkAuth: auth, convexClient: convexClient)

        if !appState.isAuthenticated, let callbackURL {
            appState.authRoute = .oauthCallback(callbackURL)
            appState.appRoute = nil
        }

        return .success
    }
}
