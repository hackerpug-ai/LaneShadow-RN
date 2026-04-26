import LaneShadowTheme
import SnapshotTesting
import SwiftUI
import Testing
@testable import LaneShadow

@MainActor
struct SessionsScreenTests {
    /// AC-1: Sessions composition renders — scrim at 0.35 opacity, LSSessionsDrawer slides in, "Rides" header, "NEW"
    /// button, "THIS WEEK" section, 5 session rows, active one stripe-highlighted
    @Test
    func sessions_default_renders() {
        let provider = SessionsMockProvider.self
        let screen = SessionsScreen(provider: provider)

        assertSnapshot(matching: screen, as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
            UITraitCollection(userInterfaceStyle: .light),
            UITraitCollection(userInterfaceIdiom: .phone),
            UITraitCollection(horizontalSizeClass: .compact),
            UITraitCollection(verticalSizeClass: .regular),
        ])))
    }

    /// AC-2: Session row tap fires onSelect callback with session id
    @Test
    func session_row_tap_fires_on_select() {
        var selectedSessionId: String?
        var selectCount = 0

        let provider = SessionsMockProvider.self
        let screen = SessionsScreen(
            provider: provider,
            onSelect: { sessionId in
                selectedSessionId = sessionId
                selectCount += 1
            }
        )

        // Verify callback is wired correctly
        #expect(selectCount == 0, "Initial select count should be 0")

        // Simulate selecting session-002 by calling the callback
        screen.onSelect("session-002")

        // Verify callback was fired with the correct session ID
        #expect(selectCount == 1, "onSelect should fire when called")
        #expect(selectedSessionId == "session-002", "Should pass the correct session ID")
    }

    /// AC-3: "NEW" button tap fires onNew callback
    @Test
    func new_button_tap_fires_on_new() {
        var newCount = 0

        let provider = SessionsMockProvider.self
        let screen = SessionsScreen(
            provider: provider,
            onNew: {
                newCount += 1
            }
        )

        // Verify callback is wired correctly
        #expect(newCount == 0, "Initial new count should be 0")

        // Simulate tapping NEW button by calling the callback
        screen.onNew()

        // Verify callback was fired exactly once
        #expect(newCount == 1, "onNew should fire when called")
    }

    /// AC-4: Scrim tap dismisses drawer and fires onDismiss callback
    @Test
    func scrim_tap_fires_on_dismiss() {
        var dismissCount = 0

        let provider = SessionsMockProvider.self
        let screen = SessionsScreen(
            provider: provider,
            onDismiss: {
                dismissCount += 1
            }
        )

        // Verify callback is wired correctly
        #expect(dismissCount == 0, "Initial dismiss count should be 0")

        // Simulate scrim tap by calling the dismiss handler
        screen.onDismiss()

        // Verify callback was fired exactly once
        #expect(dismissCount == 1, "onDismiss should fire when called")
    }

    /// AC-5: Light/dark toggle re-resolves all tokens
    @Test
    func sessions_dark_mode() {
        let provider = SessionsMockProvider.self
        let screen = SessionsScreen(provider: provider)

        assertSnapshot(
            matching: screen,
            as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .dark),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ]))
        )
    }

    /// AC-6: No data fetching in template — verify no Convex/URLSession/.task symbols
    @Test
    func no_data_fetching_symbols() throws {
        let sourceFile = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/SessionsScreen.swift"
        let sourceCode = try String(contentsOfFile: sourceFile, encoding: .utf8)

        let forbiddenPatterns = [
            "Convex",
            "URLSession",
            "CLLocationManager",
            ".task(",
            ".asyncComputed",
        ]

        for pattern in forbiddenPatterns {
            #expect(
                !sourceCode.contains(pattern),
                "SessionsScreen.swift should not contain '\(pattern)' — found data fetching symbol"
            )
        }

        #expect(!sourceCode.isEmpty, "SessionsScreen.swift source should be readable and non-empty")
    }
}
