import LaneShadowTheme
import SnapshotTesting
import SwiftUI
import Testing
import ViewInspector
import XCTest
@testable import LaneShadow

@MainActor
struct ErrorScreenTests {
    /// AC-1: Error composition renders all slots (snapshot + manual verification)
    @Test
    func default_renders_all_slots() {
        let provider = ErrorMockProvider.self
        let screen = ErrorScreen(provider: provider)

        assertSnapshot(matching: screen, as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
            UITraitCollection(userInterfaceStyle: .light),
            UITraitCollection(userInterfaceIdiom: .phone),
            UITraitCollection(horizontalSizeClass: .compact),
            UITraitCollection(verticalSizeClass: .regular)
        ])))
    }

    /// AC-2: Suggestion tap fires callback and updates input value
    @Test
    func suggestion_tap_fires_callback() async throws {
        var callbackCount = 0
        var tappedChip: MockSuggestionChip?

        let provider = ErrorMockProvider.self

        let screen = ErrorScreen(
            provider: provider,
            onSuggestionTap: { chip in
                callbackCount += 1
                tappedChip = chip
            }
        )
        .laneShadowTheme()

        // Use ViewInspector to find and tap the "Try inland" suggestion chip
        let inspected = try screen.inspect()

        // Find the error callout which contains the suggestion chips
        let errorCallout = try inspected.find(viewWithAccessibilityIdentifier: "lsinlineerrorcallout")

        // The suggestion chips are in an HStack within the callout
        // We can find the first chip by its accessibility identifier
        let chipButton = try errorCallout.find(viewWithAccessibilityIdentifier: "lssuggestionchip-tap")
        try chipButton.button().tap()

        // Verify callback was fired exactly once with the correct chip
        #expect(callbackCount == 1, "Callback should fire exactly once on chip tap")
        #expect(tappedChip?.label == "Try inland", "Should pass the correct chip to the callback")
    }

    /// AC-3: Trailing icon swaps from sliders to send on text entry
    @Test
    func trailing_icon_swap_on_text_entry() async throws {
        let provider = ErrorMockProvider.self

        var inputValue = ""
        let screen = ErrorScreen(
            provider: provider,
            chatInputValue: Binding(
                get: { inputValue },
                set: { inputValue = $0 }
            )
        )
        .laneShadowTheme()

        // Initial state: input is empty, sliders icon should be visible
        let inspected = try screen.inspect()
        let chatInputView = try inspected.find(viewWithAccessibilityIdentifier: "errorscreen-chatinput")

        // Verify sliders icon is present (filter button is shown when input is empty)
        let slidersIcon = try? chatInputView.find(viewWithAccessibilityIdentifier: "lschatinput-filter-icon-sliders")
        #expect(slidersIcon != nil, "Sliders icon should be visible when input is empty")

        // Simulate user typing via the binding
        inputValue = "Try again"

        // Re-inspect after text entry
        let inspectedAfter = try screen.inspect()
        let chatInputViewAfter = try inspectedAfter.find(viewWithAccessibilityIdentifier: "errorscreen-chatinput")

        // Verify send icon is now present (send button is shown when input has text)
        let sendIcon = try? chatInputViewAfter.find(viewWithAccessibilityIdentifier: "lschatinput-send-icon")
        #expect(sendIcon != nil, "Send icon should be visible after text entry")

        // Verify the binding state
        #expect(inputValue == "Try again", "Input value should update through binding")
        #expect(!inputValue.isEmpty, "Input should no longer be empty after text entry")
    }

    /// AC-4: Hamburger tap fires presentSessions callback
    @Test
    func hamburger_tap_fires_callback() async throws {
        var menuTapCount = 0

        let provider = ErrorMockProvider.self
        let screen = ErrorScreen(
            provider: provider,
            onMenuTap: {
                menuTapCount += 1
                print("presentSessions")
            }
        )
        .laneShadowTheme()

        // Use ViewInspector to find and tap the hamburger button
        let inspected = try screen.inspect()

        // Find the hamburger button in the LSTopBar
        let topBar = try inspected.find(viewWithAccessibilityIdentifier: "lstopbar")
        let hamburgerButton = try topBar.find(viewWithAccessibilityIdentifier: "lstopbar-hamburger")
        try hamburgerButton.button().tap()

        // Verify callback was fired exactly once
        #expect(menuTapCount == 1, "Menu callback should fire exactly once on hamburger tap")
    }

    /// AC-5: Light/dark toggle re-resolves all tokens
    @Test
    func dark_mode_snapshot() {
        let provider = ErrorMockProvider.self
        let screen = ErrorScreen(provider: provider)

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

    /// AC-6: No data fetching symbols in template source
    @Test
    func no_data_fetching_symbols() throws {
        // Read the ErrorScreen.swift source file and verify it contains no forbidden symbols
        let sourceFile = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/ErrorScreen.swift"
        let sourceCode = try String(contentsOfFile: sourceFile, encoding: .utf8)

        // Define forbidden patterns that indicate data fetching
        let forbiddenPatterns = [
            "Convex",
            "URLSession",
            "CLLocationManager",
            ".task(",
            ".asyncComputed"
        ]

        // Verify source contains no forbidden symbols
        for pattern in forbiddenPatterns {
            #expect(
                !sourceCode.contains(pattern),
                "ErrorScreen.swift should not contain '\(pattern)' — found data fetching symbol"
            )
        }

        // Verify the file exists and is readable (basic sanity check)
        #expect(!sourceCode.isEmpty, "ErrorScreen.swift source should be readable and non-empty")
    }
}
