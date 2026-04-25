package com.laneshadow.sandbox.mockproviders

/**
 * Mock provider for Error screen data.
 *
 * Provides navigator error and recovery suggestions
 * for the Error/recovery screen.
 */
object ErrorMockProvider : MockProvider<ErrorScreenState> {

    override val variants: List<String> = listOf("default", "empty", "overflow", "long-copy")

    override fun value(variant: String): ErrorScreenState {
        return when (variant) {
            "empty" -> emptyState()
            "overflow" -> overflowState()
            "long-copy" -> longCopyState()
            else -> defaultState()
        }
    }

    private fun defaultState(): ErrorScreenState {
        return ErrorScreenState(
            error = NavigatorError(
                title = "THE NAVIGATOR",
                body = "Couldn't stitch that one together — the segment through Lucia looked broken.",
                detail = "Try a different end point, or let me route you inland via Carmel Valley Rd instead?"
            ),
            suggestions = listOf(
                SuggestionChip(id = "chip-001", label = "Try inland"),
                SuggestionChip(id = "chip-002", label = "End at Big Sur")
            )
        )
    }

    private fun emptyState(): ErrorScreenState {
        return ErrorScreenState(
            error = NavigatorError(
                title = "THE NAVIGATOR",
                body = "An error occurred.",
                detail = null
            ),
            suggestions = emptyList()
        )
    }

    private fun overflowState(): ErrorScreenState {
        return ErrorScreenState(
            error = NavigatorError(
                title = "THE NAVIGATOR",
                body = "Multiple routing errors detected. Several road segments appear to be closed or inaccessible.",
                detail = "I found 5 alternative approaches. You can also try adjusting your route parameters."
            ),
            suggestions = listOf(
                SuggestionChip(id = "chip-001", label = "Try inland"),
                SuggestionChip(id = "chip-002", label = "End at Big Sur"),
                SuggestionChip(id = "chip-003", label = "Use Highway 1"),
                SuggestionChip(id = "chip-004", label = "Go around"),
                SuggestionChip(id = "chip-005", label = "Start earlier"),
                SuggestionChip(id = "chip-006", label = "Shorter route"),
                SuggestionChip(id = "chip-007", label = "Easier roads"),
                SuggestionChip(id = "chip-008", label = "Skip climbs"),
                SuggestionChip(id = "chip-009", label = "Add stops"),
                SuggestionChip(id = "chip-010", label = "Change time"),
                SuggestionChip(id = "chip-011", label = "Different day"),
                SuggestionChip(id = "chip-012", label = "Start over")
            )
        )
    }

    private fun longCopyState(): ErrorScreenState {
        return ErrorScreenState(
            error = NavigatorError(
                title = "THE NAVIGATOR",
                body = "I encountered a significant routing problem while attempting to construct your requested route. The specific issue is that the road segment through the town of Lucia appears to be either closed for maintenance or permanently inaccessible, which prevents me from creating a continuous route through that section of the coastline. This is a known bottleneck on Highway 1 that frequently causes routing disruptions.",
                detail = "I have identified several alternative approaches that might work for you. The most reliable option would be to route inland via Carmel Valley Road, which will take you through beautiful wine country and rejoin the coast further south. Alternatively, you could consider ending your ride at Big Sur or starting from a different point north of the closure."
            ),
            suggestions = listOf(
                SuggestionChip(
                    id = "chip-001",
                    label = "Try inland via Carmel Valley Road through wine country"
                ),
                SuggestionChip(
                    id = "chip-002",
                    label = "End at Big Sur with dinner at the famous restaurant"
                ),
                SuggestionChip(
                    id = "chip-003",
                    label = "Start from north of the closure at Point Sur"
                )
            )
        )
    }
}
