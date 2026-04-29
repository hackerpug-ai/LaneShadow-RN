import Foundation
import Observation

@MainActor
@Observable
final class AppState {
    enum AuthRoute: Equatable {
        case signIn
        case signUp
    }

    enum AppRoute: Equatable {
        case home
    }

    var isAuthenticated: Bool
    var authRoute: AuthRoute?
    var appRoute: AppRoute?

    init(isAuthenticated: Bool = false) {
        self.isAuthenticated = isAuthenticated
        authRoute = nil
        appRoute = nil
    }

    func updateAuthenticationState(from clerkAuth: ClerkAuth) {
        isAuthenticated = clerkAuth.currentUser != nil
    }

    func handleDeepLink(_ url: URL, clerkAuth: ClerkAuth) {
        guard url.scheme == "laneshadow" else {
            return
        }

        updateAuthenticationState(from: clerkAuth)

        let host = (url.host ?? "").lowercased()
        let path = url.path.lowercased()

        if isAuthenticated {
            appRoute = .home
            return
        }

        if host == "auth", path == "/signup" {
            authRoute = .signUp
        } else {
            authRoute = .signIn
        }
    }
}
