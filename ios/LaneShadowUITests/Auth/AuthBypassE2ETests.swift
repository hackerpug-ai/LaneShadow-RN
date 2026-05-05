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

    /// Smoke-tests the debug-only E2E sign-in: launching with `e2eSignIn: true`
    /// must reveal the E2E sign-in button on the entry view. Tapping it reads
    /// CLERK_TEST_EMAIL/CLERK_TEST_PASSWORD from environment and calls the real
    /// Clerk sign-in API, establishing a real session with a real Convex JWT.
    func testE2ESignInButtonAppearsWithE2EFlag() {
        AppLauncher.launchApp(app, resetAuth: true, e2eSignIn: true)

        XCTAssertTrue(
            element("auth.signIn.root").waitForExistence(timeout: 30),
            "Expected signed-out launch to show SignInScreen root."
        )

        let e2eButton = element("auth.signIn.e2eSignIn")
        XCTAssertTrue(
            e2eButton.waitForExistence(timeout: 5),
            "Expected the test-only E2E Sign In button to render when launched with -LaneShadowUITestE2E."
        )
    }

    /// Sanity check that the E2E sign-in button is gated — without the
    /// `-LaneShadowUITestE2E` flag, the entry view stays at exactly
    /// three buttons (Apple, Google, Continue with Email).
    func testE2ESignInButtonIsHiddenWithoutE2EFlag() {
        AppLauncher.launchApp(app, resetAuth: true)

        XCTAssertTrue(
            element("auth.signIn.root").waitForExistence(timeout: 30),
            "Expected signed-out launch to show SignInScreen root."
        )

        // Wait briefly so the entry view has a chance to render.
        _ = element("auth.signIn.continueWithEmail").waitForExistence(timeout: 5)

        XCTAssertFalse(
            element("auth.signIn.e2eSignIn").exists,
            "Expected the E2E sign-in button to be hidden without the E2E launch flag."
        )
    }

    private func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }
}
