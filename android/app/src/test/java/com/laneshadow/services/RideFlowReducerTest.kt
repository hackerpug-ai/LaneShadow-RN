package com.laneshadow.services

import com.google.common.truth.Truth.assertThat
import org.junit.Test

class RideFlowReducerTest {
    @Test
    fun reduce_idle_sendMessage_transitionsToPlanning_withFreshSessionId() {
        val state = RideFlowState.Idle()

        val nextState = reduce(
            state = state,
            action = RideFlowAction.SendMessage("plan a ride"),
        )

        assertThat(nextState).isInstanceOf(RideFlowState.Planning::class.java)
        val planning = nextState as RideFlowState.Planning
        assertThat(planning.sessionId).isNotEmpty()
        assertThat(planning.planId).isNull()
        assertThat(planning.currentPhase).isEqualTo("analyzing")
        assertThat(planning.routeOptions).isNull()
        assertThat(planning.selectedRouteId).isNull()
    }

    @Test
    fun reduce_idle_sendMessageWithBlankContent_returnsSameState() {
        val state = RideFlowState.Idle()

        val nextState = reduce(
            state = state,
            action = RideFlowAction.SendMessage("   "),
        )

        assertThat(nextState).isSameInstanceAs(state)
    }

    @Test
    fun reduce_routeResults_sendMessage_preservesSessionId() {
        val routeOptions = plannedRouteOptions()
        val state = RideFlowState.RouteResults(
            sessionId = "abc-123",
            routeOptions = routeOptions,
            selectedRouteId = "route-1",
        )

        val nextState = reduce(
            state = state,
            action = RideFlowAction.SendMessage("shorter please"),
        )

        assertThat(nextState).isInstanceOf(RideFlowState.Planning::class.java)
        val planning = nextState as RideFlowState.Planning
        assertThat(planning.sessionId).isEqualTo("abc-123")
        assertThat(planning.routeOptions).isEqualTo(routeOptions)
        assertThat(planning.selectedRouteId).isEqualTo("route-1")
    }

    @Test
    fun reduce_planning_planningError_transitionsToErrorWithTimestamp() {
        val state = RideFlowState.Planning(sessionId = "abc-123")

        val nextState = reduce(
            state = state,
            action = RideFlowAction.PlanningError("AGENT_TIMEOUT"),
        )

        assertThat(nextState).isInstanceOf(RideFlowState.Error::class.java)
        val error = nextState as RideFlowState.Error
        assertThat(error.message).isEqualTo("AGENT_TIMEOUT")
        assertThat(error.sessionId).isEqualTo("abc-123")
        assertThat(error.timestamp).isGreaterThan(0L)
    }

    @Test
    fun reduce_planningSuccess_transitionsToRouteResults_andAutoSelectsFirstRoute() {
        val state = RideFlowState.Planning(sessionId = "abc-123")
        val routeOptions = plannedRouteOptions()

        val nextState = reduce(
            state = state,
            action = RideFlowAction.PlanningSuccess(routeOptions),
        )

        assertThat(nextState).isInstanceOf(RideFlowState.RouteResults::class.java)
        val routeResults = nextState as RideFlowState.RouteResults
        assertThat(routeResults.sessionId).isEqualTo("abc-123")
        assertThat(routeResults.routeOptions).isEqualTo(routeOptions)
        assertThat(routeResults.selectedRouteId).isEqualTo("route-1")
    }

    @Test
    fun reduce_cancelPlanning_returnsRouteResultsWhenRouteOptionsExist() {
        val routeOptions = plannedRouteOptions()
        val state = RideFlowState.Planning(
            sessionId = "abc-123",
            routeOptions = routeOptions,
            selectedRouteId = "route-1",
        )

        val nextState = reduce(
            state = state,
            action = RideFlowAction.CancelPlanning,
        )

        assertThat(nextState).isInstanceOf(RideFlowState.RouteResults::class.java)
        val routeResults = nextState as RideFlowState.RouteResults
        assertThat(routeResults.sessionId).isEqualTo("abc-123")
        assertThat(routeResults.routeOptions).isEqualTo(routeOptions)
        assertThat(routeResults.selectedRouteId).isEqualTo("route-1")
    }

