import XCTest

@MainActor
final class E2EBypassConvexJWTTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
    }

    override func tearDownWithError() throws {
        app.terminate()
        app = nil
    }

    /// Tests the E2E bypass auth path: launching with `-LaneShadowE2EBypassAuth` must
    /// perform silent sign-in using CLERK_TEST_EMAIL and CLERK_TEST_PASSWORD from
    /// environment, establish a real Convex JWT, and land the user at the MapApp
    /// authenticated idle screen.
    func testE2EBypassAuthAuthenticatesAndReachesMapApp() {
        // Launch with both -LaneShadowE2EBypassAuth (new) and -LaneShadowUITestResetAuth
        // (existing, to ensure clean auth state before the bypass)
        AppLauncher.launchApp(app, resetAuth: true, e2eBypassAuth: true)

        // Wait for MapApp to render (idle screen identifier).
        // The MapApp unified screen renders when authenticated and appRoute == .home.
        let idleScreenElement = element(LSIds.idleScreen)
        XCTAssertTrue(
            idleScreenElement.waitForExistence(timeout: 60),
            "Expected E2E bypass auth to reach MapApp idle screen (idlescreen identifier)."
        )

        // Prove that a real Convex JWT was established: the top bar should render
        // with rider profile state (greeting, meta, etc.) that comes from Convex
        // subscriptions. LSTopBar only renders in authenticated state and requires
        // a valid JWT to query Convex.
        let topBarElement = element(LSIds.topBar)
        XCTAssertTrue(
            topBarElement.waitForExistence(timeout: 30),
            "Expected top bar (requiring authenticated Convex queries) to be present after bypass auth."
        )

        // Additional proof: the chat input should be visible on the idle screen.
        // This requires full authentication and idle state composition.
        let chatInputElement = element(LSIds.chatInput)
        XCTAssertTrue(
            chatInputElement.waitForExistence(timeout: 10),
            "Expected chat input (idle screen component) to be present after bypass auth."
        )
    }

    private func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }
}
