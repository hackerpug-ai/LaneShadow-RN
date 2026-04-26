import Foundation

/// Mock provider for Route Results screen data.
///
/// Provides navigator message, route list, and selected route
/// for the Route Results/route-selection screen.
public enum RouteResultsMockProvider: MockProvider {
    public static let variants = ["default", "empty", "overflow", "long-copy"]

    public static func value(variant: String = "default") -> RouteResultsScreenState {
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

    private static func defaultState() -> RouteResultsScreenState {
        RouteResultsScreenState(
            message: NavigatorMessage(
                id: "msg-002",
                sessionId: "session-001",
                body: "Found 3 great routes for your coastal adventure. The Skyline Spine offers the best technical riding with sweeping mountain vistas.",
                timestamp: "2025-04-25T10:31:00Z",
                kind: "response",
                attachments: [
                    RouteAttachment(
                        routeId: "route-001",
                        variant: "best",
                        isBest: true,
                        weather: WeatherSummary(condition: "clear", label: "Clear"),
                        scenic: 5,
                        includesFavorite: true,
                        includesFavoriteLabel: "Includes your favorite: Stage Road"
                    ),
                    RouteAttachment(
                        routeId: "route-002",
                        variant: "alt1",
                        isBest: false,
                        weather: WeatherSummary(condition: "clear", label: "Clear"),
                        scenic: 4,
                        includesFavorite: nil,
                        includesFavoriteLabel: nil
                    ),
                    RouteAttachment(
                        routeId: "route-003",
                        variant: "alt2",
                        isBest: false,
                        weather: WeatherSummary(condition: "wind", label: "18mph NW"),
                        scenic: 3,
                        includesFavorite: nil,
                        includesFavoriteLabel: nil
                    ),
                ],
                detail: "All routes avoid current roadwork on Highway 1.",
                pinned: true
            ),
            routes: [
                Route(
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
                Route(
                    id: "route-002",
                    name: "Coastal Highway Classic",
                    via: "Highway 1 all the way",
                    distance: 48000,
                    estimatedTime: 5100,
                    climb: 2800,
                    scenicScore: 8,
                    difficulty: "moderate",
                    polyline: "encoded_polyline_here",
                    variant: "alt1"
                ),
                Route(
                    id: "route-003",
                    name: "Valley Loop",
                    via: "9 → 236 → 84 → 1",
                    distance: 55000,
                    estimatedTime: 5700,
                    climb: 3500,
                    scenicScore: 6,
                    difficulty: "moderate",
                    polyline: "encoded_polyline_here",
                    variant: "alt2"
                ),
            ],
            selectedRouteId: "route-001"
        )
    }

    private static func emptyState() -> RouteResultsScreenState {
        RouteResultsScreenState(
            message: NavigatorMessage(
                id: "msg-002",
                sessionId: "session-001",
                body: "Couldn't find any routes matching your criteria.",
                timestamp: "2025-04-25T10:31:00Z",
                kind: "error",
                attachments: nil,
                detail: "Try adjusting your start or end points.",
                pinned: false
            ),
            routes: [],
            selectedRouteId: nil
        )
    }

    private static func overflowState() -> RouteResultsScreenState {
        var routes: [Route] = []
        var attachments: [RouteAttachment] = []

        for i in 1 ... 12 {
            routes.append(Route(
                id: "route-\(String(format: "%03d", i))",
                name: "Route Option \(i)",
                via: "Various roads via route \(i)",
                distance: 40000 + (i * 2000),
                estimatedTime: 4500 + (i * 300),
                climb: 2000 + (i * 200),
                scenicScore: min(10, i),
                difficulty: i > 8 ? "advanced" : (i > 4 ? "moderate" : "easy"),
                polyline: "encoded_polyline_\(i)",
                variant: i == 1 ? "best" : "alt\(i)"
            ))

            attachments.append(RouteAttachment(
                routeId: "route-\(String(format: "%03d", i))",
                variant: i == 1 ? "best" : "alt\(i)",
                isBest: i == 1,
                weather: WeatherSummary(
                    condition: i % 3 == 0 ? "wind" : "clear",
                    label: i % 3 == 0 ? "15mph NW" : "Clear"
                ),
                scenic: min(5, (i + 1) / 2),
                includesFavorite: i == 3,
                includesFavoriteLabel: i == 3 ? "Includes your favorite" : nil
            ))
        }

        return RouteResultsScreenState(
            message: NavigatorMessage(
                id: "msg-002",
                sessionId: "session-001",
                body: "Found 12 different route options for your ride! From easy coastal cruises to challenging mountain passes, there's something for every riding style today.",
                timestamp: "2025-04-25T10:31:00Z",
                kind: "response",
                attachments: attachments,
                detail: "Routes sorted by scenic score and technical difficulty.",
                pinned: true
            ),
            routes: routes,
            selectedRouteId: "route-001"
        )
    }

    private static func longCopyState() -> RouteResultsScreenState {
        RouteResultsScreenState(
            message: NavigatorMessage(
                id: "msg-002",
                sessionId: "session-001",
                body: "I've completed a comprehensive analysis of all possible routes between Santa Cruz and Big Sur, taking into account road conditions, weather patterns, scenic value, technical riding enjoyment, and your personal preferences. I found three exceptional options that I believe you'll love, each offering a unique riding experience. The first route, which I'm calling 'The Skyline Spine,' offers the most technical riding with challenging elevation changes and spectacular mountain vistas. The second option is a classic coastal highway experience that maximizes ocean views and photo opportunities. The third route balances technical challenge with scenic beauty, winding through redwood forests before emerging at the coast.",
                timestamp: "2025-04-25T10:31:00Z",
                kind: "response",
                attachments: [
                    RouteAttachment(
                        routeId: "route-001",
                        variant: "best",
                        isBest: true,
                        weather: WeatherSummary(condition: "clear", label: "Clear skies all day"),
                        scenic: 5,
                        includesFavorite: true,
                        includesFavoriteLabel: "Includes your absolute favorite: Stage Road with its perfect sequence of decreasing-radius corners"
                    ),
                    RouteAttachment(
                        routeId: "route-002",
                        variant: "alt1",
                        isBest: false,
                        weather: WeatherSummary(condition: "clear", label: "Clear with light morning fog"),
                        scenic: 4,
                        includesFavorite: nil,
                        includesFavoriteLabel: nil
                    ),
                    RouteAttachment(
                        routeId: "route-003",
                        variant: "alt2",
                        isBest: false,
                        weather: WeatherSummary(condition: "wind", label: "Gusty 18-22mph NW winds afternoon"),
                        scenic: 3,
                        includesFavorite: nil,
                        includesFavoriteLabel: nil
                    ),
                ],
                detail: "All routes have been verified against current Caltrans road closures and construction reports. I've also checked recent motorcycle forum posts for real-world surface condition updates.",
                pinned: true
            ),
            routes: [
                Route(
                    id: "route-001",
                    name: "The Skyline Spine: A Technical Masterpiece",
                    via: "280 → 92 → Skyline Boulevard → Alice's Restaurant → Stage Road → 84 → 1",
                    distance: 52000,
                    estimatedTime: 5400,
                    climb: 4200,
                    scenicScore: 10,
                    difficulty: "advanced",
                    polyline: "encoded_polyline_here",
                    variant: "best"
                ),
                Route(
                    id: "route-002",
                    name: "Coastal Highway Classic: The Scenic Route",
                    via: "Highway 1 South with detours through Davenport and Pescadero",
                    distance: 48000,
                    estimatedTime: 5100,
                    climb: 2800,
                    scenicScore: 8,
                    difficulty: "moderate",
                    polyline: "encoded_polyline_here",
                    variant: "alt1"
                ),
                Route(
                    id: "route-003",
                    name: "Forest to Coast: The Balanced Experience",
                    via: "9 → 236 through Big Basin → 84 → 1 South",
                    distance: 55000,
                    estimatedTime: 5700,
                    climb: 3500,
                    scenicScore: 6,
                    difficulty: "moderate",
                    polyline: "encoded_polyline_here",
                    variant: "alt2"
                ),
            ],
            selectedRouteId: "route-001"
        )
    }
}
