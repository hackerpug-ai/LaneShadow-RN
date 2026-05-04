import Clerk
import Foundation
import Observation

struct ClerkAuthUser: Equatable {
    let id: String
    let email: String?

    var displayName: String {
        guard let email,
              let localPart = email.split(separator: "@", maxSplits: 1).first,
              !localPart.isEmpty
        else {
            return "rider"
        }
        return String(localPart)
    }
}

enum ClerkSignUpResult: Equatable {
    case signedIn(ClerkAuthUser)
    case verificationRequired(email: String)
}

enum ClerkSignInResult: Equatable {
    case signedIn(ClerkAuthUser)
    case verificationRequired(email: String)
}

protocol ClerkAuthClient: Sendable {
    func signIn(email: String, password: String) async throws -> ClerkSignInResult
    func completeSignInVerification(code: String) async throws -> ClerkAuthUser
    func signUp(email: String, password: String, name: String?) async throws -> ClerkSignUpResult
    func completeSignUpVerification(code: String) async throws -> ClerkAuthUser
    func signInWithApple() async throws -> ClerkAuthUser
    func signInWithGoogle() async throws -> ClerkAuthUser
    func signOut() async throws
    func getJWT() async throws -> String?
    func restoreSession() async throws -> ClerkAuthUser?
    func completeOAuthCallback(token: String) async throws -> ClerkAuthUser?
}

enum ClerkAuthError: LocalizedError {
    case notConfigured
    case missingUser
    case missingSignInSession
    case missingSignInVerification
    case missingSignUpVerification
    case unsupportedSignInVerification
    case missingVerificationSession
    case missingAppleIdentityToken
    case incompleteSocialSignIn
    case incompleteSocialSignUp

    var errorDescription: String? {
        switch self {
        case .notConfigured:
            "Clerk client is not configured for native auth yet."
        case .missingUser:
            "Clerk authentication succeeded but no active user was found."
        case .missingSignInSession:
            "Password verification completed but no Clerk session was created."
        case .missingSignInVerification:
            "No active sign-in verification is available."
        case .missingSignUpVerification:
            "No active sign-up verification is available."
        case .unsupportedSignInVerification:
            "Clerk requested an unsupported sign-in verification method."
        case .missingVerificationSession:
            "Email verification completed but no Clerk session was created."
        case .missingAppleIdentityToken:
            "Sign in with Apple did not return a valid identity token."
        case .incompleteSocialSignIn:
            "Social sign-in flow did not complete; no session was created."
        case .incompleteSocialSignUp:
            "Social sign-up flow did not complete; no session was created."
        }
    }
}

protocol ClerkSDKClient: Sendable {
    func signIn(email: String, password: String) async throws -> ClerkSignInResult
    func completeSignInVerification(code: String) async throws -> ClerkAuthUser
    func signUp(email: String, password: String, name: String?) async throws -> ClerkSignUpResult
    func completeSignUpVerification(code: String) async throws -> ClerkAuthUser
    func signInWithApple() async throws -> ClerkAuthUser
    func signInWithGoogle() async throws -> ClerkAuthUser
    func signOut() async throws
    func getJWT() async throws -> String?
    func restoreSession() async throws -> ClerkAuthUser?
    func completeOAuthCallback(token: String) async throws -> ClerkAuthUser?
}

@MainActor
final class LiveClerkSDKClient: ClerkSDKClient {
    private let clerk: Clerk
    private var pendingSignIn: SignIn?
    private var pendingSignUp: SignUp?

    init(clerk: Clerk = .shared) {
        self.clerk = clerk
    }

    func signIn(email: String, password: String) async throws -> ClerkSignInResult {
        pendingSignIn = nil
        // Use single-call pattern (storywright): pass identifier + password together
        // so the SDK creates and authenticates the SignIn in one round trip and
        // session continuity is preserved across the password attempt.
        let signIn = try await SignIn.create(strategy: .identifier(email, password: password))
        return try await resolveSignIn(signIn, email: email)
    }

    func completeSignInVerification(code: String) async throws -> ClerkAuthUser {
        guard let signIn = pendingSignIn else {
            throw ClerkAuthError.missingSignInVerification
        }

        let verifiedSignIn = try await signIn.attemptSecondFactor(strategy: .emailCode(code: code))
        return try await activateCompletedSignIn(verifiedSignIn)
    }

