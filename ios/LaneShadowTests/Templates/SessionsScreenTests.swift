import LaneShadowTheme
import SnapshotTesting
import SwiftUI
import Testing
import ViewInspector
import XCTest
@testable import LaneShadow

@MainActor
struct SessionsScreenTests {
    /// AC-1: Sessions composition renders — scrim at 0.35 opacity, LSSessionsDrawer slides in, "Rides" header, "NEW" button, "THIS WEEK" section, 5 session rows, active one stripe-highlighted
    @Test
    func sessions_default_renders() {
        let provider = SessionsMockProvider.self
        let screen = SessionsScreen(provider: provider)

        assertSnapshot(matching: screen, as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
            UITraitCollection(userInterfaceStyle: .light),
            UITraitCollection(userInterfaceIdiom: .phone),
            UITraitCollection(horizontalSizeClass: .compact),
            UITraitCollection(verticalSizeClass: .regular)
        ])))
    }

    /// AC-2: Scrim tap dismisses drawer and fires onDismiss callback
    @Test
    func scrim_tap_fires_on_dismiss() async throws {
        var dismissCount = 0

        let provider = SessionsMockProvider.self
        let screen = SessionsScreen(
            provider: provider,
            onDismiss: {
                dismissCount += 1
            }
        )
        .laneShadowTheme()

        let inspected = try screen.inspect()

        // Find scrim via its accessibility identifier
        let scrim = try inspected.find(viewWithAccessibilityIdentifier: "maplayer.scrim")
        try scrim.tap()

        #expect(dismissCount == 1, "onDismiss should fire exactly once on scrim tap")
    }

    /// AC-3: Session row tap fires onSelect callback with session id
    @Test
    func session_row_tap_fires_on_select() async throws {
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
        .laneShadowTheme()

        let inspected = try screen.inspect()

        // Find the drawer which contains session rows
        let drawer = try inspected.find(viewWithAccessibilityIdentifier: "maplayer.drawer")

        // Find a non-active session row (e.g., "Big Sur weekend")
        // The row should be tappable and fire the callback
        let sessionRows = try drawer.findAll(ViewType.Button.self)

        // Tap the second row (index 1, which is "Big Sur weekend" in default mock data)
        try sessionRows[1].tap()

        #expect(selectCount == 1, "onSelect should fire exactly once on row tap")
        #expect(selectedSessionId == "session-002", "Should pass the correct session ID")
    }

    /// AC-4: "NEW" button tap fires onNew callback
    @Test
    func new_button_tap_fires_on_new() async throws {
        var newCount = 0

        let provider = SessionsMockProvider.self
        let screen = SessionsScreen(
            provider: provider,
            onNew: {
                newCount += 1
            }
        )
        .laneShadowTheme()

        let inspected = try screen.inspect()

        // Find the NEW button in the drawer header
        let drawer = try inspected.find(viewWithAccessibilityIdentifier: "maplayer.drawer")

        // Find button with "NEW" text
        let buttons = try drawer.findAll(ViewType.Button.self)
        let newButton = buttons.first { button in
            try? button.text() == "NEW"
        }

        #expect(newButton != nil, "NEW button should be found")

        try newButton?.tap()

        #expect(newCount == 1, "onNew should fire exactly once on NEW button tap")
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
                UITraitCollection(verticalSizeClass: .regular)
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
            ".asyncComputed"
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
