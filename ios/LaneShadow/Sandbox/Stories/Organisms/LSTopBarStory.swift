import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSTopBarStory {
    static let all: [Story] = [
        Story(
            id: "organisms.topbar.default",
            tier: .organism,
            component: "TopBar",
            name: "Default",
            summary: "Hamburger leading + NEW trailing. Unified rounded-rect chips (radius.md), 90% surface alpha over map.",
            previewMode: .fullScreen
        ) { _ in
            LSTopBar(
                onMenuTap: {},
                onNewTap: {}
            )
        },
        Story(
            id: "organisms.topbar.with-title",
            tier: .organism,
            component: "TopBar",
            name: "With Title",
            summary: "Title fills the flex gap between chips; display.title.md — Newsreader serif 18pt 500.",
            previewMode: .fullScreen
        ) { _ in
            LSTopBar(
                title: "Details",
                onMenuTap: {},
                onNewTap: {}
            )
        },
        Story(
            id: "organisms.topbar.hamburger-only",
            tier: .organism,
            component: "TopBar",
            name: "Hamburger Only",
            summary: "Trailing slot empty. Used on screens where NEW is contextually absent.",
            previewMode: .fullScreen
        ) { _ in
            LSTopBar(
                trailing: .none,
                onMenuTap: {}
            )
        },
        Story(
            id: "organisms.topbar.record-highlight",
            tier: .organism,
            component: "TopBar",
            name: "Record Highlight",
            summary: "Trailing chip swapped to recording indicator. Pulsing red dot + REC label from color.status.recording.",
            previewMode: .fullScreen
        ) { _ in
            LSTopBar(
                trailing: .recordHighlight(isRecording: true),
                onMenuTap: {}
            )
        },
    ]
}
