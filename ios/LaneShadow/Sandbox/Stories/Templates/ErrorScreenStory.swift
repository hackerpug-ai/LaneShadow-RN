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
        },
        Story(
            id: "templates.error-screen.s04-recovered",
            tier: .template,
            component: "ErrorScreen",
            name: "S04 — Recovered State",
            summary: "Error screen with recovered state — callout faded to 0.55 opacity, chat field primed on chip tap",
            previewMode: .fullScreen
        ) { _ in
            ErrorScreen(
                provider: ErrorMockProvider.self,
                variant: "s04-recovered",
                onMenuTap: {},
                onSuggestionTap: { _ in }
            )
        },
        Story(
            id: "templates.error-screen.v01-offline",
            tier: .template,
            component: "ErrorScreen",
            name: "V01 — Offline",
            summary: "Error screen with wifi-off watermark at 0.25 opacity, chat input at 0.7 opacity with disabled buttons",
            previewMode: .fullScreen
        ) { _ in
            ErrorScreen(
                provider: ErrorMockProvider.self,
                variant: "v01-offline",
                onMenuTap: {},
                onSuggestionTap: { _ in }
            )
        },
    ]
}
