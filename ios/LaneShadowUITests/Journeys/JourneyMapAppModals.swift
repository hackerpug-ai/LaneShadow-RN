import XCTest

/// Journey 3 — MapApp Modals: Menu drawer and transient overlays.
///
/// Per VIEW-MAP doctrine (`.spec/prds/v3-integration/VIEW-MAP.md`): Modal overlays
/// (drawer, sheet, dialog) sit over the active MapApp state and are dismissed via
/// tap-out / explicit cancel, returning to exactly the same state. The LSMap's
/// `accessibilityIdentifier` must remain stable across modal open + close cycles.
///
/// Partial implementation (Sprint 11 deferred steps):
/// - Step 01: Menu drawer (hamburger tap → drawer appears → dismiss → back to idle)
/// - Steps 02-03: Sessions drawer, cancel-confirm sheet — REMOVED (Sprint 11, requires Convex seeder)
/// - Steps 04+: Filter sheet — REMOVED (not designed yet)
///
@MainActor
final class JourneyMapAppModals: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
    }

    override func tearDownWithError() throws {
        app.terminate()
        app = nil
    }

    // MARK: - Main Journey Test

    /// Step 01 — Menu drawer: Hamburger tap opens drawer, dismiss closes it,
    /// LSMap identity remains stable across open + close cycle.
    ///
    /// CURRENT BLOCKER (2026-05-16): The hamburger button accessibility identifier
    /// "lstopbar-hamburger" is not discoverable in the XCUITest element tree even
    /// though the idlescreen renders successfully. This suggests either:
    /// 1. LSTopBar is not rendering in bypass auth mode, or
    /// 2. The button's accessibility hierarchy is not exposed to XCUITest
    ///
    /// The test demonstrates the intended flow but fails at the hamburger tap.
    /// This needs investigation of LSTopBar rendering in bypass auth mode.
    func testStep01MenuDrawerOpenClose() {
        var mapIdentityAtStart: String?

        // Launch idle state with bypass auth
        JourneyHelpers.launchWithBypassAndState(app, state: nil)

        // Give app time to fully initialize
        RunLoop.current.run(until: Date().addingTimeInterval(2))

        // Wait for idle state to be reached
        let idleReached = JourneyHelpers.waitForMapAppState(app, expected: .idle, timeout: 10)
        XCTAssertTrue(
            idleReached,
            "Expected launch with bypass to land at idle state within 10s."
        )

        // Capture LSMap identity at launch
        mapIdentityAtStart = JourneyHelpers.persistentHostIdentity(app)
        XCTAssertNotNil(
            mapIdentityAtStart,
            "LSMap must have a non-nil accessibility identifier at launch."
        )

        let screenBeforeMenu = XCTAttachment(screenshot: app.screenshot())
        screenBeforeMenu.name = "modals-01-idle-before-menu"
        screenBeforeMenu.lifetime = .keepAlways
        add(screenBeforeMenu)

        guard let mapIdentityStart = mapIdentityAtStart else {
            XCTFail("mapIdentityAtStart is nil; cannot continue")
            return
        }

        // MARK: Attempt to tap hamburger button to open menu drawer

        // Try to find hamburger button using element helper
        let hamburgerButton = element("lstopbar-hamburger")

        // This is the failure point: hamburger button is not discoverable
        // even though idlescreen exists and renders
        XCTAssertTrue(
            hamburgerButton.waitForExistence(timeout: 10),
            "BLOCKER: Hamburger button 'lstopbar-hamburger' not found in XCUITest element tree. LSTopBar may not be rendering in bypass auth mode."
        )

        hamburgerButton.tap()

        // Following steps would verify persistent-host doctrine:
        // - Wait for drawer to appear
        // - Verify map identity unchanged
        // - Tap scrim to dismiss
        // - Verify map identity still unchanged
    }

    // MARK: - Deferred Steps

    // Step 02 — Sessions Drawer (deferred to Sprint 11)
    // Spec: `.spec/design/system/views/mapapp/sessions-drawer/`
    // Requirements: Drawer over idle showing prior rides (requires Convex seeder)
    // Blocker: Sessions data must be populated by Convex; bypass auth doesn't seed rides
    // When Sprint 11 lands (Convex seeder + sessions-drawer UI):
    //   - Tap "RIDES" header or menu item
    //   - Assert drawer shows ≥1 session card with ride info
    //   - Tap a session card; assert transition to RouteResults or session-detail
    //   - Dismiss; assert persistent-host identity stable

    // Step 03 — Cancel-Confirm Sheet (deferred to Sprint 11)
    // Spec: `.spec/design/system/views/mapapp/planning/cancel-prompt/`
    // Requirements: Sheet appears during planning state to confirm cancel
    // Blocker: Requires reaching planning state (.planning), which needs planning flow
    //   to work (see JourneyMapAppCoreLoop § Steps 05+, blocked by Convex JWT bridge)
    // When planning flow is available:
    //   - Tap send from idle → transition to planning
    //   - Tap X or back to cancel
    //   - Assert cancel-confirm sheet appears
    //   - Tap cancel; assert sheet dismisses, return to planning
    //   - Tap confirm; assert state mutates to idle, persistent-host stable

    // MARK: - Helper

    private func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }
}
