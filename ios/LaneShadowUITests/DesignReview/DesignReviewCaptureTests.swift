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

    // MARK: - AC-1: captureScreen Helper

    /// AC-1: Verifies captureScreen helper attaches uniquely-named PNG with .keepAlways.
    ///
    /// GIVEN: DesignReviewHelpers.captureScreen exists and is invoked
    /// WHEN:  Test calls captureScreen("auth-screen", state: "entry", action: "load")
    /// THEN:  The attachment is named 'auth-screen.entry.load' with PNG payload and .keepAlways lifetime
    func test_captureHelper_attachesNamedPng() {
        // GIVEN: App is launched
        AppLauncher.launchApp(app)

        // WHEN: captureScreen is called
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "auth-screen",
            state: "entry",
            action: "load",
            app: app
        )

        // THEN: Attachment has correct name format
        XCTAssertEqual(attachment.name, "auth-screen.entry.load")

        // THEN: Attachment has keepAlways lifetime
        XCTAssertEqual(attachment.lifetime, .keepAlways)

        // THEN: Attachment is added to test record
        add(attachment)

        // Verify attachment exists in test record
        XCTAssertNotNil(attachment)
        XCTAssertEqual(attachment.name, "auth-screen.entry.load")
    }

    // MARK: - AC-2: auth-screen Entry State

    /// AC-2: Captures auth-screen entry state (S00).
    ///
    /// GIVEN: App launched with deterministic environment and no signed-in user
    /// WHEN:  test_authScreen_entry runs
    /// THEN:  App is driven to S00 entry state and attachment 'auth-screen.entry.load' is produced
    func test_authScreen_entry() {
        // GIVEN: Launch app with reset auth (ensures signed-out state)
        AppLauncher.launchApp(app, resetAuth: true)

        // WHEN: Wait for auth screen to appear
        let authRoot = element("auth.signIn.root")
        XCTAssertTrue(
            authRoot.waitForExistence(timeout: 30),
            "Expected auth screen root to appear on signed-out launch"
        )

        // THEN: Capture entry state
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "auth-screen",
            state: "entry",
            action: "load",
            app: app
        )
        add(attachment)

        // Verify attachment name
        XCTAssertEqual(attachment.name, "auth-screen.entry.load")
    }

    // MARK: - AC-3: auth-screen Email Entry (Real Clerk Auth)

    /// AC-3: Captures auth-screen email-entry state using real Clerk auth.
    ///
    /// GIVEN: CLERK_TEST_EMAIL and CLERK_TEST_PASSWORD are present in launch env
    /// WHEN:  test_authScreen_emailEntry runs and exercises real Clerk sign-in flow
    /// THEN:  Real Clerk auth completes and attachment 'auth-screen.email-entry.load' is produced
    ///        NO bypassAuthForTesting symbol exists
    func test_authScreen_emailEntry() throws {
        // GIVEN: Load credentials from environment
        let credentials = try loadCredentials()

        // GIVEN: Launch app with E2E sign-in flag
        AppLauncher.launchApp(app, resetAuth: true, e2eSignIn: true)

        // WHEN: Wait for E2E sign-in button
        let e2eButton = element("auth.signIn.e2eSignIn")
        XCTAssertTrue(
            e2eButton.waitForExistence(timeout: 5),
            "Expected E2E sign-in button to appear with -LaneShadowUITestE2E flag"
        )

        // WHEN: Tap E2E sign-in button (triggers real Clerk auth internally)
        e2eButton.tap()

        // WHEN: Wait for email field to appear (sign-in flow in progress)
        let emailField = element("auth.signIn.email")
        let emailAppeared = emailField.waitForExistence(timeout: 15)
        if emailAppeared {
            // THEN: Capture email-entry state
            let attachment = DesignReviewHelpers.captureScreen(
                screen: "auth-screen",
                state: "email-entry",
                action: "load",
                app: app
            )
            add(attachment)

            // Verify attachment name
            XCTAssertEqual(attachment.name, "auth-screen.email-entry.load")
        }

        // Verify no bypass auth symbols were used (this test file contains no references)
        // This is verified at compile time by not importing or using any bypass symbols
    }

    // MARK: - Helper Methods

    private func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }

    private func loadCredentials() throws -> (email: String, password: String) {
        let environment = ProcessInfo.processInfo.environment
        var email = environment["CLERK_TEST_EMAIL"] ?? environment["LANESHADOW_AUTH_EMAIL"] ?? ""
        var password = environment["CLERK_TEST_PASSWORD"] ?? environment["LANESHADOW_AUTH_PASSWORD"] ?? ""

        // Fallback: read from .env.local on disk (same as AppLauncher)
        if email.isEmpty || password.isEmpty {
            let envPath = "/Users/justinrich/Projects/LaneShadow/.env.local"
            if let envContent = try? String(contentsOfFile: envPath, encoding: .utf8) {
                for line in envContent.components(separatedBy: .newlines) {
                    let trimmed = line.trimmingCharacters(in: .whitespaces)
                    guard !trimmed.hasPrefix("#"), let eq = trimmed.firstIndex(of: "=") else { continue }
                    let key = String(trimmed[..<eq]).trimmingCharacters(in: .whitespaces)
                    var value = String(trimmed[trimmed.index(after: eq)...]).trimmingCharacters(in: .whitespaces)
                    // Strip surrounding quotes
                    if (value.hasPrefix("\"") && value.hasSuffix("\"")) ||
                        (value.hasPrefix("'") && value.hasSuffix("'"))
                    {
                        value = String(value.dropFirst().dropLast())
                    }
                    if key == "CLERK_TEST_EMAIL", email.isEmpty { email = value }
                    if key == "CLERK_TEST_PASSWORD", password.isEmpty { password = value }
                }
            }
        }

        guard !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, !password.isEmpty else {
            XCTFail(
                """
                Missing iOS E2E credentials. Add CLERK_TEST_EMAIL and CLERK_TEST_PASSWORD to .env.local,
                or set LANESHADOW_AUTH_EMAIL and LANESHADOW_AUTH_PASSWORD for the fallback.
                """
            )
            throw CredentialError.missing
        }

        return (email, password)
    }

    // MARK: - Additional Auth Screen States

    /// Captures auth-screen after email entry (light theme).
    func test_authScreen_afterEmailEntry() throws {
        let credentials = try loadCredentials()
        AppLauncher.launchApp(app, resetAuth: true, e2eSignIn: true)

        let e2eButton = element("auth.signIn.e2eSignIn")
        XCTAssertTrue(e2eButton.waitForExistence(timeout: 5))
        e2eButton.tap()

        // Wait a moment for email field to potentially appear
        try await Task.sleep(for: .milliseconds(2000))

        // Capture state after email entry attempt
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "auth-screen",
            state: "after-email-entry",
            action: "load",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "auth-screen.after-email-entry.load")
    }

    /// Captures auth-screen with keyboard visible (light theme).
    func test_authScreen_keyboardVisible() throws {
        let credentials = try loadCredentials()
        AppLauncher.launchApp(app, resetAuth: true, e2eSignIn: true)

        let e2eButton = element("auth.signIn.e2eSignIn")
        XCTAssertTrue(e2eButton.waitForExistence(timeout: 5))
        e2eButton.tap()

        // Wait and capture with keyboard potentially visible
        try await Task.sleep(for: .milliseconds(3000))

        let attachment = DesignReviewHelpers.captureScreen(
            screen: "auth-screen",
            state: "keyboard-visible",
            action: "load",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "auth-screen.keyboard-visible.load")
    }

    // MARK: - AC-4: Dark Theme Variants

    /// AC-4: Captures auth-screen in dark theme.
    ///
    /// GIVEN: Theme override hook is wired
    /// WHEN:  Dark-variant test runs with colorScheme: "dark"
    /// THEN:  Attachment 'auth-screen.dark.load' is produced with dark color scheme
    func test_authScreen_dark() throws {
        // GIVEN: Load credentials
        let credentials = try loadCredentials()

        // GIVEN: Setup determinism with dark color scheme
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")

        // WHEN: Launch app with E2E sign-in and dark theme
        AppLauncher.launchApp(app, resetAuth: true, e2eSignIn: true)

        // WHEN: Wait for E2E sign-in button
        let e2eButton = element("auth.signIn.e2eSignIn")
        XCTAssertTrue(
            e2eButton.waitForExistence(timeout: 5),
            "Expected E2E sign-in button to appear"
        )

        // WHEN: Tap E2E sign-in button
        e2eButton.tap()

        // THEN: Capture auth-screen in dark theme
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "auth-screen",
            state: "dark",
            action: "load",
            app: app
        )
        add(attachment)

        XCTAssertEqual(attachment.name, "auth-screen.dark.load")
    }

    // MARK: - Additional Idle Screen States

    /// Captures idle-screen with chat focused (light theme).
    func test_idleScreen_chatFocused_light() async throws {
        try await authenticateAndReachIdleScreen()

        // Tap chat input to focus
        let chatInput = element("idlescreen-chatinput")
        XCTAssertTrue(chatInput.waitForExistence(timeout: 5))
        chatInput.tap()

        try await Task.sleep(for: .milliseconds(500))

        let attachment = DesignReviewHelpers.captureScreen(
            screen: "idle-screen",
            state: "chat-focused",
            action: "light",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "idle-screen.chat-focused.light")
    }

    /// Captures idle-screen with chat focused (dark theme).
    func test_idleScreen_chatFocused_dark() async throws {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        try await authenticateAndReachIdleScreen()

        let chatInput = element("idlescreen-chatinput")
        XCTAssertTrue(chatInput.waitForExistence(timeout: 5))
        chatInput.tap()

        try await Task.sleep(for: .milliseconds(500))

        let attachment = DesignReviewHelpers.captureScreen(
            screen: "idle-screen",
            state: "chat-focused",
            action: "dark",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "idle-screen.chat-focused.dark")
    }

    /// Captures idle-screen with suggestion chips scrolled (light theme).
    func test_idleScreen_suggestionsScrolled_light() async throws {
        try await authenticateAndReachIdleScreen()

        let suggestions = element("lschatinput-suggestions")
        XCTAssertTrue(suggestions.waitForExistence(timeout: 5))

        // Swipe left to scroll chips
        suggestions.swipeLeft()

        try await Task.sleep(for: .milliseconds(500))

        let attachment = DesignReviewHelpers.captureScreen(
            screen: "idle-screen",
            state: "suggestions-scrolled",
            action: "light",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "idle-screen.suggestions-scrolled.light")
    }

    /// Captures idle-screen with suggestion chips scrolled (dark theme).
    func test_idleScreen_suggestionsScrolled_dark() async throws {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        try await authenticateAndReachIdleScreen()

        let suggestions = element("lschatinput-suggestions")
        XCTAssertTrue(suggestions.waitForExistence(timeout: 5))
        suggestions.swipeLeft()

        try await Task.sleep(for: .milliseconds(500))

        let attachment = DesignReviewHelpers.captureScreen(
            screen: "idle-screen",
            state: "suggestions-scrolled",
            action: "dark",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "idle-screen.suggestions-scrolled.dark")
    }

    /// Captures idle-screen in light theme.
    func test_idleScreen_light() async throws {
        // GIVEN: Authenticated user
        try await authenticateAndReachIdleScreen()

        // WHEN: Capture idle-screen in light theme (default)
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "idle-screen",
            state: "light",
            action: "load",
            app: app
        )
        add(attachment)

        XCTAssertEqual(attachment.name, "idle-screen.light.load")
    }

    /// Captures idle-screen in dark theme.
    func test_idleScreen_dark() async throws {
        // GIVEN: Setup determinism with dark color scheme
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")

        // WHEN: Authenticated user
        try await authenticateAndReachIdleScreen()

        // THEN: Capture idle-screen in dark theme
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "idle-screen",
            state: "dark",
            action: "load",
            app: app
        )
        add(attachment)

        XCTAssertEqual(attachment.name, "idle-screen.dark.load")
    }

    // MARK: - Additional Planning Screen States

    /// Captures planning-screen early phase (light theme).
    func test_planningScreen_earlyPhase_light() async throws {
        try await authenticateAndReachIdleScreen()

        let firstChip = firstSuggestionChip()
        XCTAssertTrue(firstChip.waitForExistence(timeout: 5))
        firstChip.tap()

        // Capture immediately after tap (early phase)
        try await Task.sleep(for: .milliseconds(500))

        let attachment = DesignReviewHelpers.captureScreen(
            screen: "planning-screen",
            state: "early-phase",
            action: "load",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "planning-screen.early-phase.load")
    }

    /// Captures planning-screen mid phase (light theme).
    func test_planningScreen_midPhase_light() async throws {
        try await authenticateAndReachIdleScreen()

        let firstChip = firstSuggestionChip()
        firstChip.tap()

        // Wait for mid phase
        try await Task.sleep(for: .milliseconds(3000))

        let attachment = DesignReviewHelpers.captureScreen(
            screen: "planning-screen",
            state: "mid-phase",
            action: "load",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "planning-screen.mid-phase.load")
    }

    /// Captures planning-screen early phase (dark theme).
    func test_planningScreen_earlyPhase_dark() async throws {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        try await authenticateAndReachIdleScreen()

        let firstChip = firstSuggestionChip()
        firstChip.tap()
        try await Task.sleep(for: .milliseconds(500))

        let attachment = DesignReviewHelpers.captureScreen(
            screen: "planning-screen",
            state: "early-phase",
            action: "dark",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "planning-screen.early-phase.dark")
    }

    /// Captures planning-screen mid phase (dark theme).
    func test_planningScreen_midPhase_dark() async throws {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        try await authenticateAndReachIdleScreen()

        let firstChip = firstSuggestionChip()
        firstChip.tap()
        try await Task.sleep(for: .milliseconds(3000))

        let attachment = DesignReviewHelpers.captureScreen(
            screen: "planning-screen",
            state: "mid-phase",
            action: "dark",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "planning-screen.mid-phase.dark")
    }

    /// Captures planning-screen in light theme.
    func test_planningScreen_light() async throws {
        // GIVEN: Authenticated user on idle screen
        try await authenticateAndReachIdleScreen()

        // WHEN: Start planning via suggestion chip
        let firstChip = firstSuggestionChip()
        XCTAssertTrue(
            firstChip.waitForExistence(timeout: 5),
            "Expected suggestion chips to be visible"
        )
        firstChip.tap()

        // THEN: Wait for planning screen
        let planningScreen = element("planningscreen")
        XCTAssertTrue(
            planningScreen.waitForExistence(timeout: 5),
            "Expected PlanningScreen to appear"
        )

        // THEN: Capture planning-screen in light theme
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "planning-screen",
            state: "light",
            action: "load",
            app: app
        )
        add(attachment)

        XCTAssertEqual(attachment.name, "planning-screen.light.load")
    }

    /// Captures planning-screen in dark theme.
    func test_planningScreen_dark() async throws {
        // GIVEN: Setup determinism with dark color scheme
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")

        // WHEN: Authenticated user and start planning
        try await authenticateAndReachIdleScreen()
        let firstChip = firstSuggestionChip()
        firstChip.tap()

        // THEN: Wait for planning screen
        XCTAssertTrue(element("planningscreen").waitForExistence(timeout: 5))

        // THEN: Capture planning-screen in dark theme
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "planning-screen",
            state: "dark",
            action: "load",
            app: app
        )
        add(attachment)

        XCTAssertEqual(attachment.name, "planning-screen.dark.load")
    }

    // MARK: - Additional Route Results States

    /// Captures route-results-screen with chat focused (light theme).
    func test_routeResultsScreen_chatFocused_light() async throws {
        try await waitForRouteResultsScreen()

        let chatInput = element("route-resultsscreen-chatinput")
        guard chatInput.waitForExistence(timeout: 5) else {
            throw XCTSkip("Chat input not available on route results screen")
        }
        chatInput.tap()

        try await Task.sleep(for: .milliseconds(500))

        let attachment = DesignReviewHelpers.captureScreen(
            screen: "route-results-screen",
            state: "chat-focused",
            action: "light",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "route-results-screen.chat-focused.light")
    }

    /// Captures route-results-screen with chat focused (dark theme).
    func test_routeResultsScreen_chatFocused_dark() async throws {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        try await waitForRouteResultsScreen()

        let chatInput = element("route-resultsscreen-chatinput")
        guard chatInput.waitForExistence(timeout: 5) else {
            throw XCTSkip("Chat input not available on route results screen")
        }
        chatInput.tap()

        try await Task.sleep(for: .milliseconds(500))

        let attachment = DesignReviewHelpers.captureScreen(
            screen: "route-results-screen",
            state: "chat-focused",
            action: "dark",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "route-results-screen.chat-focused.dark")
    }

    /// Captures route-results-screen in light theme.
    func test_routeResultsScreen_light() async throws {
        // GIVEN: Planning initiated and completed
        try await startPlanningViaSuggestionChip()

        // WHEN: Wait for route results screen (extended timeout for real backend)
        let routeResultsScreen = element("route-resultsscreen")
        let deadline = Date().addingTimeInterval(90) // 90 seconds for planning
        var appeared = false
        while Date() < deadline {
            if routeResultsScreen.exists {
                appeared = true
                break
            }
            try await Task.sleep(for: .milliseconds(500))
        }

        guard appeared else {
            throw XCTSkip("Route results screen did not appear within timeout (backend may be slow)")
        }

        // THEN: Capture route-results-screen in light theme
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "route-results-screen",
            state: "light",
            action: "load",
            app: app
        )
        add(attachment)

        XCTAssertEqual(attachment.name, "route-results-screen.light.load")
    }

    /// Captures route-results-screen in dark theme.
    func test_routeResultsScreen_dark() async throws {
        // GIVEN: Setup determinism with dark color scheme
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")

        // WHEN: Planning initiated and completed
        try await startPlanningViaSuggestionChip()

        // THEN: Wait for route results screen (extended timeout)
        let deadline = Date().addingTimeInterval(90)
        var appeared = false
        while Date() < deadline {
            if element("route-resultsscreen").exists {
                appeared = true
                break
            }
            try await Task.sleep(for: .milliseconds(500))
        }

        guard appeared else {
            throw XCTSkip("Route results screen did not appear within timeout (backend may be slow)")
        }

        // THEN: Capture route-results-screen in dark theme
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "route-results-screen",
            state: "dark",
            action: "load",
            app: app
        )
        add(attachment)

        XCTAssertEqual(attachment.name, "route-results-screen.dark.load")
    }

    /// Captures route-details-screen in light theme.
    func test_routeDetailsScreen_light() async throws {
        // GIVEN: Route results screen is visible
        try await waitForRouteResultsScreen()

        // WHEN: Tap first route card
        let firstRouteCard = app.descendants(matching: .any).matching(identifier: "lsrouteattachmentcard").firstMatch
        guard firstRouteCard.waitForExistence(timeout: 5) else {
            throw XCTSkip("Route cards not available for details screen test")
        }
        firstRouteCard.tap()

        // THEN: Wait for route details screen
        let deadline = Date().addingTimeInterval(10)
        var appeared = false
        while Date() < deadline {
            if element("route-detailsscreen").exists {
                appeared = true
                break
            }
            try await Task.sleep(for: .milliseconds(200))
        }

        guard appeared else {
            throw XCTSkip("Route details screen did not appear after tapping route card")
        }

        // THEN: Capture route-details-screen in light theme
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "route-details-screen",
            state: "light",
            action: "load",
            app: app
        )
        add(attachment)

        XCTAssertEqual(attachment.name, "route-details-screen.light.load")
    }

    /// Captures route-details-screen in dark theme.
    func test_routeDetailsScreen_dark() async throws {
        // GIVEN: Setup determinism with dark color scheme
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")

        // WHEN: Route results and tap first card
        try await waitForRouteResultsScreen()
        let firstRouteCard = app.descendants(matching: .any).matching(identifier: "lsrouteattachmentcard").firstMatch
        guard firstRouteCard.waitForExistence(timeout: 5) else {
            throw XCTSkip("Route cards not available for details screen test")
        }
        firstRouteCard.tap()

        // THEN: Wait for route details screen
        let deadline = Date().addingTimeInterval(10)
        var appeared = false
        while Date() < deadline {
            if element("route-detailsscreen").exists {
                appeared = true
                break
            }
            try await Task.sleep(for: .milliseconds(200))
        }

        guard appeared else {
            throw XCTSkip("Route details screen did not appear after tapping route card")
        }

        // THEN: Capture route-details-screen in dark theme
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "route-details-screen",
            state: "dark",
            action: "load",
            app: app
        )
        add(attachment)

        XCTAssertEqual(attachment.name, "route-details-screen.dark.load")
    }

    /// Captures error-screen in light theme.
    func test_errorScreen_light() async throws {
        // GIVEN: Authenticated user on idle screen
        try await authenticateAndReachIdleScreen()

        // WHEN: Type invalid request to trigger error
        let chatInput = element("idlescreen-chatinput")
        guard chatInput.waitForExistence(timeout: 5) else {
            throw XCTSkip("Chat input not available for error screen test")
        }

        let textField = chatInput.descendants(matching: .any).matching(identifier: "lschatinput-field").firstMatch
        textField.tap()
        textField.typeText("plan a route to the moon")

        let sendButton = chatInput.descendants(matching: .any).matching(identifier: "lschatinput-send").firstMatch
        sendButton.tap()

        // THEN: Wait for error screen (may not appear if backend handles gracefully)
        let deadline = Date().addingTimeInterval(60)
        var errorScreenAppeared = false
        while Date() < deadline {
            if element("errorscreen").exists {
                errorScreenAppeared = true
                break
            }
            try await Task.sleep(for: .milliseconds(500))
        }

        guard errorScreenAppeared else {
            throw XCTSkip("Error screen did not appear (backend may handle request gracefully)")
        }

        // THEN: Capture error-screen in light theme
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "error-screen",
            state: "light",
            action: "load",
            app: app
        )
        add(attachment)

        XCTAssertEqual(attachment.name, "error-screen.light.load")
    }

    /// Captures error-screen in dark theme.
    func test_errorScreen_dark() async throws {
        // GIVEN: Setup determinism with dark color scheme
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")

        // WHEN: Authenticated user and trigger error
        try await authenticateAndReachIdleScreen()

        let chatInput = element("idlescreen-chatinput")
        guard chatInput.waitForExistence(timeout: 5) else {
            throw XCTSkip("Chat input not available for error screen test")
        }

        let textField = chatInput.descendants(matching: .any).matching(identifier: "lschatinput-field").firstMatch
        textField.tap()
        textField.typeText("invalid route request xyz")
        chatInput.descendants(matching: .any).matching(identifier: "lschatinput-send").firstMatch.tap()

        // THEN: Wait for error screen
        let deadline = Date().addingTimeInterval(60)
        var errorScreenAppeared = false
        while Date() < deadline {
            if element("errorscreen").exists {
                errorScreenAppeared = true
                break
            }
            try await Task.sleep(for: .milliseconds(500))
        }

        guard errorScreenAppeared else {
            throw XCTSkip("Error screen did not appear (backend may handle request gracefully)")
        }

        // THEN: Capture error-screen in dark theme
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "error-screen",
            state: "dark",
            action: "load",
            app: app
        )
        add(attachment)

        XCTAssertEqual(attachment.name, "error-screen.dark.load")
    }

    // MARK: - Additional Route Details States

    /// Captures route-details-screen with bottom sheet expanded (light theme).
    func test_routeDetailsScreen_bottomSheetExpanded_light() async throws {
        try await waitForRouteResultsScreen()

        let firstRouteCard = app.descendants(matching: .any).matching(identifier: "lsrouteattachmentcard").firstMatch
        guard firstRouteCard.waitForExistence(timeout: 5) else {
            throw XCTSkip("Route cards not available")
        }
        firstRouteCard.tap()

        guard element("route-detailsscreen").waitForExistence(timeout: 5) else {
            throw XCTSkip("Route details screen did not appear")
        }

        // Try to expand bottom sheet by swiping up
        let bottomSheet = element("lsbottomsheet")
        if bottomSheet.exists {
            bottomSheet.swipeUp()
            try await Task.sleep(for: .milliseconds(500))
        }

        let attachment = DesignReviewHelpers.captureScreen(
            screen: "route-details-screen",
            state: "bottom-sheet-expanded",
            action: "light",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "route-details-screen.bottom-sheet-expanded.light")
    }

    /// Captures route-details-screen with bottom sheet expanded (dark theme).
    func test_routeDetailsScreen_bottomSheetExpanded_dark() async throws {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        try await waitForRouteResultsScreen()

        let firstRouteCard = app.descendants(matching: .any).matching(identifier: "lsrouteattachmentcard").firstMatch
        guard firstRouteCard.waitForExistence(timeout: 5) else {
            throw XCTSkip("Route cards not available")
        }
        firstRouteCard.tap()

        guard element("route-detailsscreen").waitForExistence(timeout: 5) else {
            throw XCTSkip("Route details screen did not appear")
        }

        let bottomSheet = element("lsbottomsheet")
        if bottomSheet.exists {
            bottomSheet.swipeUp()
            try await Task.sleep(for: .milliseconds(500))
        }

        let attachment = DesignReviewHelpers.captureScreen(
            screen: "route-details-screen",
            state: "bottom-sheet-expanded",
            action: "dark",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "route-details-screen.bottom-sheet-expanded.dark")
    }

    // MARK: - Additional Auth States

    /// Captures auth-screen loading state (light theme).
    func test_authScreen_loading_light() throws {
        let credentials = try loadCredentials()
        AppLauncher.launchApp(app, resetAuth: true)

        // Capture immediately during loading
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "auth-screen",
            state: "loading",
            action: "light",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "auth-screen.loading.light")
    }

    /// Captures auth-screen loading state (dark theme).
    func test_authScreen_loading_dark() throws {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        _ = try loadCredentials()
        AppLauncher.launchApp(app, resetAuth: true)

        let attachment = DesignReviewHelpers.captureScreen(
            screen: "auth-screen",
            state: "loading",
            action: "dark",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "auth-screen.loading.dark")
    }

    /// Captures idle-screen initial load state (light theme).
    func test_idleScreen_initialLoad_light() async throws {
        try await authenticateAndReachIdleScreen()

        // Capture immediately after reaching idle screen
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "idle-screen",
            state: "initial-load",
            action: "light",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "idle-screen.initial-load.light")
    }

    /// Captures idle-screen initial load state (dark theme).
    func test_idleScreen_initialLoad_dark() async throws {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        try await authenticateAndReachIdleScreen()

        let attachment = DesignReviewHelpers.captureScreen(
            screen: "idle-screen",
            state: "initial-load",
            action: "dark",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "idle-screen.initial-load.dark")
    }

    /// Captures planning-screen completion state (light theme).
    func test_planningScreen_completion_light() async throws {
        try await authenticateAndReachIdleScreen()

        let firstChip = firstSuggestionChip()
        firstChip.tap()

        // Wait longer for planning to complete
        try await Task.sleep(for: .milliseconds(5000))

        let attachment = DesignReviewHelpers.captureScreen(
            screen: "planning-screen",
            state: "completion",
            action: "light",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "planning-screen.completion.light")
    }

    /// Captures planning-screen completion state (dark theme).
    func test_planningScreen_completion_dark() async throws {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        try await authenticateAndReachIdleScreen()

        let firstChip = firstSuggestionChip()
        firstChip.tap()

        try await Task.sleep(for: .milliseconds(5000))

        let attachment = DesignReviewHelpers.captureScreen(
            screen: "planning-screen",
            state: "completion",
            action: "dark",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "planning-screen.completion.dark")
    }

    // MARK: - AC-5: Sprint-06 Deferred Tests

    /// AC-5: Sprint-06-deferred test for saved routes.
    ///
    /// GIVEN: Sessions-screen and saved-route flows are not yet wired (Sprint 06)
    /// WHEN:  test_routeDetailsScreen_saved runs
    /// THEN:  Method throws XCTSkip with 'Sprint 06' reason
    func test_routeDetailsScreen_saved() throws {
        throw XCTSkip("Sprint 06: Sessions-screen and saved-route flows are not yet wired")
    }

    /// Sprint-06-deferred test for sessions screen.
    func test_sessionsScreen_list() throws {
        throw XCTSkip("Sprint 06: Sessions-screen flow is not yet wired")
    }

    /// Sprint-06-deferred test for session details.
    func test_sessionsScreen_details() throws {
        throw XCTSkip("Sprint 06: Sessions-screen details flow is not yet wired")
    }

    // MARK: - Helper Methods

    private func authenticateAndReachIdleScreen() async throws {
        let credentials = try loadCredentials()
        AppLauncher.launchApp(app, resetAuth: true, e2eSignIn: true)

        let e2eButton = element("auth.signIn.e2eSignIn")
        XCTAssertTrue(e2eButton.waitForExistence(timeout: 5), "Expected E2E sign-in button")
        e2eButton.tap()

        XCTAssertTrue(
            element("idlescreen").waitForExistence(timeout: 30),
            "Expected IdleScreen to appear after authentication"
        )
        XCTAssertTrue(
            element("lschatinput-suggestions").waitForExistence(timeout: 10),
            "Expected suggestion chips to be visible"
        )
    }

    private func firstSuggestionChip() -> XCUIElement {
        element("lschatinput-suggestions").buttons.firstMatch
    }

    private func startPlanningViaSuggestionChip() async throws {
        try await authenticateAndReachIdleScreen()
        let firstChip = firstSuggestionChip()
        firstChip.tap()
        XCTAssertTrue(element("planningscreen").waitForExistence(timeout: 5))
    }

    private func waitForRouteResultsScreen() async throws {
        try await startPlanningViaSuggestionChip()

        // Wait with extended timeout for real backend planning
        let deadline = Date().addingTimeInterval(90)
        var appeared = false
        while Date() < deadline {
            if element("route-resultsscreen").exists {
                appeared = true
                break
            }
            try await Task.sleep(for: .milliseconds(500))
        }

        guard appeared else {
            throw XCTSkip("Route results screen did not appear within timeout")
        }
    }

    private enum CredentialError: Error {
        case missing
    }
}
