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
        let idleScreen = app.otherElements.matching(identifier: "idlescreen").firstMatch
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

        let mapElement = idleScreen
        XCTAssertTrue(
            mapElement.waitForExistence(timeout: 5),
            "Idle screen container should remain present for camera-state inspection"
        )
        XCTAssertEqual(
            mapElement.value as? String,
            "zoom-deltas=;recenter=0/0;outcome=idle",
            "Map host should start with no camera deltas applied"
        )

        zoomInButton.tap()
        XCTAssertTrue(
            waitForValue(
                "zoom-deltas=1;recenter=0/0;outcome=idle",
                on: mapElement
            ),
            "Zoom-in should record a +1 applied camera delta"
        )

        zoomOutButton.tap()
        XCTAssertTrue(
            waitForValue(
                "zoom-deltas=1,-1;recenter=0/0;outcome=idle",
                on: mapElement
            ),
            "Zoom-out should record a -1 applied camera delta after the +1"
        )
    }

    private func waitForValue(_ value: String, on element: XCUIElement, timeout: TimeInterval = 5) -> Bool {
        let predicate = NSPredicate(format: "value == %@", value)
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: element)
        return XCTWaiter().wait(for: [expectation], timeout: timeout) == .completed
    }
}
