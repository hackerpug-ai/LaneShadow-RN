import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum RouteResultsScreenStory {
    static let all: [Story] = [
        Story(
            id: "templates.route-results.default",
            tier: .template,
            component: "RouteResultsScreen",
            name: "Default — 3 Routes",
            summary: "Three polylines on map, pinned NavigatorMessage with 3 route attachments (best selected), refine chat input.",
            previewMode: .fullScreen
        ) { _ in
            RouteResultsScreen(provider: RouteResultsMockProvider.self)
        },
        Story(
            id: "templates.route-results.s02-alt-selected",
            tier: .template,
            component: "RouteResultsScreen",
            name: "S02 — Alt Selected",
            summary: "Alt route (Coastal Highway Classic) selected — polyline promotes from dashed to solid, card border re-tints to alt1 color.",
            previewMode: .fullScreen
        ) { _ in
            RouteResultsScreen(provider: RouteResultsMockProvider.self, variant: "s02-alt-selected")
        },
        Story(
            id: "templates.route-results.s04-refining",
            tier: .template,
            component: "RouteResultsScreen",
            name: "S04 — Refining Mode",
            summary: "Warm scrim overlay, polylines at 0.4 opacity, hidden callout, three primer chips above chat input, copper send button.",
            previewMode: .fullScreen
        ) { _ in
            RouteResultsScreen(provider: RouteResultsMockProvider.self, variant: "s04-refining")
        },
        Story(
            id: "templates.route-results.v03-recall",
            tier: .template,
            component: "RouteResultsScreen",
            name: "V03 — Recall Chip",
            summary: "Glass Recall pill at message position — tap restores callout visibility.",
            previewMode: .fullScreen
        ) { _ in
            RouteResultsScreen(provider: RouteResultsMockProvider.self, variant: "v03-recall")
        },
    ]
}
