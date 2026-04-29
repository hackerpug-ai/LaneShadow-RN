import XCTest

@MainActor
final class LaneShadowUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        AppLauncher.launchApp(app)
    }

    func testAppLaunchesWithoutCrash() {
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 10))
    }

    func testUnauthenticatedLaunchShowsSignInFlow() {
        let title = app.staticTexts["Sign In"]
        XCTAssertTrue(
            title.waitForExistence(timeout: 15),
            "Unauthenticated app launch should display the Sign In flow"
        )
        XCTAssertFalse(app.staticTexts["App Home"].exists)
    }

    func testUnauthenticatedUserCanNavigateToSignUpFlow() {
        let createAccount = app.buttons["Create Account"]
        XCTAssertTrue(
            createAccount.waitForExistence(timeout: 15),
            "Sign In flow should expose sign-up navigation"
        )
        createAccount.tap()

        XCTAssertTrue(
            app.staticTexts["Sign Up"].waitForExistence(timeout: 10),
            "Create Account should navigate to the Sign Up flow"
        )
    }
}
