import ConvexMobile
import Foundation

final class ClerkAuthProvider: AuthProvider {
    typealias T = LaneShadowAuthSession

    private let auth: ClerkAuth

    init(auth: ClerkAuth) {
        self.auth = auth
    }

    func login(onIdToken: @Sendable @escaping (String?) -> Void) async throws -> LaneShadowAuthSession {
        let token = try await auth.getJWT()
        onIdToken(token)
        return LaneShadowAuthSession(jwt: token)
    }

    func loginFromCache(onIdToken: @Sendable @escaping (String?) -> Void) async throws -> LaneShadowAuthSession {
        let token = try await auth.getJWT()
        onIdToken(token)
        return LaneShadowAuthSession(jwt: token)
    }

    func logout() async throws {
        try await auth.signOut()
    }

    func extractIdToken(from authResult: LaneShadowAuthSession) -> String {
        authResult.jwt ?? ""
    }
}
