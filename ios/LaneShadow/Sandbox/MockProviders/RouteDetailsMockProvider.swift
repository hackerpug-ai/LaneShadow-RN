import Foundation

/// Mock provider for Route Details screen data.
///
/// Provides a single route with weather timeline
/// for the Route Details/route-inspection screen.
public enum RouteDetailsMockProvider: MockProvider {
    public static let variants = ["default", "empty", "overflow", "long-copy"]

    public static func value(variant: String = "default") -> RouteDetailsScreenState {
        switch variant {
        case "empty":
            emptyState()
        case "overflow":
            overflowState()
        case "long-copy":
            longCopyState()
        default:
            defaultState()
        }
    }

    private static func defaultState() -> RouteDetailsScreenState {
        RouteDetailsScreenState(
            route: Route(
                id: "route-001",
                name: "The Skyline Spine",
                via: "280 → 92 → Skyline to Alice's",
                distance: 52000,
                estimatedTime: 5400,
                climb: 4200,
                scenicScore: 10,
                difficulty: "advanced",
                polyline: "encoded_polyline_here",
                variant: "best"
            ),
            weatherTimeline: [
                WeatherTimelineEntry(hour: "9", temperature: 62, condition: "clear"),
                WeatherTimelineEntry(hour: "10", temperature: 65, condition: "clear"),
                WeatherTimelineEntry(hour: "11", temperature: 68, condition: "clear"),
                WeatherTimelineEntry(hour: "12", temperature: 70, condition: "clear"),
                WeatherTimelineEntry(hour: "13", temperature: 71, condition: "wind"),
                WeatherTimelineEntry(hour: "14", temperature: 70, condition: "wind"),
                WeatherTimelineEntry(hour: "15", temperature: 68, condition: "clear"),
            ]
        )
    }

    private static func emptyState() -> RouteDetailsScreenState {
        RouteDetailsScreenState(
            route: Route(
                id: "route-empty",
                name: "Empty Route",
                via: "No roads selected",
                distance: 0,
                estimatedTime: 0,
                climb: 0,
                scenicScore: 0,
                difficulty: "easy",
                polyline: "",
                variant: nil
            ),
            weatherTimeline: []
        )
    }

    private static func overflowState() -> RouteDetailsScreenState {
        var timeline: [WeatherTimelineEntry] = []
        let conditions = ["clear", "clear", "wind", "wind", "rain", "storm", "hot", "cold"]

        for i in 0 ..< 23 {
            timeline.append(WeatherTimelineEntry(
                hour: "\(i)",
                temperature: 55 + i,
                condition: conditions[i % conditions.count]
            ))
        }

        return RouteDetailsScreenState(
            route: Route(
                id: "route-overflow",
                name: "The Epic All-Day Adventure Route",
                via: "280 → 92 → Skyline → Alice's → Stage → 84 → 1 → PCH → Malibu → Topanga → Mulholland → 405 → 5 → 101 → 154 → 192 → 33 → 1 → PCH → back to start",
                distance: 250_000,
                estimatedTime: 28800,
                climb: 18500,
                scenicScore: 10,
                difficulty: "advanced",
                polyline: "encoded_polyline_very_long",
                variant: "best"
            ),
            weatherTimeline: timeline
        )
    }

    private static func longCopyState() -> RouteDetailsScreenState {
        RouteDetailsScreenState(
            route: Route(
                id: "route-001",
                name: "The Skyline Spine: A Technical Masterpiece of Motorcycle Road Design",
                via: "Starting from the merge of Interstate 280, take Highway 92 west through the rolling hills until it connects with Skyline Boulevard. Follow Skyline south past all the scenic overlooks until you reach the legendary Alice's Restaurant, the quintessential biker gathering spot. Continue south on Skyline until it intersects with Stage Road, where you'll experience one of the most perfectly engineered motorcycle roads in California—decreasing-radius corners, perfect camber, and elevation changes that challenge even the most experienced riders. Finish via Highway 84 west to reconnect with Highway 1 for the final scenic coastal stretch.",
                distance: 52000,
                estimatedTime: 5400,
                climb: 4200,
                scenicScore: 10,
                difficulty: "advanced",
                polyline: "encoded_polyline_here",
                variant: "best"
            ),
            weatherTimeline: [
                WeatherTimelineEntry(
                    hour: "9",
                    temperature: 62,
                    condition: "clear"
                ),
                WeatherTimelineEntry(
                    hour: "10",
                    temperature: 65,
                    condition: "clear"
                ),
                WeatherTimelineEntry(
                    hour: "11",
                    temperature: 68,
                    condition: "clear"
                ),
                WeatherTimelineEntry(
                    hour: "12",
                    temperature: 70,
                    condition: "clear"
                ),
                WeatherTimelineEntry(
                    hour: "13",
                    temperature: 71,
                    condition: "wind"
                ),
                WeatherTimelineEntry(
                    hour: "14",
                    temperature: 70,
                    condition: "wind"
                ),
                WeatherTimelineEntry(
                    hour: "15",
                    temperature: 68,
                    condition: "clear"
                ),
            ]
        )
    }
}
