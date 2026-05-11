import XCTest

/// Auth screen and helper tests (AC-1 through AC-4).
@MainActor
final class ExploratoryDesignReviewCaptureTests: ExploratoryDesignReviewCaptureTestsBase {
    func test_captureHelper_attachesNamedPng() {
        AppLauncher.launchApp(app)
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "auth-screen",
            state: "entry",
            action: "load",
            app: app
        )
        XCTAssertEqual(attachment.name, "auth-screen.entry.load")
        XCTAssertEqual(attachment.lifetime, .keepAlways)
        add(attachment)
        XCTAssertNotNil(attachment)
        XCTAssertEqual(attachment.name, "auth-screen.entry.load")
    }

    func test_authScreen_entry() {
        AppLauncher.launchApp(app, resetAuth: true)
        let authRoot = element("auth.signIn.root")
        XCTAssertTrue(
            authRoot.waitForExistence(timeout: 30),
            "Expected auth screen root to appear on signed-out launch"
        )
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "auth-screen",
            state: "entry",
            action: "load",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "auth-screen.entry.load")
    }

    func test_authScreen_emailEntry() throws {
        _ = try loadCredentials()
        AppLauncher.launchApp(app, resetAuth: true, e2eSignIn: true)
        let e2eButton = element("auth.signIn.e2eSignIn")
        XCTAssertTrue(
            e2eButton.waitForExistence(timeout: 5),
            "Expected E2E sign-in button to appear with -LaneShadowUITestE2E flag"
        )
        e2eButton.tap()
        let emailField = element("auth.signIn.email")
        let emailAppeared = emailField.waitForExistence(timeout: 15)
        if emailAppeared {
            let attachment = DesignReviewHelpers.captureScreen(
                screen: "auth-screen",
                state: "email-entry",
                action: "load",
                app: app
            )
            add(attachment)
            XCTAssertEqual(attachment.name, "auth-screen.email-entry.load")
        }
    }

    func test_authScreen_afterEmailEntry() async throws {
        _ = try loadCredentials()
        AppLauncher.launchApp(app, resetAuth: true, e2eSignIn: true)
        let e2eButton = element("auth.signIn.e2eSignIn")
        XCTAssertTrue(e2eButton.waitForExistence(timeout: 5))
        e2eButton.tap()
        try await Task.sleep(for: .milliseconds(2000))
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "auth-screen",
            state: "after-email-entry",
            action: "load",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "auth-screen.after-email-entry.load")
    }

    func test_authScreen_keyboardVisible() async throws {
        _ = try loadCredentials()
        AppLauncher.launchApp(app, resetAuth: true, e2eSignIn: true)
        let e2eButton = element("auth.signIn.e2eSignIn")
        XCTAssertTrue(e2eButton.waitForExistence(timeout: 5))
        e2eButton.tap()
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

    func test_authScreen_dark() throws {
        _ = try loadCredentials()
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        AppLauncher.launchApp(app, resetAuth: true, e2eSignIn: true)
        let e2eButton = element("auth.signIn.e2eSignIn")
        XCTAssertTrue(
            e2eButton.waitForExistence(timeout: 5),
            "Expected E2E sign-in button to appear"
        )
        e2eButton.tap()
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "auth-screen",
            state: "dark",
            action: "load",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "auth-screen.dark.load")
    }

    func test_authScreen_loading_light() throws {
        _ = try loadCredentials()
        AppLauncher.launchApp(app, resetAuth: true)
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "auth-screen",
            state: "loading",
            action: "light",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "auth-screen.loading.light")
    }

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
}

