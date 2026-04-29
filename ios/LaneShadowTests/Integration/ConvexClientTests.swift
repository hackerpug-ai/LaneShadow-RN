import Combine
import ConvexMobile
import Foundation
import Testing
@testable import LaneShadow

@MainActor
struct ConvexClientTests {
    final class TokenCapture: @unchecked Sendable {
        private let lock = NSLock()
        private var value: String?

        func set(_ token: String?) {
            lock.lock()
            value = token
            lock.unlock()
        }

        func token() -> String? {
            lock.lock()
            defer { lock.unlock() }
            return value
        }
    }

    final class FakeTransport: LaneShadowConvexTransporting {
        var subscribeSessionsSubject = PassthroughSubject<[LaneShadowSessionRecord], ClientError>()
        var mutationPayloadByEndpoint: [String: Data] = [:]
        var actionPayloadByEndpoint: [String: Data] = [:]

        func subscribe<T: Decodable & Sendable>(
            to endpoint: String,
            with _: [String: ConvexEncodable?]?,
            yielding: T.Type
        ) -> AnyPublisher<T, ClientError> {
            if endpoint == LaneShadowConvexQuery.listSessions.rawValue,
               T.self == [LaneShadowSessionRecord].self
            {
                return subscribeSessionsSubject
                    .map { $0 as! T }
                    .eraseToAnyPublisher()
            }

            return Empty<T, ClientError>().eraseToAnyPublisher()
        }

        func mutation<T: Decodable>(
            _ endpoint: String,
            with _: [String: ConvexEncodable?]?
        ) async throws -> T {
            let payload = mutationPayloadByEndpoint[endpoint] ?? Data("{}".utf8)
            return try JSONDecoder().decode(T.self, from: payload)
        }

        func mutation(
            _ endpoint: String,
            with _: [String: ConvexEncodable?]?
        ) async throws {
            _ = endpoint
        }

        func action<T: Decodable>(
            _ endpoint: String,
            with _: [String: ConvexEncodable?]?
        ) async throws -> T {
            let payload = actionPayloadByEndpoint[endpoint] ?? Data("{}".utf8)
            return try JSONDecoder().decode(T.self, from: payload)
        }

        func action(
            _ endpoint: String,
            with _: [String: ConvexEncodable?]?
        ) async throws {
            _ = endpoint
        }
    }

    @Test
    func convexSwiftPackageIntegrated() {
        let endpoint = LaneShadowConvexQuery.listSessions.rawValue
        #expect(endpoint == "db/planningSessions:listSessions")
    }

    @Test
    func convexClientLaneShadowWrapperCreated() {
        let client = LaneShadowConvexClient(deploymentURL: "http://localhost:3210") { nil }
        #expect(type(of: client) == LaneShadowConvexClient.self)
    }

    @Test
    func setAuthBridgesClerkJWTThroughWrapper() async throws {
        let client = LaneShadowConvexClient(
            deploymentURL: "http://localhost:3210",
            tokenProvider: { "token-a" },
            transport: FakeTransport()
        )

        await client.setAuth(tokenProvider: { "token-b" })

        #expect(try await client.debugCurrentAuthTokenForTesting() == "token-b")
    }

    @Test
    func authProviderLoginUsesUpdatedTokenProvider() async throws {
        let provider = LaneShadowAuthProvider(tokenProvider: { "token-a" })
        let tokenCapture = TokenCapture()

        await provider.setAuthTokenProvider { "token-b" }

        _ = try await provider.login { token in
            tokenCapture.set(token)
        }

        #expect(tokenCapture.token() == "token-b")
    }

    @Test
    func subscribeToSessionsEmitsAsyncStreamUpdates() async {
        let transport = FakeTransport()
        let client = LaneShadowConvexClient(
            deploymentURL: "http://localhost:3210",
            tokenProvider: { nil },
            transport: transport
        )

        let sessionsStream = client.subscribeToSessions()
        var iterator = sessionsStream.makeAsyncIterator()

        transport.subscribeSessionsSubject.send([
            LaneShadowSessionRecord(
                id: "session-1",
                title: "Morning Cruise",
                preview: "Foothills",
                meta: "70F",
                when: "Today",
                active: true,
                routeIds: ["route-1"],
                createdAt: "2026-04-28T10:00:00Z"
            ),
        ])

        let firstEmission = await iterator.next()

        #expect(firstEmission?.count == 1)
        #expect(firstEmission?.first?.id == "session-1")
    }

    @Test
    func typedQueryMutationMethodsAreCallable() async throws {
        struct Response: Decodable {
            let payload: String
        }

        let transport = FakeTransport()
        transport.mutationPayloadByEndpoint[LaneShadowConvexMutation.createSession.rawValue] = try JSONSerialization
            .data(
                withJSONObject: ["payload": "mutation-ok"]
            )
        transport.actionPayloadByEndpoint[LaneShadowConvexAction.sendMessage.rawValue] = try JSONSerialization.data(
            withJSONObject: ["payload": "action-ok"]
        )

        let client = LaneShadowConvexClient(
            deploymentURL: "http://localhost:3210",
            tokenProvider: { nil },
            transport: transport
        )

        let mutationResponse: Response = try await client.mutation(.createSession)
        let actionResponse: Response = try await client.action(.sendMessage)

        #expect(mutationResponse.payload == "mutation-ok")
        #expect(actionResponse.payload == "action-ok")
    }
}
