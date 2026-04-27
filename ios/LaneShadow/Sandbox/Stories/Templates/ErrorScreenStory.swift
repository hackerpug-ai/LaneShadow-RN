import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum ErrorScreenStory {
    static let all: [Story] = [
        Story(
            id: "templates.error.default",
            tier: .template,
            component: "ErrorScreen",
            name: "Default — Lucia Segment",
            summary: "Error screen with warn-stripe callout showing Lucia segment failure, recovery suggestions, and chat input.",
            previewMode: .fullScreen
        ) { _ in
            ErrorScreen(provider: ErrorMockProvider.self)
        }
    ]
}
