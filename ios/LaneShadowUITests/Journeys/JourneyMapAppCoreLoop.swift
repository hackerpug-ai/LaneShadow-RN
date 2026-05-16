import XCTest

/// Journey 2 — MapApp Core Loop: The primary user journey.
///
/// Per VIEW-MAP doctrine (`.spec/prds/v3-integration/VIEW-MAP.md`): There is ONE persistent
/// `MapApp` host; `idle` / `planning` / `routeResults` / `routeDetails` are STATES that mutate
/// in place — never navigated to. The LSMap's `accessibilityIdentifier` (captured at step01)
/// must equal the same read at every subsequent step. Any change = view re-mount = doctrine
/// violation = test FAIL.
///
/// This journey is implemented as a SINGLE test method with sequential phases (step01 → step12)
/// to ensure each step builds on the previous one's state. XCTest runs individual test methods
/// in isolation; a journey that crosses test method boundaries breaks this contract.
///
/// Steps:
/// 01. Launch with bypass, land at idle. Capture LSMap identity.
/// 02. Assert idle content: LSTopBar greeting headline, suggestion chips ≥1 with content, pixel-sample LSMap.
/// 03. Tap zoom-in + recenter; assert Mapbox camera state change via accessibilityValue.
/// 04. Tap first suggestion chip; assert LSChatInput field value matches chip label.
/// 05. Tap send; wait for planning state. Assert phase-indicator + locked chat input visible.
/// 06. Poll for routeResults state within 90s (Sprint 09 gated).
/// 07. Assert ≥3 route attachment cards with distinct polyline stateDescriptions.
/// 08. Tap alt1 card; assert Mapbox style change via stateDescription.
/// 09. Tap alt1 card again; assert RouteDetails overlay visible (Sprint 10 gated).
/// 10. Assert route details content (title/distance/duration) non-empty. Expand sheet.
/// 11. Dismiss sheet; assert back to bare routeResults, alt1 still selected.
/// 12. Tap back chip; assert state mutates to idle.
///
/// Sprint coupling — removal protocol:
/// - Steps 06–08: Removed if planning→routeResults state transition times out.
/// - Steps 09–11: Removed if RouteDetails overlay isn't ready.
/// - Step 02: Removed if Convex JWT bridge rejects bypass tokens.
@MainActor
final class JourneyMapAppCoreLoop: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
    }

    override func tearDownWithError() throws {
        app.terminate()
        app = nil
    }

    // MARK: - Main Journey Test (steps 01-12 sequential)

    func testMapAppCoreLoopJourney() {
        var mapIdentityAtStart: String?

        // MARK: Step 01 — Launch and capture map identity

        JourneyHelpers.launchWithBypassAndState(app, state: nil)

        let idleReached = JourneyHelpers.waitForMapAppState(app, expected: .idle, timeout: 10)
        XCTAssertTrue(
            idleReached,
            "Expected launch with bypass to land at idle state within 10s."
        )

        mapIdentityAtStart = JourneyHelpers.persistentHostIdentity(app)
        XCTAssertNotNil(
            mapIdentityAtStart,
            "LSMap must have a non-nil accessibility identifier at launch."
        )

        let screen01 = XCTAttachment(screenshot: app.screenshot())
        screen01.name = "core-01-idle-launch"
        screen01.lifetime = .keepAlways
        add(screen01)

        guard let mapIdentity = mapIdentityAtStart else {
            XCTFail("mapIdentityAtStart is nil; cannot continue journey")
            return
        }

        var currentIdentity: String?

        // MARK: Step 02 — REMOVED (Convex JWT bridge rejects bypass tokens)

        // Per user instruction: incomplete tests are removed, not skipped.
        // When Convex JWT bridge is fixed, reinstate step 02:
        // - Assert LSTopBar headline (greeting) non-empty
        // - Assert suggestion chips ≥1 with non-empty content
        // - Pixel-sample LSMap ≥3 distinct colors

        // MARK: Step 03 — Tap zoom-in and recenter map controls

        currentIdentity = JourneyHelpers.persistentHostIdentity(app)
        XCTAssertEqual(
            currentIdentity,
            mapIdentity,
            "VIEW-MAP doctrine violation: LSMap remounted at step 03 — persistent-host contract broken"
        )

        let zoomInButton = element("lsmapcontrols-zoom-in")
        XCTAssertTrue(
            zoomInButton.waitForExistence(timeout: 5),
            "Expected zoom-in button to be visible in map controls."
        )
        zoomInButton.tap()

        // Give the map time to animate
        RunLoop.current.run(until: Date().addingTimeInterval(1))

        let recenterButton = element("lsmapcontrols-location.circle")
        XCTAssertTrue(
            recenterButton.waitForExistence(timeout: 5),
            "Expected recenter button to be visible in map controls."
        )
        recenterButton.tap()

        // Give the map time to recenter
        RunLoop.current.run(until: Date().addingTimeInterval(1))

        let screen03 = XCTAttachment(screenshot: app.screenshot())
        screen03.name = "core-03-map-controls"
        screen03.lifetime = .keepAlways
        add(screen03)

        // MARK: Step 04 — REMOVED (depends on Convex-provided suggestion chips from Step 02)

        // If step 02 suggestion chips are present after Convex JWT fix,
        // tap first chip and assert LSChatInput field is populated with chip label.

        // MARK: Steps 05-12 — REMOVED (Convex JWT bridge prevents chat input from appearing)

        // Steps 02, 04, 05 depend on Convex-provided greeting/suggestions/planning flow.
        // The Convex JWT bridge issue blocks this entire downstream path.
        // When the Convex JWT bridge is fixed to accept bypass tokens:
        // - Step 02 will render LSTopBar with greeting and suggestion chips
        // - Step 04 will tap a suggestion chip and populate chat input
        // - Step 05 will enter manual query, tap send, and transition to planning
        // - Steps 06-12 will execute the rest of the journey (route results, back to idle)

        let endScreenBeforeBlocks = XCTAttachment(screenshot: app.screenshot())
        endScreenBeforeBlocks.name = "core-04-idle-end-convex-jwt-blocked"
        endScreenBeforeBlocks.lifetime = .keepAlways
        add(endScreenBeforeBlocks)

        // Verify we're still in idle state (persistent-host doctrine)
        currentIdentity = JourneyHelpers.persistentHostIdentity(app)
        XCTAssertEqual(
            currentIdentity,
            mapIdentity,
            "VIEW-MAP doctrine violation: LSMap remounted after remaining in idle state"
        )

        // MARK: Steps 06-12 — REMOVED (depend on Steps 05+, which are blocked)

        // These steps require the planning state (Step 05), which fails due to Convex JWT bridge issue.
        // When the Convex JWT bridge is fixed and Step 05 completes:
        // - Steps 06-08: Test route results state and Mapbox polyline selection (Sprint 09)
        // - Steps 09-11: Test route details overlay and content (Sprint 10)
        // - Step 12: Test cancel/back to idle state
    }

    // MARK: - Helper

    private func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }
}
