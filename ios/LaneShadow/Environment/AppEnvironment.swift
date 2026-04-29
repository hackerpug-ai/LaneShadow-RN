import SwiftUI

struct AppEnvironment: @unchecked Sendable {
    let clerkAuth: ClerkAuth
    let convexClient: LaneShadowConvexClient

    @MainActor
    static func live() -> AppEnvironment {
        let clerkAuth = ClerkAuth()
        let convexClient = LaneShadowConvexClient {
            try await clerkAuth.convexJWT()
        }
        return AppEnvironment(clerkAuth: clerkAuth, convexClient: convexClient)
    }
}

private struct AppEnvironmentKey: EnvironmentKey {
    static let defaultValue: AppEnvironment = MainActor.assumeIsolated {
        AppEnvironment.live()
    }
}

extension EnvironmentValues {
    var appEnvironment: AppEnvironment {
        get { self[AppEnvironmentKey.self] }
        set { self[AppEnvironmentKey.self] = newValue }
    }
}
