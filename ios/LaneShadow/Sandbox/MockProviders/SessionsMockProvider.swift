import Foundation

/// Mock provider for Sessions screen data.
///
/// Provides a list of past and active sessions
/// for the Sessions/history screen.
public enum SessionsMockProvider: MockProvider {
    public static let variants = ["default", "empty", "overflow", "long-copy"]

    public static func value(variant: String = "default") -> SessionsScreenState {
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

    private static func defaultState() -> SessionsScreenState {
        SessionsScreenState(
            sessions: [
                Session(
                    id: "session-003",
                    title: "Santa Cruz loop",
                    preview: "Twisty roads down to Santa Cruz and back via 9",
                    meta: "3 routes · Active",
                    when: "Now",
                    active: true,
                    routeIds: ["route-001", "route-002", "route-003"],
                    createdAt: "2025-04-25T10:30:00Z"
                ),
                Session(
                    id: "session-002",
                    title: "Big Sur weekend",
                    preview: "Coastal cruise with overnight stay",
                    meta: "2 routes",
                    when: "Tue",
                    active: false,
                    routeIds: ["route-004", "route-005"],
                    createdAt: "2025-04-22T14:20:00Z"
                ),
                Session(
                    id: "session-001",
                    title: "Wine country tour",
                    preview: "Napa Valley backroads",
                    meta: "4 routes",
                    when: "Apr 12",
                    active: false,
                    routeIds: ["route-006", "route-007", "route-008", "route-009"],
                    createdAt: "2025-04-12T09:15:00Z"
                ),
            ],
            activeSessionId: "session-003"
        )
    }

    private static func emptyState() -> SessionsScreenState {
        SessionsScreenState(
            sessions: [],
            activeSessionId: nil
        )
    }

    private static func overflowState() -> SessionsScreenState {
        var sessions: [Session] = []

        let titles = [
            "Morning mountain run", "Coastal sunset cruise", "Wine country tour",
            "Redwood forest adventure", "Desert loop", "City escape",
            "Border run", "Pass storm chasing", "Peak bagging",
            "Valley cruise", "River road romp", "Lake loop tour",
        ]

        for (index, title) in titles.enumerated() {
            sessions.append(Session(
                id: "session-\(String(format: "%03d", index + 1))",
                title: title,
                preview: "Preview text for \(title.lowercased()) with some detail about the route",
                meta: "\(index + 1) route\(index == 0 ? "" : "s")",
                when: index < 3 ? "Now" : (index < 6 ? "Tue" : "Apr \(12 - index % 10)"),
                active: index == 0,
                routeIds: Array((1 ... index + 1).map { "route-\(String(format: "%03d", $0))" }),
                createdAt: "2025-04-25T10:30:00Z"
            ))
        }

        return SessionsScreenState(
            sessions: sessions,
            activeSessionId: "session-001"
        )
    }

    private static func longCopyState() -> SessionsScreenState {
        SessionsScreenState(
            sessions: [
                Session(
                    id: "session-003",
                    title: "Santa Cruz Coastal Loop with Technical Mountain Passes and Scenic Overlooks",
                    preview: "An epic adventure featuring the finest twisty roads leading down to Santa Cruz, including the legendary Stage Road with its perfectly engineered decreasing-radius corners, followed by a return journey via Highway 9 through redwood forests",
                    meta: "3 meticulously planned routes · Currently Active",
                    when: "Now",
                    active: true,
                    routeIds: ["route-001", "route-002", "route-003"],
                    createdAt: "2025-04-25T10:30:00Z"
                ),
                Session(
                    id: "session-002",
                    title: "Big Sur Weekend Adventure with Luxury Accommodations and Fine Dining",
                    preview: "A comprehensive two-day coastal cruiser featuring overnight accommodation at the historic Ventana Big Sur resort, with carefully planned stops at scenic overlooks, art galleries, and the world-famous Nepenthe restaurant perched cliffside above the Pacific Ocean",
                    meta: "2 distinct route options for each day",
                    when: "Tue",
                    active: false,
                    routeIds: ["route-004", "route-005"],
                    createdAt: "2025-04-22T14:20:00Z"
                ),
                Session(
                    id: "session-001",
                    title: "Napa Valley Wine Country Tour featuring Premium Tastings and Vineyard Lunches",
                    preview: "An exclusive curated journey through Napa Valley's most prestigious wineries, including private tastings at Opus One, Dominus, and Screaming Eagle, with a specially planned route through the Silverado Trail and lunch at the French Laundry",
                    meta: "4 unique routes covering different AVAs",
                    when: "Apr 12",
                    active: false,
                    routeIds: ["route-006", "route-007", "route-008", "route-009"],
                    createdAt: "2025-04-12T09:15:00Z"
                ),
            ],
            activeSessionId: "session-003"
        )
    }
}
