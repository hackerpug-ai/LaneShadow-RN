import Foundation
import Observation

@MainActor
@Observable
final class AppState {
    enum AuthRoute: Equatable {
        case signIn
        case signUp
        case oauthCallback(URL)
    }

    enum AppRoute: Equatable {
        case home
        case session(id: String)
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
        let path = url.path

        if host == "oauth-callback" {
            if isAuthenticated {
                appRoute = .home
                authRoute = nil
            } else {
                authRoute = .oauthCallback(url)
                appRoute = nil
            }
            return
        }

        if isAuthenticated {
            if host == "session" {
                let sessionID = path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
                if !sessionID.isEmpty {
                    appRoute = .session(id: sessionID)
                    authRoute = nil
                    return
                }
            }

            appRoute = .home
            authRoute = nil
            return
        }

        if host == "auth", path.lowercased() == "/signup" {
            authRoute = .signUp
            appRoute = nil
        } else {
            authRoute = .signIn
            appRoute = nil
        }
    }
}
