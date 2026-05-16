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
    func testStep01MenuDrawerOpenClose() {
        var mapIdentityAtStart: String?

        // Launch idle state with bypass auth
        JourneyHelpers.launchWithBypassAndState(app, state: nil)

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

        // MARK: Tap hamburger button to open menu drawer

        let hamburgerButton = element("lstopbar-hamburger")
        XCTAssertTrue(
            hamburgerButton.waitForExistence(timeout: 5),
            "Expected hamburger button to exist in LSTopBar."
        )
        hamburgerButton.tap()

        // Wait for menu drawer to appear
        let menuDrawer = element("idlescreen-menu-drawer")
        XCTAssertTrue(
            menuDrawer.waitForExistence(timeout: 5),
            "Expected menu drawer to appear within 5s after hamburger tap."
        )

        let screenMenuOpen = XCTAttachment(screenshot: app.screenshot())
        screenMenuOpen.name = "modals-01-menu-drawer-open"
        screenMenuOpen.lifetime = .keepAlways
        add(screenMenuOpen)

        // Verify LSMap identity unchanged (drawer is transient, doesn't remount map)
        var currentIdentity = JourneyHelpers.persistentHostIdentity(app)
        XCTAssertEqual(
            currentIdentity,
            mapIdentityStart,
            "VIEW-MAP doctrine violation: LSMap remounted when menu drawer opened — persistent-host contract broken"
        )

        // MARK: Dismiss menu drawer by tapping outside (scrim)

        let menuScrim = element("idlescreen-menu-scrim")
        XCTAssertTrue(
            menuScrim.exists,
            "Expected menu scrim to exist when drawer is open."
        )

        // Tap the scrim to close the drawer
        menuScrim.tap()

        // Wait for drawer to disappear
        let drawerGone = NSPredicate(format: "exists == false")
        let drawerQuery = app.descendants(matching: .any)
            .matching(identifier: "idlescreen-menu-drawer")
        expectation(
            for: drawerGone,
            evaluatedWith: drawerQuery.firstMatch,
            handler: nil
        )
        waitForExpectations(timeout: 5, handler: nil)

        let screenMenuClosed = XCTAttachment(screenshot: app.screenshot())
        screenMenuClosed.name = "modals-01-menu-drawer-closed"
        screenMenuClosed.lifetime = .keepAlways
        add(screenMenuClosed)

        // Verify we're still in idle state
        let stillIdle = JourneyHelpers.waitForMapAppState(app, expected: .idle, timeout: 5)
        XCTAssertTrue(
            stillIdle,
            "Expected to remain in idle state after dismissing menu drawer."
        )

        // Verify LSMap identity unchanged (drawer dismiss must not remount map)
        currentIdentity = JourneyHelpers.persistentHostIdentity(app)
        XCTAssertEqual(
            currentIdentity,
            mapIdentityStart,
            "VIEW-MAP doctrine violation: LSMap remounted after dismissing menu drawer — persistent-host contract broken"
        )
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
