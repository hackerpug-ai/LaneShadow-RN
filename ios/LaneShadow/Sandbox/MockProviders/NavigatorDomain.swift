import Foundation

// ============================================================================
// MARK: - Core Navigator Entities

// ============================================================================

/// User entity - mirrors Convex User read type
public struct User: Sendable, Equatable {
    public let id: String
    public let name: String
    public let handle: String
    public let avatarUrl: String?
    public let bio: String?

    public init(
        id: String,
        name: String,
        handle: String,
        avatarUrl: String? = nil,
        bio: String? = nil
    ) {
        self.id = id
        self.name = name
        self.handle = handle
        self.avatarUrl = avatarUrl
        self.bio = bio
    }
}

/// Route entity - mirrors Convex Route read type with Navigator extensions
public struct Route: Sendable, Equatable {
    public let id: String
    public let name: String // e.g. "The Skyline Spine"
    public let via: String // e.g. "280 → 92 → Skyline to Alice's"
    public let distance: Int // meters
    public let estimatedTime: Int // seconds
    public let climb: Int // feet
    public let scenicScore: Int // 0-10; UI shows ⌈scenicScore/2⌉ dots out of 5
    public let difficulty: String // "easy" | "moderate" | "advanced"
    public let polyline: String // encoded polyline
    public let variant: String? // "best" | "alt1" | "alt2"

    public init(
        id: String,
        name: String,
        via: String,
        distance: Int,
        estimatedTime: Int,
        climb: Int,
        scenicScore: Int,
        difficulty: String,
        polyline: String,
        variant: String? = nil
    ) {
        self.id = id
        self.name = name
        self.via = via
        self.distance = distance
        self.estimatedTime = estimatedTime
        self.climb = climb
        self.scenicScore = scenicScore
        self.difficulty = difficulty
        self.polyline = polyline
        self.variant = variant
    }
}

/// Session entity for Navigator screen state
public struct Session: Sendable, Equatable, Identifiable {
    public let id: String
    public let title: String // e.g. "Santa Cruz loop"
    public let preview: String // last user prompt
    public let meta: String // e.g. "3 routes · Active"
    public let when: String // relative label ("Now", "Tue", "Apr 12")
    public let active: Bool // currently-focused session
    public let routeIds: [String] // pointers into Route fixtures
    public let createdAt: String // ISO 8601

    public init(
        id: String,
        title: String,
        preview: String,
        meta: String,
        when: String,
        active: Bool,
        routeIds: [String],
        createdAt: String
    ) {
        self.id = id
        self.title = title
        self.preview = preview
        self.meta = meta
        self.when = when
        self.active = active
        self.routeIds = routeIds
        self.createdAt = createdAt
    }
}

/// Navigator message - the chat interface between user and Navigator
public struct NavigatorMessage: Sendable, Equatable {
    public let id: String
    public let sessionId: String // references Session.id
    public let body: String // Navigator's prose response
    public let timestamp: String // ISO 8601
    public let kind: String // "prompt" | "response" | "error"
    public let attachments: [RouteAttachment]? // present when kind == "response"
    public let detail: String? // optional secondary text
    public let pinned: Bool // sticky response

    public init(
        id: String,
        sessionId: String,
        body: String,
        timestamp: String,
        kind: String,
        attachments: [RouteAttachment]? = nil,
        detail: String? = nil,
        pinned: Bool = false
    ) {
        self.id = id
        self.sessionId = sessionId
        self.body = body
        self.timestamp = timestamp
        self.kind = kind
        self.attachments = attachments
        self.detail = detail
        self.pinned = pinned
    }
}

/// Route attachment - a route card attached to a Navigator message
public struct RouteAttachment: Sendable, Equatable {
    public let routeId: String // pointer into Route fixtures
    public let variant: String // "best" | "alt1" | "alt2"
    public let isBest: Bool // renders LSBestBadge
    public let weather: WeatherSummary // route-level forecast
    public let scenic: Int // 1-5 dot meter count
    public let includesFavorite: Bool? // triggers call-out
    public let includesFavoriteLabel: String? // call-out text

    public init(
        routeId: String,
        variant: String,
        isBest: Bool,
        weather: WeatherSummary,
        scenic: Int,
        includesFavorite: Bool? = nil,
        includesFavoriteLabel: String? = nil
    ) {
        self.routeId = routeId
        self.variant = variant
        self.isBest = isBest
        self.weather = weather
        self.scenic = scenic
        self.includesFavorite = includesFavorite
        self.includesFavoriteLabel = includesFavoriteLabel
    }
}

/// Weather summary for route conditions
public struct WeatherSummary: Sendable, Equatable {
    public let condition: String // "clear" | "rain" | "wind" | "storm" | "hot" | "cold"
    public let label: String // e.g. "Clear", "Rain 3pm", "18mph NW"

