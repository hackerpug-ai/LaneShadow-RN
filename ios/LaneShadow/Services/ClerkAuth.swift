import Foundation
import Observation

struct ClerkAuthUser: Equatable {
    let id: String
    let email: String?
}

protocol ClerkAuthClient: Sendable {
    func signIn(email: String, password: String) async throws -> ClerkAuthUser
    func signUp(email: String, password: String, name: String?) async throws -> ClerkAuthUser
    func signInWithApple() async throws -> ClerkAuthUser
    func signInWithGoogle() async throws -> ClerkAuthUser
    func signOut() async throws
    func getJWT() async throws -> String?
}

enum ClerkAuthError: LocalizedError {
    case notConfigured

    var errorDescription: String? {
        switch self {
        case .notConfigured:
            "Clerk client is not configured for native auth yet."
        }
    }
}

actor LiveClerkAuthClient: ClerkAuthClient {
    func signIn(email _: String, password _: String) async throws -> ClerkAuthUser {
        throw ClerkAuthError.notConfigured
    }

    func signUp(email _: String, password _: String, name _: String?) async throws -> ClerkAuthUser {
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
}

@MainActor
@Observable
final class ClerkAuth: LaneShadowClerkJWTProviding {
    private(set) var currentUser: ClerkAuthUser?

    private let client: any ClerkAuthClient

    init(client: any ClerkAuthClient = LiveClerkAuthClient()) {
        self.client = client
    }

    func signIn(email: String, password: String) async throws {
        currentUser = try await client.signIn(email: email, password: password)
    }

    func signUp(email: String, password: String, name: String?) async throws {
        currentUser = try await client.signUp(email: email, password: password, name: name)
    }

    func signInWithApple() async throws {
        currentUser = try await client.signInWithApple()
    }

    func signInWithGoogle() async throws {
        currentUser = try await client.signInWithGoogle()
    }

    func signOut() async throws {
        try await client.signOut()
        currentUser = nil
    }

    func getJWT() async throws -> String? {
        try await client.getJWT()
    }

    func convexJWT() async throws -> String? {
        try await getJWT()
    }
}
