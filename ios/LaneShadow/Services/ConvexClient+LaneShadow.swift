@preconcurrency import Combine
@preconcurrency import ConvexMobile
import Foundation

enum LaneShadowConvexQuery: String {
    case listSessions = "db/planningSessions:listSessions"
    case listMessages = "db/sessionMessages:list"
}

enum LaneShadowConvexMutation: String {
    case createSession = "db/planningSessions:createSession"
    case saveRoute = "db/savedRoutes:saveRoute"
}

enum LaneShadowConvexAction: String {
    case sendMessage = "actions/agent/sendMessage:sendMessage"
}

struct LaneShadowAuthSession {
    let jwt: String?
}

actor LaneShadowTokenProviderBox {
    private var tokenProvider: @Sendable () async throws -> String?

    init(tokenProvider: @escaping @Sendable () async throws -> String?) {
        self.tokenProvider = tokenProvider
    }

    func set(_ provider: @escaping @Sendable () async throws -> String?) {
        tokenProvider = provider
    }

    func current() async throws -> String? {
        try await tokenProvider()
    }
}

final class LaneShadowAuthProvider: AuthProvider {
    typealias T = LaneShadowAuthSession

    private let tokenBox: LaneShadowTokenProviderBox

    init(tokenProvider: @escaping @Sendable () async throws -> String?) {
        tokenBox = LaneShadowTokenProviderBox(tokenProvider: tokenProvider)
    }

    func setAuthTokenProvider(_ provider: @escaping @Sendable () async throws -> String?) async {
        await tokenBox.set(provider)
    }

    func login(onIdToken: @Sendable @escaping (String?) -> Void) async throws -> LaneShadowAuthSession {
        let token = try await currentToken()
        onIdToken(token)
        return LaneShadowAuthSession(jwt: token)
    }

    func loginFromCache(onIdToken: @Sendable @escaping (String?) -> Void) async throws -> LaneShadowAuthSession {
        let token = try await currentToken()
        onIdToken(token)
        return LaneShadowAuthSession(jwt: token)
    }

    func logout() async throws {}

    func extractIdToken(from authResult: LaneShadowAuthSession) -> String {
        authResult.jwt ?? ""
    }

    func debugCurrentTokenForTesting() async throws -> String? {
        try await currentToken()
    }

    private func currentToken() async throws -> String? {
        try await tokenBox.current()
    }
}

protocol LaneShadowConvexTransporting {
    func subscribe<T: Decodable & Sendable>(
        to endpoint: String,
        with args: [String: ConvexEncodable?]?,
        yielding: T.Type
    ) -> AnyPublisher<T, ClientError>

    func mutation<T: Decodable>(
        _ endpoint: String,
        with args: [String: ConvexEncodable?]?
    ) async throws -> T

    func mutation(
        _ endpoint: String,
        with args: [String: ConvexEncodable?]?
    ) async throws

    func action<T: Decodable>(
        _ endpoint: String,
        with args: [String: ConvexEncodable?]?
    ) async throws -> T

    func action(
        _ endpoint: String,
        with args: [String: ConvexEncodable?]?
    ) async throws
}

private final class LiveLaneShadowConvexTransport: LaneShadowConvexTransporting {
    private let client: ConvexClientWithAuth<LaneShadowAuthSession>

    init(client: ConvexClientWithAuth<LaneShadowAuthSession>) {
        self.client = client
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
        try await client.action(endpoint, with: args)
    }

    func action(
        _ endpoint: String,
        with args: [String: ConvexEncodable?]?
    ) async throws {
        try await client.action(endpoint, with: args)
    }
}

final class LaneShadowConvexClient {
    private final class CancellableBox: @unchecked Sendable {
        var cancellable: AnyCancellable?
    }

    private let transport: LaneShadowConvexTransporting
    private let authProvider: LaneShadowAuthProvider

    init(
        deploymentURL: String = ConvexConfig.deploymentURL,
        tokenProvider: @escaping @Sendable () async throws -> String?,
        transport: LaneShadowConvexTransporting? = nil
    ) {
        authProvider = LaneShadowAuthProvider(tokenProvider: tokenProvider)
        if let transport {
            self.transport = transport
        } else {
            let client = ConvexClientWithAuth(deploymentUrl: deploymentURL, authProvider: authProvider)
            self.transport = LiveLaneShadowConvexTransport(client: client)
        }
    }

    func setAuth(tokenProvider: @escaping @Sendable () async throws -> String?) async {
        await authProvider.setAuthTokenProvider(tokenProvider)
    }

    func debugCurrentAuthTokenForTesting() async throws -> String? {
        try await authProvider.debugCurrentTokenForTesting()
    }

    func debugLoginTokenForTesting() async throws -> String? {
        final class TokenBox: @unchecked Sendable {
            private let lock = NSLock()
            private var value: String?

            func set(_ token: String?) {
                lock.lock()
                value = token
                lock.unlock()
            }

            func get() -> String? {
                lock.lock()
                defer { lock.unlock() }
                return value
            }
        }

        let tokenBox = TokenBox()
        _ = try await authProvider.login { token in
            tokenBox.set(token)
        }
        return tokenBox.get()
    }

    func subscribe<T: Decodable & Sendable>(
        _ query: LaneShadowConvexQuery,
        args: [String: ConvexEncodable?]? = nil,
        yielding: T.Type = T.self
    ) -> AsyncStream<T> {
        AsyncStream { continuation in
            let cancellableBox = CancellableBox()
            cancellableBox.cancellable = transport
                .subscribe(to: query.rawValue, with: args, yielding: T.self)
                .sink(
                    receiveCompletion: { _ in
                        continuation.finish()
                    },
                    receiveValue: { value in
                        continuation.yield(value)
                    }
                )

            continuation.onTermination = { _ in
                cancellableBox.cancellable?.cancel()
                cancellableBox.cancellable = nil
            }
        }
    }

    func subscribeToSessions() -> AsyncStream<[Session]> {
        let source = subscribe(.listSessions, yielding: [LaneShadowSessionRecord].self)
        return AsyncStream<[Session]> { continuation in
            let task = Task {
                for await records in source {
                    continuation.yield(records.map(\.laneShadowSession))
                }
                continuation.finish()
            }

            continuation.onTermination = { _ in
                task.cancel()
            }
        }
    }

    func mutation<T: Decodable>(
        _ endpoint: LaneShadowConvexMutation,
        args: [String: ConvexEncodable?]? = nil
    ) async throws -> T {
        try await transport.mutation(endpoint.rawValue, with: args)
    }

    func mutation(
        _ endpoint: LaneShadowConvexMutation,
        args: [String: ConvexEncodable?]? = nil
    ) async throws {
        try await transport.mutation(endpoint.rawValue, with: args)
    }

    func action<T: Decodable>(
        _ endpoint: LaneShadowConvexAction,
        args: [String: ConvexEncodable?]? = nil
    ) async throws -> T {
        try await transport.action(endpoint.rawValue, with: args)
    }

    func action(
        _ endpoint: LaneShadowConvexAction,
        args: [String: ConvexEncodable?]? = nil
    ) async throws {
        try await transport.action(endpoint.rawValue, with: args)
    }
}

struct LaneShadowSessionRecord: Decodable {
    let id: String
    let title: String
    let preview: String
    let meta: String
    let when: String
    let active: Bool
    let routeIds: [String]
    let createdAt: String

    var laneShadowSession: Session {
        Session(
            id: id,
            title: title,
            preview: preview,
            meta: meta,
            when: when,
            active: active,
            routeIds: routeIds,
            createdAt: createdAt
        )
    }
}
