@preconcurrency import Combine
@preconcurrency import ConvexMobile
import Foundation

enum LaneShadowConvexQuery: String {
    case getCurrentUser = "db/users:getCurrentUser"
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

struct LaneShadowCurrentUser: Decodable, Equatable {
    let id: String
    let clerkUserId: String
    let email: String
    let name: String

    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case clerkUserId
        case email
        case name
    }

    var displayName: String {
        name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? email : name
    }
}

enum LaneShadowError: LocalizedError, Equatable {
    case unauthenticated
    case convex(String)
    case server(String)
    case internalError(String)
    case unknown(String)

    var errorDescription: String? {
        switch self {
        case .unauthenticated:
            "Your session expired. Please sign in again."
        case let .convex(message), let .server(message), let .internalError(message), let .unknown(message):
            message
        }
    }

    var isUnauthenticated: Bool {
        self == .unauthenticated
    }

    static func map(_ error: Error) -> LaneShadowError {
        guard let clientError = error as? ClientError else {
            return .unknown(error.localizedDescription)
        }

        switch clientError {
        case let .ConvexError(data):
            return data.localizedCaseInsensitiveContains("UNAUTHENTICATED") ? .unauthenticated : .convex(data)
        case let .ServerError(msg):
            return msg.localizedCaseInsensitiveContains("UNAUTHENTICATED") ? .unauthenticated : .server(msg)
        case let .InternalError(msg):
            return msg.localizedCaseInsensitiveContains("UNAUTHENTICATED") ? .unauthenticated : .internalError(msg)
        }
    }
}

typealias LaneShadowUnauthenticatedHandler = @MainActor @Sendable () async -> Void

actor LaneShadowUnauthenticatedHandlerBox {
    private var handler: LaneShadowUnauthenticatedHandler?

    func set(_ handler: LaneShadowUnauthenticatedHandler?) {
        self.handler = handler
    }

    func handle() async {
        await handler?()
    }
}

protocol LaneShadowClerkJWTProviding: Sendable {
    func convexJWT() async throws -> String?
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

    func logout() async throws {
        await tokenBox.set { nil }
    }

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

final class LaneShadowConvexClient: @unchecked Sendable {
    private final class CancellableBox: @unchecked Sendable {
        var cancellable: AnyCancellable?
    }

    private let transport: LaneShadowConvexTransporting
    private let authProvider: LaneShadowAuthProvider
    private let unauthenticatedHandlerBox = LaneShadowUnauthenticatedHandlerBox()

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

    func setAuth(clerkJWTProvider: any LaneShadowClerkJWTProviding) async {
        await authProvider.setAuthTokenProvider {
            try await clerkJWTProvider.convexJWT()
        }
    }

    func logout() async throws {
        try await authProvider.logout()
    }

    func setUnauthenticatedHandler(_ handler: LaneShadowUnauthenticatedHandler?) async {
        await unauthenticatedHandlerBox.set(handler)
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
                    receiveCompletion: { [weak self] completion in
                        if case let .failure(error) = completion {
                            self?.notifyUnauthenticatedIfNeeded(error)
                        }
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

    func fetchCurrentUser() async throws -> LaneShadowCurrentUser? {
        let publisher = transport.subscribe(
            to: LaneShadowConvexQuery.getCurrentUser.rawValue,
            with: nil,
            yielding: LaneShadowCurrentUser?.self
        )
        do {
            var iterator = publisher.values.makeAsyncIterator()
            return try await iterator.next() ?? nil
        } catch {
            await handleUnauthenticatedIfNeeded(error)
            throw error
        }
    }

    func mutation<T: Decodable>(
        _ endpoint: LaneShadowConvexMutation,
        args: [String: ConvexEncodable?]? = nil
    ) async throws -> T {
        do {
            return try await transport.mutation(endpoint.rawValue, with: args)
        } catch {
            await handleUnauthenticatedIfNeeded(error)
            throw error
        }
    }

    func mutation(
        _ endpoint: LaneShadowConvexMutation,
        args: [String: ConvexEncodable?]? = nil
    ) async throws {
        do {
            try await transport.mutation(endpoint.rawValue, with: args)
        } catch {
            await handleUnauthenticatedIfNeeded(error)
            throw error
        }
    }

    func action<T: Decodable>(
        _ endpoint: LaneShadowConvexAction,
        args: [String: ConvexEncodable?]? = nil
    ) async throws -> T {
        do {
            return try await transport.action(endpoint.rawValue, with: args)
        } catch {
            await handleUnauthenticatedIfNeeded(error)
            throw error
        }
    }

    func action(
        _ endpoint: LaneShadowConvexAction,
        args: [String: ConvexEncodable?]? = nil
    ) async throws {
        do {
            try await transport.action(endpoint.rawValue, with: args)
        } catch {
            await handleUnauthenticatedIfNeeded(error)
            throw error
        }
    }

    private func notifyUnauthenticatedIfNeeded(_ error: Error) {
        guard LaneShadowError.map(error).isUnauthenticated else {
            return
        }

        Task {
            await unauthenticatedHandlerBox.handle()
        }
    }

    private func handleUnauthenticatedIfNeeded(_ error: Error) async {
        guard LaneShadowError.map(error).isUnauthenticated else {
            return
        }

        await unauthenticatedHandlerBox.handle()
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
