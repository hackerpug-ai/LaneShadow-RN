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
        routeAuthenticatedWithoutHydratedProfile()

        do {
            let hydratedUser = try await convexClient.fetchCurrentUser(notifyUnauthenticated: false)
            guard let hydratedUser else {
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
                authMessage = "Unable to load rider profile."
            } else {
                routeAuthenticatedWithoutHydratedProfile(message: laneShadowError.localizedDescription)
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

    func handleUnauthenticatedConvexError(clerkAuth: ClerkAuth, convexClient: LaneShadowConvexClient) async {
        clerkAuth.clearLocalSession()
        try? await convexClient.logout()
        handleUnauthenticatedConvexError()
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

    private func routeAuthenticatedWithoutHydratedProfile(message: String? = nil) {
        isAuthenticated = true
        hasClerkSession = true
        currentUser = nil
        authRoute = nil
        if appRoute == nil {
            appRoute = .home
        }
        authMessage = message
    }

    #if DEBUG
        /// Synthesizes an authenticated session without contacting Clerk or Convex.
        /// Only callable from debug builds; the real entry point is the
        /// `-LaneShadowUITestBypassAuth` launch flag wired through AuthScreen's
        /// test-only bypass button.
        func bypassAuthForTesting(convexClient: LaneShadowConvexClient) async {
            await convexClient.setAuth(tokenProvider: { "ui-test-jwt" })

            currentUser = LaneShadowCurrentUser(
                id: "ui-test-user",
                clerkUserId: "ui-test-clerk",
                email: "uitest@laneshadow.local",
                name: "UI Test"
            )
            isAuthenticated = true
            hasClerkSession = true
            isHydratingCurrentUser = false
            authMessage = nil
            authRoute = nil
            if appRoute == nil {
                appRoute = .home
            }
        }
    #endif
}
