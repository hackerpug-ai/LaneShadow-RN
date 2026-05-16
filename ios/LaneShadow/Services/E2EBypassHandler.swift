import Foundation

/// DEBUG-only handler for E2E testing: performs silent sign-in using test credentials
/// from environment variables (CLERK_TEST_EMAIL, CLERK_TEST_PASSWORD) and establishes
/// a real Convex JWT, bypassing the interactive auth UI.
enum E2EBypassHandler {
    enum E2EBypassError: LocalizedError {
        case missingTestEmail
        case missingTestPassword
        case silentSignInFailed(String)

        var errorDescription: String? {
            switch self {
            case .missingTestEmail:
                "CLERK_TEST_EMAIL environment variable is missing or empty"
            case .missingTestPassword:
                "CLERK_TEST_PASSWORD environment variable is missing or empty"
            case let .silentSignInFailed(reason):
                "Silent sign-in failed: \(reason)"
            }
        }
    }

    static func performSilentSignIn(
        clerkAuth: ClerkAuth,
        convexClient: LaneShadowConvexClient,
        appState: AppState
    ) async throws {
        let environment = ProcessInfo.processInfo.environment
        let testEmail = environment["CLERK_TEST_EMAIL"]?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let testPassword = environment["CLERK_TEST_PASSWORD"]?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

        guard !testEmail.isEmpty else {
            throw E2EBypassError.missingTestEmail
        }
        guard !testPassword.isEmpty else {
            throw E2EBypassError.missingTestPassword
        }

        NSLog("🔵 E2EBypass: attempting silent sign-in with \(testEmail)")

        do {
            // Use the real Clerk sign-in API with test credentials
            let signInResult = try await clerkAuth.signIn(email: testEmail, password: testPassword)

            switch signInResult {
            case let .signedIn(user):
                NSLog("🔵 E2EBypass: sign-in complete; user=\(user.id)")
                // Complete authentication to establish Convex JWT and load user profile
                await appState.completeAuthentication(clerkAuth: clerkAuth, convexClient: convexClient)
                NSLog("🔵 E2EBypass: authentication completed; ready for tests")

            case let .verificationRequired(email):
                NSLog("🔵 E2EBypass: verification required for \(email); failing E2E (test infrastructure issue)")
                throw E2EBypassError.silentSignInFailed(
                    "Sign-in requires email verification; use a +clerk_test email address or configure MFA"
                )
            }
        } catch let error as E2EBypassError {
            throw error
        } catch {
            NSLog("❌ E2EBypass: sign-in threw \(error.localizedDescription)")
            throw E2EBypassError.silentSignInFailed(error.localizedDescription)
        }
    }
}
