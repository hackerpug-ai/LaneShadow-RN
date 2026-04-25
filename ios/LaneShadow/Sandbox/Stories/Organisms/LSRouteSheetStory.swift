import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSRouteSheetStory {
    static let all: [Story] = [
        Story(
            id: "organisms.routesheet.best",
            tier: .organism,
            component: "RouteSheet",
            name: "Best Route",
            summary: "Best badge + scenic tag + title opinion.lg + via + 4-col readout + weather + actions.",
            previewMode: .fullScreen
        ) { _ in
            LSRouteSheet(
                route: RouteDetails(
                    id: "route-1",
                    title: "The Skyline Spine",
                    subtitle: "via Kings Mountain Rd · Kings Mountain to Woodside",
                    isBest: true,
                    distance: "47",
                    time: "1:22",
                    climb: "3.2k",
                    scenic: "4.8"
                ),
                weatherTimeline: [
                    WeatherEntry(hour: "9A", condition: .clear, temp: "62°"),
                    WeatherEntry(hour: "10A", condition: .clear, temp: "65°"),
                    WeatherEntry(hour: "11A", condition: .clear, temp: "67°"),
                    WeatherEntry(hour: "12P", condition: .wind, temp: "68°"),
                    WeatherEntry(hour: "1P", condition: .wind, temp: "66°"),
                    WeatherEntry(hour: "2P", condition: .clear, temp: "64°"),
                ],
                timeRange: ("9am", "3pm"),
                onSave: {},
                onRide: {},
                onDismiss: {}
            )
        },
        Story(
            id: "organisms.routesheet.altRoute",
            tier: .organism,
            component: "RouteSheet",
            name: "Alt Route",
            summary: "No Best badge. Scenic tag shows lower score. All clear weather cells.",
            previewMode: .fullScreen
        ) { _ in
            LSRouteSheet(
                route: RouteDetails(
                    id: "route-2",
                    title: "Old La Honda Road",
                    subtitle: "via Page Mill Rd · Palo Alto to Woodside",
                    isBest: false,
                    distance: "38",
                    time: "1:05",
                    climb: "2.1k",
                    scenic: "3.6"
                ),
                weatherTimeline: [
                    WeatherEntry(hour: "9A", condition: .clear, temp: "61°"),
                    WeatherEntry(hour: "10A", condition: .clear, temp: "64°"),
                    WeatherEntry(hour: "11A", condition: .clear, temp: "66°"),
                    WeatherEntry(hour: "12P", condition: .clear, temp: "67°"),
                    WeatherEntry(hour: "1P", condition: .clear, temp: "65°"),
                    WeatherEntry(hour: "2P", condition: .clear, temp: "63°"),
                ],
                timeRange: ("9am", "2pm"),
                onSave: {},
                onRide: {},
                onDismiss: {}
            )
        },
        Story(
            id: "organisms.routesheet.longTitle",
            tier: .organism,
            component: "RouteSheet",
            name: "Long Title + Via",
            summary: "Title wraps to 2 lines. Via line also wraps. Sheet height expands.",
            previewMode: .fullScreen
        ) { _ in
            LSRouteSheet(
                route: RouteDetails(
                    id: "route-3",
                    title: "The Pacific Coast Highway Long Haul South",
                    subtitle: "via Cabrillo Hwy · San Francisco to Big Sur · cliffside coastal",
                    isBest: true,
                    distance: "142",
                    time: "3:45",
                    climb: "5.8k",
                    scenic: "5.0"
                ),
                weatherTimeline: [],
                timeRange: ("9am", "3pm"),
                onSave: {},
                onRide: {},
                onDismiss: {}
            )
        },
        Story(
            id: "organisms.routesheet.mixedWeather",
            tier: .organism,
            component: "RouteSheet",
            name: "Mixed Weather",
            summary: "Clear + wind + rain cells. Each cell resolves its own tint color.",
            previewMode: .fullScreen
        ) { _ in
            LSRouteSheet(
                route: RouteDetails(
                    id: "route-4",
                    title: "Coastal Connector",
                    subtitle: "via Hwy 1 · Half Moon Bay to Monterey",
                    isBest: false,
                    distance: "52",
                    time: "1:35",
                    climb: "1.4k",
                    scenic: "4.5"
                ),
                weatherTimeline: [
                    WeatherEntry(hour: "10A", condition: .clear, temp: "58°"),
                    WeatherEntry(hour: "11A", condition: .wind, temp: "56°"),
                    WeatherEntry(hour: "12P", condition: .rain, temp: "54°"),
                    WeatherEntry(hour: "1P", condition: .rain, temp: "53°"),
                    WeatherEntry(hour: "2P", condition: .wind, temp: "55°"),
                    WeatherEntry(hour: "3P", condition: .clear, temp: "57°"),
                ],
                timeRange: ("10am", "4pm"),
                onSave: {},
                onRide: {},
                onDismiss: {}
            )
        },
        Story(
            id: "organisms.routesheet.darkMode",
            tier: .organism,
            component: "RouteSheet",
            name: "Dark Mode",
            summary: "Sheet surface resolves to ink-700. All tokens re-resolve.",
            previewMode: .fullScreen
        ) { _ in
            LSRouteSheet(
                route: RouteDetails(
                    id: "route-1",
                    title: "The Skyline Spine",
                    subtitle: "via Kings Mountain Rd",
                    isBest: true,
                    distance: "47",
                    time: "1:22",
                    climb: "3.2k",
                    scenic: "4.8"
                ),
                weatherTimeline: [
                    WeatherEntry(hour: "9A", condition: .clear, temp: "62°"),
                    WeatherEntry(hour: "10A", condition: .clear, temp: "65°"),
                    WeatherEntry(hour: "11A", condition: .clear, temp: "67°"),
                ],
                timeRange: ("9am", "12pm"),
                onSave: {},
                onRide: {},
                onDismiss: {}
            )
            .preferredColorScheme(.dark)
        },
    ]
}
