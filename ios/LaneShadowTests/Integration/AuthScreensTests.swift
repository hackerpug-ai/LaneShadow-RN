import Foundation
import Testing
@testable import LaneShadow

@MainActor
struct AuthScreensTests {
    @Test
    func signInFlowProgressesFromEmailToPasswordToSubmittingToSignedIn() async {
        let auth = ClerkAuth(client: FakeAuthScreensClient())
        let viewModel = SignInViewModel(auth: auth)

        #expect(viewModel.step == .email)

        viewModel.email = "rider@example.com"
        viewModel.advanceFromEmail()
        #expect(viewModel.step == .password)

        viewModel.password = "secret"
        await viewModel.submit()

        #expect(viewModel.step == .signedIn)
        #expect(viewModel.isSubmitting == false)
    }

    @Test
    func signInScreenUsesV2AtomsAndDangerText() throws {
        let source = try authSource("Features/Auth/SignInScreen.swift")
        #expect(source.contains("LSTextField"))
        #expect(source.contains("LSButton"))
        #expect(source.contains("LSText("))
        #expect(source.contains("LSSpinner"))
        #expect(source.contains("color: .danger"))
    }

    @Test
    func authProviderMoleculeComposesAtomsWithProviderLabelAndIcon() throws {
        let source = try authSource("DesignSystem/Molecules/LSAuthProviderButton.swift")
        #expect(source.contains("enum LSAuthProvider"))
        #expect(source.contains("case apple"))
        #expect(source.contains("case google"))
        #expect(source.contains("LSButton("))
        #expect(source.contains("leadingIcon: provider.icon"))
    }

    @Test
    func signUpScreenIncludesExpectedFields() throws {
        let source = try authSource("Features/Auth/SignUpScreen.swift")
        #expect(source.contains("placeholder: \"Name\""))
        #expect(source.contains("placeholder: \"Email\""))
        #expect(source.contains("placeholder: \"Password\""))
        #expect(source.contains("placeholder: \"Confirm password\""))
    }

    @Test
    func oauthCallbackParsesTokenAndCompletesAuth() {
        let tokenFromQuery = OAuthCallbackScreen
            .parseToken(from: URL(string: "laneshadow://oauth-callback?token=abc123"))
        #expect(tokenFromQuery == "abc123")

        var capturedToken: String?
        let screen = OAuthCallbackScreen(callbackURL: URL(string: "laneshadow://oauth-callback?token=done")) {
            capturedToken = $0
        }
        screen.completeAuth()

        #expect(capturedToken == "done")
    }

    @Test
    func authScreensApplyBackgroundImageContainer() throws {
        let signInSource = try authSource("Features/Auth/SignInScreen.swift")
        let signUpSource = try authSource("Features/Auth/SignUpScreen.swift")
        let callbackSource = try authSource("Features/Auth/OAuthCallbackScreen.swift")

        #expect(signInSource.contains("AuthBackgroundContainer"))
        #expect(signInSource.contains("Image(systemName: \"mountain.2.fill\")"))
        #expect(signUpSource.contains("AuthBackgroundContainer"))
        #expect(callbackSource.contains("AuthBackgroundContainer"))
    }

    private func authSource(_ relativePath: String) throws -> String {
        let baseURL = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent("LaneShadow")
        return try String(contentsOf: baseURL.appendingPathComponent(relativePath), encoding: .utf8)
    }
}

actor FakeAuthScreensClient: ClerkAuthClient {
    func signIn(email: String, password: String) async throws -> ClerkAuthUser {
        ClerkAuthUser(id: "email-user", email: email)
    }

    func signUp(email: String, password: String, name: String?) async throws -> ClerkAuthUser {
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
        "jwt"
    }
}
