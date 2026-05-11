import XCTest

@MainActor
final class AuthSignInE2ETests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
    }

    override func tearDownWithError() throws {
        app.terminate()
        app = nil
    }

    func testEmailPasswordSignInAndRestoresSession() async throws {
        let credentials = try loadCredentials()
        let receivedAfter = Date()

        AppLauncher.launchApp(app, resetAuth: true)
        XCTAssertTrue(
            element("auth.signIn.root").waitForExistence(timeout: 30),
            "Expected signed-out launch to show SignInScreen root."
        )
        attachScreenshot(named: "auth-screen")

        try tapElement("auth.signIn.continueWithEmail")

        XCTAssertTrue(
            element("auth.signIn.email").waitForExistence(timeout: 15),
            "Expected Continue with Email to reveal the email field."
        )

        try enter(credentials.email, into: "auth.signIn.email")
        try tapElement("auth.signIn.submit")

        XCTAssertTrue(
            element("auth.signIn.password").waitForExistence(timeout: 15),
            "Expected email branch to reveal the password field."
        )
        try enter(credentials.password, into: "auth.signIn.password")
        try tapElement("auth.signIn.submit")
        attachScreenshot(named: "submitted-state")

        switch waitForSignInPostSubmitState(timeout: 45) {
        case .verificationRequired:
            let code = try await verificationCode(for: credentials, receivedAfter: receivedAfter)
            try enter(code, into: "auth.signIn.verification.code")
            try tapElement("auth.signIn.verification.submit")
            attachScreenshot(named: "verification-submitted")
        case .signedIn:
            break
        case .none:
            XCTFail(
                "Expected email/password sign-in to either request verification or reach the authenticated landing page."
            )
            return
        }

        assertAuthenticatedLanding(message: "Expected email/password sign-in to reach the authenticated landing page.")
        attachScreenshot(named: "authenticated-state")

        app.terminate()
        AppLauncher.launchApp(app)

        assertAuthenticatedLanding(message: "Expected relaunch to restore the authenticated landing page.")
        attachScreenshot(named: "restored-state")
    }

    private func loadCredentials() throws -> Credentials {
        // Use AppLauncher.mergedEnvironment() so bare `xcodebuild test`
        // invocations (which do not patch the test runner's ProcessInfo)
        // still pick up keys from .env.local.
        let environment = AppLauncher.mergedEnvironment()
        let email = environment["CLERK_TEST_EMAIL"] ?? environment["LANESHADOW_AUTH_EMAIL"] ?? ""
        let password = environment["CLERK_TEST_PASSWORD"] ?? environment["LANESHADOW_AUTH_PASSWORD"] ?? ""

        guard !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              !password.isEmpty
        else {
            XCTFail(
                "Missing iOS E2E credentials. Add CLERK_TEST_EMAIL and CLERK_TEST_PASSWORD to .env.local, or set LANESHADOW_AUTH_EMAIL and LANESHADOW_AUTH_PASSWORD for the fallback."
            )
            throw CredentialError.missing
        }

        let mailosaurAPIKey = environment["MAILOSAUR_API_KEY"] ?? ""
        let mailosaurServerID = environment["MAILOSAUR_SERVER_ID"] ?? ""
        let mailosaurDomain = environment["MAILOSAUR_DOMAIN"] ?? ""
        let mailosaur: MailosaurE2EClient? = if !mailosaurAPIKey.isEmpty, !mailosaurServerID.isEmpty {
            MailosaurE2EClient(apiKey: mailosaurAPIKey, serverID: mailosaurServerID)
        } else {
            nil
        }

        return Credentials(
            email: email,
            password: password,
            mailosaurDomain: mailosaurDomain,
            mailosaur: mailosaur
        )
    }

    private func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }

    private func waitForSignInPostSubmitState(timeout: TimeInterval) -> SignInPostSubmitState? {
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if element("auth.signIn.verification.root").exists {
                return .verificationRequired
            }
            // Post-auth sentinel: LSTopBar is the only stable id on the
            // authenticated landing today. The prior greeting/logout ids were
            // retired with the LSTopBar migration; no logout button exists in
            // the authenticated UI as of 2026-05-11.
            if element(LSIds.topBar).exists {
                return .signedIn
            }

            RunLoop.current.run(until: Date().addingTimeInterval(0.25))
        }

        return nil
    }

    private func verificationCode(for credentials: Credentials, receivedAfter: Date) async throws -> String {
        if credentials.email.contains("+clerk_test") {
            return "424242"
        }

        guard let mailosaur = credentials.mailosaur,
              !credentials.mailosaurDomain.isEmpty,
              credentials.email.lowercased().hasSuffix("@\(credentials.mailosaurDomain.lowercased())")
        else {
            XCTFail(
                "Sign-in requested email-code verification. Use a +clerk_test address or a CLERK_TEST_EMAIL under MAILOSAUR_DOMAIN so the E2E test can retrieve the code."
            )
            throw CredentialError.unreachableVerificationInbox
        }

        return try await mailosaur.pollVerificationCode(
            sentTo: credentials.email,
            receivedAfter: receivedAfter
        )
    }

    private func assertAuthenticatedLanding(message: String) {
        XCTAssertTrue(
            element(LSIds.topBar).waitForExistence(timeout: 90),
            message
        )
    }

    private func enter(_ value: String, into identifier: String) throws {
        let anyMatch = element(identifier)
        guard anyMatch.waitForExistence(timeout: 15) else {
            XCTFail("Missing input field \(identifier)")
            throw UIElementError.missing(identifier)
        }
        let field = inputElement(identifier: identifier, fallback: anyMatch)
        field.tap()
        field.typeText(value)
    }

    private func tapElement(_ identifier: String) throws {
        let element = element(identifier)
        guard element.waitForExistence(timeout: 15) else {
            XCTFail("Missing tappable element \(identifier)")
            throw UIElementError.missing(identifier)
        }
        element.tap()
    }

    private func inputElement(identifier: String, fallback: XCUIElement) -> XCUIElement {
        let textField = app.textFields[identifier]
        if textField.exists {
            return textField
        }

        let secureField = app.secureTextFields[identifier]
        if secureField.exists {
            return secureField
        }

        return fallback
    }

    private func attachScreenshot(named name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private struct Credentials {
        let email: String
        let password: String
        let mailosaurDomain: String
        let mailosaur: MailosaurE2EClient?
    }

    private enum SignInPostSubmitState {
        case verificationRequired
        case signedIn
    }

    private enum CredentialError: Error {
        case missing
        case unreachableVerificationInbox
    }

    private enum UIElementError: Error {
        case missing(String)
    }
}
