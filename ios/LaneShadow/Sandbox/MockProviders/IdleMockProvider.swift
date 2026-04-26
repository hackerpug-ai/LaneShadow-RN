//
//  IdleMockProvider.swift
//  LaneShadow
//
//  Mock provider for Idle screen data.
//
//  Provides greeting, suggestion chips, and location context
//  for the Idle/Welcome screen.
//

import Foundation

/// Mock provider for Idle screen data.
///
/// Provides greeting, suggestion chips, and location context
/// for the Idle/Welcome screen.
public enum IdleMockProvider: MockProvider {
    public static let variants = ["default", "empty", "overflow", "long-copy"]

    public static func value(variant: String = "default") -> IdleScreenState {
        switch variant {
        case "empty":
            return emptyState()
        case "overflow":
            return overflowState()
        case "long-copy":
            return longCopyState()
        default:
            return defaultState()
        }
    }

    private static func defaultState() -> IdleScreenState {
        return IdleScreenState(
            greeting: Greeting(
                meta: "FRIDAY · 68°F · CLEAR",
                headline: "Where are we riding today?",
                emphasis: "today"
            ),
            suggestions: [
                MockSuggestionChip(id: "chip-001", label: "Twisty back roads"),
                MockSuggestionChip(id: "chip-002", label: "Coastal cruise"),
                MockSuggestionChip(id: "chip-003", label: "Try inland"),
                MockSuggestionChip(id: "chip-004", label: "End at Big Sur")
            ],
            locationContext: MockLocationContext(
                label: "Near Santa Cruz, CA",
                mode: "auto"
            )
        )
    }

    private static func emptyState() -> IdleScreenState {
        return IdleScreenState(
            greeting: Greeting(
                meta: "FRIDAY · 68°F · CLEAR",
                headline: "Where are we riding today?",
                emphasis: "today"
            ),
            suggestions: [],
            locationContext: MockLocationContext(
                label: "Near Santa Cruz, CA",
                mode: "auto"
            )
        )
    }

    private static func overflowState() -> IdleScreenState {
        return IdleScreenState(
            greeting: Greeting(
                meta: "FRIDAY · 68°F · CLEAR",
                headline: "Where are we riding today?",
                emphasis: "today"
            ),
            suggestions: [
                MockSuggestionChip(id: "chip-001", label: "Twisty back roads"),
                MockSuggestionChip(id: "chip-002", label: "Coastal cruise"),
                MockSuggestionChip(id: "chip-003", label: "Try inland"),
                MockSuggestionChip(id: "chip-004", label: "End at Big Sur"),
                MockSuggestionChip(id: "chip-005", label: "Mountain pass"),
                MockSuggestionChip(id: "chip-006", label: "Valley roads"),
                MockSuggestionChip(id: "chip-007", label: "Forest trails"),
                MockSuggestionChip(id: "chip-008", label: "Ocean views"),
                MockSuggestionChip(id: "chip-009", label: "Wine country"),
                MockSuggestionChip(id: "chip-010", label: "Historic towns"),
                MockSuggestionChip(id: "chip-011", label: "Waterfall route"),
                MockSuggestionChip(id: "chip-012", label: "Sunset spot")
            ],
            locationContext: MockLocationContext(
                label: "Near Santa Cruz, CA",
                mode: "auto"
            )
        )
    }

    private static func longCopyState() -> IdleScreenState {
        return IdleScreenState(
            greeting: Greeting(
                meta: "FRIDAY · APRIL 25TH · 68 DEGREES FAHRENHEIT · CLEAR SKIES WITH UNLIMITED VISIBILITY AND PERFECT RIDING CONDITIONS",
                headline: "Where are we riding on this beautiful and absolutely perfect day for a motorcycle adventure?",
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
                    label: "Try inland routes through valleys and farmland with gentle curves"
                ),
                MockSuggestionChip(
                    id: "chip-004",
                    label: "End at Big Sur with dinner at the famous restaurant overlooking the Pacific"
                )
            ],
            locationContext: MockLocationContext(
                label: "Near Santa Cruz, California, United States of America, North America",
                mode: "auto"
            )
        )
    }
}
