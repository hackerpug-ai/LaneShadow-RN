import SwiftUI
import XCTest
@testable import LaneShadow

@MainActor
final class AuthScreensTests: XCTestCase {
    func testAuthScreenConfigurationMatchesDesignAnatomy() {
        let source = try? authSource(named: "AuthScreen.swift")

        XCTAssertNotNil(source)
        XCTAssertTrue(source?.contains("AuthScreen") == true)
        XCTAssertTrue(source?.contains("Saddle") == true)
        XCTAssertTrue(source?.contains("LaneShadow") == true)
        XCTAssertTrue(source?.contains("Continue with Apple") == true)
        XCTAssertTrue(source?.contains("OR CONTINUE WITH EMAIL") == true)
        XCTAssertTrue(source?.contains("Terms") == true)
        XCTAssertTrue(source?.contains("Privacy Policy") == true)
        XCTAssertTrue(source?.contains("LSPaperMap") == true)
        XCTAssertTrue(source?.contains("LSAuthProviderButton") == true)
        XCTAssertTrue(source?.contains("LSFormField") == true)
        XCTAssertTrue(source?.contains("LSDivider") == true)
        XCTAssertTrue(source?.contains("LSSpinner") == true)
    }

    func testAuthScreenBranchConfigurationsMatchDesignCopy() {
        XCTAssertEqual(AuthScreenConfiguration(mode: .emailEntry).headline, "Saddle up.")
        XCTAssertEqual(AuthScreenConfiguration(mode: .existingUser).headline, "Welcome back.")
        XCTAssertEqual(AuthScreenConfiguration(mode: .existingUser).ctaTitle, "Sign in")
        XCTAssertEqual(AuthScreenConfiguration(mode: .newUser).headline, "Set up shop.")
        XCTAssertEqual(AuthScreenConfiguration(mode: .newUser).ctaTitle, "Create account")
        XCTAssertEqual(AuthScreenConfiguration(mode: .invalidEmail).formAccessibilityLabel, "Sign in or create account")
        XCTAssertEqual(AuthScreenConfiguration(mode: .submitting).ctaTitle, "Continue")
    }

    func testAuthScreenTemplateStoriesCoverDesignVariants() {
        let storyIds = Set(LaneShadowStories.all.map(\.id))

        let expected = [
            "templates.auth-screen.email-entry",
            "templates.auth-screen.existing-user",
            "templates.auth-screen.new-user",
            "templates.auth-screen.invalid-email",
            "templates.auth-screen.submitting",
            "templates.auth-screen.dark",
        ]

        for id in expected {
            XCTAssertTrue(storyIds.contains(id), "Missing AuthScreen sandbox story: \(id)")
        }
    }

    func testAuthScreenSnapshotEvidenceIsDesignReferenced() {
        let designReference = ".spec/design/system/views/auth-screen/auth-screen.html"
        let storyEvidence = [
            "templates.auth-screen.email-entry",
            "templates.auth-screen.existing-user",
            "templates.auth-screen.new-user",
            "templates.auth-screen.invalid-email",
            "templates.auth-screen.submitting",
            "templates.auth-screen.dark",
        ]

        XCTAssertEqual(designReference, ".spec/design/system/views/auth-screen/auth-screen.html")
        XCTAssertEqual(storyEvidence.count, 6)
    }

    func testAuthScreenViewModelRejectsInvalidEmailInline() async {
        let viewModel = AuthScreenViewModel(auth: ClerkAuth(client: AuthScreensFakeClient()))
        viewModel.email = "invalid-email"

        await viewModel.continueFromEmail()

        XCTAssertEqual(viewModel.mode, .invalidEmail)
        XCTAssertEqual(viewModel.errorMessage, "Enter a valid email address.")
    }

    func testAuthScreenViewModelDefaultResolverKeepsValidEmailOnNeutralPath() async {
        let viewModel = AuthScreenViewModel(auth: ClerkAuth(client: AuthScreensFakeClient()))
        viewModel.email = "jamie.new@example.com"

        await viewModel.continueFromEmail()

        XCTAssertEqual(viewModel.email, "jamie.new@example.com")
        XCTAssertEqual(viewModel.mode, .emailEntry)
        XCTAssertNil(viewModel.errorMessage)
    }

