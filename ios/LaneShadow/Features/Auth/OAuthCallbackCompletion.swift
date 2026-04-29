import Foundation

enum OAuthCallbackCompletion {
    enum Result: Equatable {
        case success
        case missingToken
    }

    @MainActor
    static func complete(callbackURL: URL?, appState: AppState, auth: ClerkAuth) async -> Result {
        guard OAuthCallbackScreen.parseToken(from: callbackURL) != nil else {
            return .missingToken
        }

        appState.isAuthenticated = true
        appState.authRoute = nil
        appState.appRoute = .home
        appState.updateAuthenticationState(from: auth)
        if !appState.isAuthenticated {
            appState.isAuthenticated = true
        }
        return .success
    }
}
