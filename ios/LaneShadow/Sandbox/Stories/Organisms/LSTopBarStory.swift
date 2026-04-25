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
            summary: "Hamburger leading + NEW trailing. Unified rounded-rect chips (radius.md), 90% surface alpha over map."
        ) { _ in
            LSTopBar(
                onMenuTap: {},
                onNewTap: {}
            )
        },
        Story(
            id: "organisms.topbar.withTitle",
            tier: .organism,
            component: "TopBar",
            name: "With Title",
            summary: "Title fills the flex gap between chips; display.title.md — Newsreader serif 18pt 500."
        ) { _ in
            LSTopBar(
                title: "Details",
                onMenuTap: {},
                onNewTap: {}
            )
        },
        Story(
            id: "organisms.topbar.hamburgerOnly",
            tier: .organism,
            component: "TopBar",
            name: "Hamburger Only",
            summary: "Trailing slot empty. Used on screens where NEW is contextually absent."
        ) { _ in
            LSTopBar(
                trailing: .none,
                onMenuTap: {}
            )
        },
        Story(
            id: "organisms.topbar.recordHighlight",
            tier: .organism,
            component: "TopBar",
            name: "Record Highlight",
            summary: "Trailing chip swapped to recording indicator. Pulsing red dot + REC label from color.status.recording."
        ) { _ in
            LSTopBar(
                trailing: .recordHighlight(isRecording: true),
                onMenuTap: {}
            )
        },
    ]
}
