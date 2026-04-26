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
            summary: "Sessions drawer with scrim at 0.35 opacity, 'Rides' header, NEW button, THIS WEEK section, and 5 session rows with Santa Cruz loop marked active"
        ) { _ in
            SessionsScreen(provider: SessionsMockProvider.self)
        },
    ]
}
