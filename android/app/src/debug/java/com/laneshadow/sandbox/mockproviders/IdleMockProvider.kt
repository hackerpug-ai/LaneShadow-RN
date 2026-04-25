package com.laneshadow.sandbox.mockproviders

/**
 * Mock provider for Idle screen data.
 *
 * Provides greeting, suggestion chips, and location context
 * for the Idle/Welcome screen.
 */
object IdleMockProvider : MockProvider<IdleScreenState> {

    override val variants: List<String> = listOf("default", "empty", "overflow", "long-copy")

    override fun value(variant: String): IdleScreenState {
        return when (variant) {
            "empty" -> emptyState()
            "overflow" -> overflowState()
            "long-copy" -> longCopyState()
            else -> defaultState()
        }
    }

    private fun defaultState(): IdleScreenState {
        return IdleScreenState(
            greeting = Greeting(
                meta = "FRIDAY · 68°F · CLEAR",
                headline = "Where are we riding today?",
                emphasis = "today"
            ),
            suggestions = listOf(
                SuggestionChip(id = "chip-001", label = "Twisty back roads"),
                SuggestionChip(id = "chip-002", label = "Coastal cruise"),
                SuggestionChip(id = "chip-003", label = "Try inland"),
                SuggestionChip(id = "chip-004", label = "End at Big Sur")
            ),
            locationContext = LocationContext(
                label = "Near Santa Cruz, CA",
                mode = "auto"
            )
        )
    }

    private fun emptyState(): IdleScreenState {
        return IdleScreenState(
            greeting = Greeting(
                meta = "FRIDAY · 68°F · CLEAR",
                headline = "Where are we riding today?",
                emphasis = "today"
            ),
            suggestions = emptyList(),
            locationContext = LocationContext(
                label = "Near Santa Cruz, CA",
                mode = "auto"
            )
        )
    }

    private fun overflowState(): IdleScreenState {
        return IdleScreenState(
            greeting = Greeting(
                meta = "FRIDAY · 68°F · CLEAR",
                headline = "Where are we riding today?",
                emphasis = "today"
            ),
            suggestions = listOf(
                SuggestionChip(id = "chip-001", label = "Twisty back roads"),
                SuggestionChip(id = "chip-002", label = "Coastal cruise"),
                SuggestionChip(id = "chip-003", label = "Try inland"),
                SuggestionChip(id = "chip-004", label = "End at Big Sur"),
                SuggestionChip(id = "chip-005", label = "Mountain pass"),
                SuggestionChip(id = "chip-006", label = "Valley roads"),
                SuggestionChip(id = "chip-007", label = "Forest trails"),
                SuggestionChip(id = "chip-008", label = "Ocean views"),
                SuggestionChip(id = "chip-009", label = "Wine country"),
                SuggestionChip(id = "chip-010", label = "Historic towns"),
                SuggestionChip(id = "chip-011", label = "Waterfall route"),
                SuggestionChip(id = "chip-012", label = "Sunset spot")
            ),
            locationContext = LocationContext(
                label = "Near Santa Cruz, CA",
                mode = "auto"
            )
        )
    }

    private fun longCopyState(): IdleScreenState {
        return IdleScreenState(
            greeting = Greeting(
                meta = "FRIDAY · APRIL 25TH · 68 DEGREES FAHRENHEIT · CLEAR SKIES WITH UNLIMITED VISIBILITY AND PERFECT RIDING CONDITIONS",
                headline = "Where are we riding on this beautiful and absolutely perfect day for a motorcycle adventure?",
                emphasis = "today"
            ),
            suggestions = listOf(
                SuggestionChip(
                    id = "chip-001",
                    label = "Twisty back roads with elevation changes and technical corners"
                ),
                SuggestionChip(
                    id = "chip-002",
                    label = "Scenic coastal cruise with panoramic ocean views and photo opportunities"
                ),
                SuggestionChip(
                    id = "chip-003",
                    label = "Try inland routes through valleys and farmland with gentle curves"
                ),
                SuggestionChip(
                    id = "chip-004",
                    label = "End at Big Sur with dinner at the famous restaurant overlooking the Pacific"
                )
            ),
            locationContext = LocationContext(
                label = "Near Santa Cruz, California, United States of America, North America",
                mode = "auto"
            )
        )
    }
}
