import Foundation

/// Mock provider for RouteDetailsScreen template data.
///
/// Provides route details with weather timeline for the
/// RouteDetails/route-inspection template screen.
public enum RouteDetailsMockProvider: MockProvider {
    public static let variants = ["default", "mixedWeather"]

    public static func value(variant: String = "default") -> RouteDetailsData {
        switch variant {
        case "mixedWeather":
            mixedWeatherState()
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
            polyline: "encoded_polyline_here"
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
            polyline: "encoded_polyline_mixed_weather"
        )
    }
}

// MARK: - Data Models

public struct RouteDetailsData: @unchecked Sendable {
    public let route: RouteDetails
    public let weatherTimeline: [WeatherEntry]
    public let timeRange: (String, String)
    public let polyline: String
    public init(
        route: RouteDetails,
        weatherTimeline: [WeatherEntry],
        timeRange: (String, String),
        polyline: String
    ) {
        self.route = route
        self.weatherTimeline = weatherTimeline
        self.timeRange = timeRange
        self.polyline = polyline
    }
}
