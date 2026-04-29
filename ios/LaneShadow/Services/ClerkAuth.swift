import Clerk
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
    case missingUser

    var errorDescription: String? {
        switch self {
        case .notConfigured:
            "Clerk client is not configured for native auth yet."
        case .missingUser:
            "Clerk authentication succeeded but no active user was found."
        }
    }
}

protocol ClerkSDKClient: Sendable {
    func signIn(email: String, password: String) async throws -> ClerkAuthUser
    func signUp(email: String, password: String, name: String?) async throws -> ClerkAuthUser
    func signInWithApple() async throws -> ClerkAuthUser
    func signInWithGoogle() async throws -> ClerkAuthUser
    func signOut() async throws
    func getJWT() async throws -> String?
}

@MainActor
final class LiveClerkSDKClient: ClerkSDKClient {
    private let clerk: Clerk

    init(clerk: Clerk = .shared) {
        self.clerk = clerk
    }

    func signIn(email: String, password: String) async throws -> ClerkAuthUser {
        let signIn = try await SignIn.create(strategy: .identifier(email, password: password))
        _ = try await signIn.attemptFirstFactor(strategy: .password(password: password))
        return try currentUser()
    }

    func signUp(email: String, password: String, name: String?) async throws -> ClerkAuthUser {
        let parsedName = splitName(name)
        _ = try await SignUp.create(strategy: .standard(
            emailAddress: email,
            password: password,
            firstName: parsedName.firstName,
            lastName: parsedName.lastName
        ))
        return try currentUser()
    }

    func signInWithApple() async throws -> ClerkAuthUser {
        _ = try await SignIn.authenticateWithRedirect(strategy: .oauth(provider: .apple))
        return try currentUser()
    }

    func signInWithGoogle() async throws -> ClerkAuthUser {
        _ = try await SignIn.authenticateWithRedirect(strategy: .oauth(provider: .google))
        return try currentUser()
    }

    func signOut() async throws {
        try await clerk.signOut()
    }

    func getJWT() async throws -> String? {
        guard let session = clerk.session else {
            return nil
        }
        return try await session.getToken(.init(template: "convex"))?.jwt
    }

    private func currentUser() throws -> ClerkAuthUser {
        guard let user = clerk.user else {
            throw ClerkAuthError.missingUser
        }
        return ClerkAuthUser(id: user.id, email: user.primaryEmailAddress?.emailAddress)
    }

    private func splitName(_ name: String?) -> (firstName: String?, lastName: String?) {
        guard let trimmed = name?.trimmingCharacters(in: .whitespacesAndNewlines), !trimmed.isEmpty else {
            return (nil, nil)
        }
        let components = trimmed.split(separator: " ", maxSplits: 1, omittingEmptySubsequences: true)
        let firstName = components.first.map(String.init)
        let lastName = components.count > 1 ? String(components[1]) : nil
        return (firstName, lastName)
    }
}

@MainActor
final class LiveClerkAuthClient: ClerkAuthClient {
    private let sdk: any ClerkSDKClient

    init(sdk: any ClerkSDKClient = LiveClerkSDKClient()) {
        self.sdk = sdk
    }

    func signIn(email: String, password: String) async throws -> ClerkAuthUser {
        try await sdk.signIn(email: email, password: password)
    }

    func signUp(email: String, password: String, name: String?) async throws -> ClerkAuthUser {
        try await sdk.signUp(email: email, password: password, name: name)
    }

    func signInWithApple() async throws -> ClerkAuthUser {
        try await sdk.signInWithApple()
    }

    func signInWithGoogle() async throws -> ClerkAuthUser {
        try await sdk.signInWithGoogle()
    }

    func signOut() async throws {
        try await sdk.signOut()
    }

    func getJWT() async throws -> String? {
        try await sdk.getJWT()
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
