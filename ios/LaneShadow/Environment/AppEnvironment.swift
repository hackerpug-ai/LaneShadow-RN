import Clerk
import Foundation
import SwiftUI

struct AppEnvironment: @unchecked Sendable {
    let clerkAuth: ClerkAuth
    let convexClient: LaneShadowConvexClient
    let sessionStore: SessionStore
    let chatStore: ChatStore

    @MainActor
    static func live() -> AppEnvironment {
        let clerkAuth = if ClerkRuntimeConfiguration.configureIfAvailable() {
            ClerkAuth()
        } else {
            ClerkAuth(client: UnconfiguredClerkAuthClient())
        }

        let convexClient = LaneShadowConvexClient {
            try await clerkAuth.convexJWT()
        }
        return AppEnvironment(clerkAuth: clerkAuth, convexClient: convexClient)
    }

    @MainActor
    init(
        clerkAuth: ClerkAuth,
        convexClient: LaneShadowConvexClient,
        sessionStore: SessionStore? = nil,
        chatStore: ChatStore? = nil
    ) {
        let resolvedSessionStore = sessionStore ?? SessionStore()
        self.clerkAuth = clerkAuth
        self.convexClient = convexClient
        self.sessionStore = resolvedSessionStore
        self.chatStore = chatStore ?? ChatStore(sessionStore: resolvedSessionStore)
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

private enum ClerkRuntimeConfiguration {
    @MainActor
    static func configureIfAvailable(environment: [String: String] = ProcessInfo.processInfo.environment) -> Bool {
        let publishableKey = firstNonEmptyValue(
            for: ["CLERK_PUBLISHABLE_KEY", "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY"],
            in: environment
        ) ?? bakedInPublishableKey

        guard let publishableKey, !publishableKey.isEmpty else {
            return false
        }

        Clerk.shared.configure(publishableKey: publishableKey)
        return true
    }

    private static var bakedInPublishableKey: String? {
        let baked = ClerkConfig.publishableKey.trimmingCharacters(in: .whitespacesAndNewlines)
        return baked.isEmpty ? nil : baked
    }

    private static func firstNonEmptyValue(for keys: [String], in environment: [String: String]) -> String? {
        keys
            .lazy
            .compactMap { environment[$0]?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .first { !$0.isEmpty }
    }
}

private struct UnconfiguredClerkAuthClient: ClerkAuthClient {
    func signIn(email _: String, password _: String) async throws -> ClerkSignInResult {
        throw ClerkAuthError.notConfigured
    }

    func completeSignInVerification(code _: String) async throws -> ClerkAuthUser {
        throw ClerkAuthError.notConfigured
    }

    func signUp(email _: String, password _: String, name _: String?) async throws -> ClerkSignUpResult {
        throw ClerkAuthError.notConfigured
    }

    func completeSignUpVerification(code _: String) async throws -> ClerkAuthUser {
        throw ClerkAuthError.notConfigured
    }

    func signInWithApple() async throws -> ClerkAuthUser {
        throw ClerkAuthError.notConfigured
    }

    func signInWithGoogle() async throws -> ClerkAuthUser {
        throw ClerkAuthError.notConfigured
    }

    func signOut() async throws {}

    func getJWT() async throws -> String? {
        nil
    }

    func restoreSession() async throws -> ClerkAuthUser? {
        nil
    }

    func completeOAuthCallback(token _: String) async throws -> ClerkAuthUser? {
        nil
    }
}
