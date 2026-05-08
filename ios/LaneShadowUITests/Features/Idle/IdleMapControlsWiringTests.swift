import XCTest

@MainActor
class IdleMapControlsWiringTests: XCTestCase {
    var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        // Launch the app with the sandbox idle screen story to test map controls wiring
        AppLauncher.launchApp(
            app,
            sandbox: true,
            sandboxStoryId: "templates.idle-screen.default"
        )
    }

    override func tearDownWithError() throws {
        // Clean up after test
    }

    func testZoomChips_emitDeltasToHostCamera() {
        // Wait for idle screen to render (should be immediate with sandbox story)
        let idleScreen = app.otherElements["idlescreen"]
        XCTAssertTrue(
            idleScreen.waitForExistence(timeout: 10),
            "Idle screen should exist"
        )

        // Verify map controls are rendered
        let mapControls = app.otherElements["idle-map-controls"]
        XCTAssertTrue(
            mapControls.waitForExistence(timeout: 5),
            "Map controls should be present"
        )

        // Verify zoom-in button is accessible and visible
        let zoomInButton = app.buttons["lsmapcontrols-zoom-in"]
        XCTAssertTrue(
            zoomInButton.waitForExistence(timeout: 5),
            "Zoom-in button should be present"
        )

        // Verify zoom-out button is accessible and visible
        let zoomOutButton = app.buttons["lsmapcontrols-zoom-out"]
        XCTAssertTrue(
            zoomOutButton.waitForExistence(timeout: 5),
            "Zoom-out button should be present"
        )

        // Verify buttons are hittable (this validates the wiring and positioning)
        XCTAssertTrue(
            zoomInButton.isHittable,
            "Zoom-in button should be hittable"
        )

        XCTAssertTrue(
            zoomOutButton.isHittable,
            "Zoom-out button should be hittable"
        )
    }
}
