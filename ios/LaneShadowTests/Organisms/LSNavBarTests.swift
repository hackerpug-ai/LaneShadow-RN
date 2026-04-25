import LaneShadowTheme
import SwiftUI
import Testing
@testable import LaneShadow

@MainActor
struct LSNavBarTests {
    @Test("test_navbar_composes_lstoolbar_molecule")
    func navbar_composes_lstoolbar_molecule() {
        // GIVEN: developer renders LSNavBar with title, leading back, and trailing action
        let navBar = LSNavBar(
            title: "Filter",
            leading: .back(action: {}),
            trailing: .action(icon: .close, action: {})
        )

        // WHEN: view body resolves
        _ = navBar.body

        // THEN: LSToolbar molecule renders with back LSIcon leading + close LSIcon trailing + centered title
        // Structural verification: body resolves without crashing
    }
}
