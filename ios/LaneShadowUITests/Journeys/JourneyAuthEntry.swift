import XCTest

/// Journey E2E test: Auth entry through sign-up to authenticated map landing.
///
/// This journey consolidates three existing Auth*E2ETests:
/// - AuthBypassE2ETests (button presence assertions)
/// - AuthRegistrationE2ETests (sign-up flow with email verification)
/// - AuthSignInE2ETests deletion (Phase 0 bypass covers session restore)
///
/// Per rescoped Task #1366-iOS, we only test what J1 owns:
/// 1. Auth screen structure (entry buttons visible)
/// 2. Sign-up flow end-to-end via Mailosaur
/// 3. Session restoration (terminate + relaunch)
///
/// Clerk owns: email/password sign-in internals, OAuth, password reset.
@MainActor
final class JourneyAuthEntry: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
    }

    override func tearDownWithError() throws {
        app.terminate()
        app = nil
    }

    /// Step01: Auth screen renders with entry points.
    /// Verifies: sign-in entry, debug bypass button are visible.
    func step01_authScreenRendersWithEntryPoints() {
        // Launch with e2eSignIn flag to show DEBUG button
        AppLauncher.launchApp(app, resetAuth: true, e2eSignIn: true)

        // Assert auth screen root exists
        XCTAssertTrue(
            element("auth.signIn.root").waitForExistence(timeout: 30),
            "Expected signed-out launch to show SignInScreen root."
        )

        // Assert sign-in entry visible
        XCTAssertTrue(
            element("auth.signIn.continueWithEmail").waitForExistence(timeout: 5),
            "Expected Continue with Email button to be visible."
        )

        // Assert debug bypass button visible (DEBUG-only)
        XCTAssertTrue(
            element("auth.signIn.e2eSignIn").waitForExistence(timeout: 5),
            "Expected E2E sign-in button to be visible in DEBUG mode."
        )

        attachScreenshot(named: "auth-01-entry")
    }

    /// Step02-04: Sign-up flow end-to-end via Mailosaur email verification.
    /// Combined into one test following the pattern from AuthRegistrationE2ETests.
    /// Tests what J1 owns: generating email, submitting form, verifying code.
    /// Does NOT test: sign-in internals, OAuth, password reset (Clerk's domain).
    func step02_signUpFlowWithEmailVerification() async throws {
        let config = try loadConfig()
        let receivedAfter = Date()

        AppLauncher.launchApp(app, resetAuth: true)
        XCTAssertTrue(
            element("auth.signIn.root").waitForExistence(timeout: 30),
            "Expected signed-out launch to show SignInScreen root."
        )
        attachScreenshot(named: "signup-01-signin-entry")

        // Navigate to email entry
        try tapElement("auth.signIn.continueWithEmail")
        XCTAssertTrue(element("auth.signIn.email").waitForExistence(timeout: 15))

        // Navigate to sign-up screen
        try tapElement("auth.signUp.entry")
        XCTAssertTrue(
            element("auth.signUp.email").waitForExistence(timeout: 15),
            "Expected Create Account to navigate to the sign-up flow."
        )

        // Generate unique email and submit sign-up form
        let signupEmail = Self.generatedEmail(domain: config.mailosaurDomain)
        try enter(signupEmail, into: "auth.signUp.email")
        try tapElement("auth.signUp.submit")

        try enter("LaneShadow E2E", into: "auth.signUp.name")
        try enter(config.password, into: "auth.signUp.password")
        try tapElement("auth.signUp.submit")
        attachScreenshot(named: "signup-02-submitted")

        // Wait for verification screen or authenticated state
        switch waitForSignUpPostSubmitState(timeout: 45) {
        case .verificationRequired:
            // Email verification was required — poll Mailosaur for code
            let code = try await config.mailosaur.pollVerificationCode(
                sentTo: signupEmail,
                receivedAfter: receivedAfter
            )
            try enter(code, into: "auth.signUp.verification.code")
            try tapElement("auth.signUp.verification.submit")
            attachScreenshot(named: "signup-03-verification-submitted")
        case .signedIn:
            // Sign-up verification was not required (e.g., test account)
            break
        case .none:
            XCTFail("Expected sign-up to either request email verification or reach the authenticated landing page.")
            return
        }

        // Assert we reached the authenticated landing page
        assertAuthenticatedLanding(message: "Expected sign-up to reach the authenticated landing page.")
        attachScreenshot(named: "signup-04-authenticated")
    }

    /// Step05: Session restoration.
    /// Verifies Clerk session persists across app termination and relaunch.
    func step05_relaunchRestoresSession() {
        // Use E2E bypass to establish a session quickly (Phase 0 bypass infra)
        AppLauncher.launchApp(app, e2eBypassAuth: true)

        // Wait for authenticated landing
        XCTAssertTrue(
            element(LSIds.topBar).waitForExistence(timeout: 30),
            "Expected E2E bypass to reach authenticated landing page."
        )
        attachScreenshot(named: "session-01-established")

        // Terminate and relaunch with NO flags (should restore session)
        app.terminate()
        AppLauncher.launchApp(app)

        // Assert MapApp idle screen renders — proves Clerk session persisted
        XCTAssertTrue(
            element(LSIds.topBar).waitForExistence(timeout: 10),
            "Expected session relaunch to restore authenticated state."
        )
        attachScreenshot(named: "session-02-restored")
    }

    // MARK: - Private Helpers

    private func loadConfig() throws -> SignUpConfig {
        let environment = AppLauncher.mergedEnvironment()
        let password = environment["IOS_E2E_SIGNUP_PASSWORD"]
            ?? environment["E2E_SIGNUP_PASSWORD"]
            ?? Self.generatedPassword()
        let mailosaurAPIKey = environment["MAILOSAUR_API_KEY"] ?? ""
        let mailosaurServerID = environment["MAILOSAUR_SERVER_ID"] ?? ""
        let mailosaurDomain = environment["MAILOSAUR_DOMAIN"] ?? ""

        guard password.count >= 8,
              !mailosaurAPIKey.isEmpty,
              !mailosaurServerID.isEmpty,
              !mailosaurDomain.isEmpty
        else {
            XCTFail(
                "Missing sign-up E2E config. Set MAILOSAUR_API_KEY, MAILOSAUR_SERVER_ID, MAILOSAUR_DOMAIN, and optionally E2E_SIGNUP_PASSWORD."
            )
            throw SignUpConfigError.missing
        }

        return SignUpConfig(
            password: password,
            mailosaurDomain: mailosaurDomain,
            mailosaur: MailosaurE2EClient(apiKey: mailosaurAPIKey, serverID: mailosaurServerID)
        )
    }

    private static func generatedEmail(domain: String) -> String {
        guard !domain.isEmpty else { return "" }
        let stamp = Int(Date().timeIntervalSince1970)
        let suffix = UUID().uuidString.prefix(8).lowercased()
        return "ios-j1-\(stamp)-\(suffix)@\(domain)"
    }

    private static func generatedPassword() -> String {
        let suffix = UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(12)
        return "LaneShadow1!\(suffix)"
    }

    private func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }

    private func waitForSignUpPostSubmitState(timeout: TimeInterval) -> SignUpPostSubmitState? {
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if element("auth.signUp.verification.root").exists {
                return .verificationRequired
            }
            // Post-auth sentinel: LSTopBar is the only stable id on the
            // authenticated landing today (as of 2026-05-11).
            if element(LSIds.topBar).exists {
                return .signedIn
            }

            RunLoop.current.run(until: Date().addingTimeInterval(0.25))
        }

        return nil
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

    private struct SignUpConfig {
        let password: String
        let mailosaurDomain: String
        let mailosaur: MailosaurE2EClient
    }

    private enum SignUpPostSubmitState {
        case verificationRequired
        case signedIn
    }

    private enum SignUpConfigError: Error {
        case missing
    }

    private enum UIElementError: Error {
        case missing(String)
    }
}
