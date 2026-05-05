import XCTest

@MainActor
final class AuthRegistrationE2ETests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
    }

    override func tearDownWithError() throws {
        app.terminate()
        app = nil
    }

    func testEmailPasswordRegistrationVerifiesAndRestoresSession() async throws {
        let config = try loadConfig()
        let receivedAfter = Date()

        AppLauncher.launchApp(app, resetAuth: true)
        XCTAssertTrue(
            element("auth.signIn.root").waitForExistence(timeout: 30),
            "Expected signed-out launch to show SignInScreen root."
        )
        attachScreenshot(named: "registration-sign-in-entry")

        try tapElement("auth.signIn.continueWithEmail")
        XCTAssertTrue(element("auth.signIn.email").waitForExistence(timeout: 15))
        // Create Account link only appears in EmailEntry mode, not Entry mode.
        try tapElement("auth.signUp.entry")
        XCTAssertTrue(
            element("auth.signUp.email").waitForExistence(timeout: 15),
            "Expected Create Account to navigate to the sign-up flow."
        )

        try enter(config.signupEmail, into: "auth.signUp.email")
        try tapElement("auth.signUp.submit")

        try enter("LaneShadow E2E", into: "auth.signUp.name")
        try enter(config.password, into: "auth.signUp.password")
        try tapElement("auth.signUp.submit")
        attachScreenshot(named: "registration-submitted")

        switch waitForRegistrationPostSubmitState(timeout: 45) {
        case .verificationRequired:
            let code = try await config.mailosaur.pollVerificationCode(
                sentTo: config.signupEmail,
                receivedAfter: receivedAfter
            )
            try enter(code, into: "auth.signUp.verification.code")
            try tapElement("auth.signUp.verification.submit")
            attachScreenshot(named: "registration-verification-submitted")
        case .signedIn:
            break
        case .none:
            XCTFail("Expected sign-up to either request email verification or reach the authenticated landing page.")
            return
        }

        assertAuthenticatedLanding(message: "Expected registration to reach the authenticated landing page.")
        attachScreenshot(named: "registration-authenticated")

        app.terminate()
        AppLauncher.launchApp(app)

        assertAuthenticatedLanding(message: "Expected relaunch to restore the authenticated landing page.")
        attachScreenshot(named: "registration-restored")
    }

    private func loadConfig() throws -> RegistrationConfig {
        let environment = ProcessInfo.processInfo.environment
        let password = environment["IOS_E2E_SIGNUP_PASSWORD"]
            ?? environment["E2E_SIGNUP_PASSWORD"]
            ?? Self.generatedPassword()
        let mailosaurAPIKey = environment["MAILOSAUR_API_KEY"] ?? ""
        let mailosaurServerID = environment["MAILOSAUR_SERVER_ID"] ?? ""
        let mailosaurDomain = environment["MAILOSAUR_DOMAIN"] ?? ""
        let signupEmail = environment["E2E_SIGNUP_EMAIL"]
            ?? environment["IOS_E2E_SIGNUP_EMAIL"]
            ?? Self.generatedEmail(domain: mailosaurDomain)

        guard password.count >= 8,
              !mailosaurAPIKey.isEmpty,
              !mailosaurServerID.isEmpty,
              !mailosaurDomain.isEmpty,
              !signupEmail.isEmpty
        else {
            XCTFail(
                "Missing registration E2E config. Set MAILOSAUR_API_KEY, MAILOSAUR_SERVER_ID, MAILOSAUR_DOMAIN, and optionally IOS_E2E_SIGNUP_PASSWORD or E2E_SIGNUP_EMAIL."
            )
            throw RegistrationConfigError.missing
        }

        return RegistrationConfig(
            signupEmail: signupEmail,
            password: password,
            mailosaur: MailosaurE2EClient(apiKey: mailosaurAPIKey, serverID: mailosaurServerID)
        )
    }

    private static func generatedEmail(domain: String) -> String {
        guard !domain.isEmpty else { return "" }
        let stamp = Int(Date().timeIntervalSince1970)
        let suffix = UUID().uuidString.prefix(8).lowercased()
        return "ios-e2e-\(stamp)-\(suffix)@\(domain)"
    }

    private static func generatedPassword() -> String {
        let suffix = UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(12)
        return "LaneShadow1!\(suffix)"
    }

    private func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }

    private func waitForRegistrationPostSubmitState(timeout: TimeInterval) -> RegistrationPostSubmitState? {
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if element("auth.signUp.verification.root").exists {
                return .verificationRequired
            }
            if element("idlescreen-current-user-greeting").exists || element("auth.landing.logout").exists {
                return .signedIn
            }

            RunLoop.current.run(until: Date().addingTimeInterval(0.25))
        }

        return nil
    }

    private func assertAuthenticatedLanding(message: String) {
        XCTAssertTrue(
            element("idlescreen-current-user-greeting").waitForExistence(timeout: 90),
            message
        )
        XCTAssertTrue(
            element("auth.landing.logout").waitForExistence(timeout: 15),
            "Expected authenticated landing page to expose a logout button."
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

    private struct RegistrationConfig {
        let signupEmail: String
        let password: String
        let mailosaur: MailosaurE2EClient
    }

    private enum RegistrationPostSubmitState {
        case verificationRequired
        case signedIn
    }

    private enum RegistrationConfigError: Error {
        case missing
    }

    private enum UIElementError: Error {
        case missing(String)
    }
}
