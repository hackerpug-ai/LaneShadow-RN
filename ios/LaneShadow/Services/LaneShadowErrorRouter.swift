import Foundation

enum LaneShadowErrorRouter {
    @MainActor
    static func handle(
        _ error: Error,
        appState: AppState,
        clerkAuth: ClerkAuth,
        convex: LaneShadowConvexClient
    ) async {
        let laneShadowError = LaneShadowError.map(error)
        guard laneShadowError.isUnauthenticated else {
            return
        }

        await appState.signOutFlow(clerkAuth: clerkAuth, convexClient: convex)
    }
}