    public init(condition: String, label: String) {
        self.condition = condition
        self.label = label
    }
}

/// Weather timeline entry for hourly forecasts
public struct WeatherTimelineEntry: Sendable, Equatable {
    public let hour: String // "9", "10", "11", ...
    public let temperature: Int // °F
    public let condition: String // WeatherSummary condition

    public init(hour: String, temperature: Int, condition: String) {
        self.hour = hour
        self.temperature = temperature
        self.condition = condition
    }
}

/// Planning phase data for mock providers (avoiding conflict with LSPhaseIndicator.PlanningPhase)
public struct PlanningPhaseData: Sendable, Equatable {
    public let id: String // "reading" | "sketching" | "validating" | "weather" | "building"
    public let label: String // e.g. "Reading your ride"
    public let status: String // "pending" | "active" | "done"

    public init(id: String, label: String, status: String) {
        self.id = id
        self.label = label
        self.status = status
    }
}

/// Suggestion chip for chat input (namespaced to avoid conflict with LSChatInput.SuggestionChip)
public struct MockSuggestionChip: Sendable, Equatable {
    public let id: String
    public let label: String // e.g. "Twisty back roads"

    public init(id: String, label: String) {
        self.id = id
        self.label = label
    }
}

/// Location context for the location badge (namespaced to avoid conflict with LSChatInput.LocationContext)
public struct MockLocationContext: Sendable, Equatable {
    public let label: String // e.g. "Near Santa Cruz, CA"
    public let mode: String // "auto" | "manual"

    public init(label: String, mode: String) {
        self.label = label
        self.mode = mode
    }
}

// ============================================================================
// MARK: - Screen State Containers

// ============================================================================

/// Idle screen state
public struct IdleScreenState: Sendable, Equatable {
    public let greeting: Greeting
    public let suggestions: [MockSuggestionChip]
    public let locationContext: MockLocationContext

    public init(
        greeting: Greeting,
        suggestions: [MockSuggestionChip],
        locationContext: MockLocationContext
    ) {
        self.greeting = greeting
        self.suggestions = suggestions
        self.locationContext = locationContext
    }
}

/// Greeting for idle screen
public struct Greeting: Sendable, Equatable {
    public let meta: String // e.g. "FRIDAY · 68°F · CLEAR"
    public let headline: String // e.g. "Where are we riding today?"
    public let emphasis: String? // substring to italicize (e.g. "today")

    public init(meta: String, headline: String, emphasis: String? = nil) {
        self.meta = meta
        self.headline = headline
        self.emphasis = emphasis
    }
}

/// Planning screen state
public struct PlanningScreenState: Sendable, Equatable {
    public let phases: [PlanningPhaseData]
    public let message: NavigatorMessage
    public let isThinking: Bool

    public init(
        phases: [PlanningPhaseData],
        message: NavigatorMessage,
        isThinking: Bool
    ) {
        self.phases = phases
        self.message = message
        self.isThinking = isThinking
    }
}

/// Route results screen state
public struct RouteResultsScreenState: Sendable, Equatable {
    public let message: NavigatorMessage
    public let routes: [Route]
    public let selectedRouteId: String?

    public init(
        message: NavigatorMessage,
        routes: [Route],
        selectedRouteId: String?
    ) {
        self.message = message
        self.routes = routes
        self.selectedRouteId = selectedRouteId
    }
}

/// Route details screen state
public struct RouteDetailsScreenState: Sendable, Equatable {
    public let route: Route
    public let weatherTimeline: [WeatherTimelineEntry]

    public init(
        route: Route,
        weatherTimeline: [WeatherTimelineEntry]
    ) {
        self.route = route
        self.weatherTimeline = weatherTimeline
    }
}

/// Sessions screen state
public struct SessionsScreenState: Sendable, Equatable {
    public let sessions: [Session]
    public let activeSessionId: String?

    public init(
        sessions: [Session],
        activeSessionId: String?
    ) {
        self.sessions = sessions
        self.activeSessionId = activeSessionId
    }
}

/// Error screen state
public struct ErrorScreenState: Sendable, Equatable {
    public let error: NavigatorError
    public let suggestions: [MockSuggestionChip]

    public init(
        error: NavigatorError,
        suggestions: [MockSuggestionChip]
    ) {
        self.error = error
        self.suggestions = suggestions
    }
}

/// Navigator error for error screen
public struct NavigatorError: Sendable, Equatable {
    public let title: String
    public let body: String // e.g. "Couldn't stitch that one together"
    public let detail: String? // e.g. "Try a different end point"

    public init(
        title: String = "THE NAVIGATOR",
        body: String,
        detail: String? = nil
    ) {
        self.title = title
        self.body = body
        self.detail = detail
    }
}
