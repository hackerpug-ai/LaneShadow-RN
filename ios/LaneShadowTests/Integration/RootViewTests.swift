import Combine
import ConvexMobile
import SwiftUI
import ViewInspector
import XCTest
@testable import LaneShadow

@MainActor
final class RootViewTests: XCTestCase {
    func testRootViewReplacesContentViewAsAppEntry() {
        let app = LaneShadowApp()
        XCTAssertTrue(String(describing: type(of: app.body)).contains("RootView"))

        let rootView = RootView(convexStore: ConvexStore(), appState: AppState(isAuthenticated: false))

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
        let signInView = AuthFlowView(
            route: .signIn,
            appState: AppState(isAuthenticated: false),
            clerkAuth: ClerkAuth(client: RootViewTestsAuthClient())
        )
        XCTAssertNoThrow(try signInView.inspect().find(ViewType.NavigationStack.self))
        XCTAssertEqual(signInView.route, .signIn)

        let signUpView = AuthFlowView(
            route: .signUp,
            appState: AppState(isAuthenticated: false),
            clerkAuth: ClerkAuth(client: RootViewTestsAuthClient())
        )
        XCTAssertNoThrow(try signUpView.inspect().find(ViewType.NavigationStack.self))
        XCTAssertEqual(signUpView.route, .signUp)
    }

    func testAppFlowNavigationStackCreated() throws {
        let homeView = AppFlowView(route: .home)
        XCTAssertNoThrow(try homeView.inspect().find(ViewType.NavigationStack.self))
        XCTAssertNoThrow(try homeView.inspect().find(text: "App Home"))

        let sessionView = AppFlowView(route: .session(id: "session-123"))
        XCTAssertNoThrow(try sessionView.inspect().find(ViewType.NavigationStack.self))
        XCTAssertNoThrow(try sessionView.inspect().find(text: "Session session-123"))
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

        let authenticatedState = AppState(isAuthenticated: false)
        let authenticatedRoot = RootView(convexStore: ConvexStore(), appState: authenticatedState)
        try authenticatedRoot.handleIncomingURL(
            XCTUnwrap(URL(string: "laneshadow://session/session-42")),
            clerkAuth: authenticatedClerk
        )
        XCTAssertTrue(authenticatedState.hasClerkSession)
        XCTAssertFalse(authenticatedState.isAuthenticated)
        XCTAssertEqual(authenticatedState.appRoute, .session(id: "session-42"))
        XCTAssertNil(authenticatedState.authRoute)

        let unauthenticatedState = AppState(isAuthenticated: false)
        let unauthenticatedRoot = RootView(convexStore: ConvexStore(), appState: unauthenticatedState)
        try unauthenticatedRoot.handleIncomingURL(
            XCTUnwrap(URL(string: "laneshadow://auth/signup")),
            clerkAuth: unauthenticatedClerk
        )
        XCTAssertFalse(unauthenticatedState.isAuthenticated)
        XCTAssertEqual(unauthenticatedState.authRoute, AppState.AuthRoute.signUp)
        XCTAssertNil(unauthenticatedState.appRoute)
    }

    func testRootViewOnOpenURLWiringRoutesDeepLink() async throws {
        let clerkAuth = try await makeClerkAuth(isAuthenticated: true)
        let appState = AppState(isAuthenticated: false)
        let rootView = RootView(convexStore: ConvexStore(), appState: appState)
        let deepLinkURL = try XCTUnwrap(URL(string: "laneshadow://session/session-99"))

        rootView.handleSystemOpenURL(deepLinkURL, clerkAuth: clerkAuth)

        XCTAssertTrue(appState.hasClerkSession)
        XCTAssertFalse(appState.isAuthenticated)
        XCTAssertEqual(appState.appRoute, .session(id: "session-99"))
        XCTAssertNil(appState.authRoute)
    }

    func testCompleteAuthenticationWaitsForConvexCurrentUserBeforeAppIsAuthenticated() async throws {
        let clerkAuth = try await makeClerkAuth(isAuthenticated: true)
        let transport = RootViewTestsConvexTransport(currentUser: .jamie)
        let convexClient = LaneShadowConvexClient(
            deploymentURL: "http://localhost:3210",
            tokenProvider: { nil },
            transport: transport
        )
        let appState = AppState(isAuthenticated: false)

        await appState.completeAuthentication(clerkAuth: clerkAuth, convexClient: convexClient)

        XCTAssertEqual(transport.subscribedEndpoints, ["db/users:getCurrentUser"])
        let loginToken = try await convexClient.debugLoginTokenForTesting()
        XCTAssertEqual(loginToken, "jwt")
        XCTAssertEqual(appState.currentUser?.displayName, "Jamie Miller")
        XCTAssertTrue(appState.isAuthenticated)
        XCTAssertEqual(appState.appRoute, .home)
        XCTAssertNil(appState.authRoute)
    }

