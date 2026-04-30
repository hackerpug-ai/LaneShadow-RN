import XCTest

@MainActor
final class AuthEmailPasswordE2ETests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
    }

    override func tearDownWithError() throws {
        app.terminate()
        app = nil
    }

    func testEmailPasswordSignInAndRestoresSession() throws {
        let credentials = try loadCredentials()

        AppLauncher.launchApp(app, resetAuth: true)
        XCTAssertTrue(
            element("auth.signIn.root").waitForExistence(timeout: 30),
            "Expected signed-out launch to show SignInScreen root."
        )
        attachScreenshot(named: "auth-screen")

        enter(credentials.email, into: app.textFields["auth.signIn.email"])
        tapButton("Continue")

        let passwordField = app.secureTextFields["auth.signIn.password"]
        XCTAssertTrue(
            passwordField.waitForExistence(timeout: 15),
            "Expected email branch to reveal the password field."
        )
        enter(credentials.password, into: passwordField)
        tapButton("Sign in")
        attachScreenshot(named: "submitted-state")

        XCTAssertTrue(
            element("idlescreen-current-user-greeting").waitForExistence(timeout: 90),
            "Expected email/password sign-in to reach IdleScreen with the current user greeting."
        )
        attachScreenshot(named: "authenticated-state")

        app.terminate()
        AppLauncher.launchApp(app)

        XCTAssertTrue(
            element("idlescreen-current-user-greeting").waitForExistence(timeout: 90),
            "Expected relaunch to restore the authenticated session."
        )
        attachScreenshot(named: "restored-state")
    }

    private func loadCredentials() throws -> Credentials {
        let environment = ProcessInfo.processInfo.environment
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

        return Credentials(email: email, password: password)
    }

    private func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any)[identifier]
    }

    private func enter(_ value: String, into field: XCUIElement) {
        XCTAssertTrue(field.waitForExistence(timeout: 15), "Missing input field \(field)")
        field.tap()
        field.typeText(value)
    }

    private func tapButton(_ title: String) {
        let button = app.buttons[title]
        XCTAssertTrue(button.waitForExistence(timeout: 15), "Missing button \(title)")
        button.tap()
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
    }

    private enum CredentialError: Error {
        case missing
    }
}
