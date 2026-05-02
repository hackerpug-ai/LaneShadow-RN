import Foundation

extension RouteResultsMockProvider {
    static let standardSessionId = "session-001"
    static let standardTimestamp = "2025-04-25T10:31:00Z"
    static let standardSelectedRouteId = "route-001"

    static let defaultMessageBody = "Found 3 great routes for your coastal adventure. " +
        "The Skyline Spine offers the best technical riding with sweeping mountain vistas."
    static let defaultMessageDetail = "All routes avoid current roadwork on Highway 1."
    static let emptyMessageBody = "Couldn't find any routes matching your criteria."
    static let emptyMessageDetail = "Try adjusting your start or end points."
    static let overflowMessageBody = "Found 12 different route options for your ride! " +
        "From easy coastal cruises to challenging mountain passes, " +
        "there's something for every riding style today."
    static let overflowMessageDetail = "Routes sorted by scenic score and technical difficulty."
    static let longCopyMessageBody = "I've completed a comprehensive analysis of all possible routes between " +
        "Santa Cruz and Big Sur, taking into account road conditions, weather patterns, scenic value, " +
        "technical riding enjoyment, and your personal preferences. I found three exceptional options " +
        "that I believe you'll love, each offering a unique riding experience. The first route, which " +
        "I'm calling 'The Skyline Spine,' offers the most technical riding with challenging elevation " +
        "changes and spectacular mountain vistas. The second option is a classic coastal highway experience " +
        "that maximizes ocean views and photo opportunities. The third route balances technical challenge " +
        "with scenic beauty, winding through redwood forests before emerging at the coast."
    static let longCopyMessageDetail = "All routes have been verified against current Caltrans road closures " +
        "and construction reports. I've also checked recent motorcycle forum posts for real-world surface " +
        "condition updates."
    static let standardFavoriteLabel = "Includes your favorite: Stage Road"
    static let longCopyFavoriteLabel = "Includes your absolute favorite: Stage Road " +
        "with its perfect sequence of decreasing-radius corners"
    static let s02MessageBody = "I found 3 great routes. You selected the Coastal Highway Classic — " +
        "it's a bit shorter but still has fantastic ocean views."
    static let s04MessageBody = "Refining your route preferences..."
    static let s04MessageDetail = "Adjusting routes based on your feedback."
    static let standardRouteCoordinates = [
        LatLng(lat: 37.7749, lon: -122.4194),
        LatLng(lat: 37.7849, lon: -122.4094),
        LatLng(lat: 37.7949, lon: -122.3994),
    ]

    static func defaultState() -> RouteResultsScreenState {
        state(
            message: navigatorMessage(
                id: "msg-002",
                body: defaultMessageBody,
                attachments: standardAttachments(),
                detail: defaultMessageDetail,
                pinned: true
            ),
            routes: standardRoutes(),
            selectedRouteId: standardSelectedRouteId
        )
    }

    static func emptyState() -> RouteResultsScreenState {
        state(
            message: navigatorMessage(
                id: "msg-002",
                body: emptyMessageBody,
                kind: "error",
                detail: emptyMessageDetail
            ),
            routes: [],
            selectedRouteId: nil
        )
    }

    static func overflowState() -> RouteResultsScreenState {
        let routes = overflowRoutes()
        let attachments = overflowAttachments()

        return state(
            message: navigatorMessage(
                id: "msg-002",
                body: overflowMessageBody,
                attachments: attachments,
                detail: overflowMessageDetail,
                pinned: true
            ),
            routes: routes,
            selectedRouteId: standardSelectedRouteId
        )
    }

    static func longCopyState() -> RouteResultsScreenState {
        state(
            message: navigatorMessage(
                id: "msg-002",
                body: longCopyMessageBody,
                attachments: longCopyAttachments(),
                detail: longCopyMessageDetail,
                pinned: true
            ),
            routes: longCopyRoutes(),
            selectedRouteId: standardSelectedRouteId
        )
    }

    static func s02AltSelectedState() -> RouteResultsScreenState {
        state(
            message: navigatorMessage(
                id: "msg-s02",
                body: s02MessageBody,
                attachments: standardAttachments(),
                detail: defaultMessageDetail,
                pinned: true
            ),
            routes: standardRoutes(),
            selectedRouteId: "route-002"
        )
    }

    static func s04RefiningState() -> RouteResultsScreenState {
        state(
            message: navigatorMessage(
                id: "msg-s04",
                body: s04MessageBody,
                kind: "response",
                detail: s04MessageDetail
            ),
            routes: standardRoutes(),
            selectedRouteId: standardSelectedRouteId
        )
    }

    static func v03RecallState() -> RouteResultsScreenState {
        state(
            message: navigatorMessage(
                id: "msg-v03",
                body: defaultMessageBody,
                attachments: standardAttachments(),
                detail: defaultMessageDetail,
                pinned: true
            ),
            routes: standardRoutes(),
            selectedRouteId: standardSelectedRouteId
        )
    }

    static func state(
        message: NavigatorMessage,
        routes: [Route],
        selectedRouteId: String?
    ) -> RouteResultsScreenState {
        RouteResultsScreenState(
            message: message,
            routes: routes,
            selectedRouteId: selectedRouteId,
            routePolylines: routePolylines(
                routeCount: routes.count,
                selectedRouteId: selectedRouteId
            )
        )
    }

