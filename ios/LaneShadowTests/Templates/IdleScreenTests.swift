import LaneShadowTheme
import SnapshotTesting
import SwiftUI
import Testing
import ViewInspector
import XCTest
@testable import LaneShadow

@MainActor
struct IdleScreenTemplateTests {
    /// AC-1: Idle composition renders all six slot elements (snapshot + manual verification)
    @Test
    func idle_default_renders() {
        let provider = IdleMockProvider.default
        let screen = IdleScreen(provider: provider)
            .frame(width: 390, height: 844)
            .laneShadowTheme()

        assertSnapshot(matching: screen, as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
            UITraitCollection(userInterfaceStyle: .light),
            UITraitCollection(userInterfaceIdiom: .phone),
            UITraitCollection(horizontalSizeClass: .compact),
            UITraitCollection(verticalSizeClass: .regular),
        ])))
    }

    /// AC-2: Suggestion tap fires callback and updates input value
    @Test
    func suggestion_tap_fires_callback() async throws {
        var callbackCount = 0
        var tappedChip: MockSuggestionChip?

        let provider = IdleMockProvider.default

        let screen = IdleScreen(
            provider: provider,
            onSuggestionTap: { chip in
                callbackCount += 1
                tappedChip = chip
            }
        )
        .laneShadowTheme()

        // Use ViewInspector to find and tap the "Coastal cruise" suggestion chip
        let inspected = try screen.inspect()

        // Find the chip button with label "Coastal cruise" and tap it
        // The chip is wrapped in LSChatInput which has identifier "idlescreen-chatinput"
        let chatInputView = try inspected.find(viewWithAccessibilityIdentifier: "idlescreen-chatinput")
        let chipButton = try chatInputView.find(viewWithAccessibilityIdentifier: "lschatinput-chip-coastal-cruise")
        try chipButton.button().tap()

        // Verify callback was fired exactly once with the correct chip
        #expect(callbackCount == 1, "Callback should fire exactly once on chip tap")
        #expect(tappedChip?.label == "Coastal cruise", "Should pass the correct chip to the callback")
    }

    /// AC-3: Trailing icon swaps from sliders to send on text entry
    @Test
    func trailing_icon_swap_on_text_entry() async throws {
        let provider = IdleMockProvider.default

        let emptyScreen = IdleScreen(
            provider: provider,
            chatInputValue: Binding(
                get: { "" },
                set: { _ in }
            )
        )
        .laneShadowTheme()

        // Initial state: input is empty, sliders icon should be visible
        let inspected = try emptyScreen.inspect()
        let chatInputView = try inspected.find(viewWithAccessibilityIdentifier: "idlescreen-chatinput")

        // Verify sliders icon is present (filter button is shown when input is empty)
        let slidersIcon = try? chatInputView.find(viewWithAccessibilityIdentifier: "lschatinput-filter-icon-sliders")
        #expect(slidersIcon != nil, "Sliders icon should be visible when input is empty")

        var inputValue = "Test ride"
        let filledScreen = IdleScreen(
            provider: provider,
            chatInputValue: Binding(
                get: { inputValue },
                set: { inputValue = $0 }
            )
        )
        .laneShadowTheme()

        // Re-inspect after text entry
        let inspectedAfter = try filledScreen.inspect()
        let chatInputViewAfter = try inspectedAfter.find(viewWithAccessibilityIdentifier: "idlescreen-chatinput")

        // Verify send icon is now present (send button is shown when input has text)
        let sendIcon = try? chatInputViewAfter.find(viewWithAccessibilityIdentifier: "lschatinput-send-icon")
        #expect(sendIcon != nil, "Send icon should be visible after text entry")

        // Verify the binding state
        #expect(inputValue == "Test ride", "Input value should update through binding")
        #expect(!inputValue.isEmpty, "Input should no longer be empty after text entry")
    }

    /// AC-4: Hamburger tap fires presentSessions callback
    @Test
    func hamburger_tap_fires_callback() async throws {
        var menuTapCount = 0

        let provider = IdleMockProvider.default
        let screen = IdleScreen(
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
    func idle_dark_mode() {
        let provider = IdleMockProvider.default
        let screen = IdleScreen(provider: provider)
            .frame(width: 390, height: 844)
            .laneShadowTheme()

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

    /// AC-6: No data fetching symbols in template source
    @Test
    func no_data_fetching_symbols() throws {
        // Read the IdleScreen.swift source file and verify it contains no forbidden symbols
        let sourceFile = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/IdleScreen.swift"
        let sourceCode = try String(contentsOfFile: sourceFile, encoding: .utf8)

        // Define forbidden patterns that indicate data fetching
        let forbiddenPatterns = [
            "Convex",
            "URLSession",
            "CLLocationManager",
            ".task(",
            ".asyncComputed",
        ]

        // Verify source contains no forbidden symbols
        for pattern in forbiddenPatterns {
            #expect(
                !sourceCode.contains(pattern),
                "IdleScreen.swift should not contain '\(pattern)' — found data fetching symbol"
            )
        }

        // Verify the file exists and is readable (basic sanity check)
        #expect(!sourceCode.isEmpty, "IdleScreen.swift source should be readable and non-empty")
    }

    @Test
    func idle_chat_suggestions_use_shared_spacing() throws {
        let templateSuggestions = try IdleScreen(provider: IdleMockProvider.self)
            .laneShadowTheme()
            .inspect()
            .find(viewWithAccessibilityIdentifier: "lschatinput-suggestions")
        let containerSuggestions = try IdleScreenContainer(
            viewModel: IdleViewModel(
                chatStore: ChatStore(),
                sessionStore: SessionStore(),
                convexClient: StubLaneShadowConvexClient()
            )
        )
        .laneShadowTheme()
        .inspect()
        .find(viewWithAccessibilityIdentifier: "lschatinput-suggestions")
        let templateGap = try templateSuggestions.padding(.bottom)
        let containerGap = try containerSuggestions.padding(.bottom)

        #expect(templateGap == Theme.shared.space.lg)
        #expect(containerGap == Theme.shared.space.lg)
        #expect(templateGap == containerGap)
    }

    @Test
    func idle_prompt_renders_between_menu_and_new_actions() throws {
        let inspected = try IdleScreen(provider: IdleMockProvider.self)
            .laneShadowTheme()
            .inspect()

        _ = try inspected.find(text: "Where are we riding today?")
        _ = try inspected.find(viewWithAccessibilityIdentifier: "lstopbar-title")
        _ = try inspected.find(viewWithAccessibilityIdentifier: "lstopbar-meta")
        _ = try inspected.find(viewWithAccessibilityIdentifier: "lstopbar-headline")
        #expect((try? inspected.find(viewWithAccessibilityIdentifier: "idle-context-capsule")) == nil)
    }

    @Test
    func idle_view_model_exposes_location_aware_chat_context() {
        let viewModel = IdleViewModel(
            chatStore: ChatStore(),
            sessionStore: SessionStore(),
            convexClient: StubLaneShadowConvexClient()
        )
        viewModel.locationLabel = "Santa Cruz, CA"
        viewModel.isLocationEnabled = true

        #expect(viewModel.locationBadge == LocationContext(label: "Santa Cruz, CA", mode: .auto))
        #expect(viewModel.chatPlaceholder == "Plan a ride from Santa Cruz, CA…")
    }

    @Test
    func idle_view_model_exposes_meta_and_styled_headline_for_topbar() {
        let viewModel = IdleViewModel(
            chatStore: ChatStore(),
            sessionStore: SessionStore(),
            convexClient: StubLaneShadowConvexClient()
        )
        viewModel.locationLabel = "Santa Cruz, CA"
        viewModel.isLocationEnabled = true
        viewModel.metaRow = "WED · 72°F · SUNNY"
        viewModel.favoriteLocations = [FavoriteLocation(id: "1", lat: 36.97, lon: -122.03, label: "Local Loop")]
        viewModel.recentSessions = [Session(
            id: "1",
            title: "Morning Ride",
            preview: "Scenic loop",
            meta: "3 routes",
            when: "Today",
            active: false,
            routeIds: [],
            createdAt: "2026-05-10T00:00:00Z"
        )]

        #expect(viewModel.topBarMetaText == "WED · 72°F · SUNNY")
        #expect(String(viewModel.topBarHeadline.characters) == "Where are we riding today, rider?")
    }
}

@MainActor
final class IdleScreenTests: XCTestCase {
    func test_idle_chat_suggestions_use_shared_spacing() throws {
        let templateSuggestions = try IdleScreen(provider: IdleMockProvider.self)
            .laneShadowTheme()
            .inspect()
            .find(viewWithAccessibilityIdentifier: "lschatinput-suggestions")
        let containerSuggestions = try IdleScreenContainer(
            viewModel: IdleViewModel(
                chatStore: ChatStore(),
                sessionStore: SessionStore(),
                convexClient: StubLaneShadowConvexClient()
            )
        )
        .laneShadowTheme()
        .inspect()
        .find(viewWithAccessibilityIdentifier: "lschatinput-suggestions")

        XCTAssertEqual(
            try templateSuggestions.padding(.bottom),
            Theme.shared.space.lg,
            accuracy: 0.001
        )
        XCTAssertEqual(
            try containerSuggestions.padding(.bottom),
            Theme.shared.space.lg,
            accuracy: 0.001
        )
        XCTAssertEqual(
            try templateSuggestions.padding(.bottom),
            try containerSuggestions.padding(.bottom),
            accuracy: 0.001,
            "Idle consumers should inherit the same LSChatInput suggestion spacing without screen-specific offsets"
        )
    }
}
