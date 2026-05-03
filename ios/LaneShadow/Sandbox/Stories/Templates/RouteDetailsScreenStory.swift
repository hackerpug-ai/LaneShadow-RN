import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum RouteDetailsScreenStory {
    static let all: [Story] = [
        Story(
            id: "templates.route-details-screen.default",
            tier: .template,
            component: "RouteDetailsScreen",
            name: "Default — Skyline Spine",
            summary: "Route details with best badge, instrument readout, weather timeline, and Save/Ride actions.",
            previewMode: .fullScreen
        ) { _ in
            RouteDetailsScreen(provider: RouteDetailsMockProvider.self)
        },
        Story(
            id: "templates.route-details-screen.s02-mixed-weather",
            tier: .template,
            component: "RouteDetailsScreen",
            name: "Mixed Weather — Coast & Ridge",
            summary: "Route details with mixed weather timeline (clear → wind → rain).",
            previewMode: .fullScreen
        ) { _ in
            RouteDetailsScreen(provider: RouteDetailsMockProvider.self, variant: "mixedWeather")
        },
        Story(
            id: "templates.route-details-screen.s03-dark",
            tier: .template,
            component: "RouteDetailsScreen",
            name: "S03 — Dark Mode",
            summary: "Route details in dark mode — all theme tokens resolve to dark variants.",
            previewMode: .fullScreen
        ) { _ in
            RouteDetailsScreen(provider: RouteDetailsMockProvider.self, variant: "s03-dark")
                .preferredColorScheme(.dark)
        },
        Story(
            id: "templates.route-details-screen.s04-medium",
            tier: .template,
            component: "RouteDetailsScreen",
            name: "S04 — Medium Detent",
            summary: "Route details sheet at medium detent (~0.45) with map and overlay visible.",
            previewMode: .fullScreen
        ) { _ in
            RouteDetailsScreen(provider: RouteDetailsMockProvider.self, variant: "s04-medium")
        },
        Story(
            id: "templates.route-details-screen.s05-dismissing",
            tier: .template,
            component: "RouteDetailsScreen",
            name: "S05 — Dismissing Copper Stripe",
            summary: "Copper top-edge stripe gradient flash on dismiss drag past medium detent.",
            previewMode: .fullScreen
        ) { _ in
            RouteDetailsScreen(provider: RouteDetailsMockProvider.self, variant: "s05-dismissing")
        },
        Story(
            id: "templates.route-details-screen.v01-saved",
            tier: .template,
            component: "RouteDetailsScreen",
            name: "V01 — Saved State",
            summary: "Glass+ copper-stripe toast, Save button saved variant, 'Saved' pill beside best badge.",
            previewMode: .fullScreen
        ) { _ in
            RouteDetailsScreen(provider: RouteDetailsMockProvider.self, variant: "v01-saved")
        },
    ]
}
