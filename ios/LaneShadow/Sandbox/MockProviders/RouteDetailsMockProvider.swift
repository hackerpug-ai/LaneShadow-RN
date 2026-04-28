import Foundation

/// Mock provider for RouteDetailsScreen template data.
///
/// Provides route details with weather timeline for the
/// RouteDetails/route-inspection template screen.
public enum RouteDetailsMockProvider: MockProvider {
    public static let variants = ["default", "mixedWeather", "s03-dark", "s04-medium", "s05-dismissing", "v01-saved"]

    public static func value(variant: String = "default") -> RouteDetailsData {
        switch variant {
        case "mixedWeather":
            mixedWeatherState()
        case "s03-dark":
            s03DarkState()
        case "s04-medium":
            s04MediumState()
        case "s05-dismissing":
            s05DismissingState()
        case "v01-saved":
            v01SavedState()
        default:
            defaultState()
        }
    }

    private static func defaultState() -> RouteDetailsData {
        RouteDetailsData(
            route: RouteDetails(
                id: "route-skyline-spine",
                title: "The Skyline Spine",
                subtitle: "via Hwy 35 → Hwy 9 · past Alice's",
                isBest: true,
                distance: "64",
                time: "2h 10m",
                climb: "2,400",
                scenic: "9.2"
            ),
            weatherTimeline: [
                WeatherEntry(hour: "9A", condition: .clear, temp: "62°"),
                WeatherEntry(hour: "10", condition: .clear, temp: "64°"),
                WeatherEntry(hour: "11", condition: .clear, temp: "67°"),
                WeatherEntry(hour: "12", condition: .clear, temp: "71°"),
                WeatherEntry(hour: "1P", condition: .clear, temp: "73°"),
                WeatherEntry(hour: "2P", condition: .clear, temp: "71°"),
            ],
            timeRange: ("9 AM", "2 PM"),
            coordinates: [
                LatLng(lat: 37.7749, lon: -122.4194),
                LatLng(lat: 37.7849, lon: -122.4094),
                LatLng(lat: 37.7949, lon: -122.3994),
                LatLng(lat: 37.8049, lon: -122.3894),
                LatLng(lat: 37.8149, lon: -122.3794),
                LatLng(lat: 37.8249, lon: -122.3694),
                LatLng(lat: 37.8349, lon: -122.3594),
            ]
        )
    }

    private static func mixedWeatherState() -> RouteDetailsData {
        RouteDetailsData(
            route: RouteDetails(
                id: "route-coast-ridge",
                title: "Coast & Ridge Loop",
                subtitle: "via Hwy 1 → Panoramic",
                isBest: true,
                distance: "82",
                time: "2h 45m",
                climb: "3,100",
                scenic: "8.7"
            ),
            weatherTimeline: [
                WeatherEntry(hour: "11A", condition: .clear, temp: "66°"),
                WeatherEntry(hour: "12", condition: .clear, temp: "68°"),
                WeatherEntry(hour: "1P", condition: .wind, temp: "65°"),
                WeatherEntry(hour: "2P", condition: .wind, temp: "62°"),
                WeatherEntry(hour: "3P", condition: .rain, temp: "58°"),
                WeatherEntry(hour: "4P", condition: .rain, temp: "56°"),
            ],
            timeRange: ("11 AM", "4 PM"),
            coordinates: [
                LatLng(lat: 37.6249, lon: -122.4694),
                LatLng(lat: 37.6349, lon: -122.4594),
                LatLng(lat: 37.6449, lon: -122.4494),
                LatLng(lat: 37.6549, lon: -122.4394),
                LatLng(lat: 37.6649, lon: -122.4294),
                LatLng(lat: 37.6749, lon: -122.4194),
                LatLng(lat: 37.6849, lon: -122.4094),
            ]
        )
    }

    // MARK: - S03: Dark state

    private static func s03DarkState() -> RouteDetailsData {
        RouteDetailsData(
            route: RouteDetails(
                id: "route-skyline-spine-dark",
                title: "The Skyline Spine",
                subtitle: "via Hwy 35 → Hwy 9 · past Alice's",
                isBest: true,
                distance: "64",
                time: "2h 10m",
                climb: "2,400",
                scenic: "9.2"
            ),
            weatherTimeline: [
                WeatherEntry(hour: "9A", condition: .clear, temp: "62°"),
                WeatherEntry(hour: "10", condition: .clear, temp: "64°"),
                WeatherEntry(hour: "11", condition: .clear, temp: "67°"),
                WeatherEntry(hour: "12", condition: .clear, temp: "71°"),
                WeatherEntry(hour: "1P", condition: .clear, temp: "73°"),
                WeatherEntry(hour: "2P", condition: .clear, temp: "71°"),
            ],
            timeRange: ("9 AM", "2 PM"),
            coordinates: [
                LatLng(lat: 37.7749, lon: -122.4194),
                LatLng(lat: 37.7849, lon: -122.4094),
                LatLng(lat: 37.7949, lon: -122.3994),
                LatLng(lat: 37.8049, lon: -122.3894),
                LatLng(lat: 37.8149, lon: -122.3794),
                LatLng(lat: 37.8249, lon: -122.3694),
                LatLng(lat: 37.8349, lon: -122.3594),
            ]
        )
    }

    // MARK: - S04: Medium detent state

