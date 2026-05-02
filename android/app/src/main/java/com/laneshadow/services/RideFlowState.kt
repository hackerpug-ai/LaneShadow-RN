package com.laneshadow.services

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
        val sessionId: String?,
        val message: String,
        val timestamp: Long,
    ) : RideFlowState

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
