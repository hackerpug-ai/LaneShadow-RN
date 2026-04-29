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

    private func currentToken() async throws -> String? {
        try await tokenBox.current()
    }
}

final class LaneShadowConvexClient {
    private let client: ConvexClientWithAuth<LaneShadowAuthSession>
    private let authProvider: LaneShadowAuthProvider

    init(
        deploymentURL: String = ConvexConfig.deploymentURL,
        tokenProvider: @escaping @Sendable () async throws -> String?
    ) {
        authProvider = LaneShadowAuthProvider(tokenProvider: tokenProvider)
        client = ConvexClientWithAuth(deploymentUrl: deploymentURL, authProvider: authProvider)
    }

    func setAuth(tokenProvider: @escaping @Sendable () async throws -> String?) async {
        await authProvider.setAuthTokenProvider(tokenProvider)
    }

    func subscribe<T: Decodable & Sendable>(
        _ query: LaneShadowConvexQuery,
        args: [String: ConvexEncodable?]? = nil,
        yielding: T.Type = T.self
    ) -> AsyncStream<T> {
        AsyncStream { continuation in
            let cancellable = client
                .subscribe(to: query.rawValue, with: args, yielding: T.self)
                .sink(
                    receiveCompletion: { _ in
                        continuation.finish()
                    },
                    receiveValue: { value in
                        continuation.yield(value)
                    }
                )
            _ = cancellable
        }
    }

    func subscribeToSessions() -> AsyncStream<[Session]> {
        let source = subscribe(.listSessions, yielding: [LaneShadowSessionRecord].self)
        return AsyncStream<[Session]> { continuation in
            Task {
                for await records in source {
                    continuation.yield(records.map(\.laneShadowSession))
                }
                continuation.finish()
            }
        }
    }

    func mutation<T: Decodable>(
        _ endpoint: LaneShadowConvexMutation,
        args: [String: ConvexEncodable?]? = nil
    ) async throws -> T {
        try await client.mutation(endpoint.rawValue, with: args)
    }

    func mutation(
        _ endpoint: LaneShadowConvexMutation,
        args: [String: ConvexEncodable?]? = nil
    ) async throws {
        try await client.mutation(endpoint.rawValue, with: args)
    }

    func action<T: Decodable>(
        _ endpoint: LaneShadowConvexAction,
        args: [String: ConvexEncodable?]? = nil
    ) async throws -> T {
        try await client.action(endpoint.rawValue, with: args)
    }

    func action(
        _ endpoint: LaneShadowConvexAction,
        args: [String: ConvexEncodable?]? = nil
    ) async throws {
        try await client.action(endpoint.rawValue, with: args)
    }
}

private struct LaneShadowSessionRecord: Decodable {
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
