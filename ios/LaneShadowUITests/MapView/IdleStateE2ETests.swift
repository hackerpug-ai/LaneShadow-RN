import XCTest

@MainActor
final class IdleStateE2ETests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
    }

    override func tearDownWithError() throws {
        app.terminate()
        app = nil
    }

    /// Idle state lands on the map view with real greeting, meta row, and
    /// favorites driven by the Convex backend.
    func testIdleStateRendersGreetingAndMetaRow() {
        AppLauncher.launchApp(app, bypassAuth: true)

        XCTAssertTrue(
            element("idlescreen-current-user-greeting").waitForExistence(timeout: 30),
            "Expected authenticated launch to show the idle-screen greeting overlay."
        )

        XCTAssertTrue(
            element("greeting-meta").waitForExistence(timeout: 5),
            "Expected meta row (day · temp · condition) to render."
        )

        XCTAssertTrue(
            element("greeting-headline").waitForExistence(timeout: 5),
            "Expected greeting headline to render."
        )

        attachScreenshot(named: "idle-state-landing")
    }

    /// Suggestion chips are tappable and transition into the planning state.
    func testIdleStateSuggestionChipTransitionsToPlanning() {
        AppLauncher.launchApp(app, bypassAuth: true)

        XCTAssertTrue(
            element("idlescreen-current-user-greeting").waitForExistence(timeout: 30),
            "Expected idle screen before tapping suggestion chip."
        )

        let firstChip = app.buttons.firstMatch
        XCTAssertTrue(firstChip.waitForExistence(timeout: 5), "Expected at least one suggestion chip.")
        firstChip.tap()

        XCTAssertTrue(
            element("planning-phase-indicator").waitForExistence(timeout: 10),
            "Expected planning phase indicator after tapping suggestion chip."
        )

        attachScreenshot(named: "idle-to-planning-transition")
    }

    /// Hamburger menu opens the sessions drawer overlay.
    func testIdleStateHamburgerOpensSessionsDrawer() {
        AppLauncher.launchApp(app, bypassAuth: true)

        XCTAssertTrue(
            element("idlescreen-current-user-greeting").waitForExistence(timeout: 30),
            "Expected idle screen before opening drawer."
        )

        let hamburger = element("ls-topbar-hamburger-chip")
        XCTAssertTrue(hamburger.waitForExistence(timeout: 5), "Expected hamburger menu chip.")
        hamburger.tap()

        XCTAssertTrue(
            element("sessions-drawer-root").waitForExistence(timeout: 5),
            "Expected sessions drawer to open after tapping hamburger."
        )

        attachScreenshot(named: "idle-drawer-open")
    }

    private func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }

    private func attachScreenshot(named name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