    private static func s04MediumState() -> RouteDetailsData {
        RouteDetailsData(
            route: RouteDetails(
                id: "route-medium-detent",
                title: "The Skyline Spine",
                subtitle: "via Hwy 35 → Hwy 9 · past Alice's",
                isBest: true,
                distance: "64",
                time: "2h 10m",
                climb: "2,400",
                scenic: "9.2"
            ),
            weatherTimeline: [
                WeatherEntry(hour: "9A", condition: .clear, temp: "62°"),
                WeatherEntry(hour: "10", condition: .clear, temp: "64°"),
                WeatherEntry(hour: "11", condition: .clear, temp: "67°"),
                WeatherEntry(hour: "12", condition: .clear, temp: "71°"),
                WeatherEntry(hour: "1P", condition: .clear, temp: "73°"),
                WeatherEntry(hour: "2P", condition: .clear, temp: "71°"),
            ],
            timeRange: ("9 AM", "2 PM"),
            coordinates: [
                LatLng(lat: 37.7749, lon: -122.4194),
                LatLng(lat: 37.7849, lon: -122.4094),
                LatLng(lat: 37.7949, lon: -122.3994),
                LatLng(lat: 37.8049, lon: -122.3894),
                LatLng(lat: 37.8149, lon: -122.3794),
                LatLng(lat: 37.8249, lon: -122.3694),
                LatLng(lat: 37.8349, lon: -122.3594),
            ]
        )
    }

    // MARK: - S05: Dismissing state

    private static func s05DismissingState() -> RouteDetailsData {
        RouteDetailsData(
            route: RouteDetails(
                id: "route-dismissing",
                title: "The Skyline Spine",
                subtitle: "via Hwy 35 → Hwy 9 · past Alice's",
                isBest: true,
                distance: "64",
                time: "2h 10m",
                climb: "2,400",
                scenic: "9.2"
            ),
            weatherTimeline: [
                WeatherEntry(hour: "9A", condition: .clear, temp: "62°"),
                WeatherEntry(hour: "10", condition: .clear, temp: "64°"),
                WeatherEntry(hour: "11", condition: .clear, temp: "67°"),
                WeatherEntry(hour: "12", condition: .clear, temp: "71°"),
                WeatherEntry(hour: "1P", condition: .clear, temp: "73°"),
                WeatherEntry(hour: "2P", condition: .clear, temp: "71°"),
            ],
            timeRange: ("9 AM", "2 PM"),
            coordinates: [
                LatLng(lat: 37.7749, lon: -122.4194),
                LatLng(lat: 37.7849, lon: -122.4094),
                LatLng(lat: 37.7949, lon: -122.3994),
                LatLng(lat: 37.8049, lon: -122.3894),
                LatLng(lat: 37.8149, lon: -122.3794),
                LatLng(lat: 37.8249, lon: -122.3694),
                LatLng(lat: 37.8349, lon: -122.3594),
            ]
        )
    }

    // MARK: - V01: Saved state

    private static func v01SavedState() -> RouteDetailsData {
        RouteDetailsData(
            route: RouteDetails(
                id: "route-saved",
                title: "The Skyline Spine",
                subtitle: "via Hwy 35 → Hwy 9 · past Alice's",
                isBest: true,
                distance: "64",
                time: "2h 10m",
                climb: "2,400",
                scenic: "9.2"
            ),
            weatherTimeline: [
                WeatherEntry(hour: "9A", condition: .clear, temp: "62°"),
                WeatherEntry(hour: "10", condition: .clear, temp: "64°"),
                WeatherEntry(hour: "11", condition: .clear, temp: "67°"),
                WeatherEntry(hour: "12", condition: .clear, temp: "71°"),
                WeatherEntry(hour: "1P", condition: .clear, temp: "73°"),
                WeatherEntry(hour: "2P", condition: .clear, temp: "71°"),
            ],
            timeRange: ("9 AM", "2 PM"),
            coordinates: [
                LatLng(lat: 37.7749, lon: -122.4194),
                LatLng(lat: 37.7849, lon: -122.4094),
                LatLng(lat: 37.7949, lon: -122.3994),
                LatLng(lat: 37.8049, lon: -122.3894),
                LatLng(lat: 37.8149, lon: -122.3794),
                LatLng(lat: 37.8249, lon: -122.3694),
                LatLng(lat: 37.8349, lon: -122.3594),
            ]
        )
    }
}

// MARK: - Data Models

public struct RouteDetailsData: @unchecked Sendable, Equatable {
    public let route: RouteDetails
    public let weatherTimeline: [WeatherEntry]
    public let timeRange: (String, String)
    public let coordinates: [LatLng]
    public init(
        route: RouteDetails,
        weatherTimeline: [WeatherEntry],
        timeRange: (String, String),
        coordinates: [LatLng]
    ) {
        self.route = route
        self.weatherTimeline = weatherTimeline
        self.timeRange = timeRange
        self.coordinates = coordinates
    }

    public static func == (lhs: RouteDetailsData, rhs: RouteDetailsData) -> Bool {
        lhs.route == rhs.route &&
            lhs.weatherTimeline == rhs.weatherTimeline &&
            lhs.timeRange.0 == rhs.timeRange.0 &&
            lhs.timeRange.1 == rhs.timeRange.1 &&
            lhs.coordinates == rhs.coordinates
    }
}