    @Test
    fun reduce_loadSession_transitionsIdleToRouteResults() {
        val routeOptions = plannedRouteOptions()

        val nextState = reduce(
            state = RideFlowState.Idle(),
            action = RideFlowAction.LoadSession(
                sessionId = "session-123",
                routeOptions = routeOptions,
                selectedRouteId = "route-1",
            ),
        )

        assertThat(nextState).isInstanceOf(RideFlowState.RouteResults::class.java)
        val routeResults = nextState as RideFlowState.RouteResults
        assertThat(routeResults.sessionId).isEqualTo("session-123")
        assertThat(routeResults.routeOptions).isEqualTo(routeOptions)
        assertThat(routeResults.selectedRouteId).isEqualTo("route-1")
    }

    @Test
    fun reduce_viewHistory_fromRouteDetails_transitionsToSessionHistory() {
        val routeOptions = plannedRouteOptions()
        val state = RideFlowState.RouteDetails(
            sessionId = "abc-123",
            routeOptions = routeOptions,
            selectedRouteId = "route-1",
        )

        val nextState = reduce(
            state = state,
            action = RideFlowAction.ViewHistory,
        )

        assertThat(nextState).isInstanceOf(RideFlowState.SessionHistory::class.java)
        val history = nextState as RideFlowState.SessionHistory
        assertThat(history.sessionId).isEqualTo("abc-123")
        assertThat(history.routeOptions).isEqualTo(routeOptions)
        assertThat(history.selectedRouteId).isEqualTo("route-1")
    }

    @Test
    fun reduce_closeHistory_returnsRouteResultsWhenRoutesExist() {
        val routeOptions = plannedRouteOptions()
        val state = RideFlowState.SessionHistory(
            sessionId = "abc-123",
            routeOptions = routeOptions,
            selectedRouteId = "route-1",
        )

        val nextState = reduce(
            state = state,
            action = RideFlowAction.CloseHistory,
        )

        assertThat(nextState).isInstanceOf(RideFlowState.RouteResults::class.java)
        val routeResults = nextState as RideFlowState.RouteResults
        assertThat(routeResults.sessionId).isEqualTo("abc-123")
        assertThat(routeResults.routeOptions).isEqualTo(routeOptions)
        assertThat(routeResults.selectedRouteId).isEqualTo("route-1")
    }

    @Test
    fun reduce_closeExport_returnsRouteDetails() {
        val routeOptions = plannedRouteOptions()
        val state = RideFlowState.NavigationExport(
            sessionId = "abc-123",
            routeOptions = routeOptions,
            selectedRouteId = "route-1",
        )

        val nextState = reduce(
            state = state,
            action = RideFlowAction.CloseExport,
        )

        assertThat(nextState).isInstanceOf(RideFlowState.RouteDetails::class.java)
        val routeDetails = nextState as RideFlowState.RouteDetails
        assertThat(routeDetails.sessionId).isEqualTo("abc-123")
        assertThat(routeDetails.routeOptions).isEqualTo(routeOptions)
        assertThat(routeDetails.selectedRouteId).isEqualTo("route-1")
    }

    @Test
    fun reduce_newSession_resetsToIdle() {
        val state = RideFlowState.RouteDetails(
            sessionId = "abc-123",
            routeOptions = plannedRouteOptions(),
            selectedRouteId = "route-1",
        )

        val nextState = reduce(
            state = state,
            action = RideFlowAction.NewSession,
        )

        assertThat(nextState).isEqualTo(initialState)
    }

    private fun plannedRouteOptions(): PlannedRouteOptions =
        PlannedRouteOptions(
            planId = "plan-123",
            options = listOf(
                RouteOption(routeOptionId = "route-1"),
            ),
        )
}
