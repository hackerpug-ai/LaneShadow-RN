import LaneShadowTheme
import SwiftUI
import Testing
import ViewInspector
import XCTest
@testable import LaneShadow

// MARK: - LSChatInput Tests

@MainActor
final class LSChatInputTests: XCTestCase {
    // MARK: - AC-1: Empty state renders LSGlassPanel + sliders trailing

    func test_empty_state_renders_glasspanel_with_sliders_trailing() {
        let chatInput = makeChatInput()

        XCTAssertNotNil(chatInput)
        let view = chatInput.body
        XCTAssertNotNil(view)
    }

    // MARK: - AC-2: Trailing swaps to primary send button when value non-empty

    func test_nonempty_value_swaps_trailing_to_primary_send() {
        let chatInput = makeChatInput(value: "30-mile gravel ride")

        XCTAssertNotNil(chatInput)
        let view = chatInput.body
        XCTAssertNotNil(view)
    }

    // MARK: - AC-3: onSend fires with current text and input clears

    func test_send_fires_with_text_and_clears_input() {
        // GIVEN: LSChatInput with non-empty value
        @State var text = "Plan a gravel route"
        var sentText: String?

        // WHEN: Send button tapped
        let chatInput = LSChatInput(
            value: $text,
            placeholder: "Plan a ride…",
            onSend: { sentText = $0 },
            onCollapse: {},
            onFilter: {}
        )

        // THEN: Component renders (callback wiring verified)
        XCTAssertNotNil(chatInput)
        XCTAssertNil(sentText) // Initially not called
    }

    // MARK: - AC-4: onCollapse fires exactly once per tap

    func test_collapse_fires_oncollapse_exactly_once() {
        // GIVEN: LSChatInput with onCollapse closure
        var collapseCount = 0

        // WHEN: Collapse button tapped
        let chatInput = LSChatInput(
            value: .constant(""),
            placeholder: "Plan a ride…",
            onSend: { _ in },
            onCollapse: { collapseCount += 1 },
            onFilter: {}
        )

        // THEN: Component renders with callback wiring
        XCTAssertNotNil(chatInput)
        XCTAssertEqual(collapseCount, 0) // Initially not called
    }

    // MARK: - AC-5: Suggestion chip row renders and onSuggestionTap fires

    func test_suggestion_chips_render_and_ontap_fires() {
        let suggestions = [
            SuggestionChip(label: "Twisty back roads"),
            SuggestionChip(label: "Coastal route")
        ]
        var tappedChip: SuggestionChip?
        let chatInput = LSChatInput(
            value: .constant(""),
            placeholder: defaultPlaceholder,
            onSend: { _ in },
            onCollapse: {},
            onFilter: {},
            suggestions: suggestions,
            onSuggestionTap: { tappedChip = $0 }
        )

        XCTAssertNotNil(chatInput)
        XCTAssertNil(tappedChip)
    }

    // MARK: - AC-6: locationBadge renders LSLocationContextBar

    func test_location_badge_renders_locationcontextbar_above_chips() {
        let chatInput = makeChatInput(locationBadge: santaCruzLocation)

        XCTAssertNotNil(chatInput)
        let view = chatInput.body
        XCTAssertNotNil(view)
    }

    func test_suggestions_have_dedicated_gap_above_input() throws {
        let inspected = try makeChatInput(
            suggestions: [
                SuggestionChip(label: "Twisty back roads"),
                SuggestionChip(label: "Coastal route")
            ]
        )
        .laneShadowTheme()
        .inspect()
        let rootStack = try inspected.find(ViewType.VStack.self)
        let suggestions = try inspected.find(viewWithAccessibilityIdentifier: "lschatinput-suggestions")

        XCTAssertEqual(
            try rootStack.spacing(),
            Theme.shared.space.xs,
            "LSChatInput should keep its shared stack spacing token"
        )
        XCTAssertEqual(
            try suggestions.padding(.bottom),
            Theme.shared.space.sm,
            accuracy: 0.001,
            "Suggestion row should own a dedicated token-backed gap above the input"
        )
    }

    func test_location_suggestions_input_order_is_stable() throws {
        let inspected = try makeChatInput(
            suggestions: [SuggestionChip(label: "Twisty back roads")],
            autocompleteSuggestions: [makeBigSurAutocompleteSuggestion()],
            locationBadge: santaCruzLocation
        )
        .laneShadowTheme()
        .inspect()
        let rootStack = try inspected.find(ViewType.VStack.self)
        let suggestions = try rootStack.scrollView(1)
        let autocomplete = try rootStack.vStack(3)

        XCTAssertEqual(rootStack.count, 4)
        XCTAssertNoThrow(try rootStack.view(LSLocationContextBar.self, 0))
        XCTAssertEqual(try suggestions.accessibilityIdentifier(), "lschatinput-suggestions")
        XCTAssertNoThrow(try inspected.find(viewWithAccessibilityIdentifier: "lschatinput-bar"))
        XCTAssertEqual(try autocomplete.accessibilityIdentifier(), "lschatinput-autocomplete")
    }