    private func resolveSignIn(_ signIn: SignIn, email: String) async throws -> ClerkSignInResult {
        switch signIn.status {
        case .complete:
            return try await .signedIn(activateCompletedSignIn(signIn))
        case .needsClientTrust, .needsSecondFactor:
            guard let emailFactor = signIn.supportedSecondFactors?.first(where: { $0.strategy == "email_code" }) else {
                throw ClerkAuthError.unsupportedSignInVerification
            }
            pendingSignIn = try await signIn.prepareSecondFactor(
                strategy: .emailCode(emailAddressId: emailFactor.emailAddressId)
            )
            return .verificationRequired(email: email)
        case .needsIdentifier, .needsFirstFactor, .needsNewPassword, .unknown:
            throw ClerkAuthError.missingSignInSession
        }
    }

    private func activateCompletedSignIn(_ signIn: SignIn) async throws -> ClerkAuthUser {
        guard let createdSessionId = signIn.createdSessionId else {
            throw ClerkAuthError.missingSignInSession
        }
        let preActiveId = clerk.session?.id ?? "nil"
        NSLog("🔷 ClerkSDK.activateCompletedSignIn: createdSessionId=\(createdSessionId) clerk.session.id=\(preActiveId)")
        // Only call setActive if Clerk hasn't already activated the session.
        // SignIn.create with `.complete` status often pre-activates the session,
        // and a redundant /touch call returns 401 "signed_out" because the
        // device token hasn't propagated yet.
        if clerk.session?.id != createdSessionId {
            do {
                try await clerk.setActive(sessionId: createdSessionId)
                NSLog("🔷 ClerkSDK.activateCompletedSignIn: setActive ok; clerk.session.id=\(clerk.session?.id ?? "nil")")
            } catch {
                NSLog("❌ ClerkSDK.activateCompletedSignIn: setActive failed \(error.localizedDescription); clerk.session.id=\(clerk.session?.id ?? "nil")")
            }
        } else {
            NSLog("🔷 ClerkSDK.activateCompletedSignIn: already active")
        }
        pendingSignIn = nil
        return try currentUser()
    }

    private func activateCompletedTransferResult(_ result: TransferFlowResult) async throws -> ClerkAuthUser {
        let sessionId = try Self.completedSocialSessionID(from: result)
        try await clerk.setActive(sessionId: sessionId)
        pendingSignIn = nil
        pendingSignUp = nil
        return try currentUser()
    }

    static func completedSocialSessionID(from result: TransferFlowResult) throws -> String {
        switch result {
        case let .signIn(signIn):
            guard signIn.status == .complete, let createdSessionId = signIn.createdSessionId else {
                throw ClerkAuthError.incompleteSocialSignIn
            }
            return createdSessionId
        case let .signUp(signUp):
            guard signUp.status == .complete, let createdSessionId = signUp.createdSessionId else {
                throw ClerkAuthError.incompleteSocialSignUp
            }
            return createdSessionId
        }
    }

    func signUp(email: String, password: String, name: String?) async throws -> ClerkSignUpResult {
        let parsedName = splitName(name)
        var signUp = try await SignUp.create(strategy: .standard(
            emailAddress: email,
            password: password,
            firstName: parsedName.firstName,
            lastName: parsedName.lastName
        ))

        if let createdSessionId = signUp.createdSessionId {
            try await clerk.setActive(sessionId: createdSessionId)
            pendingSignUp = nil
            return try .signedIn(currentUser())
        }

        signUp = try await signUp.prepareVerification(strategy: .emailCode)
        pendingSignUp = signUp
        return .verificationRequired(email: email)
    }

    func completeSignUpVerification(code: String) async throws -> ClerkAuthUser {
        guard let signUp = pendingSignUp else {
            throw ClerkAuthError.missingSignUpVerification
        }

        let verifiedSignUp = try await signUp.attemptVerification(strategy: .emailCode(code: code))
        guard let createdSessionId = verifiedSignUp.createdSessionId else {
            throw ClerkAuthError.missingVerificationSession
        }

        try await clerk.setActive(sessionId: createdSessionId)
        pendingSignUp = nil
        return try currentUser()
    }

    func signInWithApple() async throws -> ClerkAuthUser {
        let credential = try await SignInWithAppleHelper.getAppleIdCredential()
        guard let tokenData = credential.identityToken,
              let idToken = String(data: tokenData, encoding: .utf8),
              !idToken.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        else {
            throw ClerkAuthError.missingAppleIdentityToken
        }

        let result = try await SignIn.authenticateWithIdToken(provider: .apple, idToken: idToken)
        return try await activateCompletedTransferResult(result)
    }

    func signInWithGoogle() async throws -> ClerkAuthUser {
        let result = try await SignIn.authenticateWithRedirect(strategy: .oauth(provider: .google))
        return try await activateCompletedTransferResult(result)
    }

    func signOut() async throws {
        pendingSignIn = nil
        pendingSignUp = nil
        try await clerk.signOut()
    }