/// Idle screen exploratory tests.
@MainActor
final class ExploratoryIdleScreenCaptureTests: ExploratoryDesignReviewCaptureTestsBase {
    func test_idleScreen_chatFocused_light() async throws {
        try await authenticateAndReachIdleScreen()
        // LSChatInput's own root id `lschatinput` is the proven-findable
        // sentinel; the outer `idlescreen-chatinput` wrapper id is collapsed
        // by SwiftUI's accessibility tree when XCUITest queries via
        // `.firstMatch`. Tap the chat input via its root id.
        let chatInput = element("lschatinput")
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

    func test_idleScreen_chatFocused_dark() async throws {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        try await authenticateAndReachIdleScreen()
        // LSChatInput's own root id `lschatinput` is the proven-findable
        // sentinel; the outer `idlescreen-chatinput` wrapper id is collapsed
        // by SwiftUI's accessibility tree when XCUITest queries via
        // `.firstMatch`. Tap the chat input via its root id.
        let chatInput = element("lschatinput")
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

    func test_idleScreen_suggestionsScrolled_light() async throws {
        try await authenticateAndReachIdleScreen()
        let suggestions = element("lschatinput-suggestions")
        XCTAssertTrue(suggestions.waitForExistence(timeout: 5))
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
}

/// Planning screen exploratory tests.
@MainActor
final class ExploratoryPlanningScreenCaptureTests: ExploratoryDesignReviewCaptureTestsBase {
    func test_planningScreen_earlyPhase_light() async throws {
        try await authenticateAndReachIdleScreen()
        let firstChip = firstSuggestionChip()
        XCTAssertTrue(firstChip.waitForExistence(timeout: 5))
        firstChip.tap()
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

    func test_planningScreen_midPhase_light() async throws {
        try await authenticateAndReachIdleScreen()
        let firstChip = firstSuggestionChip()
        firstChip.tap()
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

    func test_planningScreen_light() async throws {
        try await authenticateAndReachIdleScreen()
        let firstChip = firstSuggestionChip()
        XCTAssertTrue(
            firstChip.waitForExistence(timeout: 5),
            "Expected suggestion chips to be visible"
        )
        firstChip.tap()
        let planningScreen = element("planningscreen")
        XCTAssertTrue(
            planningScreen.waitForExistence(timeout: 5),
            "Expected PlanningScreen to appear"
        )
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "planning-screen",
            state: "light",
            action: "load",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "planning-screen.light.load")
    }

    func test_planningScreen_dark() async throws {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        try await authenticateAndReachIdleScreen()
        let firstChip = firstSuggestionChip()
        firstChip.tap()
        XCTAssertTrue(element("planningscreen").waitForExistence(timeout: 5))
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "planning-screen",
            state: "dark",
            action: "load",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "planning-screen.dark.load")
    }

    func test_planningScreen_completion_light() async throws {
        try await authenticateAndReachIdleScreen()
        let firstChip = firstSuggestionChip()
        firstChip.tap()
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
}

/// Route results and details exploratory tests.
@MainActor
final class ExploratoryRouteScreensCaptureTests: ExploratoryDesignReviewCaptureTestsBase {
    func test_routeResultsScreen_chatFocused_light() async throws {
        try await waitForRouteResultsScreen()
        let input = element("route-resultsscreen-chatinput")
        guard input.waitForExistence(timeout: 5) else {
            throw XCTSkip("Chat input not available on route results screen")
        }
        input.tap()
        try await Task.sleep(for: .milliseconds(500))
        let attach = DesignReviewHelpers.captureScreen(
            screen: "route-results-screen", state: "chat-focused", action: "light", app: app
        )
        add(attach)
        XCTAssertEqual(attach.name, "route-results-screen.chat-focused.light")
    }

    func test_routeResultsScreen_chatFocused_dark() async throws {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        try await waitForRouteResultsScreen()
        let input = element("route-resultsscreen-chatinput")
        guard input.waitForExistence(timeout: 5) else {
            throw XCTSkip("Chat input not available on route results screen")
        }
        input.tap()
        try await Task.sleep(for: .milliseconds(500))
        let attach = DesignReviewHelpers.captureScreen(
            screen: "route-results-screen", state: "chat-focused", action: "dark", app: app
        )
        add(attach)
        XCTAssertEqual(attach.name, "route-results-screen.chat-focused.dark")
    }

    func test_routeResultsScreen_light() async throws {
        try await startPlanningViaSuggestionChip()
        let routeResultsScreen = element("route-resultsscreen")
        let deadline = Date().addingTimeInterval(90)
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
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "route-results-screen",
            state: "light",
            action: "load",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "route-results-screen.light.load")
    }

    func test_routeResultsScreen_dark() async throws {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        try await startPlanningViaSuggestionChip()
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
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "route-results-screen",
            state: "dark",
            action: "load",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "route-results-screen.dark.load")
    }

    func test_routeDetailsScreen_light() async throws {
        try await waitForRouteResultsScreen()
        let firstRouteCard = app.descendants(matching: .any).matching(identifier: "lsrouteattachmentcard").firstMatch
        guard firstRouteCard.waitForExistence(timeout: 5) else {
            throw XCTSkip("Route cards not available for details screen test")
        }
        firstRouteCard.tap()
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
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "route-details-screen",
            state: "light",
            action: "load",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "route-details-screen.light.load")
    }

    func test_routeDetailsScreen_dark() async throws {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        try await waitForRouteResultsScreen()
        let firstRouteCard = app.descendants(matching: .any).matching(identifier: "lsrouteattachmentcard").firstMatch
        guard firstRouteCard.waitForExistence(timeout: 5) else {
            throw XCTSkip("Route cards not available for details screen test")
        }
        firstRouteCard.tap()
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
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "route-details-screen",
            state: "dark",
            action: "load",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "route-details-screen.dark.load")
    }

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

