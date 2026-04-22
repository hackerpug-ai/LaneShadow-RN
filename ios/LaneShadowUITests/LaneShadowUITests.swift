import XCTest

@MainActor
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

    func testAppTitleVisible() {
        let title = app.staticTexts["LaneShadow"]
        XCTAssertTrue(
            title.waitForExistence(timeout: 15),
            "App should display LaneShadow title"
        )
    }

    func testNavigationTitleVisible() {
        let navTitle = app.navigationBars.staticTexts["LaneShadow"]
        XCTAssertTrue(
            navTitle.waitForExistence(timeout: 15),
            "Navigation bar should display LaneShadow title"
        )
    }
}
