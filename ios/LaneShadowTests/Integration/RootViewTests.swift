import SwiftUI
import ViewInspector
import XCTest
@testable import LaneShadow

@MainActor
final class RootViewTests: XCTestCase {
    func testRootViewReplacesContentViewAsAppEntry() {
        let rootView = RootView(convexStore: ConvexStore())
        XCTAssertEqual(rootView.activeFlow, .auth)
    }

    func testAppStateObservableModelCreated() {
        let state = AppState()
        XCTAssertFalse(state.isAuthenticated)
    }

    func testAuthGateSwitchImplemented() {
        let unauthenticatedView = RootView(
            convexStore: ConvexStore(),
            appState: AppState(isAuthenticated: false)
        )
        XCTAssertEqual(unauthenticatedView.activeFlow, .auth)

        let authenticatedView = RootView(
            convexStore: ConvexStore(),
            appState: AppState(isAuthenticated: true)
        )
        XCTAssertEqual(authenticatedView.activeFlow, .app)
    }

    func testAuthFlowNavigationStackCreated() throws {
        let navStack = try AuthFlowView(route: .signUp).inspect().find(ViewType.NavigationStack.self)
        XCTAssertNotNil(navStack)
    }

    func testAppFlowNavigationStackCreated() throws {
        let navStack = try AppFlowView(route: .session(id: "session-123")).inspect().find(ViewType.NavigationStack.self)
        XCTAssertNotNil(navStack)
    }

    func testAppEnvironmentDIContainerImplemented() async throws {
        let clerkAuth = try await makeClerkAuth(isAuthenticated: true)
        let environment = makeEnvironment(clerkAuth: clerkAuth)

        XCTAssertTrue(type(of: environment.clerkAuth) == ClerkAuth.self)
        XCTAssertTrue(type(of: environment.convexClient) == LaneShadowConvexClient.self)
    }

    func testDeepLinkHandlingImplemented() async throws {
        let authenticatedClerk = try await makeClerkAuth(isAuthenticated: true)
        let unauthenticatedClerk = try await makeClerkAuth(isAuthenticated: false)

        let authenticatedSessionState = AppState(isAuthenticated: false)
        try authenticatedSessionState.handleDeepLink(
            XCTUnwrap(URL(string: "laneshadow://session/session-42")),
            clerkAuth: authenticatedClerk
        )
        XCTAssertTrue(authenticatedSessionState.isAuthenticated)
        XCTAssertEqual(authenticatedSessionState.appRoute, .session(id: "session-42"))
        XCTAssertNil(authenticatedSessionState.authRoute)

        let authenticatedDefaultState = AppState(isAuthenticated: false)
        try authenticatedDefaultState.handleDeepLink(
            XCTUnwrap(URL(string: "laneshadow://app/home")),
            clerkAuth: authenticatedClerk
        )
        XCTAssertEqual(authenticatedDefaultState.appRoute, .home)

        let signUpState = AppState(isAuthenticated: false)
        try signUpState.handleDeepLink(
            XCTUnwrap(URL(string: "laneshadow://auth/signup")),
            clerkAuth: unauthenticatedClerk
        )
        XCTAssertFalse(signUpState.isAuthenticated)
        XCTAssertEqual(signUpState.authRoute, .signUp)
        XCTAssertNil(signUpState.appRoute)

        let signInFallbackState = AppState(isAuthenticated: false)
        try signInFallbackState.handleDeepLink(
            XCTUnwrap(URL(string: "laneshadow://unknown/path")),
            clerkAuth: unauthenticatedClerk
        )
        XCTAssertEqual(signInFallbackState.authRoute, .signIn)

        let oauthState = AppState(isAuthenticated: false)
        try oauthState.handleDeepLink(
            XCTUnwrap(URL(string: "laneshadow://oauth-callback?code=abc")),
            clerkAuth: unauthenticatedClerk
        )
        XCTAssertEqual(oauthState.authRoute, .oauthCallback)
        XCTAssertNil(oauthState.appRoute)
    }

    private func makeEnvironment(clerkAuth: ClerkAuth) -> AppEnvironment {
        AppEnvironment(
            clerkAuth: clerkAuth,
            convexClient: LaneShadowConvexClient(deploymentURL: "http://localhost:3210") { nil }
        )
    }

    private func makeClerkAuth(isAuthenticated: Bool) async throws -> ClerkAuth {
        let client = RootViewTestsAuthClient()
        let auth = ClerkAuth(client: client)
        if isAuthenticated {
            try await auth.signIn(email: "rider@example.com", password: "secret")
        }
        return auth
    }
}

actor RootViewTestsAuthClient: ClerkAuthClient {
    func signIn(email: String, password _: String) async throws -> ClerkAuthUser {
        ClerkAuthUser(id: "user-1", email: email)
    }

    func signUp(email: String, password _: String, name _: String?) async throws -> ClerkAuthUser {
        ClerkAuthUser(id: "user-2", email: email)
    }

    func signInWithApple() async throws -> ClerkAuthUser {
        ClerkAuthUser(id: "apple", email: "apple@example.com")
    }

    func signInWithGoogle() async throws -> ClerkAuthUser {
        ClerkAuthUser(id: "google", email: "google@example.com")
    }

    func signOut() async throws {}

    func getJWT() async throws -> String? {
        "jwt"
    }
}

extension RootView: Inspectable {}
extension AuthFlowView: Inspectable {}
extension AppFlowView: Inspectable {}