    func getJWT() async throws -> String? {
        guard let session = clerk.session else {
            NSLog("🔷 ClerkSDK.getJWT: clerk.session=nil → returning nil")
            return nil
        }
        do {
            let token = try await session.getToken(.init(template: "convex"))?.jwt
            NSLog("🔷 ClerkSDK.getJWT: session.id=\(session.id) jwt=\(token != nil ? "<\(token!.count) chars>" : "nil")")
            return token
        } catch {
            NSLog("❌ ClerkSDK.getJWT: session.id=\(session.id) threw \(error.localizedDescription)")
            throw error
        }
    }

    func restoreSession() async throws -> ClerkAuthUser? {
        try await clerk.load()
        guard let user = clerk.user else {
            return nil
        }
        return ClerkAuthUser(id: user.id, email: user.primaryEmailAddress?.emailAddress)
    }

    func completeOAuthCallback(token: String) async throws -> ClerkAuthUser? {
        let signIn = try await SignIn.create(strategy: .ticket(token))

        if let createdSessionId = signIn.createdSessionId {
            try await clerk.setActive(sessionId: createdSessionId)
        }

        guard let user = clerk.user else {
            return nil
        }
        return ClerkAuthUser(id: user.id, email: user.primaryEmailAddress?.emailAddress)
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

    func signIn(email: String, password: String) async throws -> ClerkSignInResult {
        try await sdk.signIn(email: email, password: password)
    }

    func completeSignInVerification(code: String) async throws -> ClerkAuthUser {
        try await sdk.completeSignInVerification(code: code)
    }

    func signUp(email: String, password: String, name: String?) async throws -> ClerkSignUpResult {
        try await sdk.signUp(email: email, password: password, name: name)
    }

    func completeSignUpVerification(code: String) async throws -> ClerkAuthUser {
        try await sdk.completeSignUpVerification(code: code)
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

    func restoreSession() async throws -> ClerkAuthUser? {
        try await sdk.restoreSession()
    }

    func completeOAuthCallback(token: String) async throws -> ClerkAuthUser? {
        try await sdk.completeOAuthCallback(token: token)
    }
}

@MainActor
@Observable
final class ClerkAuth: LaneShadowClerkJWTProviding {
    private(set) var currentUser: ClerkAuthUser?
    private(set) var pendingSignInEmail: String?
    private(set) var pendingSignUpEmail: String?

    private let client: any ClerkAuthClient

    init(client: any ClerkAuthClient = LiveClerkAuthClient()) {
        self.client = client
    }

    func signIn(email: String, password: String) async throws -> ClerkSignInResult {
        let result = try await client.signIn(email: email, password: password)
        switch result {
        case let .signedIn(user):
            currentUser = user
            pendingSignInEmail = nil
        case let .verificationRequired(email):
            currentUser = nil
            pendingSignInEmail = email
        }
        return result
    }

    func completeSignInVerification(code: String) async throws {
        currentUser = try await client.completeSignInVerification(code: code)
        pendingSignInEmail = nil
    }

    func signUp(email: String, password: String, name: String?) async throws -> ClerkSignUpResult {
        let result = try await client.signUp(email: email, password: password, name: name)
        switch result {
        case let .signedIn(user):
            currentUser = user
            pendingSignUpEmail = nil
        case let .verificationRequired(email):
            currentUser = nil
            pendingSignUpEmail = email
        }
        return result
    }

    func completeSignUpVerification(code: String) async throws {
        currentUser = try await client.completeSignUpVerification(code: code)
        pendingSignUpEmail = nil
    }

    func signInWithApple() async throws {
        currentUser = try await client.signInWithApple()
    }

    func signInWithGoogle() async throws {
        currentUser = try await client.signInWithGoogle()
    }

    func signOut() async throws {
        try await client.signOut()
        clearLocalSession()
    }

    func getJWT() async throws -> String? {
        NSLog("🔶 ClerkAuth.getJWT: enter")
        let token = try await client.getJWT()
        NSLog("🔶 ClerkAuth.getJWT: returning \(token != nil ? "<token>" : "nil")")
        return token
    }

    func convexJWT() async throws -> String? {
        NSLog("🔶 ClerkAuth.convexJWT: enter")
        return try await getJWT()
    }

    func restoreSession() async throws {
        currentUser = try await client.restoreSession()
    }

    func clearLocalSession() {
        currentUser = nil
        pendingSignInEmail = nil
        pendingSignUpEmail = nil
    }

    func completeOAuthCallback(token: String) async {
        do {
            currentUser = try await client.completeOAuthCallback(token: token)
        } catch {
            clearLocalSession()
        }
    }
}
