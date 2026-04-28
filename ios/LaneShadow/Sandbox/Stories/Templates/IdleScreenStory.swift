import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum IdleScreenStory {
    static let all: [Story] = [
        Story(
            id: "templates.idle.default",
            tier: .template,
            component: "IdleScreen",
            name: "Default",
            summary: "Welcome screen with greeting overlay, map, and chat input with suggestions.",
            previewMode: .fullScreen
        ) { _ in
            IdleScreen(provider: IdleMockProvider.self)
        },

        // V01: No Location
        Story(
            id: "templates.idle-screen.v-no-location",
            tier: .template,
            component: "IdleScreen",
            name: "V01 · No Location",
            summary: "GPS denied — copper-framed 'Tap to set start' pill, dimmed chat input.",
            previewMode: .fullScreen
        ) { args in
            IdleScreen(provider: IdleMockProvider.self, variant: "v-no-location")
        },

        // V02: First Ride
        Story(
            id: "templates.idle-screen.v-first-ride",
            tier: .template,
            component: "IdleScreen",
            name: "V02 · First Ride",
            summary: "No saved favorites yet — onboarding suggestion chips.",
            previewMode: .fullScreen
        ) { args in
            IdleScreen(provider: IdleMockProvider.self, variant: "v-first-ride")
        },

        // V03: Weather Advisory
        Story(
            id: "templates.idle-screen.v-weather-advisory",
            tier: .template,
            component: "IdleScreen",
            name: "V03 · Weather Advisory",
            summary: "Heavy rain — warning meta, advisory card, short/dry suggestions.",
            previewMode: .fullScreen
        ) { args in
            IdleScreen(provider: IdleMockProvider.self, variant: "v-weather-advisory")
        },

        // S02: Typing with send
        Story(
            id: "templates.idle-screen.s02-typing-send",
            tier: .template,
            component: "IdleScreen",
            name: "S02 · Typing with Send",
            summary: "User typing in chat input with suggestions visible.",
            previewMode: .fullScreen
        ) { args in
            IdleScreen(provider: IdleMockProvider.self, variant: "default")
        },

        // S03: Dark mode
        Story(
            id: "templates.idle-screen.s03-dark",
            tier: .template,
            component: "IdleScreen",
            name: "S03 · Dark Mode",
            summary: "Dark mode variant of default idle state.",
            previewMode: .fullScreen
        ) { args in
            IdleScreen(provider: IdleMockProvider.self, variant: "default")
        },

        // S04: Filter sheet
        Story(
            id: "templates.idle-screen.s04-filter-sheet",
            tier: .template,
            component: "IdleScreen",
            name: "S04 · Filter Sheet",
            summary: "Filter sheet visible with route preferences.",
            previewMode: .fullScreen
        ) { args in
            IdleScreen(provider: IdleMockProvider.self, variant: "default")
        },
    ]
}
