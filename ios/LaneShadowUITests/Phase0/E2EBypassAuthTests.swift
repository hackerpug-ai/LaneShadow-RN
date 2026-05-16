import XCTest

/// Phase 0 proof-of-correctness: `-LaneShadowE2EBypassAuth` must establish a
/// real Clerk session (no UI dance) and land the user at the MapApp screen.
///
/// Out of scope (intentionally): verifying Convex queries succeed after bypass.
/// Auth UI itself is owned by Clerk and not our test surface; downstream Convex
/// data assertions belong to Journey 2 (MapApp Core Loop), not Phase 0.
@MainActor
final class E2EBypassAuthTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
    }

    override func tearDownWithError() throws {
        app.terminate()
        app = nil
    }

    /// Bypass must skip the auth UI entirely and render MapApp's idle state.
    func testE2EBypassAuthReachesMapApp() {
        AppLauncher.launchApp(app, resetAuth: true, e2eBypassAuth: true)

        let idleScreenElement = element(LSIds.idleScreen)
        XCTAssertTrue(
            idleScreenElement.waitForExistence(timeout: 60),
            "Expected E2E bypass auth to render MapApp idle screen (idlescreen identifier)."
        )

        // Auth screen must NOT be present — bypass replaces it, not stacks above it.
        let authRoot = element("auth.signIn.root")
        XCTAssertFalse(
            authRoot.exists,
            "Auth screen must not be visible after E2E bypass."
        )
    }

    private func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }
}
