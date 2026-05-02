import ConvexMobile
import Foundation
import Testing
@testable import LaneShadow

@Suite("LaneShadow Error Tests")
@MainActor
struct LaneShadowErrorTests {
    @Test("test_laneShadowError_map_coversAllServerCodes")
    func laneShadowError_map_coversAllServerCodes() {
        let cases: [(Error, LaneShadowError)] = [
            (
                ClientError.ConvexError(data: #"{"code":"SESSION_NOT_FOUND"}"#),
                .sessionNotFound
            ),
            (
                ClientError.ConvexError(data: #"{"code":"INVALID_CONTENT"}"#),
                .invalidContent
            ),
            (
                ClientError.ServerError(msg: "RATE_LIMIT_EXCEEDED: monthly cap"),
                .rateLimitExceeded
            ),
            (
                ClientError.ServerError(msg: "PLAN_LIMIT_EXCEEDED - monthly cap"),
                .planLimitExceeded
            ),
            (
                ClientError.ServerError(msg: "PLAN_ALREADY_ACTIVE"),
                .planAlreadyActive
            ),
            (
                ClientError.ServerError(msg: "PLAN_NOT_FOUND"),
                .planNotFound
            ),
            (
                ClientError.ConvexError(data: #"{"code":"AGENTIC_PARSE_FAILED"}"#),
                .agenticParseFailed
            ),
            (
                ClientError.ServerError(msg: "LOW_CONFIDENCE_PARSE: couldn't parse"),
                .lowConfidenceParse
            ),
            (
                ClientError.ServerError(msg: "GENERATION_FAILED - retry later"),
                .generationFailed
            ),
            (
                ClientError.InternalError(msg: "NO_ROUTES_GENERATED"),
                .noRoutesGenerated
            ),
            (
                ClientError.InternalError(msg: "AGENT_TIMEOUT"),
                .agentTimeout
            ),
            (
                ClientError.ServerError(msg: "NETWORK_TIMEOUT"),
                .networkTimeout
            ),
            (
                ClientError.ServerError(msg: "WEATHER_UNAVAILABLE"),
                .weatherUnavailable
            ),
        ]

        for (error, expected) in cases {
            let mapped = LaneShadowError.map(error)
            #expect(mapped == expected)
            #expect((mapped.errorDescription ?? "").isEmpty == false)
        }
    }

    @Test("test_laneShadowError_map_unknownMessage_fallsBack")
    func laneShadowError_map_unknownMessage_fallsBack() {
        let mapped = LaneShadowError.map(ClientError.ServerError(msg: "some uncoded message"))

        #expect(mapped == .unknown("some uncoded message"))
        #expect(mapped.errorDescription == "some uncoded message")
    }

    @Test("test_laneShadowError_unauthenticated_triggersSignOutFlow")
    func laneShadowError_unauthenticated_triggersSignOutFlow() async throws {
        let authClient = RootViewTestsAuthClient()
        let clerkAuth = ClerkAuth(client: authClient)
        try await clerkAuth.signIn(email: "rider@example.com", password: "secret")

        let convexClient = LaneShadowConvexClient(
            deploymentURL: "http://localhost:3210",
            tokenProvider: { "jwt" },
            transport: RootViewTestsConvexTransport(currentUser: laneShadowCurrentUser)
        )

        let appState = AppState(isAuthenticated: true, currentUser: laneShadowCurrentUser)
        appState.appRoute = AppState.AppRoute.session(id: "session-123")
        appState.cachedLastFailedInput = "Plan a scenic ride"

        await LaneShadowErrorRouter.handle(
            ClientError.ConvexError(data: #"{"code":"UNAUTHENTICATED"}"#),
            appState: appState,
            clerkAuth: clerkAuth,
            convex: convexClient
        )

        #expect(clerkAuth.currentUser == nil)
        #expect(try await convexClient.debugCurrentAuthTokenForTesting() == nil)
        #expect(appState.isAuthenticated == false)
        #expect(appState.hasClerkSession == false)
        #expect(appState.authRoute == AppState.AuthRoute.signIn)
        #expect(appState.appRoute == nil)
        #expect(appState.cachedLastFailedInput == nil)
        #expect(await authClient.signOutCallCount() == 0)
    }

    private var laneShadowCurrentUser: LaneShadowCurrentUser {
        LaneShadowCurrentUser(
            id: "user-jamie",
            clerkUserId: "clerk-jamie",
            email: "jamie@example.com",
            name: "Jamie"
        )
    }
}