    func testAuthScreenViewModelDefaultResolverDoesNotInferExistingUserFromEmail() async {
        let viewModel = AuthScreenViewModel(auth: ClerkAuth(client: AuthScreensFakeClient()))
        viewModel.email = "elena@ridelaneshadow.com"

        await viewModel.continueFromEmail()

        XCTAssertEqual(viewModel.mode, .emailEntry)
        XCTAssertNil(viewModel.errorMessage)
    }

    func testAuthScreenViewModelBranchesToExistingUser() async {
        let viewModel = AuthScreenViewModel(
            auth: ClerkAuth(client: AuthScreensFakeClient()),
            emailResolver: { _ in .existingUser }
        )
        viewModel.email = "elena@ridelaneshadow.com"

        await viewModel.continueFromEmail()

        XCTAssertEqual(viewModel.mode, .existingUser)
        XCTAssertNil(viewModel.errorMessage)
    }

    func testAuthScreenViewModelBranchesToNewUser() async {
        let viewModel = AuthScreenViewModel(
            auth: ClerkAuth(client: AuthScreensFakeClient()),
            emailResolver: { _ in .newUser }
        )
        viewModel.email = "jamie.miller@hey.com"

        await viewModel.continueFromEmail()

        XCTAssertEqual(viewModel.mode, .newUser)
        XCTAssertNil(viewModel.errorMessage)
    }

    func testAuthScreenViewModelSubmittingExistingUserSignsIn() async {
        let viewModel = AuthScreenViewModel(
            auth: ClerkAuth(client: AuthScreensFakeClient()),
            mode: .existingUser,
            email: "elena@ridelaneshadow.com",
            password: "secret"
        )

        await viewModel.submitEmailBranch()

        XCTAssertEqual(viewModel.mode, .signedIn)
        XCTAssertFalse(viewModel.isSubmitting)
        XCTAssertNil(viewModel.errorMessage)
    }

    func testAuthScreenViewModelSubmittingNewUserCreatesAccount() async {
        let viewModel = AuthScreenViewModel(
            auth: ClerkAuth(client: AuthScreensFakeClient()),
            mode: .newUser,
            email: "jamie.miller@hey.com",
            password: "secret",
            displayName: "Jamie Miller"
        )

        await viewModel.submitEmailBranch()

        XCTAssertEqual(viewModel.mode, .signedIn)
        XCTAssertFalse(viewModel.isSubmitting)
        XCTAssertNil(viewModel.errorMessage)
    }

    func testAppStateRoutesOAuthCallbackWithURLPayload() throws {
        let appState = AppState(isAuthenticated: false)
        let auth = ClerkAuth(client: AuthScreensFakeClient())
        let callbackURL = try XCTUnwrap(URL(string: "laneshadow://oauth-callback?token=abc123"))

        appState.handleDeepLink(callbackURL, clerkAuth: auth)

        guard case let .oauthCallback(url)? = appState.authRoute else {
            return XCTFail("Expected oauth callback route with URL payload")
        }
        XCTAssertEqual(url, callbackURL)
    }

    func testPasswordVisibilityToggleStateChanges() {
        var state = AuthPasswordVisibilityState()

        XCTAssertTrue(state.isSecureEntry)
        state.toggle()
        XCTAssertFalse(state.isSecureEntry)
        state.toggle()
        XCTAssertTrue(state.isSecureEntry)
    }

    func testOAuthCallbackCompletionDoesNotAuthenticateWhenCallbackDoesNotYieldUser() async throws {
        let client = AuthScreensFakeClient(callbackCompletionUser: nil)
        let auth = ClerkAuth(client: client)
        let appState = AppState(isAuthenticated: false)
        let callbackURL = try XCTUnwrap(URL(string: "laneshadow://oauth-callback?token=abc123"))

        let result = await OAuthCallbackCompletion.complete(
            callbackURL: callbackURL,
            appState: appState,
            auth: auth
        )

        XCTAssertEqual(result, .success)
        XCTAssertFalse(appState.isAuthenticated)
        XCTAssertNil(appState.appRoute)
        XCTAssertNotNil(appState.authRoute)
        let tokens = await client.receivedCallbackTokens
        XCTAssertEqual(tokens, ["abc123"])
    }

