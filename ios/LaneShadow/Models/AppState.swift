import Foundation
import Observation

@MainActor
@Observable
final class AppState {
    var isAuthenticated: Bool

    init(isAuthenticated: Bool = false) {
        self.isAuthenticated = isAuthenticated
    }

    func updateAuthenticationState(from clerkAuth: ClerkAuth) {
        isAuthenticated = clerkAuth.currentUser != nil
    }

    func handleDeepLink(_ url: URL, clerkAuth: ClerkAuth) {
        if url.scheme == "laneshadow", url.host == "auth" {
            updateAuthenticationState(from: clerkAuth)
        }
    }
}
