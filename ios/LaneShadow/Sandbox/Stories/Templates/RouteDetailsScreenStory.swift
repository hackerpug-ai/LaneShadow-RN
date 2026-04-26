import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum RouteDetailsScreenStory {
    static let all: [Story] = [
        Story(
            id: "templates.routeDetails.default",
            tier: .template,
            component: "RouteDetailsScreen",
            name: "Default — Skyline Spine",
            summary: "Route details with best badge, instrument readout, weather timeline, and Save/Ride actions."
        ) { _ in
            RouteDetailsScreen(provider: RouteDetailsMockProvider.self)
        },
        Story(
            id: "templates.routeDetails.mixedWeather",
            tier: .template,
            component: "RouteDetailsScreen",
            name: "Mixed Weather — Coast & Ridge",
            summary: "Route details with mixed weather timeline (clear → wind → rain)."
        ) { _ in
            RouteDetailsScreen(provider: RouteDetailsMockProvider.self)
        },
    ]
}
