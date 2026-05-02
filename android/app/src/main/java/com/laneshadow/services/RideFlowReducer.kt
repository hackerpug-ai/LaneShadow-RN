package com.laneshadow.services

import java.util.UUID

internal val initialState: RideFlowState = RideFlowState.Idle()

internal fun reduce(state: RideFlowState, action: RideFlowAction): RideFlowState =
    when (state) {
        is RideFlowState.Idle -> handleIdleState(state, action)
        is RideFlowState.Planning -> handlePlanningState(state, action)
        is RideFlowState.Error -> handleErrorState(state, action)
        is RideFlowState.RouteResults -> handleRouteResultsState(state, action)
        is RideFlowState.RouteDetails -> handleRouteDetailsState(state, action)
        is RideFlowState.SessionHistory -> handleSessionHistoryState(state, action)
        is RideFlowState.NavigationExport -> handleNavigationExportState(state, action)
    }

private fun handleIdleState(
    state: RideFlowState.Idle,
    action: RideFlowAction,
): RideFlowState =
    when (action) {
        is RideFlowAction.SendMessage -> {
            if (!canSendMessage(action.content)) {
                state
            } else {
                RideFlowState.Planning(
                    sessionId = generateSessionId(),
                    planId = null,
                    currentPhase = "analyzing",
                    routeOptions = null,
                    selectedRouteId = null,
                )
            }
        }

        is RideFlowAction.LoadSession ->
            RideFlowState.RouteResults(
                sessionId = action.sessionId,
                routeOptions = action.routeOptions,
                selectedRouteId = action.selectedRouteId,
            )

        RideFlowAction.NewSession -> initialState

        else -> state
    }

private fun handlePlanningState(
    state: RideFlowState.Planning,
    action: RideFlowAction,
): RideFlowState =
    when (action) {
        is RideFlowAction.PlanningSuccess ->
            RideFlowState.RouteResults(
                sessionId = state.sessionId,
                routeOptions = action.routeOptions,
                selectedRouteId = action.routeOptions.options.firstOrNull()?.routeOptionId,
            )

        is RideFlowAction.PlanningError ->
            RideFlowState.Error(
                sessionId = state.sessionId,
                message = action.message,
                timestamp = System.currentTimeMillis(),
            )

        RideFlowAction.CancelPlanning ->
            if (state.routeOptions != null) {
                RideFlowState.RouteResults(
                    sessionId = state.sessionId,
                    routeOptions = state.routeOptions,
                    selectedRouteId = state.selectedRouteId,
                )
            } else {
                initialState
            }

        RideFlowAction.NewSession -> initialState

        else -> state
    }

private fun handleErrorState(
    state: RideFlowState.Error,
    action: RideFlowAction,
): RideFlowState =
    when (action) {
        RideFlowAction.ClearError -> initialState

        is RideFlowAction.SendMessage ->
            if (!canSendMessage(action.content)) {
                state
            } else {
                RideFlowState.Planning(
                    sessionId = generateSessionId(),
                    planId = null,
                    currentPhase = "analyzing",
                    routeOptions = null,
                    selectedRouteId = null,
                )
            }

        RideFlowAction.NewSession -> initialState

        else -> state
    }

private fun handleRouteResultsState(
    state: RideFlowState.RouteResults,
    action: RideFlowAction,
): RideFlowState =
    when (action) {
        is RideFlowAction.SendMessage ->
            if (!canSendMessage(action.content)) {
                state
            } else {
                RideFlowState.Planning(
                    sessionId = state.sessionId,
                    planId = null,
                    currentPhase = "analyzing",
                    routeOptions = state.routeOptions,
                    selectedRouteId = state.selectedRouteId,
                )
            }

        is RideFlowAction.SelectRoute ->
            RideFlowState.RouteDetails(
                sessionId = state.sessionId,
                routeOptions = state.routeOptions,
                selectedRouteId = action.routeId,
            )

        RideFlowAction.NavigateExport ->
            if (!canNavigateToExport(state.selectedRouteId)) {
                state
            } else {
                RideFlowState.NavigationExport(
                    sessionId = state.sessionId,
                    routeOptions = state.routeOptions,
                    selectedRouteId = state.selectedRouteId!!,
                )
            }

        RideFlowAction.ViewHistory ->
            if (!canViewHistory(state.sessionId)) {
                state
            } else {
                RideFlowState.SessionHistory(
                    sessionId = state.sessionId,
                    routeOptions = state.routeOptions,
                    selectedRouteId = state.selectedRouteId,
                )
            }

        RideFlowAction.NewSession -> initialState

        else -> state
    }

private fun handleRouteDetailsState(
    state: RideFlowState.RouteDetails,
    action: RideFlowAction,
): RideFlowState =
    when (action) {
        is RideFlowAction.SendMessage ->
            if (!canSendMessage(action.content)) {
                state
            } else {
                RideFlowState.Planning(
                    sessionId = state.sessionId,
                    planId = null,
                    currentPhase = "analyzing",
                    routeOptions = state.routeOptions,
                    selectedRouteId = state.selectedRouteId,
                )
            }

        is RideFlowAction.SelectRoute ->
            state.copy(selectedRouteId = action.routeId)

        RideFlowAction.NavigateExport ->
            RideFlowState.NavigationExport(
                sessionId = state.sessionId,
                routeOptions = state.routeOptions,
                selectedRouteId = state.selectedRouteId,
            )

        RideFlowAction.ViewHistory ->
            RideFlowState.SessionHistory(
                sessionId = state.sessionId,
                routeOptions = state.routeOptions,
                selectedRouteId = state.selectedRouteId,
            )

        RideFlowAction.NewSession -> initialState

        else -> state
    }

private fun handleSessionHistoryState(
    state: RideFlowState.SessionHistory,
    action: RideFlowAction,
): RideFlowState =
    when (action) {
        RideFlowAction.CloseHistory ->
            if (state.routeOptions != null) {
                RideFlowState.RouteResults(
                    sessionId = state.sessionId,
                    routeOptions = state.routeOptions,
                    selectedRouteId = state.selectedRouteId,
                )
            } else {
                RideFlowState.Idle(
                    sessionId = state.sessionId,
                    routeOptions = null,
                    selectedRouteId = null,
                )
            }

        is RideFlowAction.SelectRoute ->
            RideFlowState.RouteDetails(
                sessionId = state.sessionId,
                routeOptions = state.routeOptions,
                selectedRouteId = action.routeId,
            )

        RideFlowAction.NewSession -> initialState

        else -> state
    }

private fun handleNavigationExportState(
    state: RideFlowState.NavigationExport,
    action: RideFlowAction,
): RideFlowState =
    when (action) {
        RideFlowAction.CloseExport ->
            RideFlowState.RouteDetails(
                sessionId = state.sessionId,
                routeOptions = state.routeOptions,
                selectedRouteId = state.selectedRouteId,
            )

        RideFlowAction.NewSession -> initialState

        else -> state
    }

private fun canSendMessage(content: String): Boolean = content.trim().isNotEmpty()

private fun canNavigateToExport(selectedRouteId: String?): Boolean = selectedRouteId != null

private fun canViewHistory(sessionId: String?): Boolean = sessionId != null

private fun generateSessionId(): String =
    "session-${System.currentTimeMillis()}-${UUID.randomUUID().toString().take(8)}"
