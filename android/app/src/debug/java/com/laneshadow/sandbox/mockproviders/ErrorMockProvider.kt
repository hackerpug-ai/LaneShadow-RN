package com.laneshadow.sandbox.mockproviders

/**
 * Mock provider for Error screen data.
 *
 * Provides NavigatorError with body, detail, and suggestion chips
 * for the Error/Recovery screen.
 */
object ErrorMockProvider : MockProvider<ErrorScreenState> {

    override val variants: List<String> = listOf(
        "default",
        "network",
        "impossible",
        "safety-gate",
        "long-detail",
        "no-suggestions",
        "s04-recovered",
        "v01-offline",
        "s02-storm-gate"
    )

    override fun value(variant: String): ErrorScreenState {
        return when (variant) {
            "network" -> networkTimeoutState()
            "impossible" -> constraintImpossibleState()
            "safety-gate" -> safetyGateState()
            "long-detail" -> longDetailState()
            "no-suggestions" -> noSuggestionsState()
            "s04-recovered" -> s04RecoveredState()
            "v01-offline" -> v01OfflineState()
            "s02-storm-gate" -> s02StormGateState()
            else -> defaultState()
        }
    }

    /**
     * Default error state — broken segment (per spec S01)
     */
    private fun defaultState(): ErrorScreenState {
        return ErrorScreenState(
            error = NavigatorError(
                title = "THE NAVIGATOR",
                body = "Couldn't stitch that one together — the segment through Lucia looked broken.",
                detail = "Try a different end point, or let me route you inland via Carmel Valley Rd instead?"
            ),
            suggestions = listOf(
                SuggestionChip(id = "chip-inland", label = "Try inland", isPrimary = true),
                SuggestionChip(id = "chip-bigsur", label = "End at Big Sur", isPrimary = false)
            )
        )
    }

    /**
     * Network timeout state (per spec S02)
     */
    private fun networkTimeoutState(): ErrorScreenState {
        return ErrorScreenState(
            error = NavigatorError(
                title = "THE NAVIGATOR",
                body = "I lost the signal mid-thought. Let's try that again when you're back on data.",
                detail = "You're offline. Suggestions below are drawn from your last 14 days of rides."
            ),
            suggestions = listOf(
                SuggestionChip(id = "chip-retry", label = "Retry when online", isPrimary = true),
                SuggestionChip(id = "chip-santa-cruz", label = "Santa Cruz loop (recent)", isPrimary = false),
                SuggestionChip(id = "chip-coast", label = "Coast after dark (recent)", isPrimary = false)
            )
        )
    }

    /**
     * Constraint impossible state (per spec S03)
     */
    private fun constraintImpossibleState(): ErrorScreenState {
        return ErrorScreenState(
            error = NavigatorError(
                title = "THE NAVIGATOR",
                body = "30 miles and no highways between here and Big Sur? The geography says no.",
                detail = "The route you asked for would require teleportation. One of these should loosen it:"
            ),
            suggestions = listOf(
                SuggestionChip(id = "chip-hwy1", label = "Allow Hwy 1", isPrimary = true),
                SuggestionChip(id = "chip-closer", label = "Closer end point", isPrimary = false),
                SuggestionChip(id = "chip-100miles", label = "Open 100 miles", isPrimary = false)
            )
        )
    }

    /**
     * Safety gate state — storm blocking region (per spec S04)
     */
    private fun safetyGateState(): ErrorScreenState {
        return ErrorScreenState(
            error = NavigatorError(
                title = "THE NAVIGATOR",
                body = "Thunderstorm across the entire region. I won't plan a ride through that.",
                detail = "The safety gate blocked every candidate. Weather clears after midnight — I can hold the ask until then."
            ),
            suggestions = listOf(
                SuggestionChip(id = "chip-midnight", label = "Remind me at midnight", isPrimary = true),
                SuggestionChip(id = "chip-tomorrow", label = "Ride tomorrow", isPrimary = false),
                SuggestionChip(id = "chip-indoors", label = "Something indoors", isPrimary = false)
            )
        )
    }

    /**
     * Long detail state (per spec V02)
     */
    private fun longDetailState(): ErrorScreenState {
        return ErrorScreenState(
            error = NavigatorError(
                title = "THE NAVIGATOR",
                body = "Couldn't route a loop that stays under 40 minutes and still touches the coast — you're 52 miles from Hwy 1.",
                detail = "I tried three shapes: a tight coastal-only loop, a start-side detour, and a bluff overlook. Each needed at least 55 minutes one-way. If you can flex the time limit to an hour I have a 58-minute coastal version ready."
            ),
            suggestions = listOf(
                SuggestionChip(id = "chip-60min", label = "Flex to 60 min", isPrimary = true),
                SuggestionChip(id = "chip-skip-coast", label = "Skip the coast", isPrimary = false),
                SuggestionChip(id = "chip-rewrite", label = "Rewrite", isPrimary = false)
            )
        )
    }

    /**
     * No suggestions state — generic failure (per spec V03)
     */
    private fun noSuggestionsState(): ErrorScreenState {
        return ErrorScreenState(
            error = NavigatorError(
                title = "THE NAVIGATOR",
                body = "Something went wrong on my end. I don't have a good suggestion this time.",
                detail = "Please rewrite the ask — a slightly different prompt usually works."
            ),
            suggestions = emptyList()
        )
    }

    /**
     * S04 recovered state — user tapped a suggestion chip
     */
    private fun s04RecoveredState(): ErrorScreenState {
        return ErrorScreenState(
            error = NavigatorError(
                title = "THE NAVIGATOR",
                body = "I lost the signal mid-thought. Let's try that again when you're back on data.",
                detail = "You're offline. Suggestions below are drawn from your last 14 days of rides."
            ),
            suggestions = listOf(
                SuggestionChip(id = "chip-retry", label = "Retry when online", isPrimary = true),
                SuggestionChip(id = "chip-santa-cruz", label = "Santa Cruz loop (recent)", isPrimary = false),
                SuggestionChip(id = "chip-coast", label = "Coast after dark (recent)", isPrimary = false)
            ),
            isRecovered = true
        )
    }

    /**
     * V01 offline state — wifi watermark + dim chat
     */
    private fun v01OfflineState(): ErrorScreenState {
        return ErrorScreenState(
            error = NavigatorError(
                title = "THE NAVIGATOR",
                body = "I lost the signal mid-thought. Let's try that again when you're back on data.",
                detail = "You're offline. Suggestions below are drawn from your last 14 days of rides."
            ),
            suggestions = listOf(
                SuggestionChip(id = "chip-retry", label = "Retry when online", isPrimary = true),
                SuggestionChip(id = "chip-santa-cruz", label = "Santa Cruz loop (recent)", isPrimary = false)
            ),
            isOffline = true
        )
    }

    /**
     * S02 storm-gate variant — wx.storm purple theme
     */
    private fun s02StormGateState(): ErrorScreenState {
        return ErrorScreenState(
            error = NavigatorError(
                title = "THE NAVIGATOR",
                body = "Thunderstorm across the entire region. I won't plan a ride through that.",
                detail = "The safety gate blocked every candidate. Weather clears after midnight — I can hold the ask until then."
            ),
            suggestions = listOf(
                SuggestionChip(id = "chip-midnight", label = "Remind me at midnight", isPrimary = true),
                SuggestionChip(id = "chip-tomorrow", label = "Ride tomorrow", isPrimary = false),
                SuggestionChip(id = "chip-indoors", label = "Something indoors", isPrimary = false)
            ),
            isStormGate = true
        )
    }
}