    func testCompleteAuthenticationDoesNotShowAppWhenCurrentUserIsMissing() async throws {
        let clerkAuth = try await makeClerkAuth(isAuthenticated: true)
        let convexClient = LaneShadowConvexClient(
            deploymentURL: "http://localhost:3210",
            tokenProvider: { nil },
            transport: RootViewTestsConvexTransport(currentUser: nil)
        )
        let appState = AppState(isAuthenticated: false)

        await appState.completeAuthentication(clerkAuth: clerkAuth, convexClient: convexClient)

        XCTAssertFalse(appState.isAuthenticated)
        XCTAssertNil(appState.currentUser)
        XCTAssertNil(appState.appRoute)
        XCTAssertEqual(appState.authRoute, AppState.AuthRoute.signIn)
    }

    func testSignOutClearsClerkConvexAndRouteState() async throws {
        let client = RootViewTestsAuthClient()
        let clerkAuth = ClerkAuth(client: client)
        try await clerkAuth.signIn(email: "rider@example.com", password: "secret")
        let convexClient = LaneShadowConvexClient(
            deploymentURL: "http://localhost:3210",
            tokenProvider: { "jwt" },
            transport: RootViewTestsConvexTransport(currentUser: .jamie)
        )
        let appState = AppState(isAuthenticated: true, currentUser: .jamie)
        appState.appRoute = .session(id: "session-123")

        await appState.signOut(clerkAuth: clerkAuth, convexClient: convexClient)

        XCTAssertNil(clerkAuth.currentUser)
        let loginToken = try await convexClient.debugLoginTokenForTesting()
        XCTAssertNil(loginToken)
        XCTAssertFalse(appState.isAuthenticated)
        XCTAssertNil(appState.currentUser)
        XCTAssertNil(appState.appRoute)
        XCTAssertEqual(appState.authRoute, AppState.AuthRoute.signIn)
        let signOutCalls = await client.signOutCallCount()
        XCTAssertEqual(signOutCalls, 1)
    }

    func testUnauthenticatedConvexErrorClearsAuthAndRedirectsToSignIn() async throws {
        let clerkAuth = try await makeClerkAuth(isAuthenticated: true)
        let convexClient = LaneShadowConvexClient(
            deploymentURL: "http://localhost:3210",
            tokenProvider: { "jwt" },
            transport: RootViewTestsConvexTransport(currentUser: .jamie)
        )
        let appState = AppState(isAuthenticated: true, currentUser: .jamie)
        let rootView = RootView(convexStore: ConvexStore(), appState: appState)

        await rootView.handleConvexError(
            ClientError.ConvexError(data: #"{"code":"UNAUTHENTICATED"}"#),
            clerkAuth: clerkAuth,
            convexClient: convexClient
        )

        XCTAssertNil(clerkAuth.currentUser)
        let loginToken = try await convexClient.debugLoginTokenForTesting()
        XCTAssertNil(loginToken)
        XCTAssertFalse(appState.isAuthenticated)
        XCTAssertEqual(appState.authRoute, AppState.AuthRoute.signIn)
        XCTAssertEqual(appState.authMessage, "Your session expired. Please sign in again.")
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
    private(set) var signOutCalls = 0

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

    func signOut() async throws {
        signOutCalls += 1
    }

    func signOutCallCount() -> Int {
        signOutCalls
    }

    func getJWT() async throws -> String? {
        "jwt"
    }

    func restoreSession() async throws -> ClerkAuthUser? {
        nil
    }

    func completeOAuthCallback(token _: String) async throws -> ClerkAuthUser? {
        nil
    }
}

final class RootViewTestsConvexTransport: LaneShadowConvexTransporting {
    private let currentUser: LaneShadowCurrentUser?
    private(set) var subscribedEndpoints: [String] = []

    init(currentUser: LaneShadowCurrentUser?) {
        self.currentUser = currentUser
    }

    func subscribe<T: Decodable & Sendable>(
        to endpoint: String,
        with _: [String: ConvexEncodable?]?,
        yielding _: T.Type
    ) -> AnyPublisher<T, ClientError> {
        subscribedEndpoints.append(endpoint)

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
        fatalError("Unexpected mutation in RootViewTestsConvexTransport")
    }

    func mutation(
        _: String,
        with _: [String: ConvexEncodable?]?
    ) async throws {}

    func action<T: Decodable>(
        _: String,
        with _: [String: ConvexEncodable?]?
    ) async throws -> T {
        fatalError("Unexpected action in RootViewTestsConvexTransport")
    }

    func action(
        _: String,
        with _: [String: ConvexEncodable?]?
    ) async throws {}
}

private extension LaneShadowCurrentUser {
    static let jamie = LaneShadowCurrentUser(
        id: "user-1",
        clerkUserId: "clerk-user-1",
        email: "jamie@example.com",
        name: "Jamie Miller"
    )
}

extension RootView: Inspectable {}
extension AuthFlowView: Inspectable {}
extension AppFlowView: Inspectable {}
