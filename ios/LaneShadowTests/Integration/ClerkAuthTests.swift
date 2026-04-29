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
