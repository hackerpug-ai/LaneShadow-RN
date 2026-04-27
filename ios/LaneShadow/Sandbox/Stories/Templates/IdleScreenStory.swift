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
    ]
}
