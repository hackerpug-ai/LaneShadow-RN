package com.laneshadow.services

sealed interface RideFlowAction {
    data class SendMessage(val content: String) : RideFlowAction
    data class PlanningSuccess(val routeOptions: PlannedRouteOptions) : RideFlowAction
    data class PlanningError(val message: String) : RideFlowAction
    data object CancelPlanning : RideFlowAction
    data class SelectRoute(val routeId: String) : RideFlowAction
    data object ViewHistory : RideFlowAction
    data object CloseHistory : RideFlowAction
    data object NavigateExport : RideFlowAction
    data object CloseExport : RideFlowAction
    data object NewSession : RideFlowAction
    data class LoadSession(
        val sessionId: String,
        val routeOptions: PlannedRouteOptions,
        val selectedRouteId: String? = null,
    ) : RideFlowAction
    data object ClearError : RideFlowAction
}
