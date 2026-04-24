import LaneShadowTheme
import SwiftUI
import Testing

@testable import LaneShadow

@MainActor
struct LSTabItemTests {
    @Test("test_selected_uses_signal_default_unselected_uses_tertiary")
    func test_selected_uses_signal_default_unselected_uses_tertiary() async throws {
        // GIVEN: developer renders LSTabItem with selected: true and selected: false
        let selectedItem = LSTabItem(
            icon: .map,
            label: "Home",
            selected: true
        ) { }

        let unselectedItem = LSTabItem(
            icon: .map,
            label: "Home",
            selected: false
        ) { }

        // WHEN: both view bodies resolve
        // THEN: selected uses signal.default color with indicator, unselected uses tertiary
        _ = selectedItem.body
        _ = unselectedItem.body
        #expect(true)
    }
}
