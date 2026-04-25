import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSNavBarStory {
    static let all: [Story] = [
        Story(
            id: "organisms.navbar.default",
            tier: .organism,
            component: "NavBar",
            name: "Default",
            summary: "Standard modal toolbar. Back leading (signal-colored), centered title, close trailing."
        ) { _ in
            LSNavBar(
                title: "Filter",
                leading: .back(action: {}),
                trailing: .action(icon: .close, action: {})
            )
        },
    ]
}
