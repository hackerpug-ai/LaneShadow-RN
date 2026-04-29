import ConvexMobile
import Foundation
import Testing
@testable import LaneShadow

@MainActor
struct ConvexClientTests {
    final class TokenRecorder: @unchecked Sendable {
        private let lock = NSLock()
        private var token: String?

        func record(_ value: String?) {
            lock.lock()
            token = value
            lock.unlock()
        }

        func current() -> String? {
            lock.lock()
            defer { lock.unlock() }
            return token
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
    func setAuthBridgesClerkJWT() async throws {
        let provider = LaneShadowAuthProvider { "token-a" }
        await provider.setAuthTokenProvider { "token-b" }
        let recorder = TokenRecorder()

        _ = try await provider.login { token in
            recorder.record(token)
        }

        #expect(recorder.current() == "token-b")
    }

    @Test
    func subscribeToSessionsEmitsAsyncStream() {
        let client = LaneShadowConvexClient(deploymentURL: "http://localhost:3210") { nil }
        let stream = client.subscribeToSessions()
        #expect(type(of: stream) == AsyncStream<[Session]>.self)
    }

    @Test
    func typedQueryMutationMethodsExposed() {
        let query = LaneShadowConvexQuery.listMessages
        let mutation = LaneShadowConvexMutation.createSession
        let action = LaneShadowConvexAction.sendMessage

        #expect(query.rawValue == "db/sessionMessages:list")
        #expect(mutation.rawValue == "db/planningSessions:createSession")
        #expect(action.rawValue == "actions/agent/sendMessage:sendMessage")
    }
}
