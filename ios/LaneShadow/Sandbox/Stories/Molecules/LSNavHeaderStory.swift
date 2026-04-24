import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSNavHeaderStory {
    static let all: [Story] = [
        Story(
            id: "molecules.navHeader.default",
            tier: .molecule,
            component: "NavHeader",
            name: "Default",
            summary: "Default navigation header with inline ui.title.md title treatment."
        ) { _ in
            LSNavHeader(
                variant: .default,
                title: "Routes",
                leading: .back(action: {}),
                trailing: .action(icon: .menu, action: {})
            )
        },
        Story(
            id: "molecules.navHeader.largeTitle",
            tier: .molecule,
            component: "NavHeader",
            name: "Large Title",
            summary: "Large-title navigation header with opinion.lg title row beneath toolbar chrome."
        ) { _ in
            LSNavHeader(
                variant: .largeTitle,
                title: "Chat",
                leading: .back(action: {}),
                trailing: .action(icon: .menu, action: {})
            )
        },
        Story(
            id: "molecules.navHeader.largeTitleWithSubtitle",
            tier: .molecule,
            component: "NavHeader",
            name: "Large Title With Subtitle",
            summary: "Large-title navigation header including optional subtitle body copy."
        ) { _ in
            LSNavHeader(
                variant: .largeTitle,
                title: "Chat",
                subtitle: "Ride planning with your group",
                leading: .back(action: {}),
                trailing: .action(icon: .menu, action: {})
            )
        },
    ]
}
