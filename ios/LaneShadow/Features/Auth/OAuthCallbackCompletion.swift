import Foundation

enum OAuthCallbackCompletion {
    enum Result: Equatable {
        case success
        case missingToken
    }

    @MainActor
    static func complete(callbackURL: URL?, appState: AppState, auth: ClerkAuth) async -> Result {
        guard let token = OAuthCallbackScreen.parseToken(from: callbackURL) else {
            return .missingToken
        }

        await auth.completeOAuthCallback(token: token)
        appState.updateAuthenticationState(from: auth)

        if appState.isAuthenticated {
            appState.authRoute = nil
            appState.appRoute = .home
        } else if let callbackURL {
            appState.authRoute = .oauthCallback(callbackURL)
            appState.appRoute = nil
        }

        return .success
    }
}
