import XCTest

@MainActor
final class AuthBypassE2ETests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
    }

    override func tearDownWithError() throws {
        app.terminate()
        app = nil
    }

    /// Smoke-tests the debug-only auth bypass: launching with `bypassAuth: true`
    /// must reveal the bypass button on the entry view, and tapping it must
    /// short-circuit the Clerk flow and land on the authenticated home screen
    /// without making any real OAuth or Convex calls.
    func testBypassAuthLandsOnAuthenticatedHomeWithoutClerk() {
        AppLauncher.launchApp(app, resetAuth: true, bypassAuth: true)

        XCTAssertTrue(
            element("auth.signIn.root").waitForExistence(timeout: 30),
            "Expected signed-out launch to show SignInScreen root."
        )

        let bypassButton = element("auth.signIn.bypassAuth")
        XCTAssertTrue(
            bypassButton.waitForExistence(timeout: 5),
            "Expected the test-only Bypass auth button to render when launched with -LaneShadowUITestBypassAuth."
        )

        bypassButton.tap()

        XCTAssertTrue(
            element("idlescreen-current-user-greeting").waitForExistence(timeout: 10),
            "Expected the bypass to drop the app onto the authenticated landing view."
        )
        XCTAssertTrue(
            element("auth.landing.logout").exists,
            "Expected the authenticated landing view to expose the logout button."
        )
    }

    /// Sanity check that the bypass button is gated — without the
    /// `-LaneShadowUITestBypassAuth` flag, the entry view stays at exactly
    /// three buttons (Apple, Google, Continue with Email).
    func testBypassButtonIsHiddenWithoutBypassFlag() {
        AppLauncher.launchApp(app, resetAuth: true)

        XCTAssertTrue(
            element("auth.signIn.root").waitForExistence(timeout: 30),
            "Expected signed-out launch to show SignInScreen root."
        )

        // Wait briefly so the entry view has a chance to render.
        _ = element("auth.signIn.continueWithEmail").waitForExistence(timeout: 5)

        XCTAssertFalse(
            element("auth.signIn.bypassAuth").exists,
            "Expected the bypass button to be hidden without the bypass launch flag."
        )
    }

    private func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }
}
