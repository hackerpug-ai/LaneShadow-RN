import XCTest

/// Design review capture helpers for XCUITest screenshot harness.
///
/// Provides deterministic environment setup and named screenshot capture
/// for design review pipeline. All attachments use `.keepAlways` lifetime
/// and follow the naming convention `{screen}.{state}.{action}`.
@MainActor
enum DesignReviewHelpers {
    /// Captures a screenshot with a deterministic name format.
    ///
    /// - Parameters:
    ///   - screen: The screen identifier (e.g., "auth-screen", "idle-screen")
    ///   - state: The state identifier (e.g., "entry", "email-entry", "dark")
    ///   - action: The action identifier (e.g., "load", "submit", "error")
    ///   - app: The XCUIApplication instance to capture from
    ///
    /// - Returns: An XCTAttachment with the screenshot, named `{screen}.{state}.{action}`
    ///            and `.keepAlways` lifetime for preservation in .xcresult bundles.
    static func captureScreen(
        screen: String,
        state: String,
        action: String,
        app: XCUIApplication
    ) -> XCTAttachment {
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        let name = "\(screen).\(state).\(action)"
        attachment.name = name
        attachment.lifetime = .keepAlways
        return attachment
    }

    /// Captures a specific element with the standard design-review name format.
    static func captureElement(
        screen: String,
        state: String,
        action: String,
        element: XCUIElement
    ) -> XCTAttachment {
        let screenshot = element.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = "\(screen).\(state).\(action)"
        attachment.lifetime = .keepAlways
        return attachment
    }

    /// Waits for the planning-screen scaffold to fully render, then captures it.
    static func capturePlanningScreen(
        app: XCUIApplication,
        state: String,
        theme: String
    ) -> XCTAttachment {
        let planningScreen = app.descendants(matching: .any)
            .matching(identifier: LSIds.planningScreen)
            .firstMatch

        XCTAssertTrue(
            planningScreen.waitForExistence(timeout: 10),
            "\(LSIds.planningScreen) must be present on planning-screen \(state).\(theme)"
        )

        return captureElement(
            screen: "planning-screen",
            state: state,
            action: theme,
            element: planningScreen
        )
    }

    /// Sets up deterministic environment for design review captures.
    ///
    /// Disables animations to reduce flakiness and freezes locale/timezone
    /// to ensure consistent screenshot output across test runs.
    ///
    /// - Parameters:
    ///   - app: The XCUIApplication instance to configure
    ///   - colorScheme: Optional color scheme override ("light" or "dark")
    static func setupDeterminismEnvironment(app: XCUIApplication, colorScheme: String? = nil) {
        // Disable animations for deterministic screenshots
        app.launchArguments += [
            "-AppleAnimationDuration", "0",
            "-UIViewAnimationsEnabled", "0",
        ]

        // Freeze locale to en_US for consistent text rendering
        app.launchEnvironment["APPLELOCALE"] = "en_US"
        app.launchEnvironment["APPLELANGUAGES"] = "en_US"

        // Freeze timezone to PST for consistent time display
        app.launchEnvironment["TZ"] = "America/Los_Angeles"

        // Set color scheme if specified
        if let scheme = colorScheme {
            app.launchArguments += ["-LaneShadowUITestColorScheme", scheme]
        }
    }
}
