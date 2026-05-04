import Combine
import ConvexMobile
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
        XCTAssertTrue(source?.contains("Continue with Email") == true)
        XCTAssertTrue(source?.contains("Terms") == true)
        XCTAssertTrue(source?.contains("Privacy Policy") == true)
        XCTAssertTrue(source?.contains("LSPaperMap") == true)
        XCTAssertTrue(source?.contains("LSAuthProviderButton") == true)
        XCTAssertTrue(source?.contains("LSFormField") == true)
        XCTAssertTrue(source?.contains("LSSpinner") == true)
    }

    func testAuthScreenProvidesStableE2EIdentifiers() {
        let source = try? authSource(named: "AuthScreen.swift")

        XCTAssertTrue(source?.contains("\\(authIdentifierPrefix).email") == true)
        XCTAssertTrue(source?.contains("\\(authIdentifierPrefix).password") == true)
        XCTAssertTrue(source?.contains("\\(authIdentifierPrefix).name") == true)
        XCTAssertTrue(source?.contains("\\(authIdentifierPrefix).submit") == true)
        XCTAssertTrue(source?.contains("auth.signUp.entry") == true)
        XCTAssertTrue(source?.contains("passwordField(helperText: nil, error: viewModel.errorMessage)") == true)
        XCTAssertTrue(source?.contains(
            "passwordField(helperText: \"Use at least 8 characters.\", error: viewModel.errorMessage)"
        ) == true)
    }

    func testAuthScreenBranchConfigurationsMatchDesignCopy() {
        XCTAssertEqual(AuthScreenConfiguration(mode: .emailEntry).headline, "Saddle up.")
        XCTAssertEqual(AuthScreenConfiguration(mode: .existingUser).headline, "Welcome back.")
        XCTAssertEqual(AuthScreenConfiguration(mode: .existingUser).ctaTitle, "Sign in")
        XCTAssertEqual(AuthScreenConfiguration(mode: .newUser).headline, "Set up shop.")
        XCTAssertEqual(AuthScreenConfiguration(mode: .newUser).ctaTitle, "Create account")
        XCTAssertEqual(AuthScreenConfiguration(mode: .invalidEmail).formAccessibilityLabel, "Sign in or create account")
        XCTAssertEqual(AuthScreenConfiguration(mode: .submitting).ctaTitle, "Continue")
        XCTAssertEqual(AuthScreenConfiguration(mode: .verificationRequired).ctaTitle, "Continue")
    }

    func testAuthScreenTemplateStoriesCoverDesignVariants() {
        let storyIds = Set(LaneShadowStories.all.map(\.id))

        let expected = [
            "templates.auth-screen.entry",
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
            "templates.auth-screen.entry",
            "templates.auth-screen.email-entry",
            "templates.auth-screen.existing-user",
            "templates.auth-screen.new-user",
            "templates.auth-screen.invalid-email",
            "templates.auth-screen.submitting",
            "templates.auth-screen.dark",
        ]

        XCTAssertEqual(designReference, ".spec/design/system/views/auth-screen/auth-screen.html")
        XCTAssertEqual(storyEvidence.count, 7)
    }

    func testAuthScreenViewModelRejectsInvalidEmailInline() async {
        let viewModel = makeAuthScreenViewModel()
        viewModel.email = "invalid-email"

        await viewModel.continueFromEmail()

        XCTAssertEqual(viewModel.mode, .invalidEmail)
        XCTAssertEqual(viewModel.errorMessage, "Enter a valid email address.")
    }

    func testAuthScreenViewModelNeutralPreviewResolverKeepsValidEmailOnNeutralPath() async {
        let viewModel = makeAuthScreenViewModel()
        viewModel.email = "jamie.new@example.com"

        await viewModel.continueFromEmail()

        XCTAssertEqual(viewModel.email, "jamie.new@example.com")
        XCTAssertEqual(viewModel.mode, .emailEntry)
        XCTAssertNil(viewModel.errorMessage)
    }

    func testAuthScreenViewModelNeutralPreviewResolverDoesNotInferExistingUserFromEmail() async {
        let viewModel = makeAuthScreenViewModel()
        viewModel.email = "elena@ridelaneshadow.com"

        await viewModel.continueFromEmail()

        XCTAssertEqual(viewModel.mode, .emailEntry)
        XCTAssertNil(viewModel.errorMessage)
    }

    func testSignInScreenInjectsExistingUserResolver() async {
        let signInViewModel = SignInViewModel(auth: ClerkAuth(client: AuthScreensFakeClient()))
        let screen = SignInScreen(appState: AppState(isAuthenticated: false), viewModel: signInViewModel)
        let authViewModel = screen.makeAuthScreenViewModel(auth: ClerkAuth(client: AuthScreensFakeClient()))
        authViewModel.email = "rider@example.com"

        await authViewModel.continueFromEmail()

        XCTAssertEqual(authViewModel.mode, .existingUser)
        XCTAssertNil(authViewModel.errorMessage)
    }

    func testSignUpScreenInjectsNewUserResolver() async {
        let signUpViewModel = SignUpViewModel(auth: ClerkAuth(client: AuthScreensFakeClient()))
        let screen = SignUpScreen(appState: AppState(isAuthenticated: false), viewModel: signUpViewModel)
        let authViewModel = screen.makeAuthScreenViewModel(auth: ClerkAuth(client: AuthScreensFakeClient()))
        authViewModel.email = "rider@example.com"

        await authViewModel.continueFromEmail()

        XCTAssertEqual(authViewModel.mode, .newUser)
        XCTAssertNil(authViewModel.errorMessage)
    }

    func testProductionWrappersDoNotUseNeutralPreviewResolver() throws {
        let signInSource = try authSource(named: "SignInScreen.swift")
        let signUpSource = try authSource(named: "SignUpScreen.swift")

        XCTAssertTrue(signInSource.contains("emailResolver: Self.productionEmailResolver"))
        XCTAssertTrue(signUpSource.contains("emailResolver: Self.productionEmailResolver"))
        XCTAssertFalse(signInSource.contains("neutralPreviewEmailResolver"))
        XCTAssertFalse(signUpSource.contains("neutralPreviewEmailResolver"))
    }

    func testAuthScreenViewModelBranchesToExistingUser() async {
        let viewModel = makeAuthScreenViewModel(
            emailResolver: { _ in .existingUser }
        )
        viewModel.email = "elena@ridelaneshadow.com"

        await viewModel.continueFromEmail()

        XCTAssertEqual(viewModel.mode, .existingUser)
        XCTAssertNil(viewModel.errorMessage)
    }

    func testAuthScreenViewModelBranchesToNewUser() async {
        let viewModel = makeAuthScreenViewModel(
            emailResolver: { _ in .newUser }
        )
        viewModel.email = "jamie.miller@hey.com"

        await viewModel.continueFromEmail()

        XCTAssertEqual(viewModel.mode, .newUser)
        XCTAssertNil(viewModel.errorMessage)
    }

    func testAuthScreenViewModelSubmittingExistingUserSignsIn() async {
        let viewModel = makeAuthScreenViewModel(
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
        let viewModel = makeAuthScreenViewModel(
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

    func testAuthScreenViewModelSubmittingNewUserCanRequireVerification() async {
        let auth = ClerkAuth(client: AuthScreensFakeClient(
            signUpResult: .verificationRequired(email: "jamie.miller@hey.com")
        ))
        let viewModel = AuthScreenViewModel(
            auth: auth,
            mode: .newUser,
            email: "jamie.miller@hey.com",
            password: "secret",
            displayName: "Jamie Miller",
            emailResolver: AuthScreenViewModel.neutralPreviewEmailResolver
        )

        await viewModel.submitEmailBranch()

        XCTAssertEqual(viewModel.mode, .verificationRequired)
        XCTAssertEqual(auth.pendingSignUpEmail, "jamie.miller@hey.com")
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
            auth: auth,
            convexClient: makeConvexClient(currentUser: nil)
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
            auth: auth,
            convexClient: makeConvexClient(currentUser: .jamie)
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
        let auth = ClerkAuth(client: AuthScreensFakeClient())
        let viewModel = SignInViewModel(auth: auth)
        viewModel.email = "rider@example.com"
        viewModel.password = "secret"
        viewModel.step = .password

        await viewModel.submit()

        XCTAssertEqual(viewModel.step, .signedIn)
        XCTAssertEqual(auth.currentUser?.email, "rider@example.com")
        XCTAssertFalse(viewModel.isSubmitting)
        XCTAssertNil(viewModel.errorMessage)
    }

    func testAuthScreenProviderSignInUpdatesSharedClerkAuthInstance() async throws {
        let auth = ClerkAuth(client: AuthScreensFakeClient())
        let viewModel = AuthScreenViewModel(
            auth: auth,
            emailResolver: AuthScreenViewModel.neutralPreviewEmailResolver
        )

        try await viewModel.signInWithApple()

        XCTAssertEqual(viewModel.mode, .signedIn)
        XCTAssertEqual(auth.currentUser?.id, "apple-user")
    }

    private func makeAuthScreenViewModel(
        mode: AuthScreenMode = .emailEntry,
        email: String = "",
        password: String = "",
        displayName: String = "",
        emailResolver: @escaping AuthScreenViewModel.EmailResolver = AuthScreenViewModel.neutralPreviewEmailResolver
    ) -> AuthScreenViewModel {
        AuthScreenViewModel(
            auth: ClerkAuth(client: AuthScreensFakeClient()),
            mode: mode,
            email: email,
            password: password,
            displayName: displayName,
            emailResolver: emailResolver
        )
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

    private func makeConvexClient(currentUser: LaneShadowCurrentUser?) -> LaneShadowConvexClient {
        LaneShadowConvexClient(
            deploymentURL: "http://localhost:3210",
            tokenProvider: { nil },
            transport: AuthScreensConvexTransport(currentUser: currentUser)
        )
    }
}

actor AuthScreensFakeClient: ClerkAuthClient {
    private(set) var receivedCallbackTokens: [String] = []
    private let callbackCompletionUser: ClerkAuthUser?
    private let signUpResult: ClerkSignUpResult?

    init(
        callbackCompletionUser: ClerkAuthUser? = ClerkAuthUser(id: "callback-user", email: "callback@example.com"),
        signUpResult: ClerkSignUpResult? = nil
    ) {
        self.callbackCompletionUser = callbackCompletionUser
        self.signUpResult = signUpResult
    }

    func signIn(email: String, password: String) async throws -> ClerkSignInResult {
        .signedIn(ClerkAuthUser(id: "email-user", email: email))
    }

    func completeSignInVerification(code: String) async throws -> ClerkAuthUser {
        ClerkAuthUser(id: "verified-signin-user", email: "signin@example.com")
    }

    func signUp(email: String, password: String, name: String?) async throws -> ClerkSignUpResult {
        signUpResult ?? .signedIn(ClerkAuthUser(id: "signup-user", email: email))
    }

    func completeSignUpVerification(code: String) async throws -> ClerkAuthUser {
        ClerkAuthUser(id: "verified-signup-user", email: "signup@example.com")
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

    func restoreSession() async throws -> ClerkAuthUser? {
        nil
    }

    func completeOAuthCallback(token: String) async throws -> ClerkAuthUser? {
        receivedCallbackTokens.append(token)
        return callbackCompletionUser
    }
}

final class AuthScreensConvexTransport: LaneShadowConvexTransporting {
    private let currentUser: LaneShadowCurrentUser?

    init(currentUser: LaneShadowCurrentUser?) {
        self.currentUser = currentUser
    }

    func subscribe<T: Decodable & Sendable>(
        to endpoint: String,
        with _: [String: ConvexEncodable?]?,
        yielding _: T.Type
    ) -> AnyPublisher<T, ClientError> {
        if endpoint == LaneShadowConvexQuery.getCurrentUser.rawValue {
            return Just(currentUser as! T)
                .setFailureType(to: ClientError.self)
                .eraseToAnyPublisher()
        }

        return Empty<T, ClientError>().eraseToAnyPublisher()
    }

    func mutation<T: Decodable>(
        _: String,
        with _: [String: ConvexEncodable?]?
    ) async throws -> T {
        fatalError("Unexpected mutation in AuthScreensConvexTransport")
    }

    func mutation(
        _: String,
        with _: [String: ConvexEncodable?]?
    ) async throws {}

    func action<T: Decodable>(
        _: String,
        with _: [String: ConvexEncodable?]?
    ) async throws -> T {
        fatalError("Unexpected action in AuthScreensConvexTransport")
    }

    func action(
        _: String,
        with _: [String: ConvexEncodable?]?
    ) async throws {}

    func triggerAuthRefresh() async {}
}

private extension LaneShadowCurrentUser {
    static let jamie = LaneShadowCurrentUser(
        id: "user-1",
        clerkUserId: "clerk-user-1",
        email: "jamie@example.com",
        name: "Jamie Miller"
    )
}
