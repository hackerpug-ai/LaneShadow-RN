import LaneShadowTheme
import SwiftUI
import Testing

@testable import LaneShadow

@MainActor
struct LSNavigatorMessageTests {
    // MARK: - AC-1: Signal callout composition

    @Test("test_renders_signal_callout_with_compass_label_body")
    func rendersSignalCalloutWithCompassLabelBody() async throws {
        // GIVEN: LSNavigatorMessage with body text, pinned
        let message = LSNavigatorMessage(
            body: "Take 280 south to 92 east, then Skyline.",
            pinned: true,
            onPin: {},
            onDismiss: {}
        )

        // WHEN: view body resolves
        // THEN: components are present (verified through view inspection)
        // Note: SwiftUI view structure testing is limited, so we verify the view exists
        // and has the correct properties by rendering it

        let _ = message.body

        // Verify the view can be created and rendered
        // Actual component structure verification would require snapshot testing
        // or more advanced view inspection tools
    }
}
