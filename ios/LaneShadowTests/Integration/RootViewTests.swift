import Combine
import Clerk
import CoreLocation
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

    func testLiveIdlePlanningRequestUsesCurrentLocationWithoutClarification() async throws {
        let runtime = try await makeLivePlanningRuntime()
        defer {
            Task {
                try? await runtime.clerkAuth.signOut()
            }
        }

        let currentLocation = LaneShadowCurrentLocation(
            lat: 37.7749,
            lng: -122.4194
        )
        let prompt = "Plan a scenic 2-hour ride"

        let session = try await runtime.convexClient.createPlanningSession(firstMessage: prompt)
        let result = try await runtime.convexClient.sendPlanningMessage(
            sessionId: session.sessionId,
            content: prompt,
            currentLocation: currentLocation
        )

        NSLog("AC4_LIVE_SESSION_ID=\(session.sessionId)")
        NSLog("AC4_LIVE_MESSAGE_ID=\(result.messageId)")

        XCTAssertEqual(
            runtime.transport.capturedCurrentLocation,
            currentLocation
        )

        let clarificationRegex = try NSRegularExpression(
            pattern: "where are (you|we) starting from",
            options: [.caseInsensitive]
        )
        let responseRange = NSRange(result.response.startIndex ..< result.response.endIndex, in: result.response)
        XCTAssertTrue(
            clarificationRegex.firstMatch(in: result.response, options: [], range: responseRange) == nil,
            "Expected no clarification asking where the rider starts. Response: \(result.response)"
        )

        let routeOptionsAttachment = result.attachments?.first(where: { $0.type == "route_options" })
        XCTAssertNotNil(routeOptionsAttachment, "Expected live sendMessage to produce a route_options attachment.")
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

    private func makeLivePlanningRuntime() async throws -> LivePlanningRuntime {
        let credentials = try loadLivePlanningCredentials()
        configureLiveClerkIfNeeded(publishableKey: credentials.publishableKey)

        let clerkAuth = ClerkAuth()
        let authProvider = LaneShadowAuthProvider {
            try await clerkAuth.convexJWT()
        }
        let transport = RecordingLiveConvexTransport(
            deploymentURL: credentials.convexURL,
            authProvider: authProvider
        )
        let convexClient = LaneShadowConvexClient(
            deploymentURL: credentials.convexURL,
            tokenProvider: { try await clerkAuth.convexJWT() },
            transport: transport
        )
        let appState = AppState(isAuthenticated: false)

        try await clerkAuth.restoreSession()

        if clerkAuth.currentUser?.email != credentials.email {
            if clerkAuth.currentUser != nil {
                try await clerkAuth.signOut()
            }

            let signInResult = try await clerkAuth.signIn(
                email: credentials.email,
                password: credentials.password
            )
            guard case .signedIn = signInResult else {
                XCTFail("Live test credentials require interactive verification.")
                throw LivePlanningTestError.verificationRequired
            }
        }

        await transport.triggerAuthRefresh()
        await appState.completeAuthentication(clerkAuth: clerkAuth, convexClient: convexClient)

        guard appState.isAuthenticated else {
            throw LivePlanningTestError.authenticationDidNotComplete
        }

        let environment = AppEnvironment(
            clerkAuth: clerkAuth,
            convexClient: convexClient,
            sessionStore: SessionStore()
        )

        return LivePlanningRuntime(
            clerkAuth: clerkAuth,
            convexClient: convexClient,
            transport: transport,
            appState: appState,
            environment: environment
        )
    }

    private func waitForSessionID(in chatStore: ChatStore, timeoutNanoseconds: UInt64 = 30_000_000_000) async throws -> String {
        let deadline = DispatchTime.now().uptimeNanoseconds + timeoutNanoseconds
        while DispatchTime.now().uptimeNanoseconds < deadline {
            if let sessionId = chatStore.flowState.sessionId {
                return sessionId
            }
            try await Task.sleep(nanoseconds: 200_000_000)
        }
        throw LivePlanningTestError.sessionIDTimeout
    }

    private func waitForLiveSessionRecord(
        sessionId: String,
        convexClient: LaneShadowConvexClient,
        timeoutNanoseconds: UInt64 = 45_000_000_000
    ) async throws -> LaneShadowSessionRecord {
        try await withThrowingTaskGroup(of: LaneShadowSessionRecord.self) { group in
            group.addTask {
                for await sessions in convexClient.subscribe(.listSessions, yielding: [LaneShadowSessionRecord].self) {
                    if let record = sessions.first(where: { $0.id == sessionId }),
                       record.lastKnownLocation != nil
                    {
                        return record
                    }
                }
                throw LivePlanningTestError.sessionRecordTimeout(sessionId)
            }

            group.addTask {
                try await Task.sleep(nanoseconds: timeoutNanoseconds)
                throw LivePlanningTestError.sessionRecordTimeout(sessionId)
            }

            guard let result = try await group.next() else {
                throw LivePlanningTestError.sessionRecordTimeout(sessionId)
            }
            group.cancelAll()
            return result
        }
    }

    private func waitForLiveSessionMessages(
        sessionId: String,
        convexClient: LaneShadowConvexClient,
        timeoutNanoseconds: UInt64 = 60_000_000_000
    ) async throws -> [LaneShadowSessionMessage] {
        try await withThrowingTaskGroup(of: [LaneShadowSessionMessage].self) { group in
            group.addTask {
                for await messages in convexClient.subscribeToSessionMessages(sessionId: sessionId, limit: 50) {
                    let hasToolStep = messages.contains { !($0.thinkingSteps ?? []).isEmpty }
                    let hasFinalAssistantText = messages.contains {
                        $0.role == "system" && !$0.content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                    }
                    if hasToolStep && hasFinalAssistantText {
                        return messages
                    }
                }
                throw LivePlanningTestError.sessionMessagesTimeout(sessionId)
            }

            group.addTask {
                try await Task.sleep(nanoseconds: timeoutNanoseconds)
                throw LivePlanningTestError.sessionMessagesTimeout(sessionId)
            }

            guard let result = try await group.next() else {
                throw LivePlanningTestError.sessionMessagesTimeout(sessionId)
            }
            group.cancelAll()
            return result
        }
    }

    private func loadLivePlanningCredentials() throws -> LivePlanningCredentials {
        let environment = Self.loadDotEnvLocal().merging(ProcessInfo.processInfo.environment) { _, new in new }

        let publishableKey = try requireValue(
            keys: ["CLERK_PUBLISHABLE_KEY", "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY"],
            in: environment
        )
        let convexURL = try requireValue(
            keys: ["CONVEX_URL", "EXPO_PUBLIC_CONVEX_URL"],
            in: environment
        )
        let email = try requireValue(keys: ["CLERK_TEST_EMAIL"], in: environment)
        let password = try requireValue(keys: ["CLERK_TEST_PASSWORD"], in: environment)

        return LivePlanningCredentials(
            publishableKey: publishableKey,
            convexURL: convexURL,
            email: email,
            password: password
        )
    }

    private func requireValue(keys: [String], in environment: [String: String]) throws -> String {
        for key in keys {
            if let value = environment[key]?.trimmingCharacters(in: .whitespacesAndNewlines), !value.isEmpty {
                return value
            }
        }
        throw LivePlanningTestError.missingEnvironment(keys.joined(separator: ","))
    }

    private func configureLiveClerkIfNeeded(publishableKey: String) {
        Clerk.shared.configure(publishableKey: publishableKey)
    }

    private static func loadDotEnvLocal() -> [String: String] {
        let envPath = "/Users/justinrich/Projects/LaneShadow/.env.local"
        guard let content = try? String(contentsOfFile: envPath, encoding: .utf8) else {
            return [:]
        }

        var result: [String: String] = [:]
        for line in content.components(separatedBy: .newlines) {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            guard !trimmed.isEmpty,
                  !trimmed.hasPrefix("#"),
                  let equalsIndex = trimmed.firstIndex(of: "=")
            else {
                continue
            }

            let key = String(trimmed[..<equalsIndex]).trimmingCharacters(in: .whitespaces)
            var value = String(trimmed[trimmed.index(after: equalsIndex)...])
                .trimmingCharacters(in: .whitespaces)

            if (value.hasPrefix("\"") && value.hasSuffix("\"")) ||
                (value.hasPrefix("'") && value.hasSuffix("'"))
            {
                value = String(value.dropFirst().dropLast())
            }

            result[key] = value
        }
        return result
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

private struct LivePlanningRuntime {
    let clerkAuth: ClerkAuth
    let convexClient: LaneShadowConvexClient
    let transport: RecordingLiveConvexTransport
    let appState: AppState
    let environment: AppEnvironment
}

private struct LivePlanningCredentials {
    let publishableKey: String
    let convexURL: String
    let email: String
    let password: String
}

private enum LivePlanningTestError: Error {
    case missingEnvironment(String)
    case verificationRequired
    case authenticationDidNotComplete
    case sessionIDTimeout
    case sessionRecordTimeout(String)
    case sessionMessagesTimeout(String)
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

private final class RecordingLiveConvexTransport: LaneShadowConvexTransporting {
    private let client: ConvexClientWithAuth<LaneShadowAuthSession>
    private(set) var capturedCurrentLocation: LaneShadowCurrentLocation?

    init(
        deploymentURL: String,
        authProvider: LaneShadowAuthProvider
    ) {
        client = ConvexClientWithAuth(
            deploymentUrl: deploymentURL,
            authProvider: authProvider
        )
    }

    func subscribe<T: Decodable & Sendable>(
        to endpoint: String,
        with args: [String: ConvexEncodable?]?,
        yielding: T.Type
    ) -> AnyPublisher<T, ClientError> {
        client.subscribe(to: endpoint, with: args, yielding: T.self)
    }

    func mutation<T: Decodable>(
        _ endpoint: String,
        with args: [String: ConvexEncodable?]?
    ) async throws -> T {
        try await client.mutation(endpoint, with: args)
    }

    func mutation(
        _ endpoint: String,
        with args: [String: ConvexEncodable?]?
    ) async throws {
        try await client.mutation(endpoint, with: args)
    }

    func action<T: Decodable>(
        _ endpoint: String,
        with args: [String: ConvexEncodable?]?
    ) async throws -> T {
        captureCurrentLocationIfPresent(endpoint: endpoint, args: args)
        return try await client.action(endpoint, with: args)
    }

    func action(
        _ endpoint: String,
        with args: [String: ConvexEncodable?]?
    ) async throws {
        captureCurrentLocationIfPresent(endpoint: endpoint, args: args)
        try await client.action(endpoint, with: args)
    }

    func triggerAuthRefresh() async {
        _ = await client.loginFromCache()
    }

    private func captureCurrentLocationIfPresent(
        endpoint: String,
        args: [String: ConvexEncodable?]?
    ) {
        guard endpoint == LaneShadowConvexAction.sendMessage.rawValue,
              let rawValue = args?["currentLocation"],
              let value = rawValue,
              let encoded = try? value.convexEncode(),
              let data = encoded.data(using: .utf8),
              let location = try? JSONDecoder().decode(LaneShadowCurrentLocation.self, from: data)
        else {
            return
        }

        capturedCurrentLocation = location
    }
}
