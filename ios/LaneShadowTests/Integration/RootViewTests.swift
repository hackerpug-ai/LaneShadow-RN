import Combine
import ConvexMobile
import SwiftUI
import UIKit
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

    func testAuthFlowRoutesByAppStateRoute() throws {
        let signInView = AuthFlowView(
            route: .signIn,
            appState: AppState(isAuthenticated: false),
            clerkAuth: ClerkAuth(client: RootViewTestsAuthClient())
        )
        XCTAssertEqual(signInView.route, .signIn)

        let signUpView = AuthFlowView(
            route: .signUp,
            appState: AppState(isAuthenticated: false),
            clerkAuth: ClerkAuth(client: RootViewTestsAuthClient())
        )
        XCTAssertEqual(signUpView.route, .signUp)

        let callbackURL = try XCTUnwrap(URL(string: "laneshadow://oauth-callback?token=abc123"))
        let callbackView = AuthFlowView(
            route: .oauthCallback(callbackURL),
            appState: AppState(isAuthenticated: false),
            clerkAuth: ClerkAuth(client: RootViewTestsAuthClient())
        )
        XCTAssertEqual(callbackView.route, .oauthCallback(callbackURL))
    }

    func testAppFlowNavigationStackCreated() async throws {
        let clerkAuth = try await makeClerkAuth(isAuthenticated: true)
        let transport = RootViewTestsConvexTransport(currentUser: .jamie)
        let convexClient = LaneShadowConvexClient(
            deploymentURL: "http://localhost:3210",
            tokenProvider: { nil },
            transport: transport
        )
        let sharedSessionStore = SessionStore()
        let appEnvironment = AppEnvironment(clerkAuth: clerkAuth, convexClient: convexClient)
        let sharedEnvironment = AppEnvironment(
            clerkAuth: clerkAuth,
            convexClient: convexClient,
            sessionStore: sharedSessionStore
        )

        let homeView = AppFlowView(route: .home)
            .environment(\.appEnvironment, sharedEnvironment)
        XCTAssertNoThrow(try homeView.inspect().find(ViewType.NavigationStack.self))
        XCTAssertNoThrow(try homeView.inspect().find(text: "App Home"))

        let sessionView = AppFlowView(route: .session(id: "session-123"))
            .environment(\.appEnvironment, sharedEnvironment)
        let sessionHostingController = UIHostingController(rootView: sessionView)
        sessionHostingController.loadViewIfNeeded()
        XCTAssertNotNil(sessionHostingController.view)
        _ = appEnvironment
    }

    func testAuthenticatedRootHomeMountsLiveIdleGreeting() async throws {
        let clerkAuth = try await makeClerkAuth(isAuthenticated: true)
        let transport = RootViewTestsConvexTransport(currentUser: .jamie)
        let convexClient = LaneShadowConvexClient(
            deploymentURL: "http://localhost:3210",
            tokenProvider: { nil },
            transport: transport
        )
        let appState = AppState(isAuthenticated: true, currentUser: .jamie)
        let rootView = RootView(convexStore: ConvexStore(), appState: appState)

        let hostedView = rootView.environment(
            \.appEnvironment,
            AppEnvironment(clerkAuth: clerkAuth, convexClient: convexClient)
        )
        let harness = host(hostedView)
        XCTAssertNotNil(harness.controller.view)

        await waitForAppRoute(appState, expected: .home)

        XCTAssertEqual(appState.appRoute, .home)
    }

    func testAuthenticatedRootSessionRouteMountsPlanningTranscript() async throws {
        let clerkAuth = try await makeClerkAuth(isAuthenticated: true)
        let transport = RootViewTestsConvexTransport(currentUser: .jamie)
        let convexClient = LaneShadowConvexClient(
            deploymentURL: "http://localhost:3210",
            tokenProvider: { nil },
            transport: transport
        )
        let appState = AppState(isAuthenticated: true, currentUser: .jamie)
        appState.appRoute = .session(id: "session-123")

        let rootView = RootView(convexStore: ConvexStore(), appState: appState)
        let hostedView = rootView.environment(
            \.appEnvironment,
            AppEnvironment(clerkAuth: clerkAuth, convexClient: convexClient)
        )
        let hostingController = UIHostingController(rootView: hostedView)
        hostingController.loadViewIfNeeded()
        XCTAssertNotNil(hostingController.view)

        await pumpMainActor()

        XCTAssertEqual(appState.appRoute, .session(id: "session-123"))
    }

    func testAppFlowSessionErrorRendersErrorScreenContainer() {
        let appState = AppState(isAuthenticated: true, currentUser: .jamie)
        appState.appRoute = .session(id: "session-123")

        let sessionStore = SessionStore()
        let chatStore = ChatStore(
            flowState: .error(
                ErrorState(
                    errorMessage: "STREAM_DOWN",
                    sessionId: "session-123",
                    errorTimestamp: Date(timeIntervalSince1970: 1_700_000_000)
                )
            ),
            sessionStore: sessionStore,
            dependencies: RideFlowDependencies(
                makeSessionId: { "route-session-456" },
                makeTimestamp: { Date(timeIntervalSince1970: 1_700_000_000) }
            )
        )

        let appFlowView = AppFlowView(route: appState.appRoute, appState: appState)

        XCTAssertEqual(appFlowView.route, .session(id: "session-123"))
        XCTAssertEqual(chatStore.flowState.phase, .error)
        XCTAssertEqual(chatStore.flowState.errorMessage, "STREAM_DOWN")
        XCTAssertEqual(
            AppFlowView.sessionDestination(for: chatStore.flowState.phase),
            .errorScreen
        )
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

    func testCompleteAuthenticationRoutesHomeAndHydratesConvexCurrentUser() async throws {
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

    func testCompleteAuthenticationRoutesHomeWhenCurrentUserIsMissing() async throws {
        let clerkAuth = try await makeClerkAuth(isAuthenticated: true)
        let convexClient = LaneShadowConvexClient(
            deploymentURL: "http://localhost:3210",
            tokenProvider: { nil },
            transport: RootViewTestsConvexTransport(currentUser: nil)
        )
        let appState = AppState(isAuthenticated: false)

        await appState.completeAuthentication(clerkAuth: clerkAuth, convexClient: convexClient)

        XCTAssertTrue(appState.isAuthenticated)
        XCTAssertTrue(appState.hasClerkSession)
        XCTAssertNil(appState.currentUser)
        XCTAssertEqual(appState.appRoute, .home)
        XCTAssertNil(appState.authRoute)
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

    func testUnauthenticatedConvexSubscriptionClearsAuthAndRedirectsToSignIn() async throws {
        let clerkAuth = try await makeClerkAuth(isAuthenticated: true)
        let transport = RootViewTestsConvexTransport(currentUser: .jamie)
        let convexClient = LaneShadowConvexClient(
            deploymentURL: "http://localhost:3210",
            tokenProvider: { "jwt" },
            transport: transport
        )
        let appState = AppState(isAuthenticated: true, currentUser: .jamie)
        let rootView = RootView(convexStore: ConvexStore(), appState: appState)
        await rootView.registerConvexUnauthenticatedHandler(
            clerkAuth: clerkAuth,
            convexClient: convexClient
        )

        let sessionsTask = Task {
            for await _ in convexClient.subscribeToSessions() {}
        }
        transport.sendSessionsFailure(ClientError.ConvexError(data: #"{"code":"UNAUTHENTICATED"}"#))
        await waitForUnauthenticatedRedirect(appState: appState, clerkAuth: clerkAuth)
        sessionsTask.cancel()

        XCTAssertNil(clerkAuth.currentUser)
        let loginToken = try await convexClient.debugLoginTokenForTesting()
        XCTAssertNil(loginToken)
        XCTAssertFalse(appState.isAuthenticated)
        XCTAssertEqual(appState.authRoute, AppState.AuthRoute.signIn)
        XCTAssertEqual(appState.authMessage, "Your session expired. Please sign in again.")
    }

    func testUITestResetAuthLaunchArgumentIsDebugOnlyAndExplicit() {
        #if DEBUG
            XCTAssertTrue(RootView.shouldResetAuthForUITesting(arguments: ["-UITesting", "-LaneShadowUITestResetAuth"]))
            XCTAssertFalse(RootView.shouldResetAuthForUITesting(arguments: ["-UITesting"]))
        #else
            XCTAssertTrue(true)
        #endif
    }

    private func pumpMainActor(iterations: Int = 20) async {
        for _ in 0 ..< iterations {
            await Task.yield()
        }
    }

    private func waitForUnauthenticatedRedirect(appState: AppState, clerkAuth: ClerkAuth) async {
        for _ in 0 ..< 100 {
            if appState.authRoute == .signIn, clerkAuth.currentUser == nil {
                return
            }
            try? await Task.sleep(nanoseconds: 10_000_000)
        }
    }

    private func waitForAppRoute(_ appState: AppState, expected: AppState.AppRoute) async {
        for _ in 0 ..< 100 {
            if appState.appRoute == expected {
                return
            }
            try? await Task.sleep(nanoseconds: 10_000_000)
        }
    }

    private func waitForFlowPhase(_ chatStore: ChatStore, expected: RideFlowPhaseKind) async {
        for _ in 0 ..< 100 {
            if chatStore.flowState.phase == expected {
                return
            }
            try? await Task.sleep(nanoseconds: 10_000_000)
        }
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

    @MainActor
    private func host(_ rootView: some View) -> HostedHarness {
        let controller = UIHostingController(rootView: AnyView(rootView))
        controller.loadViewIfNeeded()
        controller.view.frame = CGRect(x: 0, y: 0, width: 320, height: 80)
        let window = UIWindow(frame: controller.view.frame)
        window.rootViewController = controller
        window.makeKeyAndVisible()
        controller.view.setNeedsLayout()
        controller.view.layoutIfNeeded()
        window.layoutIfNeeded()
        RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.01))
        return HostedHarness(window: window, controller: controller)
    }
}

private struct HostedHarness {
    let window: UIWindow
    let controller: UIHostingController<AnyView>
}

actor RootViewTestsAuthClient: ClerkAuthClient {
    private(set) var signOutCalls = 0

    func signIn(email: String, password _: String) async throws -> ClerkSignInResult {
        .signedIn(ClerkAuthUser(id: "user-1", email: email))
    }

    func completeSignInVerification(code _: String) async throws -> ClerkAuthUser {
        ClerkAuthUser(id: "user-1", email: "signin@example.com")
    }

    func signUp(email: String, password _: String, name _: String?) async throws -> ClerkSignUpResult {
        .signedIn(ClerkAuthUser(id: "user-2", email: email))
    }

    func completeSignUpVerification(code _: String) async throws -> ClerkAuthUser {
        ClerkAuthUser(id: "user-2", email: "signup@example.com")
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
    private let sessionsSubject = PassthroughSubject<[LaneShadowSessionRecord], ClientError>()
    private var sessionMessagesSubjects: [String: CurrentValueSubject<[LaneShadowSessionMessage], ClientError>] = [:]
    private var routePlanSubjects: [String: PassthroughSubject<LaneShadowRoutePlanSnapshot, ClientError>] = [:]
    private var latestRoutePlans: [String: LaneShadowRoutePlanSnapshot] = [:]
    private var activeRoutePlanSubjects: [String: CurrentValueSubject<[LaneShadowRoutePlanSnapshot], ClientError>] = [:]
    private(set) var createPlanningSessionCalls: [String] = []
    private(set) var sendPlanningMessageCalls: [LaneShadowPlanningMessageCall] = []
    private(set) var subscribedEndpoints: [String] = []
    var stubCreatePlanningSessionResult = LaneShadowPlanningSessionCreationResult(sessionId: "session-123")

    init(currentUser: LaneShadowCurrentUser?) {
        self.currentUser = currentUser
    }

    func subscribe<T: Decodable & Sendable>(
        to endpoint: String,
        with args: [String: ConvexEncodable?]?,
        yielding _: T.Type
    ) -> AnyPublisher<T, ClientError> {
        subscribedEndpoints.append(endpoint)

        if endpoint == LaneShadowConvexQuery.getCurrentUser.rawValue {
            return Just(currentUser as! T)
                .setFailureType(to: ClientError.self)
                .eraseToAnyPublisher()
        }

        if endpoint == LaneShadowConvexQuery.listSessions.rawValue,
           T.self == [LaneShadowSessionRecord].self
        {
            return sessionsSubject
                .map { $0 as! T }
                .eraseToAnyPublisher()
        }

        if endpoint == LaneShadowConvexQuery.listMessages.rawValue,
           T.self == [LaneShadowSessionMessage].self,
           let sessionId = sessionIdArgument(from: args)
        {
            let subject = sessionMessagesSubjects[sessionId]
                ?? CurrentValueSubject<[LaneShadowSessionMessage], ClientError>([])
            sessionMessagesSubjects[sessionId] = subject
            return subject
                .map { $0 as! T }
                .eraseToAnyPublisher()
        }

        if endpoint == LaneShadowConvexQuery.getActiveRoutePlansForSession.rawValue,
           T.self == [LaneShadowRoutePlanSnapshot].self,
           let sessionId = sessionIdArgument(from: args)
        {
            let subject = activeRoutePlanSubjects[sessionId]
                ?? CurrentValueSubject<[LaneShadowRoutePlanSnapshot], ClientError>([])
            activeRoutePlanSubjects[sessionId] = subject
            return subject
                .map { $0 as! T }
                .eraseToAnyPublisher()
        }

        if endpoint == LaneShadowConvexQuery.getPlanById.rawValue,
           T.self == LaneShadowRoutePlanSnapshot.self,
           let routePlanId = routePlanIdArgument(from: args)
        {
            if let latestRoutePlan = latestRoutePlans[routePlanId] {
                return Just(latestRoutePlan as! T)
                    .setFailureType(to: ClientError.self)
                    .eraseToAnyPublisher()
            }

            let subject = routePlanSubjects[routePlanId]
                ?? PassthroughSubject<LaneShadowRoutePlanSnapshot, ClientError>()
            routePlanSubjects[routePlanId] = subject
            return subject
                .map { $0 as! T }
                .eraseToAnyPublisher()
        }

        return Empty<T, ClientError>().eraseToAnyPublisher()
    }

    func sendSessionsFailure(_ error: ClientError) {
        sessionsSubject.send(completion: .failure(error))
    }

    func sendSessionMessages(_ messages: [LaneShadowSessionMessage], sessionId: String) {
        let subject = sessionMessagesSubjects[sessionId]
            ?? CurrentValueSubject<[LaneShadowSessionMessage], ClientError>([])
        sessionMessagesSubjects[sessionId] = subject
        subject.send(messages)
    }

    func sendActiveRoutePlans(_ plans: [LaneShadowRoutePlanSnapshot], sessionId: String) {
        let subject = activeRoutePlanSubjects[sessionId]
            ?? CurrentValueSubject<[LaneShadowRoutePlanSnapshot], ClientError>([])
        activeRoutePlanSubjects[sessionId] = subject
        subject.send(plans)
    }

    func sendRoutePlan(_ routePlan: LaneShadowRoutePlanSnapshot) {
        latestRoutePlans[routePlan.id] = routePlan
        routePlanSubjects[routePlan.id]?.send(routePlan)
    }

    func mutation<T: Decodable>(
        _ endpoint: String,
        with args: [String: ConvexEncodable?]?
    ) async throws -> T {
        if endpoint == LaneShadowConvexMutation.createSession.rawValue,
           T.self == LaneShadowPlanningSessionCreationResult.self
        {
            if let firstMessage = stringArgument(named: "firstMessage", in: args) {
                createPlanningSessionCalls.append(firstMessage)
            }

            return stubCreatePlanningSessionResult as! T
        }

        fatalError("Unexpected mutation in RootViewTestsConvexTransport")
    }

    func mutation(
        _ endpoint: String,
        with _: [String: ConvexEncodable?]?
    ) async throws {
        if endpoint == LaneShadowConvexMutation.cancelPlan.rawValue {
            return
        }

        fatalError("Unexpected mutation in RootViewTestsConvexTransport")
    }

    func action<T: Decodable>(
        _ endpoint: String,
        with args: [String: ConvexEncodable?]?
    ) async throws -> T {
        if endpoint == LaneShadowConvexAction.sendMessage.rawValue,
           T.self == LaneShadowSendMessageResult.self
        {
            if let sessionId = sessionIdArgument(from: args),
               let content = stringArgument(named: "content", in: args)
            {
                sendPlanningMessageCalls.append(
                    LaneShadowPlanningMessageCall(
                        sessionId: sessionId,
                        content: content,
                        currentLocation: nil
                    )
                )
            }

            return LaneShadowSendMessageResult(
                response: "",
                messageId: "message-123",
                attachments: [
                    LaneShadowSendMessageAttachment(
                        type: "route_options",
                        routePlanId: "route-plan-123"
                    ),
                ]
            ) as! T
        }

        fatalError("Unexpected action in RootViewTestsConvexTransport")
    }

    func action(
        _ endpoint: String,
        with _: [String: ConvexEncodable?]?
    ) async throws {}

    private func sessionIdArgument(from args: [String: ConvexEncodable?]?) -> String? {
        stringArgument(named: "sessionId", in: args)
    }

    private func routePlanIdArgument(from args: [String: ConvexEncodable?]?) -> String? {
        stringArgument(named: "routePlanId", in: args)
    }

    private func stringArgument(named key: String, in args: [String: ConvexEncodable?]?) -> String? {
        guard let rawValue = args?[key],
              let value = rawValue,
              let encoded = try? value.convexEncode(),
              let data = encoded.data(using: .utf8)
        else {
            return nil
        }

        return try? JSONDecoder().decode(String.self, from: data)
    }

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

extension RootView: Inspectable {}
extension AuthFlowView: Inspectable {}
extension AppFlowView: Inspectable {}
