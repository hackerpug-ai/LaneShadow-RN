import SwiftUI
import ViewInspector
import XCTest
@testable import LaneShadow

@MainActor
final class RootViewTests: XCTestCase {
    func testRootViewSelectsAuthFlowWhenNotAuthenticated() {
        let view = RootView(
            convexStore: ConvexStore(),
            appState: AppState(isAuthenticated: false)
        )

        XCTAssertEqual(view.activeFlow, .auth)
    }

    func testRootViewSelectsAppFlowWhenAuthenticated() {
        let view = RootView(
            convexStore: ConvexStore(),
            appState: AppState(isAuthenticated: true)
        )

        XCTAssertEqual(view.activeFlow, .app)
    }

    func testAppStateRoutesUnauthenticatedAuthSignupDeepLinkToSignUp() async throws {
        let clerkAuth = try await makeClerkAuth(isAuthenticated: false)
        let state = AppState(isAuthenticated: false)

        state.handleDeepLink(URL(string: "laneshadow://auth/signup")!, clerkAuth: clerkAuth)

        XCTAssertFalse(state.isAuthenticated)
        XCTAssertEqual(state.authRoute, .signUp)
        XCTAssertNil(state.appRoute)
    }

    func testAppStateRoutesAuthenticatedDeepLinkToAppDestination() async throws {
        let clerkAuth = try await makeClerkAuth(isAuthenticated: true)
        let state = AppState(isAuthenticated: false)

        state.handleDeepLink(URL(string: "laneshadow://app/home")!, clerkAuth: clerkAuth)

        XCTAssertTrue(state.isAuthenticated)
        XCTAssertEqual(state.appRoute, .home)
    }

    func testAuthFlowUsesNavigationStack() throws {
        let navStack = try AuthFlowView().inspect().find(ViewType.NavigationStack.self)
        XCTAssertNotNil(navStack)
    }

    func testAppFlowUsesNavigationStack() throws {
        let navStack = try AppFlowView().inspect().find(ViewType.NavigationStack.self)
        XCTAssertNotNil(navStack)
    }

    func testAppEnvironmentProvidesClerkAndConvex() async throws {
        let clerkAuth = try await makeClerkAuth(isAuthenticated: true)
        let environment = makeEnvironment(clerkAuth: clerkAuth)

        XCTAssertTrue(type(of: environment.clerkAuth) == ClerkAuth.self)
        XCTAssertTrue(type(of: environment.convexClient) == LaneShadowConvexClient.self)
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
