import ConvexMobile
import Foundation
import Testing
@testable import LaneShadow

@MainActor
struct ClerkAuthTests {
    @Test
    func clerkIOSPackageIntegrated() {
        // Compile-time integration check for Convex + auth surfaces.
        let providerType: any AuthProvider.Type = ClerkAuthProvider.self
        #expect(String(describing: providerType).contains("ClerkAuthProvider"))
    }

    @Test
    func clerkAuthObservableWrapperCreated() {
        let auth = ClerkAuth(client: FakeClerkAuthClient())
        #expect(type(of: auth) == ClerkAuth.self)
    }

    @Test
    func emailPasswordAuthFlowImplemented() async throws {
        let client = FakeClerkAuthClient()
        let auth = ClerkAuth(client: client)

        try await auth.signIn(email: "rider@example.com", password: "secret")

        #expect(auth.currentUser?.id == "email-user")
        #expect(await client.lastEmail == "rider@example.com")
    }

    @Test
    func appleSignInOAuthFlowImplemented() async throws {
        let auth = ClerkAuth(client: FakeClerkAuthClient())

        try await auth.signInWithApple()

        #expect(auth.currentUser?.id == "apple-user")
    }

    @Test
    func googleOAuthFlowImplemented() async throws {
        let auth = ClerkAuth(client: FakeClerkAuthClient())

        try await auth.signInWithGoogle()

        #expect(auth.currentUser?.id == "google-user")
    }

    @Test
    func liveClientUsesClerkSDKForEmailSignInAndJWT() async throws {
        let sdk = MockClerkSDK()
        sdk.emailSignInUser = ClerkAuthUser(id: "clerk-email", email: "rider@example.com")
        sdk.jwtToReturn = "convex-jwt"
        let client = LiveClerkAuthClient(sdk: sdk)

        let user = try await client.signIn(email: "rider@example.com", password: "secret")
        let jwt = try await client.getJWT()

        #expect(user.id == "clerk-email")
        #expect(sdk.recordedEmailSignIn?.0 == "rider@example.com")
        #expect(sdk.recordedEmailSignIn?.1 == "secret")
        #expect(jwt == "convex-jwt")
    }

    @Test
    func liveClientUsesClerkSDKForSignUpAndOAuthAndSignOut() async throws {
        let sdk = MockClerkSDK()
        sdk.signUpUser = ClerkAuthUser(id: "clerk-signup", email: "signup@example.com")
        sdk.appleUser = ClerkAuthUser(id: "clerk-apple", email: "apple@example.com")
        sdk.googleUser = ClerkAuthUser(id: "clerk-google", email: "google@example.com")
        let client = LiveClerkAuthClient(sdk: sdk)

        _ = try await client.signUp(email: "signup@example.com", password: "secret", name: "Rider")
        _ = try await client.signInWithApple()
        _ = try await client.signInWithGoogle()
        try await client.signOut()

        #expect(sdk.recordedSignUp?.0 == "signup@example.com")
        #expect(sdk.recordedSignUp?.1 == "secret")
        #expect(sdk.recordedSignUp?.2 == "Rider")
        #expect(sdk.appleCalls == 1)
        #expect(sdk.googleCalls == 1)
        #expect(sdk.signOutCalls == 1)
    }

    @Test
    func clerkAuthProviderConformsToConvexMobile() {
        let provider = ClerkAuthProvider(auth: ClerkAuth(client: FakeClerkAuthClient()))
        let authProvider: any AuthProvider = provider
        #expect(String(describing: type(of: authProvider)).contains("ClerkAuthProvider"))
    }

    @Test
    func infoPlistIncludesLaneshadowURLScheme() throws {
        let plistURL = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent("LaneShadow")
            .appendingPathComponent("Info.plist")
        let data = try Data(contentsOf: plistURL)
        let plist = try PropertyListSerialization.propertyList(from: data, format: nil) as? [String: Any]
        let urlTypes = plist?["CFBundleURLTypes"] as? [[String: Any]]
        let schemes = urlTypes?
            .flatMap { $0["CFBundleURLSchemes"] as? [String] ?? [] } ?? []

        #expect(schemes.contains("laneshadow"))
    }
}

actor FakeClerkAuthClient: ClerkAuthClient {
    var lastEmail: String?

    func signIn(email: String, password _: String) async throws -> ClerkAuthUser {
        lastEmail = email
        return ClerkAuthUser(id: "email-user", email: email)
    }

    func signUp(email: String, password _: String, name _: String?) async throws -> ClerkAuthUser {
        ClerkAuthUser(id: "signup-user", email: email)
    }

    func signInWithApple() async throws -> ClerkAuthUser {
        ClerkAuthUser(id: "apple-user", email: "apple@example.com")
    }

    func signInWithGoogle() async throws -> ClerkAuthUser {
        ClerkAuthUser(id: "google-user", email: "google@example.com")
    }

    func signOut() async throws {}

    func getJWT() async throws -> String? {
        "jwt-token"
    }
}

@MainActor
final class MockClerkSDK: ClerkSDKClient {
    var recordedEmailSignIn: (String, String)?
    var recordedSignUp: (String, String, String?)?
    var appleCalls = 0
    var googleCalls = 0
    var signOutCalls = 0

    var emailSignInUser = ClerkAuthUser(id: "email-user", email: "email@example.com")
    var signUpUser = ClerkAuthUser(id: "signup-user", email: "signup@example.com")
    var appleUser = ClerkAuthUser(id: "apple-user", email: "apple@example.com")
    var googleUser = ClerkAuthUser(id: "google-user", email: "google@example.com")
    var jwtToReturn: String?

    func signIn(email: String, password: String) async throws -> ClerkAuthUser {
        recordedEmailSignIn = (email, password)
        return emailSignInUser
    }

    func signUp(email: String, password: String, name: String?) async throws -> ClerkAuthUser {
        recordedSignUp = (email, password, name)
        return signUpUser
    }

    func signInWithApple() async throws -> ClerkAuthUser {
        appleCalls += 1
        return appleUser
    }

    func signInWithGoogle() async throws -> ClerkAuthUser {
        googleCalls += 1
        return googleUser
    }

    func signOut() async throws {
        signOutCalls += 1
    }

    func getJWT() async throws -> String? {
        jwtToReturn
    }
}
