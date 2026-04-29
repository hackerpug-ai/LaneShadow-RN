import XCTest
@testable import LaneShadow

@MainActor
final class AuthScreensTests: XCTestCase {
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

    func testOAuthCallbackCompletionMarksAuthenticatedAndRoutesHome() async throws {
        let auth = ClerkAuth(client: AuthScreensFakeClient())
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
}

actor AuthScreensFakeClient: ClerkAuthClient {
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
}
