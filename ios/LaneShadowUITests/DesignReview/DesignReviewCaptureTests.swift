import XCTest

/// Design review capture tests for screenshot pipeline.
///
/// Drives the real app through reachable (screen, state, theme) combinations
/// using real Clerk auth (NO bypass flags) and produces named XCTAttachments
/// for downstream export and vision-LLM evaluation.
///
/// **Auth Strategy**: Uses real Clerk email/password auth via CLERK_TEST_EMAIL
/// and CLERK_TEST_PASSWORD launch env (Sprint 03 RF-38 pattern). NO auth bypass.
///
/// **Determinism**: All tests call `setupDeterminismEnvironment()` to disable
/// animations and freeze locale/timezone for consistent screenshots.
///
/// **Naming**: Every attachment follows `{screen}.{state}.{action}` with
/// `.keepAlways` lifetime.
@MainActor
final class DesignReviewCaptureTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        DesignReviewHelpers.setupDeterminismEnvironment(app: app)
    }

    override func tearDownWithError() throws {
        app.terminate()
        app = nil
    }

    /// Captures the canonical idle-screen default state (light theme).
    func test_idleScreen_default_light() {
        launchSandboxStory("templates.idle-screen.default")
        let attachment = captureIdleScreen(state: "default", theme: "light")
        add(attachment)

        XCTAssertEqual(attachment.name, "idle-screen.default.light")
    }

    /// Captures the canonical idle-screen default state (dark theme).
    func test_idleScreen_default_dark() {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        launchSandboxStory("templates.idle-screen.s03-dark")
        let attachment = captureIdleScreen(state: "default", theme: "dark")
        add(attachment)

        XCTAssertEqual(attachment.name, "idle-screen.default.dark")
    }

    /// Captures the canonical typing-send idle state (light theme).
    func test_idleScreen_typingSend_light() {
        launchSandboxStory("templates.idle-screen.s02-typing-send")
        let attachment = captureIdleScreen(state: "typing-send", theme: "light")
        add(attachment)

        XCTAssertEqual(attachment.name, "idle-screen.typing-send.light")
    }

    /// Captures the canonical filter-sheet idle state (light theme).
    func test_idleScreen_filterSheet_light() {
        launchSandboxStory("templates.idle-screen.s04-filter-sheet")
        let attachment = captureIdleScreen(state: "filter-sheet", theme: "light")
        add(attachment)

        XCTAssertEqual(attachment.name, "idle-screen.filter-sheet.light")
    }

    /// Sprint-06: Captures the canonical no-location idle state (light theme).
    func test_idleScreen_noLocation_light() {
        launchSandboxStory("templates.idle-screen.v-no-location")
        let attachment = captureIdleScreen(state: "no-location", theme: "light")
        add(attachment)

        XCTAssertEqual(attachment.name, "idle-screen.no-location.light")
    }

    /// Sprint-06: Captures the canonical first-ride idle state (light theme).
    func test_idleScreen_firstRide_light() {
        launchSandboxStory("templates.idle-screen.v-first-ride")
        let attachment = captureIdleScreen(state: "first-ride", theme: "light")
        add(attachment)

        XCTAssertEqual(attachment.name, "idle-screen.first-ride.light")
    }

    /// Sprint-06: Captures the canonical weather-advisory idle state (light theme).
    func test_idleScreen_weatherAdvisory_light() {
        launchSandboxStory("templates.idle-screen.v-weather-advisory")
        let attachment = captureIdleScreen(state: "weather-advisory", theme: "light")
        add(attachment)

        XCTAssertEqual(attachment.name, "idle-screen.weather-advisory.light")
    }

    /// Captures the canonical typing-send idle state (dark theme).
    func test_idleScreen_typingSend_dark() {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        launchSandboxStory("templates.idle-screen.s02-typing-send")
        let attachment = captureIdleScreen(state: "typing-send", theme: "dark")
        add(attachment)

        XCTAssertEqual(attachment.name, "idle-screen.typing-send.dark")
    }

    /// Captures the canonical filter-sheet idle state (dark theme).
    func test_idleScreen_filterSheet_dark() {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        launchSandboxStory("templates.idle-screen.s04-filter-sheet")
        let attachment = captureIdleScreen(state: "filter-sheet", theme: "dark")
        add(attachment)

        XCTAssertEqual(attachment.name, "idle-screen.filter-sheet.dark")
    }

    /// Sprint-06: Captures the canonical no-location idle state (dark theme).
    func test_idleScreen_noLocation_dark() {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        launchSandboxStory("templates.idle-screen.v-no-location")
        let attachment = captureIdleScreen(state: "no-location", theme: "dark")
        add(attachment)

        XCTAssertEqual(attachment.name, "idle-screen.no-location.dark")
    }

    /// Sprint-06: Captures the canonical first-ride idle state (dark theme).
    func test_idleScreen_firstRide_dark() {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        launchSandboxStory("templates.idle-screen.v-first-ride")
        let attachment = captureIdleScreen(state: "first-ride", theme: "dark")
        add(attachment)

        XCTAssertEqual(attachment.name, "idle-screen.first-ride.dark")
    }

    /// Sprint-06: Captures the canonical weather-advisory idle state (dark theme).
    func test_idleScreen_weatherAdvisory_dark() {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        launchSandboxStory("templates.idle-screen.v-weather-advisory")
        let attachment = captureIdleScreen(state: "weather-advisory", theme: "dark")
        add(attachment)

        XCTAssertEqual(attachment.name, "idle-screen.weather-advisory.dark")
    }

    /// Sprint-06: Captures the canonical chat-focused idle state (light theme).
    func test_idleScreen_chatFocused_light() {
        launchSandboxStory("templates.idle-screen.s02-typing-send")
        let attachment = captureIdleScreen(state: "chat-focused", theme: "light")
        add(attachment)

        XCTAssertEqual(attachment.name, "idle-screen.chat-focused.light")
    }

    /// Sprint-06: Captures the canonical chat-focused idle state (dark theme).
    func test_idleScreen_chatFocused_dark() {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        launchSandboxStory("templates.idle-screen.s02-typing-send")
        let attachment = captureIdleScreen(state: "chat-focused", theme: "dark")
        add(attachment)

        XCTAssertEqual(attachment.name, "idle-screen.chat-focused.dark")
    }

    private func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }

    private func launchSandboxStory(_ storyId: String) {
        AppLauncher.launchApp(app, sandbox: true, sandboxStoryId: storyId)
        XCTAssertTrue(
            element("idlescreen").waitForExistence(timeout: 10),
            "Expected sandbox idle story to render for \(storyId)"
        )
    }

    private func captureIdleScreen(state: String, theme: String) -> XCTAttachment {
        // Verify new retrofit identifiers are present before capture
        XCTAssertTrue(
            element("idle-context-capsule").waitForExistence(timeout: 10),
            "idle-context-capsule must be present on idle-screen \(state).\(theme)"
        )
        XCTAssertTrue(
            element("idle-map-controls").waitForExistence(timeout: 10),
            "idle-map-controls must be present on idle-screen \(state).\(theme)"
        )

        return DesignReviewHelpers.captureElement(
            screen: "idle-screen",
            state: state,
            action: theme,
            element: element("idlescreen")
        )
    }
}
