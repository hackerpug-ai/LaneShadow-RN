package com.laneshadow.services

/**
 * Canonical planning phase taxonomy.
 *
 * Per SPRINT.md step 2: "parsing → searching → drafting → enriching → finalizing"
 * This enum is the single source of truth for phase names across the Android app.
 *
 * Mapping from legacy labels (for MockProviders migration):
 * - "Reading your ride" → Parsing
 * - "Sketching roads" → Searching
 * - "Validating roads" → Drafting
 * - "Checking conditions" → Enriching
 * - "Building your rides" → Finalizing
 */
enum class Phase {
    Parsing,
    Searching,
    Drafting,
    Enriching,
    Finalizing,
    ;

    companion object {
        /**
         * Label-to-phase map for parsing server status strings.
         * Covers all 5 canonical names (lowercase) per AC-2.
         */
        val LabelMap: Map<String, Phase> = mapOf(
            "parsing" to Parsing,
            "searching" to Searching,
            "drafting" to Drafting,
            "enriching" to Enriching,
            "finalizing" to Finalizing,
        )

        /**
         * Display labels for each phase in UI order.
         */
        val DisplayLabels: List<String> = listOf(
            "Parsing your request",
            "Searching for routes",
            "Drafting options",
            "Enriching details",
            "Finalizing plan",
        )

        /**
         * Parse a server status string to Phase enum.
         * Returns null if the string is not a canonical phase name.
         */
        fun fromLabel(label: String?): Phase? = LabelMap[label?.lowercase()]
    }
}

sealed interface RideFlowState {
    sealed interface WithSession : RideFlowState {
        val sessionId: String
    }

    data class Idle(
        val sessionId: String? = null,
        val routeOptions: PlannedRouteOptions? = null,
        val selectedRouteId: String? = null,
    ) : RideFlowState

    data class Planning(
        override val sessionId: String,
        val planId: String? = null,
        val currentPhase: String = "analyzing",
        val routeOptions: PlannedRouteOptions? = null,
        val selectedRouteId: String? = null,
    ) : RideFlowState, WithSession

    data class Error(
        override val sessionId: String = "",
        val message: String,
        val timestamp: Long,
    ) : RideFlowState, WithSession

    data class RouteResults(
        override val sessionId: String,
        val routeOptions: PlannedRouteOptions,
        val selectedRouteId: String?,
    ) : RideFlowState, WithSession

    data class RouteDetails(
        override val sessionId: String,
        val routeOptions: PlannedRouteOptions,
        val selectedRouteId: String,
    ) : RideFlowState, WithSession

    data class SessionHistory(
        override val sessionId: String,
        val routeOptions: PlannedRouteOptions,
        val selectedRouteId: String?,
    ) : RideFlowState, WithSession

    data class NavigationExport(
        override val sessionId: String,
        val routeOptions: PlannedRouteOptions,
        val selectedRouteId: String,
    ) : RideFlowState, WithSession
}

data class PlannedRouteOptions(
    val planId: String? = null,
    val options: List<RouteOption> = emptyList(),
)

data class RouteOption(
    val routeOptionId: String,
)
