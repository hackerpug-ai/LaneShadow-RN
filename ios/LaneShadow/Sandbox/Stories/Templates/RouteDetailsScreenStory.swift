import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum RouteDetailsScreenStory {
    static let all: [Story] = [
        Story(
            id: "templates.route-details.default",
            tier: .template,
            component: "RouteDetailsScreen",
            name: "Default — Skyline Spine",
            summary: "Route details with best badge, instrument readout, weather timeline, and Save/Ride actions."
        ) { _ in
            RouteDetailsScreen(provider: RouteDetailsMockProvider.self)
        },
    ]
}
