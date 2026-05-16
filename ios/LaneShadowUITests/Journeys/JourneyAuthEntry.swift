import XCTest

/// Journey 1 — Auth Entry view smoke check.
///
/// Per scope pivot 2026-05-16: Clerk owns the sign-in UI as a managed popup,
/// so this journey only verifies what we own — that the auth view renders
/// with the expected entry points (sign-in trigger, debug bypass button).
///
/// Sign-up via Mailosaur and session restoration are intentionally NOT
/// included here. The existing `AuthRegistrationE2ETests` still covers
/// sign-up; that file remains in place until its content can be folded in
/// after Mailosaur verification is independently confirmed.
///
/// Phase 0 bypass infrastructure already covers "land at MapApp" for
/// downstream journeys (see `E2EBypassAuthTests`).
@MainActor
final class JourneyAuthEntry: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
    }

    override func tearDownWithError() throws {
        app.terminate()
        app = nil
    }

    /// Step01: Auth screen renders with entry points.
    /// Verifies: sign-in entry and debug bypass button are visible.
    func step01_authScreenRendersWithEntryPoints() {
        AppLauncher.launchApp(app, resetAuth: true, e2eSignIn: true)

        XCTAssertTrue(
            element("auth.signIn.root").waitForExistence(timeout: 30),
            "Expected signed-out launch to show SignInScreen root."
        )

        XCTAssertTrue(
            element("auth.signIn.continueWithEmail").waitForExistence(timeout: 5),
            "Expected Continue with Email button to be visible."
        )

        XCTAssertTrue(
            element("auth.signIn.e2eSignIn").waitForExistence(timeout: 5),
            "Expected E2E sign-in button to be visible in DEBUG mode."
        )

        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "auth-01-entry"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }
}
