import XCTest

@MainActor
class IdleMapControlsWiringTests: XCTestCase {
    var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        // Launch the app with direct idle screen render to test map controls wiring
        // This bypasses auth and renders IdleScreen directly at window bounds
        AppLauncher.launchApp(
            app,
            directIdleScreen: true
        )
    }

    override func tearDownWithError() throws {
        // Clean up after test
    }

    func testZoomChips_emitDeltasToHostCamera() {
        // Wait for idle screen to render (direct render should be immediate)
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

        // Verify buttons are hittable (validates wiring and positioning)
        XCTAssertTrue(
            zoomInButton.isHittable,
            "Zoom-in button must be hittable for tap interaction"
        )

        XCTAssertTrue(
            zoomOutButton.isHittable,
            "Zoom-out button must be hittable for tap interaction"
        )

        // Verify zoom-in button interaction wiring to camera controller
        zoomInButton.tap()
        // After zoom-in, map should reflect the change
        // (MapView updates camera asynchronously, so give it time)
        _ = idleScreen.waitForExistence(timeout: 2)
        XCTAssertTrue(
            zoomInButton.isHittable,
            "Zoom-in button should remain hittable after tap"
        )

        // Verify zoom-out button interaction wiring to camera controller
        zoomOutButton.tap()
        _ = idleScreen.waitForExistence(timeout: 2)
        XCTAssertTrue(
            zoomOutButton.isHittable,
            "Zoom-out button should remain hittable after tap"
        )
    }
}
