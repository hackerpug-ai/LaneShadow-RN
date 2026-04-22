import XCTest

final class LaneShadowUITests: XCTestCase {
    let app = XCUIApplication()

    override func setUpWithError() throws {
        continueAfterFailure = false
        app.launchEnvironment["LANESHADOW_LAUNCH_SANDBOX"] = "0"
        app.launch()
    }

    func testAppLaunchesWithoutCrash() {
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 10))
    }

    func testSignInScreenVisible() {
        let titleElement = app.staticTexts.containing(
            NSPredicate(format: "label CONTAINS %@", "Lane Shadow")
        ).firstMatch

        XCTAssertTrue(
            titleElement.waitForExistence(timeout: 15),
            "Sign-in screen should show 'Lane Shadow' title within 15 seconds"
        )
    }

    func testAuthButtonsPresent() {
        let appleButton = app.buttons.containing(
            NSPredicate(format: "label CONTAINS %@", "Apple")
        ).firstMatch

        let googleButton = app.buttons.containing(
            NSPredicate(format: "label CONTAINS %@", "Google")
        ).firstMatch

        XCTAssertTrue(
            appleButton.waitForExistence(timeout: 15),
            "'Continue with Apple' button should be visible on sign-in screen"
        )
        XCTAssertTrue(
            googleButton.waitForExistence(timeout: 15),
            "'Continue with Google' button should be visible on sign-in screen"
        )
    }
}
