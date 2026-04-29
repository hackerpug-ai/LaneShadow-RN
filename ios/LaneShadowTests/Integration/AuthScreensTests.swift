import XCTest
@testable import LaneShadow

@MainActor
final class AuthScreensTests: XCTestCase {
    private let authSecureTextEntrySourcePath = "/Users/justinrich/Projects/LaneShadow/.claude/worktrees/AUTH-S03-T09/ios/LaneShadow/Features/Auth/AuthSecureTextEntry.swift"
    private let signInScreenSourcePath = "/Users/justinrich/Projects/LaneShadow/.claude/worktrees/AUTH-S03-T09/ios/LaneShadow/Features/Auth/SignInScreen.swift"
    private let signUpScreenSourcePath = "/Users/justinrich/Projects/LaneShadow/.claude/worktrees/AUTH-S03-T09/ios/LaneShadow/Features/Auth/SignUpScreen.swift"
    private let oauthCallbackScreenSourcePath = "/Users/justinrich/Projects/LaneShadow/.claude/worktrees/AUTH-S03-T09/ios/LaneShadow/Features/Auth/OAuthCallbackScreen.swift"

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

    func testPasswordVisibilityToggleStateChanges() {
        var state = AuthPasswordVisibilityState()

        XCTAssertTrue(state.isSecureEntry)

        state.toggle()
        XCTAssertFalse(state.isSecureEntry)

        state.toggle()
        XCTAssertTrue(state.isSecureEntry)
    }

    func testOAuthCallbackCompletionDoesNotAuthenticateWhenCallbackDoesNotYieldUser() async throws {
        let auth = ClerkAuth(client: AuthScreensFakeClient(callbackCompletionUser: nil))
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
    }

    func testOAuthCallbackCompletionRoutesHomeWhenCallbackProducesAuthenticatedUser() async throws {
        let auth = ClerkAuth(client: AuthScreensFakeClient(
            callbackCompletionUser: ClerkAuthUser(id: "oauth-user", email: "rider@example.com")
        ))
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

    func testAuthSecureTextEntryComposesLSTextFieldAndNoRawFields() throws {
        let source = try String(contentsOfFile: authSecureTextEntrySourcePath, encoding: .utf8)
        let sourceWithoutV2Atom = source.replacingOccurrences(of: "LSTextField(", with: "")

        XCTAssertTrue(source.contains("LSTextField("))
        XCTAssertFalse(source.contains("SecureField("))
        XCTAssertFalse(sourceWithoutV2Atom.contains("TextField("))
    }

    func testAuthScreensUseAuthBackgroundContainer() throws {
        let signInSource = try String(contentsOfFile: signInScreenSourcePath, encoding: .utf8)
        let signUpSource = try String(contentsOfFile: signUpScreenSourcePath, encoding: .utf8)
        let callbackSource = try String(contentsOfFile: oauthCallbackScreenSourcePath, encoding: .utf8)

        XCTAssertTrue(signInSource.contains("AuthBackgroundContainer"))
        XCTAssertTrue(signUpSource.contains("AuthBackgroundContainer"))
        XCTAssertTrue(callbackSource.contains("AuthBackgroundContainer"))
    }
}

actor AuthScreensFakeClient: ClerkAuthClient {
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
        callbackCompletionUser
    }
}
