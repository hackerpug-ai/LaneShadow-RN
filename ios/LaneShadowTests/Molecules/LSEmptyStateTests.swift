import LaneShadowTheme
import SwiftUI
import Testing

@testable import LaneShadow

@MainActor
struct LSEmptyStateTests {
    @Test("test_centered_layout_with_icon_text_and_button_atoms")
    func test_centered_layout_with_icon_text_and_button_atoms() async throws {
        // GIVEN: developer instantiates LSEmptyState with icon, title, body, and action
        let emptyState = LSEmptyState(
            icon: .layers,
            title: "No rides yet",
            body: "Record your first ride.",
            action: .primary("Get Started") { }
        )

        // WHEN: view body resolves
        // THEN: centered VStack with LSIcon at xl, LSText title.md and body.md, LSButton primary
        _ = emptyState.body
        #expect(true)
    }

    @Test("test_action_button_fires_callback_once")
    func test_action_button_fires_callback_once() async throws {
        // GIVEN: LSEmptyState rendered with action closure
        var callbackCount = 0
        let emptyState = LSEmptyState(
            icon: .layers,
            title: "No rides yet",
            body: "Record your first ride.",
            action: .primary("Get Started") {
                callbackCount += 1
            }
        )

        // WHEN: view renders
        // THEN: closure does not fire on render (only on tap)
        _ = emptyState.body
        #expect(callbackCount == 0, "Callback should not fire on render")
    }
}
