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
        var subscribeRoutePlanSubject = PassthroughSubject<LaneShadowRoutePlanSnapshot, ClientError>()
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

            if endpoint == LaneShadowConvexQuery.getPlanById.rawValue,
               T.self == LaneShadowRoutePlanSnapshot.self
            {
                return subscribeRoutePlanSubject
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

        func triggerAuthRefresh() async {}
    }

    actor FakeClerkJWTProvider: LaneShadowClerkJWTProviding {
        private var token: String?

        init(token: String?) {
            self.token = token
        }

        func convexJWT() async throws -> String? {
            token
        }

        func setToken(_ token: String?) {
            self.token = token
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
    func reverseGeocodeActionUsesPlacesEndpoint() {
        #expect(LaneShadowConvexAction.reverseGeocode.rawValue == "actions/places:reverseGeocode")
    }

    @Test
    func currentWeatherActionUsesWeatherEndpoint() {
        #expect(LaneShadowConvexAction.getCurrentWeather.rawValue == "actions/weather:getCurrentWeather")
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
    func setAuthBridgesToLoginCallbackThroughWrapper() async throws {
        let client = LaneShadowConvexClient(
            deploymentURL: "http://localhost:3210",
            tokenProvider: { "token-a" },
            transport: FakeTransport()
        )

        await client.setAuth(tokenProvider: { "token-b" })
        let callbackToken = try await client.debugLoginTokenForTesting()

        #expect(callbackToken == "token-b")
    }

    @Test
    func setAuthClerkJWTProviderBridgesToLoginCallbackThroughWrapper() async throws {
        let client = LaneShadowConvexClient(
            deploymentURL: "http://localhost:3210",
            tokenProvider: { "token-a" },
            transport: FakeTransport()
        )
        let clerkProvider = FakeClerkJWTProvider(token: "clerk-token-b")

        await client.setAuth(clerkJWTProvider: clerkProvider)
        let callbackToken = try await client.debugLoginTokenForTesting()

        #expect(callbackToken == "clerk-token-b")
    }

    @Test
    func logoutClearsAuthProviderToken() async throws {
        let client = LaneShadowConvexClient(
            deploymentURL: "http://localhost:3210",
            tokenProvider: { "token-a" },
            transport: FakeTransport()
        )

        #expect(try await client.debugLoginTokenForTesting() == "token-a")

        try await client.logout()

        #expect(try await client.debugLoginTokenForTesting() == nil)
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
                creationTime: 1_730_000_000_000,
                clerkUserId: "clerk-user-1",
                title: "Morning Cruise",
                status: "active",
                createdAt: 1_730_000_000_000,
                updatedAt: 1_730_000_010_000,
                lastKnownLocation: LaneShadowPlanningSessionLocation(
                    lat: 39.7392,
                    lng: -104.9903,
                    updatedAt: 1_730_000_015_000
                )
            ),
        ])

        let firstEmission = await iterator.next()

        #expect(firstEmission?.count == 1)
        #expect(firstEmission?.first?.id == "session-1")
    }

    @Test
    func listSessionsDecoderMatchesBackendPayloadShape() throws {
        let payload = try JSONSerialization.data(
            withJSONObject: [
                "_id": "session-1",
                "_creationTime": 1_730_000_000_000,
                "clerkUserId": "clerk-user-1",
                "title": "Morning Cruise",
                "status": "active",
                "createdAt": 1_730_000_000_000,
                "updatedAt": 1_730_000_010_000,
                "lastKnownLocation": [
                    "lat": 39.7392,
                    "lng": -104.9903,
                    "updatedAt": 1_730_000_015_000,
                ],
            ]
        )

        let record = try JSONDecoder().decode(LaneShadowSessionRecord.self, from: payload)
        let session = record.laneShadowSession

        #expect(record.id == "session-1")
        #expect(record.creationTime == 1_730_000_000_000)
        #expect(record.clerkUserId == "clerk-user-1")
        #expect(session.id == "session-1")
        #expect(session.title == "Morning Cruise")
        #expect(session.active)
        #expect(session.preview == "Planning in progress")
        #expect(session.meta.contains("Last known location"))
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
