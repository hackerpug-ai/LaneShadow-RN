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
    var hasClerkSession: Bool
    var isHydratingCurrentUser: Bool
    var currentUser: LaneShadowCurrentUser?
    var authMessage: String?
    var authRoute: AuthRoute?
    var appRoute: AppRoute?

    init(isAuthenticated: Bool = false, currentUser: LaneShadowCurrentUser? = nil) {
        self.isAuthenticated = isAuthenticated
        hasClerkSession = isAuthenticated || currentUser != nil
        isHydratingCurrentUser = false
        self.currentUser = currentUser
        authMessage = nil
        authRoute = nil
        appRoute = nil
    }

    func updateAuthenticationState(from clerkAuth: ClerkAuth) {
        hasClerkSession = clerkAuth.currentUser != nil
        if !hasClerkSession {
            clearAuthenticatedState(authRoute: .signIn)
        }
    }

    func completeAuthentication(clerkAuth: ClerkAuth, convexClient: LaneShadowConvexClient) async {
        updateAuthenticationState(from: clerkAuth)
        guard hasClerkSession else {
            return
        }

        isHydratingCurrentUser = true
        authMessage = nil
        await convexClient.setAuth(clerkJWTProvider: clerkAuth)

        do {
            let hydratedUser = try await convexClient.fetchCurrentUser()
            guard let hydratedUser else {
                clearAuthenticatedState(authRoute: .signIn)
                isHydratingCurrentUser = false
                return
            }

            currentUser = hydratedUser
            isAuthenticated = true
            hasClerkSession = true
            authRoute = nil
            if appRoute == nil {
                appRoute = .home
            }
        } catch {
            let laneShadowError = LaneShadowError.map(error)
            if laneShadowError.isUnauthenticated {
                handleUnauthenticatedConvexError()
            } else {
                clearAuthenticatedState(authRoute: .signIn)
                authMessage = laneShadowError.localizedDescription
            }
        }

        isHydratingCurrentUser = false
    }

    func restoreAuthentication(clerkAuth: ClerkAuth, convexClient: LaneShadowConvexClient) async {
        do {
            try await clerkAuth.restoreSession()
            await completeAuthentication(clerkAuth: clerkAuth, convexClient: convexClient)
        } catch {
            clearAuthenticatedState(authRoute: .signIn)
            authMessage = error.localizedDescription
        }
    }

    func signOut(clerkAuth: ClerkAuth, convexClient: LaneShadowConvexClient) async {
        try? await clerkAuth.signOut()
        try? await convexClient.logout()
        clearAuthenticatedState(authRoute: .signIn)
    }

    func handleUnauthenticatedConvexError() {
        clearAuthenticatedState(authRoute: .signIn)
        authMessage = LaneShadowError.unauthenticated.localizedDescription
    }

    func handleDeepLink(_ url: URL, clerkAuth: ClerkAuth) {
        guard url.scheme == "laneshadow" else {
            return
        }

        updateAuthenticationState(from: clerkAuth)

        let host = (url.host ?? "").lowercased()
        let path = url.path

        if host == "oauth-callback" {
            if hasClerkSession {
                appRoute = .home
                authRoute = nil
            } else {
                authRoute = .oauthCallback(url)
                appRoute = nil
            }
            return
        }

        if hasClerkSession {
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

    private func clearAuthenticatedState(authRoute route: AuthRoute?) {
        isAuthenticated = false
        hasClerkSession = false
        isHydratingCurrentUser = false
        currentUser = nil
        authRoute = route
        appRoute = nil
    }
}
