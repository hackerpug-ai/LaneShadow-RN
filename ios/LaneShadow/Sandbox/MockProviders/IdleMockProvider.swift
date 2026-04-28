import Foundation

/// Mock provider for Idle screen data.
///
/// Provides greeting, suggestion chips, and location context
/// for the Idle/Welcome screen.
public enum IdleMockProvider: MockProvider {
    public static let variants = [
        "default",
        "empty",
        "overflow",
        "long-copy",
        "v-no-location",
        "v-first-ride",
        "v-weather-advisory",
    ]

    /// Singleton instances for convenience
    public static var `default`: IdleMockProvider.Type {
        IdleMockProvider.self
    }

    public static func value(variant: String = "default") -> IdleScreenState {
        switch variant {
        case "empty":
            emptyState()
        case "overflow":
            overflowState()
        case "long-copy":
            longCopyState()
        case "v-no-location":
            noLocationState()
        case "v-first-ride":
            firstRideState()
        case "v-weather-advisory":
            weatherAdvisoryState()
        default:
            defaultState()
        }
    }

    private static func defaultState() -> IdleScreenState {
        IdleScreenState(
            greeting: Greeting(
                meta: "FRIDAY · 68°F · CLEAR",
                headline: "Where are we riding today?",
                emphasis: "today"
            ),
            suggestions: [
                MockSuggestionChip(id: "chip-001", label: "Twisty back roads"),
                MockSuggestionChip(id: "chip-002", label: "Coastal cruise"),
                MockSuggestionChip(id: "chip-003", label: "Half-day loop"),
                MockSuggestionChip(id: "chip-004", label: "Mountain passes"),
            ],
            locationContext: MockLocationContext(
                label: "Near Santa Cruz, CA",
                mode: "manual"
            ),
            showFavoritePins: true
        )
    }

    private static func emptyState() -> IdleScreenState {
        IdleScreenState(
            greeting: Greeting(
                meta: "FRIDAY · 68°F · CLEAR",
                headline: "Where are we riding today?",
                emphasis: "today"
            ),
            suggestions: [],
            locationContext: MockLocationContext(
                label: "Near Santa Cruz, CA",
                mode: "auto"
            ),
            showFavoritePins: true
        )
    }

    private static func overflowState() -> IdleScreenState {
        IdleScreenState(
            greeting: Greeting(
                meta: "FRIDAY · 68°F · CLEAR",
                headline: "Where are we riding today?",
                emphasis: "today"
            ),
            suggestions: [
                MockSuggestionChip(id: "chip-001", label: "Twisty back roads"),
                MockSuggestionChip(id: "chip-002", label: "Coastal cruise"),
                MockSuggestionChip(id: "chip-003", label: "Half-day loop"),
                MockSuggestionChip(id: "chip-004", label: "Mountain passes"),
                MockSuggestionChip(id: "chip-005", label: "Mountain pass"),
                MockSuggestionChip(id: "chip-006", label: "Valley roads"),
                MockSuggestionChip(id: "chip-007", label: "Forest trails"),
                MockSuggestionChip(id: "chip-008", label: "Ocean views"),
                MockSuggestionChip(id: "chip-009", label: "Wine country"),
                MockSuggestionChip(id: "chip-010", label: "Historic towns"),
                MockSuggestionChip(id: "chip-011", label: "Waterfall route"),
                MockSuggestionChip(id: "chip-012", label: "Sunset spot"),
            ],
            locationContext: MockLocationContext(
                label: "Near Santa Cruz, CA",
                mode: "manual"
            ),
            showFavoritePins: true
        )
    }

    private static func longCopyState() -> IdleScreenState {
        let longMeta = "FRIDAY · APRIL 25TH · 68 DEGREES FAHRENHEIT · CLEAR SKIES WITH " +
            "UNLIMITED VISIBILITY AND PERFECT RIDING CONDITIONS"
        let longHeadline = "Where are we riding on this beautiful and absolutely perfect " +
            "day for a motorcycle adventure?"
        return IdleScreenState(
            greeting: Greeting(
                meta: longMeta,
                headline: longHeadline,
                emphasis: "today"
            ),
            suggestions: [
                MockSuggestionChip(
                    id: "chip-001",
                    label: "Twisty back roads with elevation changes and technical corners"
                ),
                MockSuggestionChip(
                    id: "chip-002",
                    label: "Scenic coastal cruise with panoramic ocean views and photo opportunities"
                ),
                MockSuggestionChip(
                    id: "chip-003",
                    label: "Half-day loop routes through valleys and farmland with gentle curves"
                ),
                MockSuggestionChip(
                    id: "chip-004",
                    label: "Mountain passes with dinner at the famous restaurant overlooking the Pacific"
                ),
            ],
            locationContext: MockLocationContext(
                label: "Near Santa Cruz, California, United States of America, North America",
                mode: "manual"
            ),
            showFavoritePins: true
        )
    }

    // MARK: - V01: No Location

    private static func noLocationState() -> IdleScreenState {
        IdleScreenState(
            greeting: Greeting(
                meta: "Friday · Set a start",
                headline: "Where are we starting from?",
                emphasis: "starting"
            ),
            suggestions: [],
            locationContext: MockLocationContext(
                label: "Tap to set start",
                mode: "needed"
            ),
            showFavoritePins: false
        )
    }

    // MARK: - V02: First Ride

    private static func firstRideState() -> IdleScreenState {
        IdleScreenState(
            greeting: Greeting(
                meta: "Friday · 68°F · Clear",
                headline: "Where are we riding today?",
                emphasis: "today"
            ),
            suggestions: [
                MockSuggestionChip(id: "chip-001", label: "Short & scenic"),
                MockSuggestionChip(id: "chip-002", label: "Learn the roads"),
                MockSuggestionChip(id: "chip-003", label: "Half-day loop"),
                MockSuggestionChip(id: "chip-004", label: "Mountain views"),
            ],
            locationContext: MockLocationContext(
                label: "Near Santa Cruz, CA",
                mode: "auto"
            ),
            showFavoritePins: false // No favorites on first ride
        )
    }

    // MARK: - V03: Weather Advisory

    private static func weatherAdvisoryState() -> IdleScreenState {
        IdleScreenState(
            greeting: Greeting(
                meta: "Friday · 54°F · Heavy rain",
                headline: "Not the prettiest day for it.",
                emphasis: "prettiest"
            ),
            suggestions: [
                MockSuggestionChip(id: "chip-001", label: "Under 30 min"),
                MockSuggestionChip(id: "chip-002", label: "Stay near town"),
                MockSuggestionChip(id: "chip-003", label: "Cafés only"),
            ],
            locationContext: MockLocationContext(
                label: "Near Santa Cruz, CA",
                mode: "auto"
            ),
            showFavoritePins: true,
            weatherAdvisory: WeatherAdvisory(
                label: "Weather advisory",
                body: "I can still plan something, but shorter loops near home will beat anything with a pass today."
            )
        )
    }
}
