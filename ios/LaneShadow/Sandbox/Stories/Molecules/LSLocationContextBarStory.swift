import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSLocationContextBarStory {
    static let all: [Story] = [
        Story(
            id: "molecules.locationContextBar.default",
            tier: .molecule,
            component: "LocationContextBar",
            name: "Default (Auto)",
            summary: "Two-pill location context bar with the auto mode pill."
        ) { _ in
            LSLocationContextBar(
                location: "Near Santa Cruz, CA",
                mode: .auto,
                onModeChange: {}
            )
            .padding(Theme.shared.space.lg)
        },

        Story(
            id: "molecules.locationContextBar.manualMode",
            tier: .molecule,
            component: "LocationContextBar",
            name: "Manual Mode",
            summary: "Location context bar with a manual override mode pill."
        ) { _ in
            LSLocationContextBar(
                location: "Near Santa Cruz, CA",
                mode: .manual,
                onModeChange: {}
            )
            .padding(Theme.shared.space.lg)
        },

        Story(
            id: "molecules.locationContextBar.longLocationLabel",
            tier: .molecule,
            component: "LocationContextBar",
            name: "Long Location Label",
            summary: "Long-form location label stress case for pill spacing."
        ) { _ in
            LSLocationContextBar(
                location: "Near Big Basin Redwoods State Park, Santa Cruz Mountains, California",
                mode: .manual,
                onModeChange: {}
            )
            .padding(Theme.shared.space.lg)
        },
    ]
}
