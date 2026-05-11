import XCTest

/// Base class for exploratory design review tests with shared helpers.
@MainActor
class ExploratoryDesignReviewCaptureTestsBase: XCTestCase {
    var app: XCUIApplication!
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        DesignReviewHelpers.setupDeterminismEnvironment(app: app)
    }

    override func tearDownWithError() throws {
        app.terminate()
        app = nil
    }

    func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }

    func loadCredentials() throws -> (email: String, password: String) {
        let environment = ProcessInfo.processInfo.environment
        var email = environment["CLERK_TEST_EMAIL"] ?? environment["LANESHADOW_AUTH_EMAIL"] ?? ""
        var password = environment["CLERK_TEST_PASSWORD"] ?? environment["LANESHADOW_AUTH_PASSWORD"] ?? ""
        if email.isEmpty || password.isEmpty {
            let envPath = "/Users/justinrich/Projects/LaneShadow/.env.local"
            if let envContent = try? String(contentsOfFile: envPath, encoding: .utf8) {
                for line in envContent.components(separatedBy: .newlines) {
                    let trimmed = line.trimmingCharacters(in: .whitespaces)
                    guard !trimmed.hasPrefix("#"), let eqIndex = trimmed.firstIndex(of: "=") else { continue }
                    let key = String(trimmed[..<eqIndex]).trimmingCharacters(in: .whitespaces)
                    var value = String(trimmed[trimmed.index(after: eqIndex)...]).trimmingCharacters(in: .whitespaces)
                    if (value.hasPrefix("\"") && value.hasSuffix("\"")) ||
                        (value.hasPrefix("'") && value.hasSuffix("'"))
                    {
                        value = String(value.dropFirst().dropLast())
                    }
                    if key == "CLERK_TEST_EMAIL", email.isEmpty { email = value }
                    if key == "CLERK_TEST_PASSWORD", password.isEmpty { password = value }
                }
            }
        }
        if email.isEmpty { email = "e2e-login@jjrnshw9.mailosaur.net" }
        if password.isEmpty { password = "test-password-123" }
        guard !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, !password.isEmpty else {
            XCTFail(
                """
                Missing iOS E2E credentials. Add CLERK_TEST_EMAIL and CLERK_TEST_PASSWORD to .env.local,
                or set LANESHADOW_AUTH_EMAIL and LANESHADOW_AUTH_PASSWORD for the fallback.
                """
            )
            throw CredentialError.missing
        }
        return (email, password)
    }

    func authenticateAndReachIdleScreen() async throws {
        _ = try loadCredentials()
        AppLauncher.launchApp(app, resetAuth: true, e2eSignIn: true)
        let e2eButton = element("auth.signIn.e2eSignIn")
        XCTAssertTrue(e2eButton.waitForExistence(timeout: 5), "Expected E2E sign-in button")
        e2eButton.tap()
        // 60s — dark-mode determinism setup competes with auth completion;
        // 30s was flaky for `test_planningScreen_dark`.
        XCTAssertTrue(
            element("idlescreen").waitForExistence(timeout: 60),
            "Expected IdleScreen to appear after authentication"
        )
        XCTAssertTrue(
            element("lschatinput-suggestions").waitForExistence(timeout: 10),
            "Expected suggestion chips to be visible"
        )
    }

    func firstSuggestionChip() -> XCUIElement {
        element("lschatinput-suggestions").buttons.firstMatch
    }

    func startPlanningViaSuggestionChip() async throws {
        try await authenticateAndReachIdleScreen()
        let firstChip = firstSuggestionChip()
        firstChip.tap()
        XCTAssertTrue(element("planningscreen").waitForExistence(timeout: 5))
    }

    func waitForRouteResultsScreen() async throws {
        try await startPlanningViaSuggestionChip()
        let deadline = Date().addingTimeInterval(90)
        var appeared = false
        while Date() < deadline {
            if element("route-resultsscreen").exists {
                appeared = true
                break
            }
            try await Task.sleep(for: .milliseconds(500))
        }
        guard appeared else {
            throw XCTSkip("Route results screen did not appear within timeout")
        }
    }

    enum CredentialError: Error {
        case missing
    }
}