    func testOAuthCallbackCompletionRoutesHomeWhenCallbackProducesAuthenticatedUser() async throws {
        let client = AuthScreensFakeClient(
            callbackCompletionUser: ClerkAuthUser(id: "oauth-user", email: "rider@example.com")
        )
        let auth = ClerkAuth(client: client)
        let appState = AppState(isAuthenticated: false)
        let callbackURL = try XCTUnwrap(URL(string: "laneshadow://oauth-callback?token=abc123"))

        let result = await OAuthCallbackCompletion.complete(
            callbackURL: callbackURL,
            appState: appState,
            auth: auth
        )

        XCTAssertEqual(result, .success)
        XCTAssertTrue(appState.isAuthenticated)
        XCTAssertEqual(appState.appRoute, .home)
        XCTAssertNil(appState.authRoute)
    }

    func testAuthBackgroundContainerPrefersAssetWhenAvailable() {
        let source = AuthBackgroundContainer<EmptyView>.resolveImageSource { name in
            name == "AuthBackground" ? UIImage() : nil
        }

        XCTAssertEqual(source, .authBackground)
    }

    func testAuthBackgroundContainerFallsBackWhenAssetMissing() {
        let source = AuthBackgroundContainer<EmptyView>.resolveImageSource { _ in nil }

        XCTAssertEqual(source, .fallback)
    }

    func testSignUpViewModelSubmitsAndTransitionsToSignedIn() async {
        let auth = ClerkAuth(client: AuthScreensFakeClient())
        let viewModel = SignUpViewModel(auth: auth)
        viewModel.name = "Rider"
        viewModel.email = "rider@example.com"
        viewModel.password = "secret"
        viewModel.confirmPassword = "secret"

        await viewModel.submit()

        XCTAssertTrue(viewModel.isSignedIn)
        XCTAssertFalse(viewModel.isSubmitting)
        XCTAssertNil(viewModel.errorMessage)
    }

    func testSignUpViewModelRequiresMatchingPasswords() async {
        let auth = ClerkAuth(client: AuthScreensFakeClient())
        let viewModel = SignUpViewModel(auth: auth)
        viewModel.name = "Rider"
        viewModel.email = "rider@example.com"
        viewModel.password = "secret"
        viewModel.confirmPassword = "different"

        await viewModel.submit()

        XCTAssertFalse(viewModel.isSignedIn)
        XCTAssertEqual(viewModel.errorMessage, "Passwords do not match.")
    }

    func testSignInViewModelTransitionsFromEmailToPassword() {
        let viewModel = SignInViewModel(auth: ClerkAuth(client: AuthScreensFakeClient()))
        viewModel.email = "rider@example.com"

        viewModel.advanceFromEmail()

        XCTAssertEqual(viewModel.step, .password)
        XCTAssertNil(viewModel.errorMessage)
    }

    func testSignInViewModelSubmitTransitionsToSignedIn() async {
        let viewModel = SignInViewModel(auth: ClerkAuth(client: AuthScreensFakeClient()))
        viewModel.email = "rider@example.com"
        viewModel.password = "secret"
        viewModel.step = .password

        await viewModel.submit()

        XCTAssertEqual(viewModel.step, .signedIn)
        XCTAssertFalse(viewModel.isSubmitting)
        XCTAssertNil(viewModel.errorMessage)
    }

    private func authSource(named fileName: String) throws -> String {
        let repoRoot = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()

        let fileURL = repoRoot
            .appendingPathComponent("ios")
            .appendingPathComponent("LaneShadow")
            .appendingPathComponent("Features")
            .appendingPathComponent("Auth")
            .appendingPathComponent(fileName)

        return try String(contentsOf: fileURL, encoding: .utf8)
    }
}

actor AuthScreensFakeClient: ClerkAuthClient {
    private(set) var receivedCallbackTokens: [String] = []
    private let callbackCompletionUser: ClerkAuthUser?

    init(callbackCompletionUser: ClerkAuthUser? = ClerkAuthUser(id: "callback-user", email: "callback@example.com")) {
        self.callbackCompletionUser = callbackCompletionUser
    }

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
        "jwt-token"
    }

    func completeOAuthCallback(token: String) async throws -> ClerkAuthUser? {
        receivedCallbackTokens.append(token)
        return callbackCompletionUser
    }
}
