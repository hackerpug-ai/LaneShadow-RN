import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSRouteAttachmentCardStory {
    static let all: [Story] = [
        story(
            id: "molecules.routeAttachmentCard.bestSelected",
            name: "Best Selected",
            summary: "Best route card with selected border, best badge, and weather badge.",
            route: baseBestRoute(),
            selected: true,
            compact: false
        ),
        story(
            id: "molecules.routeAttachmentCard.bestCompact",
            name: "Best Compact",
            summary: "Compact best route card without best or weather badges.",
            route: baseBestRoute(),
            selected: false,
            compact: true
        ),
        story(
            id: "molecules.routeAttachmentCard.alt1",
            name: "Alt1",
            summary: "Alternate route card with the alt1 stripe token.",
            route: alt1Route(),
            selected: false,
            compact: false
        ),
        story(
            id: "molecules.routeAttachmentCard.alt2",
            name: "Alt2",
            summary: "Alternate route card with the alt2 stripe token.",
            route: alt2Route(),
            selected: false,
            compact: false
        ),
        story(
            id: "molecules.routeAttachmentCard.withFavoriteFlag",
            name: "With Favorite Flag",
            summary: "Route card with an optional favorite row.",
            route: favoriteRoute(),
            selected: false,
            compact: false
        ),
        story(
            id: "molecules.routeAttachmentCard.longTitle",
            name: "Long Title",
            summary: "Long title and subtitle wrapping stress case.",
            route: longTitleRoute(),
            selected: false,
            compact: false
        ),
    ]

    private static func story(
        id: String,
        name: String,
        summary: String,
        route: LSRouteAttachmentCardRoute,
        selected: Bool,
        compact: Bool
    ) -> Story {
        Story(
            id: id,
            tier: .molecule,
            component: "RouteAttachmentCard",
            name: name,
            summary: summary
        ) { _ in
            LSRouteAttachmentCard(
                route: route,
                selected: selected,
                compact: compact
            )
            .padding(Theme.shared.space.lg)
        }
    }

    private static func baseBestRoute() -> LSRouteAttachmentCardRoute {
        LSRouteAttachmentCardRoute(
            variant: .best,
            title: "Santa Cruz Redwoods Loop",
            subtitle: "Via Bonny Doon and Skyline",
            distance: "62 mi",
            duration: "1h 45m",
            elevation: "3,200 ft",
            scenicRating: 4,
            weather: .init(condition: .clear, label: "Clear")
        )
    }

    private static func alt1Route() -> LSRouteAttachmentCardRoute {
        LSRouteAttachmentCardRoute(
            variant: .alt1,
            title: "Empire Grade Alternative",
            subtitle: "Via Felton and Zayante",
            distance: "58 mi",
            duration: "1h 38m",
            elevation: "2,900 ft",
            scenicRating: 3,
            weather: .init(condition: .wind, label: "18mph NW")
        )
    }

    private static func alt2Route() -> LSRouteAttachmentCardRoute {
        LSRouteAttachmentCardRoute(
            variant: .alt2,
            title: "Coastal Return",
            subtitle: "Via Davenport and Highway 1",
            distance: "66 mi",
            duration: "1h 52m",
            elevation: "2,100 ft",
            scenicRating: 2,
            weather: .init(condition: .rain, label: "Rain 3pm")
        )
    }

    private static func favoriteRoute() -> LSRouteAttachmentCardRoute {
        LSRouteAttachmentCardRoute(
            variant: .best,
            title: "West Cliff Sunset Run",
            subtitle: "Via Wilder Ranch and Highway 1",
            distance: "47 mi",
            duration: "1h 18m",
            elevation: "1,800 ft",
            scenicRating: 5,
            weather: .init(condition: .clear, label: "Clear"),
            favoriteLabel: "Includes West Cliff favorite"
        )
    }

    private static func longTitleRoute() -> LSRouteAttachmentCardRoute {
        LSRouteAttachmentCardRoute(
            variant: .best,
            title: "Santa Cruz Mountains Coastal Ridge Loop With Extra Redwood Detours and Ocean Overlooks",
            subtitle: "Via Bonny Doon, Empire Grade, Wilder Ranch, Davenport, and an extended Highway 1 return",
            distance: "88 mi",
            duration: "2h 31m",
            elevation: "4,700 ft",
            scenicRating: 4,
            weather: .init(condition: .wind, label: "22mph NW")
        )
    }
}
