import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum RouteResultsScreenStory {
    static let all: [Story] = [
        Story(
            id: "templates.routeresults.default",
            tier: .template,
            component: "RouteResultsScreen",
            name: "Default — 3 Routes",
            summary: "Three polylines on map, pinned NavigatorMessage with 3 route attachments (best selected), refine chat input."
        ) { _ in
            RouteResultsScreen(provider: RouteResultsMockProvider.self)
        },
    ]
}
