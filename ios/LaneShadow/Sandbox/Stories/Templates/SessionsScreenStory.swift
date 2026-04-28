import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum SessionsScreenStory {
    static let all: [Story] = [
        Story(
            id: "templates.sessions.default",
            tier: .template,
            component: "SessionsScreen",
            name: "Default — This Week",
            summary: "Sessions drawer with scrim at 0.35 opacity, 'Rides' header, NEW button, THIS WEEK section, and 5 session rows with Santa Cruz loop marked active",
            previewMode: .fullScreen
        ) { _ in
            SessionsScreen(provider: SessionsMockProvider.self)
        },
        Story(
            id: "templates.sessions-screen.s05-new-confirm",
            tier: .template,
            component: "SessionsScreen",
            name: "S05 — New Confirm Dialog",
            summary: "Sessions screen with active session, tapping NEW shows confirmation dialog with surface.scrim backdrop and surface.card dialog",
            previewMode: .fullScreen
        ) { _ in
            SessionsScreen(
                provider: SessionsMockProvider.self,
                variant: "s05-new-confirm",
                onSelect: { _ in },
                onNew: {},
                onDismiss: {}
            )
        },
        Story(
            id: "templates.sessions-screen.s04-grouped",
            tier: .template,
            component: "SessionsScreen",
            name: "S04 — Grouped by Date",
            summary: "Sessions drawer with multiple date sections (TONIGHT, TODAY, THIS WEEK, LAST WEEK, EARLIER)",
            previewMode: .fullScreen
        ) { _ in
            SessionsScreen(
                provider: SessionsMockProvider.self,
                variant: "s04-grouped",
                onSelect: { _ in },
                onNew: {},
                onDismiss: {}
            )
        },

        // S02: Dark mode
        Story(
            id: "templates.sessions-screen.s02-dark",
            tier: .template,
            component: "SessionsScreen",
            name: "S02 — Dark Mode",
            summary: "Dark mode variant of sessions list.",
            previewMode: .fullScreen
        ) { _ in
            SessionsScreen(provider: SessionsMockProvider.self)
        },

        // S03: Empty state
        Story(
            id: "templates.sessions-screen.s03-empty",
            tier: .template,
            component: "SessionsScreen",
            name: "S03 — Empty",
            summary: "No sessions — empty state with NEW button.",
            previewMode: .fullScreen
        ) { _ in
            SessionsScreen(provider: SessionsMockProvider.self, variant: "empty")
        },
    ]
}
