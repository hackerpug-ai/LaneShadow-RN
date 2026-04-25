import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSRouteCardStory {
    static let all: [Story] = [
        story(
            id: "organisms.routecard.default",
            name: "Default",
            summary: "LSCard wrapper, map preview, title ui.title.md, distance + time body.sm, moderate difficulty tag.",
            route: defaultRoute()
        ),
        story(
            id: "organisms.routecard.saved",
            name: "Saved",
            summary: "heartFill icon in signal copper appears in title row trailing.",
            route: savedRoute()
        ),
        story(
            id: "organisms.routecard.alt1",
            name: "Alt Variant",
            summary: "route.variant = .alt1 → polyline stroke resolves to color.route.alt1 sage-green.",
            route: alt1Route()
        ),
        story(
            id: "organisms.routecard.longTitle",
            name: "Long Title Overflow",
            summary: "Title truncates with ellipsis on one line. Multiple tags wrap if needed.",
            route: longTitleRoute()
        ),
        story(
            id: "organisms.routecard.missingData",
            name: "Missing Optional Data",
            summary: "No polyline, no distance, no difficulty tag. Graceful fallback: placeholder map, em-dash values.",
            route: missingOptionalDataRoute()
        ),
        story(
            id: "organisms.routecard.darkMode",
            name: "Dark Mode",
            summary: "Surface resolves to ink-700. Map paper to dark style. Copper polyline remains vivid.",
            route: defaultRoute()
        ),
    ]

    private static func story(
        id: String,
        name: String,
        summary: String,
        route: LSRouteCard.Route
    ) -> Story {
        Story(
            id: id,
            tier: .organism,
            component: "RouteCard",
            name: name,
            summary: summary
        ) { _ in
            LSRouteCard(route: route)
                .padding(Theme.shared.space.lg)
                .frame(maxWidth: 360)
        }
    }

    // MARK: - Fixtures

    private static func defaultRoute() -> LSRouteCard.Route {
        LSRouteCard.Route(
            id: "route-1",
            title: "The Skyline Spine",
            distance: 47000, // meters
            duration: 4920, // seconds (1h 22m)
            polyline: [
                LatLng(lat: 37.7749, lon: -122.4194),
                LatLng(lat: 37.8000, lon: -122.4500),
                LatLng(lat: 37.8500, lon: -122.5000),
                LatLng(lat: 37.9000, lon: -122.5500),
                LatLng(lat: 37.9500, lon: -122.6000),
            ],
            variant: .best,
            difficulty: .moderate,
            isSaved: false
        )
    }

    private static func savedRoute() -> LSRouteCard.Route {
        var route = defaultRoute()
        route.isSaved = true
        return route
    }

    private static func alt1Route() -> LSRouteCard.Route {
        LSRouteCard.Route(
            id: "route-2",
            title: "Old La Honda Road",
            distance: 38000,
            duration: 3900,
            polyline: [
                LatLng(lat: 37.3500, lon: -122.2000),
                LatLng(lat: 37.4000, lon: -122.2500),
                LatLng(lat: 37.4500, lon: -122.3000),
                LatLng(lat: 37.5000, lon: -122.3500),
            ],
            variant: .alt1,
            difficulty: .easy,
            isSaved: false
        )
    }

    private static func longTitleRoute() -> LSRouteCard.Route {
        LSRouteCard.Route(
            id: "route-3",
            title: "The Pacific Coast Highway Long Haul South from San Francisco to Big Sur",
            distance: 142_000,
            duration: 13500,
            polyline: [
                LatLng(lat: 37.7749, lon: -122.4194),
                LatLng(lat: 37.5000, lon: -122.4000),
                LatLng(lat: 37.0000, lon: -122.3000),
                LatLng(lat: 36.5000, lon: -121.9000),
            ],
            variant: .best,
            difficulty: .advanced,
            isSaved: false
        )
    }

    private static func missingOptionalDataRoute() -> LSRouteCard.Route {
        LSRouteCard.Route(
            id: "route-4",
            title: "Unnamed Route",
            distance: 0,
            duration: 0,
            polyline: [],
            variant: .best,
            difficulty: nil,
            isSaved: false
        )
    }
}
