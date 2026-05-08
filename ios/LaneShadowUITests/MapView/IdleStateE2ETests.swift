import UIKit
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

    /// Mapbox must render real tile/style content, not a uniform black canvas with only SDK chrome.
    func testIdleMapTilesRenderNonUniformPixelGrid() throws {
        AppLauncher.launchApp(app, bypassAuth: true, directIdleScreen: true)

        XCTAssertTrue(
            element("idlescreen").waitForExistence(timeout: 30),
            "Expected direct idle screen to render before sampling map pixels."
        )

        sleep(6)

        let screenshot = app.screenshot()
        let colors = try sampledRGBColors(
            in: screenshot,
            normalizedPoints: [
                CGPoint(x: 0.18, y: 0.28),
                CGPoint(x: 0.45, y: 0.28),
                CGPoint(x: 0.72, y: 0.28),
                CGPoint(x: 0.18, y: 0.46),
                CGPoint(x: 0.45, y: 0.46),
                CGPoint(x: 0.72, y: 0.46),
                CGPoint(x: 0.18, y: 0.64),
                CGPoint(x: 0.45, y: 0.64),
                CGPoint(x: 0.72, y: 0.64),
            ]
        )

        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = "idle-map-tile-grid"
        attachment.lifetime = .keepAlways
        add(attachment)

        XCTAssertGreaterThanOrEqual(
            colors.count,
            3,
            "Expected at least 3 distinct sampled colors from loaded map tiles; a uniform canvas indicates tile/style loading failed."
        )
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

    private func sampledRGBColors(
        in screenshot: XCUIScreenshot,
        normalizedPoints: [CGPoint]
    ) throws -> Set<UInt32> {
        guard let image = UIImage(data: screenshot.pngRepresentation)?.cgImage else {
            throw XCTSkip("Unable to decode screenshot PNG for pixel sampling.")
        }

        let width = image.width
        let height = image.height
        let bytesPerPixel = 4
        let bytesPerRow = bytesPerPixel * width
        var pixels = [UInt8](repeating: 0, count: height * bytesPerRow)

        guard let context = CGContext(
            data: &pixels,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: bytesPerRow,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else {
            throw XCTSkip("Unable to allocate screenshot sampling context.")
        }

        context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))

        return Set(normalizedPoints.map { point in
            let x = min(max(Int(point.x * CGFloat(width)), 0), width - 1)
            let y = min(max(Int(point.y * CGFloat(height)), 0), height - 1)
            let offset = y * bytesPerRow + x * bytesPerPixel
            let red = UInt32(pixels[offset])
            let green = UInt32(pixels[offset + 1])
            let blue = UInt32(pixels[offset + 2])
            return (red << 16) | (green << 8) | blue
        })
    }
}
