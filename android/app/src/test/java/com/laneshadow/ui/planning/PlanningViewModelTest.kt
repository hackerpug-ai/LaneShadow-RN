package com.laneshadow.ui.planning

import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.chat.ChatRepository
import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.data.route.RoutePlan
import com.laneshadow.data.route.RouteRepository
import com.laneshadow.data.session.PlanningSession
import com.laneshadow.data.session.SessionRepository
import com.laneshadow.services.MainDispatcherRule
import com.laneshadow.services.PlannedRouteOptions
import com.laneshadow.services.RouteOption
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Rule
import org.junit.Test

class PlanningViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun state_mapsLatestAgentMessageStatusToCurrentPhase() = runTest {
        val viewModel = PlanningViewModel(
            sessionId = "sess-1",
            chatRepository = FakeChatRepository(
                messages = listOf(
                    SessionMessage(
                        role = "agent",
                        status = "drafting",
                    ),
                ),
            ),
            routeRepository = FakeRouteRepository(),
            sessionRepository = FakeSessionRepository(),
        )

        advanceUntilIdle()

        assertThat(viewModel.state.value.currentPhase).isEqualTo("drafting")
        assertThat(viewModel.state.value.headerLabel).isEqualTo("Sun on one leg, wind on another…")
    }

    @Test
    fun state_emitsSuccessTransitionWhenActivePlanCompletes() = runTest {
        val routeOptions = plannedRouteOptions()
        val viewModel = PlanningViewModel(
            sessionId = "sess-1",
            chatRepository = FakeChatRepository(),
            routeRepository = FakeRouteRepository(
                activePlans = listOf(
                    RoutePlan(
                        id = "plan-7",
                        status = "completed",
                        options = routeOptions.options,
                    ),
                ),
            ),
            sessionRepository = FakeSessionRepository(),
        )

        advanceUntilIdle()

        val transition = viewModel.state.value.transition
        assertThat(transition).isEqualTo(PlanningTransition.Success(routeOptions))
    }

    @Test
    fun cancel_invokesCancelPlanWithActivePlanId() = runTest {
        val routeRepository = FakeRouteRepository(
            activePlans = listOf(
                RoutePlan(
                    id = "plan-7",
                    status = "running",
                ),
            ),
        )
        val viewModel = PlanningViewModel(
            sessionId = "sess-1",
            chatRepository = FakeChatRepository(),
            routeRepository = routeRepository,
            sessionRepository = FakeSessionRepository(),
        )

        advanceUntilIdle()
        viewModel.cancel()
        advanceUntilIdle()

        assertThat(routeRepository.cancelPlanCalls.get()).isEqualTo(1)
        assertThat(routeRepository.lastCancelledPlanId).isEqualTo("plan-7")
    }

    private class FakeChatRepository(
        private val messages: List<SessionMessage> = emptyList(),
    ) : ChatRepository {
        override fun subscribeToMessages(sessionId: String): Flow<List<SessionMessage>> =
            flowOf(messages)

        override suspend fun sendMessage(
            sessionId: String,
            content: String,
            currentLocation: com.laneshadow.ui.atoms.LatLng?,
        ): Result<Unit> = Result.success(Unit)
    }

    private class FakeRouteRepository(
        private val activePlans: List<RoutePlan> = emptyList(),
    ) : RouteRepository {
        val cancelPlanCalls = AtomicInteger(0)
        var lastCancelledPlanId: String? = null

        override fun subscribeToActiveRoutePlans(sessionId: String): Flow<List<RoutePlan>> =
            flowOf(activePlans)

        override suspend fun cancelPlan(routePlanId: String): Result<Unit> {
            cancelPlanCalls.incrementAndGet()
            lastCancelledPlanId = routePlanId
            return Result.success(Unit)
        }
    }

    private class FakeSessionRepository : SessionRepository {
        override fun subscribeToSessions(): Flow<List<PlanningSession>> = flowOf(emptyList())
        override suspend fun createSession(firstMessage: String): Result<String> =
            Result.success("sess-42")
    }

    private fun plannedRouteOptions(): PlannedRouteOptions =
        PlannedRouteOptions(
            planId = "plan-7",
            options = listOf(
                RouteOption(routeOptionId = "opt-1"),
                RouteOption(routeOptionId = "opt-2"),
                RouteOption(routeOptionId = "opt-3"),
            ),
        )
}