    static func navigatorMessage(
        id: String,
        body: String,
        kind: String = "response",
        attachments: [RouteAttachment]? = nil,
        detail: String? = nil,
        pinned: Bool = false
    ) -> NavigatorMessage {
        NavigatorMessage(
            id: id,
            sessionId: standardSessionId,
            body: body,
            timestamp: standardTimestamp,
            kind: kind,
            attachments: attachments,
            detail: detail,
            pinned: pinned
        )
    }

    static func standardRoutes() -> [Route] {
        [
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
        ]
    }

    static func overflowRoutes() -> [Route] {
        (1 ... 12).map { routeIndex in
            Route(
                id: routeId(for: routeIndex),
                name: "Route Option \(routeIndex)",
                via: "Various roads via route \(routeIndex)",
                distance: 40000 + (routeIndex * 2000),
                estimatedTime: 4500 + (routeIndex * 300),
                climb: 2000 + (routeIndex * 200),
                scenicScore: min(10, routeIndex),
                difficulty: routeIndex > 8 ? "advanced" : (routeIndex > 4 ? "moderate" : "easy"),
                polyline: "encoded_polyline_\(routeIndex)",
                variant: routeIndex == 1 ? "best" : "alt\(routeIndex)"
            )
        }
    }

    static func longCopyRoutes() -> [Route] {
        [
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
        ]
    }

    static func standardAttachments() -> [RouteAttachment] {
        [
            routeAttachment(
                routeId: "route-001",
                variant: "best",
                isBest: true,
                weatherCondition: "clear",
                weatherLabel: "Clear",
                scenic: 5,
                includesFavorite: true,
                includesFavoriteLabel: standardFavoriteLabel
            ),
            routeAttachment(
                routeId: "route-002",
                variant: "alt1",
                isBest: false,
                weatherCondition: "clear",
                weatherLabel: "Clear",
                scenic: 4
            ),
            routeAttachment(
                routeId: "route-003",
                variant: "alt2",
                isBest: false,
                weatherCondition: "wind",
                weatherLabel: "18mph NW",
                scenic: 3
            ),
        ]
    }

    static func overflowAttachments() -> [RouteAttachment] {
        (1 ... 12).map { routeIndex in
            routeAttachment(
                routeId: routeId(for: routeIndex),
                variant: routeIndex == 1 ? "best" : "alt\(routeIndex)",
                isBest: routeIndex == 1,
                weatherCondition: routeIndex % 3 == 0 ? "wind" : "clear",
                weatherLabel: routeIndex % 3 == 0 ? "15mph NW" : "Clear",
                scenic: min(5, (routeIndex + 1) / 2),
                includesFavorite: routeIndex == 3,
                includesFavoriteLabel: routeIndex == 3 ? "Includes your favorite" : nil
            )
        }
    }

    static func longCopyAttachments() -> [RouteAttachment] {
        [
            routeAttachment(
                routeId: "route-001",
                variant: "best",
                isBest: true,
                weatherCondition: "clear",
                weatherLabel: "Clear skies all day",
                scenic: 5,
                includesFavorite: true,
                includesFavoriteLabel: longCopyFavoriteLabel
            ),
            routeAttachment(
                routeId: "route-002",
                variant: "alt1",
                isBest: false,
                weatherCondition: "clear",
                weatherLabel: "Clear with light morning fog",
                scenic: 4
            ),
            routeAttachment(
                routeId: "route-003",
                variant: "alt2",
                isBest: false,
                weatherCondition: "wind",
                weatherLabel: "Gusty 18-22mph NW winds afternoon",
                scenic: 3
            ),
        ]
    }

    static func routeAttachment(
        routeId: String,
        variant: String,
        isBest: Bool,
        weatherCondition: String,
        weatherLabel: String,
        scenic: Int,
        includesFavorite: Bool? = nil,
        includesFavoriteLabel: String? = nil
    ) -> RouteAttachment {
        RouteAttachment(
            routeId: routeId,
            variant: variant,
            isBest: isBest,
            weather: WeatherSummary(
                condition: weatherCondition,
                label: weatherLabel
            ),
            scenic: scenic,
            includesFavorite: includesFavorite,
            includesFavoriteLabel: includesFavoriteLabel
        )
    }

    static func routePolylines(
        routeCount: Int,
        selectedRouteId: String?
    ) -> [PolylineData] {
        (0 ..< routeCount).map { routeIndex in
            let currentRouteId = routeId(for: routeIndex)

            return PolylineData(
                coordinates: standardRouteCoordinates,
                variant: routeVariant(for: routeIndex),
                strokeWidth: currentRouteId == selectedRouteId ? .lg : .md,
                lineDasharray: currentRouteId == selectedRouteId ? nil : lsMapPolylineDasharray
            )
        }
    }

    static func routeId(for index: Int) -> String {
        "route-\(String(format: "%03d", index + 1))"
    }

    static func routeVariant(for index: Int) -> RouteVariant {
        switch index {
        case 0:
            .best
        case 1:
            .alt1
        default:
            .alt2
        }
    }
}
