import UIKit
import XCTest

/// Live E2E coverage for the Sprint 08 planning state of the map view.
///
/// Mirrors `IdleStateE2ETests` — same `XCUIApplication` shape, same
/// `AppLauncher.launchApp(bypassAuth: true)` flow, same screenshot helpers.
/// Tests run unchanged on simulator (`-destination 'platform=iOS Simulator,
/// name=iPhone 16'`) and physical iPhone (`-destination "id=<UDID>"`).
///
/// Covers the human-testing-gate behaviors that became live-path after
/// the Sprint 08 stub-fix cycle (commits 8eb2d577a + 08e034a87):
///
/// - AC-1: composition renders (capsule + indicator + chat input)
/// - AC-2: persistent map host survives idle → planning (pixel signal)
/// - AC-3: chat input locked while ViewModel is thinking
/// - AC-4: back chip cancels and returns to idle
/// - AC-5: sketch polyline animates (pixel-diff between two frames)
///
/// See `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-E2E-IOS-T01-planning-state-live-e2e.md`.
@MainActor
final class PlanningStateE2ETests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
    }

    override func tearDownWithError() throws {
        app.terminate()
        app = nil
    }

    // MARK: - AC-1

    /// After tapping a suggestion chip in idle, the planning state's three
    /// overlays (phase indicator + chat input + map) all render within 10s.
    func testPlanningStateRendersCompositionAfterChipTap() {
        AppLauncher.launchApp(app, bypassAuth: true)
        tapFirstSuggestionChip()

        XCTAssertTrue(
            element(LSIds.planningScreen).waitForExistence(timeout: 10),
            "Expected planningscreen root after suggestion chip tap."
        )
        XCTAssertTrue(
            element(LSIds.planningScreenPhaseIndicator).waitForExistence(timeout: 10),
            "Expected planningscreen-phase-indicator overlay to render."
        )
        XCTAssertTrue(
            element(LSIds.planningScreenChatInput).waitForExistence(timeout: 10),
            "Expected planningscreen-chat-input overlay to render."
        )
        XCTAssertTrue(
            element(LSIds.planningScreenMap).waitForExistence(timeout: 10),
            "Expected planningscreen-map host to render."
        )

        attachScreenshot(named: "planning-state-composition")
    }

    // MARK: - AC-2

    /// After the idle → planning transition, the planning-state map renders
    /// live Mapbox tiles (non-uniform pixels). This is the strongest
    /// XCUITest-level signal that the map host survived the transition with
    /// real tile content rather than collapsing to a placeholder.
    func testPlanningStateMapHostRendersLiveTilesAfterTransition() throws {
        AppLauncher.launchApp(app, bypassAuth: true)

        XCTAssertTrue(
            element(LSIds.idleScreenMap).waitForExistence(timeout: 30),
            "Expected idle map to be mounted before transition."
        )

        tapFirstSuggestionChip()

        XCTAssertTrue(
            element(LSIds.planningScreenMap).waitForExistence(timeout: 10),
            "Expected planningscreen-map after transition."
        )

        // Let Mapbox draw at least one frame in the planning state.
        sleep(3)

        let screenshot = app.screenshot()
        let colors = try sampledRGBColors(
            in: screenshot,
            normalizedPoints: [
                CGPoint(x: 0.18, y: 0.30),
                CGPoint(x: 0.45, y: 0.30),
                CGPoint(x: 0.72, y: 0.30),
                CGPoint(x: 0.18, y: 0.48),
                CGPoint(x: 0.45, y: 0.48),
                CGPoint(x: 0.72, y: 0.48),
                CGPoint(x: 0.18, y: 0.66),
                CGPoint(x: 0.45, y: 0.66),
                CGPoint(x: 0.72, y: 0.66),
            ]
        )

        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = "planning-state-map-tile-grid"
        attachment.lifetime = .keepAlways
        add(attachment)

        XCTAssertGreaterThanOrEqual(
            colors.count,
            3,
            "Expected at least 3 distinct sampled colors from planning-state map tiles; uniform pixels indicate the host did not preserve tile content across the transition."
        )
    }

    // MARK: - AC-3

    /// While the ViewModel is thinking (immediately after a chip tap, before
    /// any agent message returns), the chat input must be locked: the
    /// spinner element is present AND the field is not enabled.
    func testPlanningStateChatInputLocksWhileThinking() {
        AppLauncher.launchApp(app, bypassAuth: true)
        tapFirstSuggestionChip()

        XCTAssertTrue(
            element(LSIds.planningScreenChatInput).waitForExistence(timeout: 10),
            "Expected planningscreen-chat-input overlay before checking lock state."
        )

        // Spinner indicates `isThinking == true` at the LSChatInput level.
        let spinner = element(LSIds.chatInputSpinner)
        XCTAssertTrue(
            spinner.waitForExistence(timeout: 5),
            "Expected lschatinput-spinner while ViewModel is thinking."
        )

        // Field must not accept input while locked.
        let field = element(LSIds.chatInputField)
        XCTAssertTrue(
            field.waitForExistence(timeout: 5),
            "Expected lschatinput-field element to be present."
        )
        XCTAssertFalse(
            field.isEnabled,
            "Expected lschatinput-field.isEnabled == false while planning is thinking."
        )

        attachScreenshot(named: "planning-state-chat-locked")
    }

    // MARK: - AC-4

    /// Tapping the back chip from the planning state cancels the plan
    /// (firing `db.routePlans.cancelPlan` via `viewModel.cancelPlanning`)
    /// and returns the user to the idle map view. The persistent-host
    /// contract means the idle map re-renders without a fresh app launch.
    ///
    /// NB: this test asserts CURRENT behavior — the iOS live path does not
    /// yet render the cancel-confirm sheet (a documented follow-up:
    /// PLAN-S08-IOS-CANCEL-CONFIRM-T01). When the sheet lands, this test
    /// must be split: back → sheet visible → "Cancel plan" → idle.
    func testPlanningStateBackChipCancelsAndReturnsToIdle() {
        AppLauncher.launchApp(app, bypassAuth: true)
        tapFirstSuggestionChip()

        XCTAssertTrue(
            element(LSIds.planningScreen).waitForExistence(timeout: 10),
            "Expected planningscreen before tapping back chip."
        )

        let collapse = element(LSIds.chatInputCollapse)
        XCTAssertTrue(
            collapse.waitForExistence(timeout: 5),
            "Expected lschatinput-collapse back chip on the locked chat input."
        )
        collapse.tap()

        XCTAssertTrue(
            element(LSIds.idleScreen).waitForExistence(timeout: 10),
            "Expected to return to idlescreen after back chip from planning."
        )
        XCTAssertFalse(
            element(LSIds.planningScreen).exists,
            "Expected planningscreen to be torn down after cancellation."
        )

        attachScreenshot(named: "planning-cancelled-back-to-idle")
    }

    // MARK: - AC-5

    /// Sample two screenshots ~700ms apart inside the planning-state map
    /// bounds (half the 1400ms sketch loop). The two pixel sets must
    /// differ — uniform/identical pixels would prove the polyline
    /// animation is static, which is what `UIScreen.main.bounds`
    /// anti-pattern + reduced-motion regressions would produce.
    func testPlanningStateSketchPolylineAnimatesBetweenFrames() throws {
        AppLauncher.launchApp(app, bypassAuth: true)
        tapFirstSuggestionChip()

        XCTAssertTrue(
            element(LSIds.planningScreenMap).waitForExistence(timeout: 10),
            "Expected planningscreen-map before sampling animation frames."
        )

        // Allow the polyline overlay to begin animating after the planning
        // composition has fully laid out.
        sleep(2)

        let firstShot = app.screenshot()
        let firstPixels = try sampledRGBColors(
            in: firstShot,
            normalizedPoints: animationSamplePoints
        )
        let firstAttachment = XCTAttachment(screenshot: firstShot)
        firstAttachment.name = "polyline-frame-t0"
        firstAttachment.lifetime = .keepAlways
        add(firstAttachment)

        // ~700ms — half of the 1400ms sketch loop, so the polyline
        // should have advanced visibly.
        usleep(700_000)

        let secondShot = app.screenshot()
        let secondPixels = try sampledRGBColors(
            in: secondShot,
            normalizedPoints: animationSamplePoints
        )
        let secondAttachment = XCTAttachment(screenshot: secondShot)
        secondAttachment.name = "polyline-frame-t700ms"
        secondAttachment.lifetime = .keepAlways
        add(secondAttachment)

        XCTAssertNotEqual(
            firstPixels,
            secondPixels,
            "Expected polyline-region pixels to change between frames sampled ~700ms apart (sketch animation should be advancing). Identical sets indicate the animation is static — likely a reduced-motion regression, a paused infiniteTransition, or a layout that fell back to UIScreen.main.bounds."
        )
    }

    // MARK: - Helpers

    /// Suggestion chips sit inside `lschatinput-suggestions` on the idle
    /// chat input. Tap the first one to start a planning session.
    private func tapFirstSuggestionChip() {
        let suggestions = element(LSIds.chatInputSuggestions)
        XCTAssertTrue(
            suggestions.waitForExistence(timeout: 30),
            "Expected idle suggestion chip row before transitioning to planning."
        )

        let chip = suggestions.buttons.firstMatch
        XCTAssertTrue(
            chip.waitForExistence(timeout: 5),
            "Expected at least one suggestion chip in the idle state."
        )
        chip.tap()
    }

    /// Sample points inside the map overlay region (avoiding the top
    /// LSTopBar at y ≈ 0.0–0.18 and the bottom chat input at y ≈ 0.75–1.0).
    private var animationSamplePoints: [CGPoint] {
        [
            CGPoint(x: 0.30, y: 0.40),
            CGPoint(x: 0.45, y: 0.40),
            CGPoint(x: 0.60, y: 0.40),
            CGPoint(x: 0.30, y: 0.55),
            CGPoint(x: 0.45, y: 0.55),
            CGPoint(x: 0.60, y: 0.55),
        ]
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

    /// Sample the RGB color at each normalized point in the screenshot and
    /// return the unique set. Identical to the idle test's helper — kept
    /// local here so the planning test file stays self-contained.
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