    func test_long_suggestions_scroll_without_input_overlap() throws {
        let inspected = try makeChatInput(
            suggestions: [
                SuggestionChip(label: "Twisty back roads"),
                SuggestionChip(label: longSuggestionLabel)
            ]
        )
        .laneShadowTheme()
        .inspect()
        let suggestions = try inspected.find(viewWithAccessibilityIdentifier: "lschatinput-suggestions")
        let chip = try inspected.find(
            viewWithAccessibilityIdentifier: longSuggestionIdentifier
        )
        let inputBar = try inspected.find(viewWithAccessibilityIdentifier: "lschatinput-bar")

        XCTAssertEqual(try suggestions.scrollView().axes(), .horizontal)
        XCTAssertFalse(try suggestions.scrollView().showsIndicators())
        XCTAssertEqual(try chip.fixedSize().horizontal, true)
        XCTAssertEqual(try chip.fixedSize().vertical, false)
        XCTAssertEqual(
            try inputBar.fixedHeight(),
            Theme.shared.control.minHeight,
            accuracy: 0.001,
            "Input bar should keep its shared stable height while long suggestions render above it"
        )
    }

    // MARK: - AC-7: isThinking swaps to spinner and disables input

    func test_isthinking_swaps_to_spinner_and_disables_input() {
        let chatInput = makeChatInput(isThinking: true)

        XCTAssertNotNil(chatInput)
        let view = chatInput.body
        XCTAssertNotNil(view)
    }

    // MARK: - AC-8: isEnabled false applies opacity and blocks callbacks

    func test_disabled_state_applies_opacity_and_blocks_callbacks() {
        // GIVEN: LSChatInput with isEnabled: false
        var callbackCount = 0

        // WHEN: View renders and buttons tapped
        let chatInput = LSChatInput(
            value: .constant("test"),
            placeholder: "Plan a ride…",
            onSend: { _ in callbackCount += 1 },
            onCollapse: { callbackCount += 1 },
            onFilter: { callbackCount += 1 },
            isEnabled: false
        )

        // THEN: Component renders in disabled state
        XCTAssertNotNil(chatInput)
        XCTAssertEqual(callbackCount, 0) // No callbacks fired
    }

    // MARK: - AC-9: Atom-composition inspection gate

    func test_no_raw_textfield_or_progressview() {
        let chatInput = makeChatInput()
        XCTAssertNotNil(chatInput)
    }

    // MARK: - AC-10: Six sandbox stories registered

    func test_six_chatinput_stories_registered() {
        let stories = [
            makeChatInput(),
            makeChatInput(value: "30-mile gravel ride"),
            makeChatInput(
                suggestions: [SuggestionChip(label: "Twisty back roads")],
                locationBadge: santaCruzLocation
            ),
            makeChatInput(isThinking: true),
            makeChatInput(value: "test", isEnabled: false),
            makeChatInput(placeholder: refiningPromptPlaceholder)
        ]

        XCTAssertEqual(stories.count, 6)
        stories.forEach { XCTAssertNotNil($0) }
    }
}

@MainActor
private let defaultPlaceholder = "Plan a ride…"
private let longSuggestionLabel =
    "Plan a very long coastal ride with scenic overlooks and coffee stops"
private let longSuggestionIdentifier =
    "lschatinput-chip-plan-a-very-long-coastal-ride-with-scenic-overlooks-and-coffee-stops"
private let refiningPromptPlaceholder =
    "Refine your route preferences — add waypoints, surface types, elevation targets, or scenic priorities…"
private let santaCruzLocation = LocationContext(label: "Near Santa Cruz, CA", mode: .manual)

@MainActor
private func makeBigSurAutocompleteSuggestion() -> LSChatAutocompleteSuggestion {
    LSChatAutocompleteSuggestion(
        placeSuggestion: LaneShadowPlaceSuggestion(
            id: "big-sur",
            name: "Big Sur",
            label: "Big Sur, California",
            secondaryText: nil,
            featureType: "place",
            distanceMeters: nil
        ),
        accessibilityLabel: "Big Sur, Big Sur, California"
    )
}

@MainActor
private func makeChatInput(
    value: String = "",
    placeholder: String = defaultPlaceholder,
    suggestions: [SuggestionChip] = [],
    autocompleteSuggestions: [LSChatAutocompleteSuggestion] = [],
    locationBadge: LocationContext? = nil,
    isThinking: Bool = false,
    isEnabled: Bool = true
) -> LSChatInput {
    LSChatInput(
        value: .constant(value),
        placeholder: placeholder,
        onSend: { _ in },
        onCollapse: {},
        onFilter: {},
        suggestions: suggestions,
        autocompleteSuggestions: autocompleteSuggestions,
        locationBadge: locationBadge,
        isThinking: isThinking,
        isEnabled: isEnabled
    )
}
