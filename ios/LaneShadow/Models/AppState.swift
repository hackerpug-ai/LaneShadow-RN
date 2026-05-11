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
    var cachedLastFailedInput: String?
    private(set) var isCompletingAuthentication: Bool = false

    init(isAuthenticated: Bool = false, currentUser: LaneShadowCurrentUser? = nil) {
        self.isAuthenticated = isAuthenticated
        hasClerkSession = isAuthenticated || currentUser != nil
        isHydratingCurrentUser = false
        self.currentUser = currentUser
        authMessage = nil
        authRoute = nil
        appRoute = nil
        cachedLastFailedInput = nil
    }

    func updateAuthenticationState(from clerkAuth: ClerkAuth) {
        let hadSession = hasClerkSession
        hasClerkSession = clerkAuth.currentUser != nil
        NSLog("🟠 AppState.updateAuthState: hasClerkSession \(hadSession) → \(hasClerkSession)")
        if !hasClerkSession {
            clearAuthenticatedState(authRoute: .signIn)
        }
    }

    func completeAuthentication(clerkAuth: ClerkAuth, convexClient: LaneShadowConvexClient) async {
        NSLog("🟠 AppState.completeAuth: enter clerkUserId=\(clerkAuth.currentUser?.id ?? "nil")")
        isCompletingAuthentication = true
        defer { isCompletingAuthentication = false }
        updateAuthenticationState(from: clerkAuth)
        guard hasClerkSession else {
            NSLog("🟠 AppState.completeAuth: guard fail (no clerk session); exit")
            return
        }

        isHydratingCurrentUser = true
        authMessage = nil
        NSLog("🟠 AppState.completeAuth: setAuth start")
        await convexClient.setAuth(clerkJWTProvider: clerkAuth)
        NSLog("🟠 AppState.completeAuth: setAuth done; routeAuthenticatedWithoutHydratedProfile")
        routeAuthenticatedWithoutHydratedProfile()

        do {
            let hydratedUser = try await convexClient.fetchCurrentUser(notifyUnauthenticated: false)
            guard let hydratedUser else {
                NSLog("🟠 AppState.completeAuth: fetchCurrentUser nil; exit")
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
            NSLog("🟠 AppState.completeAuth: hydrated ok; isAuthenticated=true")
        } catch {
            let laneShadowError = LaneShadowError.map(error)
            NSLog(
                "❌ AppState.completeAuth: fetchCurrentUser threw \(laneShadowError.localizedDescription) isUnauth=\(laneShadowError.isUnauthenticated)"
            )
            if laneShadowError.isUnauthenticated {
                authMessage = "Unable to load rider profile."
            } else {
                routeAuthenticatedWithoutHydratedProfile(message: laneShadowError.localizedDescription)
            }
        }

        isHydratingCurrentUser = false
        NSLog("🟠 AppState.completeAuth: exit hasClerkSession=\(hasClerkSession) isAuthenticated=\(isAuthenticated)")
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
        NSLog("🟠 AppState.signOut: enter")
        try? await clerkAuth.signOut()
        try? await convexClient.logout()
        clearAuthenticatedState(authRoute: .signIn)
        NSLog("🟠 AppState.signOut: exit")
    }

    func signOutFlow(clerkAuth: ClerkAuth, convexClient: LaneShadowConvexClient) async {
        NSLog("🟠 AppState.signOutFlow: enter")
        clerkAuth.clearLocalSession()
        try? await convexClient.logout()
        handleUnauthenticatedConvexError()
        NSLog("🟠 AppState.signOutFlow: exit")
    }

    func handleUnauthenticatedConvexError() {
        NSLog("🟠 AppState.handleUnauthenticatedConvexError(sync): clearing auth")
        clearAuthenticatedState(authRoute: .signIn)
        authMessage = LaneShadowError.unauthenticated.localizedDescription
    }

    func handleUnauthenticatedConvexError(clerkAuth: ClerkAuth, convexClient: LaneShadowConvexClient) async {
        if isCompletingAuthentication {
            NSLog("🟠 AppState.handleUnauthenticatedConvexError(async): suppressed — auth bootstrap in flight")
            return
        }
        if !hasClerkSession {
            NSLog("🟠 AppState.handleUnauthenticatedConvexError(async): suppressed — no clerk session")
            return
        }
        NSLog("🟠 AppState.handleUnauthenticatedConvexError(async): firing signOutFlow")
        await signOutFlow(clerkAuth: clerkAuth, convexClient: convexClient)
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
        NSLog(
            "🟠 AppState.clearAuthenticatedState: hasClerkSession \(hasClerkSession) → false; route=\(String(describing: route))"
        )
        isAuthenticated = false
        hasClerkSession = false
        isHydratingCurrentUser = false
        currentUser = nil
        authRoute = route
        appRoute = nil
        cachedLastFailedInput = nil
    }

    private func routeAuthenticatedWithoutHydratedProfile(message: String? = nil) {
        NSLog("🟠 AppState.routeAuthenticatedWithoutHydratedProfile: hasClerkSession→true isAuthenticated→true")
        isAuthenticated = true
        hasClerkSession = true
        currentUser = nil
        authRoute = nil
        if appRoute == nil {
            appRoute = .home
        }
        authMessage = message
    }
}
