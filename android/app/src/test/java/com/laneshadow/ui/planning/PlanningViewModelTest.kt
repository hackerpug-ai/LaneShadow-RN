package com.laneshadow.ui.planning

import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.chat.ChatRepository
import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.data.chat.SessionThinkingStep
import com.laneshadow.data.route.RoutePlan
import com.laneshadow.data.route.RouteRepository
import com.laneshadow.data.session.PlanningSession
import com.laneshadow.data.session.SessionRepository
import com.laneshadow.services.LaneShadowError
import com.laneshadow.services.MainDispatcherRule
import com.laneshadow.services.Phase
import com.laneshadow.services.PlannedRouteOptions
import com.laneshadow.services.RouteOption
import java.io.IOException
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Rule
import org.junit.Test

class PlanningViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun derives_drafting_phase_from_status() = runTest {
        val chatRepository = FakeChatRepository()
        val viewModel = createViewModel(chatRepository = chatRepository)

        chatRepository.emit(
            listOf(
                SessionMessage(
                    role = "agent",
                    status = "drafting",
                ),
            ),
        )
        advanceUntilIdle()

        assertThat(viewModel.state.value.currentPhase).isEqualTo(Phase.Drafting)
        assertThat(viewModel.state.value.activePhaseIndex).isEqualTo(2)
        assertThat(viewModel.state.value.phaseSteps.map { it.state }).containsExactly(
            com.laneshadow.ui.atoms.PhaseDotState.Done,
            com.laneshadow.ui.atoms.PhaseDotState.Done,
            com.laneshadow.ui.atoms.PhaseDotState.Active,
            com.laneshadow.ui.atoms.PhaseDotState.Pending,
            com.laneshadow.ui.atoms.PhaseDotState.Pending,
        ).inOrder()
    }

    @Test
    fun capsule_headline_per_phase() = runTest {
        val chatRepository = FakeChatRepository()
        val viewModel = createViewModel(chatRepository = chatRepository)

        val expectedHeadlines = listOf(
            Phase.Parsing to "Sketching…",
            Phase.Searching to "Asking…",
            Phase.Drafting to "Refining…",
            Phase.Enriching to "Scoring…",
            Phase.Finalizing to "Finalizing…",
        )

        expectedHeadlines.forEach { (phase, headline) ->
            chatRepository.emit(
                listOf(
                    SessionMessage(
                        role = "agent",
                        status = phase.name.lowercase(),
                    ),
                ),
            )
            advanceUntilIdle()

            assertThat(viewModel.state.value.currentPhase).isEqualTo(phase)
            assertThat(viewModel.state.value.capsuleHeadline).isEqualTo(headline)
        }
    }

    @Test
    fun initial_phase_steps_have_5_stable_ids() = runTest {
        val viewModel = createViewModel()

        assertThat(viewModel.state.value.phaseSteps.map { it.id }).containsExactly(
            "parsing",
            "searching",
            "drafting",
            "enriching",
            "finalizing",
        ).inOrder()
        assertThat(viewModel.state.value.phaseSteps.map { it.state }).containsExactly(
            com.laneshadow.ui.atoms.PhaseDotState.Active,
            com.laneshadow.ui.atoms.PhaseDotState.Pending,
            com.laneshadow.ui.atoms.PhaseDotState.Pending,
            com.laneshadow.ui.atoms.PhaseDotState.Pending,
            com.laneshadow.ui.atoms.PhaseDotState.Pending,
        ).inOrder()
    }

    @Test
    fun state_emitsSuccessTransitionWhenActivePlanCompletes() = runTest {
        val routeOptions = plannedRouteOptions()
        val viewModel = createViewModel(
            routeRepository = FakeRouteRepository(
                activePlans = listOf(
                    RoutePlan(
                        id = "plan-7",
                        status = "completed",
                        options = routeOptions.options,
                    ),
                ),
            ),
        )

        advanceUntilIdle()

        assertThat(viewModel.state.value.transition).isEqualTo(PlanningTransition.Success(routeOptions))
    }

    @Test
    fun state_emitsFailureTransitionWhenActivePlanFails() = runTest {
        val routeRepository = FakeRouteRepository(
            activePlans = listOf(
                RoutePlan(
                    id = "plan-7",
                    status = "failed",
                    statusMessage = "Route planning failed",
                    errorCode = "ROUTING_COMPILE_FAILED",
                    errorMessage = "Route planning failed",
                ),
            ),
        )
        val viewModel = createViewModel(routeRepository = routeRepository)

        advanceUntilIdle()

        assertThat(viewModel.state.value.transition).isEqualTo(
            PlanningTransition.Failure(
                error = LaneShadowError.RoutingCompileFailed,
                message = "Route planning failed",
            ),
        )
        assertThat(viewModel.state.value.subscriptionError).isEqualTo("Route planning failed")
        assertThat(viewModel.state.value.isThinking).isFalse()
    }

    @Test
    fun cancel_invokes_repository_and_emits_cancelled_transition() = runTest {
        val routeRepository = FakeRouteRepository(
            activePlans = listOf(
                RoutePlan(
                    id = "plan_abc",
                    status = "running",
                ),
            ),
        )
        val viewModel = createViewModel(routeRepository = routeRepository)
        advanceUntilIdle()

        routeRepository.onCancel = {
            routeRepository.emitPlans(
                listOf(
                    RoutePlan(
                        id = "plan_abc",
                        status = "cancelled",
                    ),
                ),
            )
        }

        viewModel.cancel()
        advanceUntilIdle()

        assertThat(routeRepository.cancelPlanCalls.get()).isEqualTo(1)
        assertThat(routeRepository.lastCancelledPlanId).isEqualTo("plan_abc")
        assertThat(viewModel.state.value.transition).isEqualTo(PlanningTransition.Cancelled)
        assertThat(viewModel.state.value.isThinking).isFalse()
    }

    @Test
    fun cancel_failure_does_not_emit_cancelled_when_plan_disappears() = runTest {
        val cancelError = IOException("cancel offline")
        val routeRepository = FakeRouteRepository(
            activePlans = listOf(
                RoutePlan(
                    id = "plan_abc",
                    status = "running",
                ),
            ),
        )
        routeRepository.cancelPlanResult = Result.failure(cancelError)
        routeRepository.onCancel = {
            routeRepository.emitPlans(emptyList())
        }

        val viewModel = createViewModel(routeRepository = routeRepository)
        advanceUntilIdle()

        viewModel.cancel()
        advanceUntilIdle()

        assertThat(routeRepository.cancelPlanCalls.get()).isEqualTo(1)
        assertThat(viewModel.state.value.transition).isEqualTo(
            PlanningTransition.Failure(
                error = LaneShadowError.NetworkTimeout(cancelError),
                message = "cancel offline",
            ),
        )
        assertThat(viewModel.state.value.subscriptionError).isEqualTo("cancel offline")
        assertThat(viewModel.state.value.transition).isNotEqualTo(PlanningTransition.Cancelled)
    }

    @Test
    fun cancel_success_emits_cancelled_when_status_was_observed_before_result_returns() = runTest {
        val cancelResult = CompletableDeferred<Result<Unit>>()
        val routeRepository = FakeRouteRepository(
            activePlans = listOf(
                RoutePlan(
                    id = "plan_abc",
                    status = "running",
                ),
            ),
        )
        routeRepository.cancelPlanResultDeferred = cancelResult
        routeRepository.onCancel = {
            routeRepository.emitPlans(
                listOf(
                    RoutePlan(
                        id = "plan_abc",
                        status = "cancelled",
                    ),
                ),
            )
            cancelResult.complete(Result.success(Unit))
        }

        val viewModel = createViewModel(routeRepository = routeRepository)
        advanceUntilIdle()

        viewModel.cancel()
        advanceUntilIdle()

        assertThat(routeRepository.cancelPlanCalls.get()).isEqualTo(1)
        assertThat(viewModel.state.value.transition).isEqualTo(PlanningTransition.Cancelled)
        assertThat(viewModel.state.value.isThinking).isFalse()
    }

    @Test
    fun cancel_with_null_planId_is_noop() = runTest {
        val routeRepository = FakeRouteRepository()
        val viewModel = createViewModel(routeRepository = routeRepository)

        viewModel.cancel()
        advanceUntilIdle()

        assertThat(routeRepository.cancelPlanCalls.get()).isEqualTo(0)
        assertThat(viewModel.state.value.transition).isNull()
    }

    @Test
    fun state_emitsFailureTransitionWhenSubscriptionsFail() = runTest {
        val ioException = IOException("offline")
        val viewModel = createViewModel(
            chatRepository = FailingChatRepository(ioException),
        )

        advanceUntilIdle()

        assertThat(viewModel.state.value.transition).isEqualTo(
            PlanningTransition.Failure(
                error = LaneShadowError.NetworkTimeout(ioException),
                message = "offline",
            ),
        )
        assertThat(viewModel.state.value.subscriptionError).contains("offline")
        assertThat(viewModel.state.value.isThinking).isFalse()
    }

    @Test
    fun route_subscription_failure_surfaces_error_state() = runTest {
        val viewModel = createViewModel(
            routeRepository = FailingRouteRepository(IOException("route offline")),
        )

        advanceUntilIdle()

        assertThat(viewModel.state.value.subscriptionError).isEqualTo("route offline")
        assertThat(viewModel.state.value.isThinking).isFalse()
    }

    @Test
    fun structured_phase_metadata_is_used_before_status_fallback() = runTest {
        val chatRepository = FakeChatRepository()
        val viewModel = createViewModel(chatRepository = chatRepository)

        chatRepository.emit(
            listOf(
                SessionMessage(
                    role = "system",
                    kind = "planning",
                    status = "running",
                    phase = "searching",
                    thinkingSteps = listOf(
                        SessionThinkingStep(
                            type = "tool_start",
                            toolName = "fetchWeather",
                            summary = "Enriching with weather context",
                            timestamp = 1L,
                        ),
                    ),
                ),
            ),
        )
        advanceUntilIdle()

        assertThat(viewModel.state.value.currentPhase).isEqualTo(Phase.Enriching)
        assertThat(viewModel.state.value.activePhaseIndex).isEqualTo(3)
        assertThat(viewModel.state.value.phaseSteps.map { it.state }).containsExactly(
            com.laneshadow.ui.atoms.PhaseDotState.Done,
            com.laneshadow.ui.atoms.PhaseDotState.Done,
            com.laneshadow.ui.atoms.PhaseDotState.Done,
            com.laneshadow.ui.atoms.PhaseDotState.Active,
            com.laneshadow.ui.atoms.PhaseDotState.Pending,
        ).inOrder()
    }

    @Test
    fun planning_content_events_are_used_before_phase_fallback() = runTest {
        val chatRepository = FakeChatRepository()
        val viewModel = createViewModel(chatRepository = chatRepository)

        chatRepository.emit(
            listOf(
                SessionMessage(
                    role = "system",
                    kind = "planning",
                    status = "running",
                    phase = "parsing",
                    content = """{"events":[{"type":"tool_pending","tool":"planRoute"}]}""",
                ),
            ),
        )
        advanceUntilIdle()

        assertThat(viewModel.state.value.currentPhase).isEqualTo(Phase.Drafting)
        assertThat(viewModel.state.value.activePhaseIndex).isEqualTo(2)
    }

    private fun createViewModel(
        chatRepository: ChatRepository = FakeChatRepository(),
        routeRepository: RouteRepository = FakeRouteRepository(),
        sessionRepository: SessionRepository = FakeSessionRepository(),
    ): PlanningViewModel =
        PlanningViewModel(
            sessionId = "sess-1",
            chatRepository = chatRepository,
            routeRepository = routeRepository,
            sessionRepository = sessionRepository,
        )

    private class FakeChatRepository : ChatRepository {
        private val messagesFlow = MutableStateFlow<List<SessionMessage>>(emptyList())

        fun emit(messages: List<SessionMessage>) {
            messagesFlow.value = messages
        }

        override fun subscribeToMessages(sessionId: String): Flow<List<SessionMessage>> = messagesFlow

        override suspend fun sendMessage(
            sessionId: String,
            content: String,
            currentLocation: com.laneshadow.ui.atoms.LatLng?,
        ): Result<Unit> = Result.success(Unit)
    }

    private class FailingChatRepository(
        private val error: Throwable,
    ) : ChatRepository {
        override fun subscribeToMessages(sessionId: String): Flow<List<SessionMessage>> = flow {
            throw error
        }

        override suspend fun sendMessage(
            sessionId: String,
            content: String,
            currentLocation: com.laneshadow.ui.atoms.LatLng?,
        ): Result<Unit> = Result.success(Unit)
    }

    private class FakeRouteRepository(
        activePlans: List<RoutePlan> = emptyList(),
    ) : RouteRepository {
        private val activePlansFlow = MutableStateFlow(activePlans)

        val cancelPlanCalls = AtomicInteger(0)
        var lastCancelledPlanId: String? = null
        var onCancel: (() -> Unit)? = null
        var cancelPlanResult: Result<Unit> = Result.success(Unit)
        var cancelPlanResultDeferred: CompletableDeferred<Result<Unit>>? = null

        fun emitPlans(plans: List<RoutePlan>) {
            activePlansFlow.value = plans
        }

        override fun subscribeToActiveRoutePlans(sessionId: String): Flow<List<RoutePlan>> =
            activePlansFlow

        override suspend fun cancelPlan(routePlanId: String): Result<Unit> {
            cancelPlanCalls.incrementAndGet()
            lastCancelledPlanId = routePlanId
            onCancel?.invoke()
            return cancelPlanResultDeferred?.await() ?: cancelPlanResult
        }
    }

    private class FailingRouteRepository(
        private val error: Throwable,
    ) : RouteRepository {
        override fun subscribeToActiveRoutePlans(sessionId: String): Flow<List<RoutePlan>> = flow {
            throw error
        }

        override suspend fun cancelPlan(routePlanId: String): Result<Unit> = Result.success(Unit)
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
