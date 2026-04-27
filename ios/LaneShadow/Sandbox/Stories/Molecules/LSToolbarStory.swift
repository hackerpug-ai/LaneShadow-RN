import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSToolbarStory {
    static let all: [Story] = [
        Story(
            id: "molecules.toolbar.back-title-action",
            tier: .molecule,
            component: "Toolbar",
            name: "Back+Title+Action",
            summary: "Toolbar with back leading slot, centered title, and one trailing action."
        ) { _ in
            LSToolbar(
                leading: .back(action: {}),
                title: "Details",
                trailing: .action(icon: .menu, action: {})
            )
        },
        Story(
            id: "molecules.toolbar.title-only",
            tier: .molecule,
            component: "Toolbar",
            name: "Title Only",
            summary: "Toolbar with centered title and empty leading/trailing slots."
        ) { _ in
            LSToolbar(title: "Overview")
        },
        Story(
            id: "molecules.toolbar.title-two-actions",
            tier: .molecule,
            component: "Toolbar",
            name: "Title+Two Actions",
            summary: "Toolbar with centered title and two trailing icon actions."
        ) { _ in
            LSToolbar(
                title: "Map",
                trailing: .actions([
                    LSToolbarAction(icon: .sliders, action: {}),
                    LSToolbarAction(icon: .menu, action: {}),
                ])
            )
        },
        Story(
            id: "molecules.toolbar.no-back-button",
            tier: .molecule,
            component: "Toolbar",
            name: "No Back Button",
            summary: "Toolbar with no leading back button and a trailing action."
        ) { _ in
            LSToolbar(
                leading: .none,
                title: "Saved Routes",
                trailing: .action(icon: .bookmark, action: {})
            )
        },
    ]
}
