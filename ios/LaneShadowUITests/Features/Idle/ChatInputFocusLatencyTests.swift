import XCTest

/// Measures the latency between tapping the chat input field on the idle screen
/// and the system keyboard appearing (a proxy for SwiftUI focus state propagation).
///
/// User reported "huge delay between tapping on an input field and focus". Without
/// device-side profiling, code review alone can't identify the root cause; this
/// test quantifies the delay so we can iterate on fixes against a real number.
///
/// Runs across N trials (cold-tap + warm-tap) and prints percentiles. Failure
/// threshold is intentionally loose (1500 ms) — the value of the test is the
/// *measurement* it prints, which lets us A/B fixes.
@MainActor
final class ChatInputFocusLatencyTests: XCTestCase {
    private static let coldTapMaxMs: Double = 1500
    private static let warmTapMaxMs: Double = 500
    private static let trialCount = 5

    var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        AppLauncher.launchApp(app, directIdleScreen: true)
    }

    /// Measures cold-tap latency: launch → first tap on chat input → keyboard visible.
    /// This is the worst-case the user experiences when they first interact with
    /// the idle screen after launch.
    func testColdTapLatency_chatInputFocus() throws {
        let idleScreen = app.otherElements[LSIds.idleScreen]
        XCTAssertTrue(
            idleScreen.waitForExistence(timeout: 15),
            "Idle screen must mount before we can measure focus latency"
        )

        // Wait for the chat input region to be rendered. The chat-input-suggestions
        // strip is unique (single match), so we use it as the materialization signal.
        // The chat input region's identifier appears multiple times in the SwiftUI
        // tree (the inputBarView has nested accessibility containers). Rather than
        // disambiguating via index, we just settle a fixed delay after idleScreen
        // exists — the chat input renders synchronously with the rest of the screen.
        wait(for: 1.0)

        let keyboard = app.keyboards.firstMatch
        let tapTarget = bottomCenterTapTarget(of: idleScreen)

        let start = Date()
        tapTarget.tap()
        let appeared = keyboard.waitForExistence(timeout: Self.coldTapMaxMs / 1000 + 0.5)
        let elapsedMs = Date().timeIntervalSince(start) * 1000

        NSLog("📐 COLD_TAP_FOCUS_LATENCY_MS=\(String(format: "%.1f", elapsedMs))")
        XCTAssertTrue(
            appeared,
            "Keyboard never appeared within \(Self.coldTapMaxMs)ms cap"
        )
        XCTAssertLessThan(
            elapsedMs,
            Self.coldTapMaxMs,
            "Cold-tap focus latency \(elapsedMs)ms exceeded cap (\(Self.coldTapMaxMs)ms). " +
            "If this fires, the user-reported delay is real and large."
        )
    }

    /// Measures warm-tap latency: dismiss keyboard, then tap again. Removes
    /// first-tap noise (gesture-system warmup, lazy view materialization).
    func testWarmTapLatency_chatInputFocus_percentiles() throws {
        let idleScreen = app.otherElements[LSIds.idleScreen]
        XCTAssertTrue(idleScreen.waitForExistence(timeout: 15))

        // The chat input region's identifier appears multiple times in the SwiftUI
        // tree (the inputBarView has nested accessibility containers). Rather than
        // disambiguating via index, we just settle a fixed delay after idleScreen
        // exists — the chat input renders synchronously with the rest of the screen.
        wait(for: 1.0)

        let keyboard = app.keyboards.firstMatch
        let tapTarget = bottomCenterTapTarget(of: idleScreen)
        var measurements: [Double] = []

        // Warmup tap so the first measurement isn't first-launch jitter
        tapTarget.tap()
        _ = keyboard.waitForExistence(timeout: 3)
        dismissKeyboard()

        for trial in 0 ..< Self.trialCount {
            wait(for: 0.5)

            let start = Date()
            tapTarget.tap()
            let appeared = keyboard.waitForExistence(timeout: Self.warmTapMaxMs / 1000 + 0.5)
            let elapsedMs = Date().timeIntervalSince(start) * 1000

            XCTAssertTrue(appeared, "Trial \(trial): keyboard never appeared")
            measurements.append(elapsedMs)
            NSLog("📐 WARM_TAP_FOCUS_LATENCY_MS trial=\(trial) value=\(String(format: "%.1f", elapsedMs))")

            dismissKeyboard()
        }

        let sorted = measurements.sorted()
        let p50 = sorted[sorted.count / 2]
        let p95 = sorted[min(sorted.count - 1, Int(Double(sorted.count) * 0.95))]
        let mean = measurements.reduce(0, +) / Double(measurements.count)

        NSLog("📐 WARM_TAP_FOCUS_LATENCY_SUMMARY n=\(measurements.count) mean=\(String(format: "%.1f", mean))ms p50=\(String(format: "%.1f", p50))ms p95=\(String(format: "%.1f", p95))ms")

        XCTAssertLessThan(
            p95,
            Self.warmTapMaxMs,
            "Warm-tap p95 \(p95)ms exceeded cap (\(Self.warmTapMaxMs)ms). " +
            "Measurements (ms): \(measurements.map { String(format: "%.0f", $0) }.joined(separator: ", "))"
        )
    }

    // MARK: - Helpers

    /// Coordinate-based tap target near the bottom-center of the idle screen,
    /// where LSChatInput's text field visually sits. Bypasses identifier
    /// resolution problems with deeply-nested SwiftUI accessibility trees.
    private func bottomCenterTapTarget(of element: XCUIElement) -> XCUICoordinate {
        // Target ~6% above the bottom edge, horizontally centered. The chat
        // bar sits in the bottom overlay slot with theme.space.md padding.
        return element.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.94))
    }

    private func dismissKeyboard() {
        if app.keyboards.firstMatch.exists {
            // Tap near the top of the map (above any overlays) to dismiss the keyboard
            let dismissTarget = app.otherElements[LSIds.idleScreen]
                .coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.25))
            dismissTarget.tap()
        }
    }

    private func wait(for seconds: TimeInterval) {
        let exp = expectation(description: "wait \(seconds)")
        DispatchQueue.main.asyncAfter(deadline: .now() + seconds) {
            exp.fulfill()
        }
        waitForExpectations(timeout: seconds + 1)
    }
}
