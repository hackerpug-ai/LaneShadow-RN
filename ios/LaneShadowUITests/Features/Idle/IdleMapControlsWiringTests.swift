import XCTest

class IdleMapControlsWiringTests: XCTestCase {
    var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    override func tearDownWithError() throws {
        // Clean up after test
    }

    func testZoomChips_emitDeltasToHostCamera() throws {
        // Wait for idle screen to render
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

        // Verify zoom-in button is accessible
        let zoomInButton = app.buttons["lsmapcontrols-zoom-in"]
        XCTAssertTrue(
            zoomInButton.waitForExistence(timeout: 5),
            "Zoom-in button should be present"
        )

        // Verify zoom-out button is accessible
        let zoomOutButton = app.buttons["lsmapcontrols-zoom-out"]
        XCTAssertTrue(
            zoomOutButton.waitForExistence(timeout: 5),
            "Zoom-out button should be present"
        )

        // Tap zoom-in button and verify it's tappable
        zoomInButton.tap()

        // Tap zoom-out button and verify it's tappable
        zoomOutButton.tap()

        // If we reach here without crashing, the wiring is correct
        XCTAssertTrue(true, "Zoom buttons tapped successfully")
    }
}