    func test_errorScreen_light() async throws {
        try await authenticateAndReachIdleScreen()
        let chatInput = element("idlescreen-chatinput")
        guard chatInput.waitForExistence(timeout: 5) else {
            throw XCTSkip("Chat input not available for error screen test")
        }
        let textField = chatInput.descendants(matching: .any).matching(identifier: "lschatinput-field").firstMatch
        textField.tap()
        textField.typeText("plan a route to the moon")
        let sendButton = chatInput.descendants(matching: .any).matching(identifier: "lschatinput-send").firstMatch
        sendButton.tap()
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
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "error-screen",
            state: "light",
            action: "load",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "error-screen.light.load")
    }

    func test_errorScreen_dark() async throws {
        DesignReviewHelpers.setupDeterminismEnvironment(app: app, colorScheme: "dark")
        try await authenticateAndReachIdleScreen()
        let chatInput = element("idlescreen-chatinput")
        guard chatInput.waitForExistence(timeout: 5) else {
            throw XCTSkip("Chat input not available for error screen test")
        }
        let textField = chatInput.descendants(matching: .any).matching(identifier: "lschatinput-field").firstMatch
        textField.tap()
        textField.typeText("invalid route request xyz")
        chatInput.descendants(matching: .any).matching(identifier: "lschatinput-send").firstMatch.tap()
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
        let attachment = DesignReviewHelpers.captureScreen(
            screen: "error-screen",
            state: "dark",
            action: "load",
            app: app
        )
        add(attachment)
        XCTAssertEqual(attachment.name, "error-screen.dark.load")
    }
}

/// Deferred tests for features not yet wired.
@MainActor
final class ExploratoryDeferredCaptureTests: ExploratoryDesignReviewCaptureTestsBase {
    func test_routeDetailsScreen_saved() throws {
        throw XCTSkip("Sprint 06: Sessions-screen and saved-route flows are not yet wired")
    }

    func test_sessionsScreen_list() throws {
        throw XCTSkip("Sprint 06: Sessions-screen flow is not yet wired")
    }

    func test_sessionsScreen_details() throws {
        throw XCTSkip("Sprint 06: Sessions-screen details flow is not yet wired")
    }
}
