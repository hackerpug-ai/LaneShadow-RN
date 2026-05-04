package com.laneshadow.ui.planning

import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.chat.ChatRepository
import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.data.route.RouteRepository
import com.laneshadow.data.session.SessionRepository
import com.laneshadow.services.MainDispatcherRule
import com.laneshadow.services.Phase
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Rule
import org.junit.Test

/**
 * AC-3: ViewModel maps server status to canonical Phase enum (NOT raw strings)
 * GIVEN: PlanningViewModel receives sessionMessages.status updates with canonical phase names
 * WHEN:  ViewModel processes each status string
 * THEN:  Emitted UI state contains corresponding Phase enum value (not String)
 */
class PlanningViewModelPhaseMappingTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun viewModel_emits_phase_enum_for_parsing_status() = runTest {
        val viewModel = PlanningViewModel(
            sessionId = "sess-1",
            chatRepository = FakeChatRepository(
                messages = listOf(
                    SessionMessage(role = "agent", status = "parsing"),
                ),
            ),
            routeRepository = FakeRouteRepository(),
            sessionRepository = FakeSessionRepository(),
        )

        advanceUntilIdle()

        // THEN: UI state should contain Phase enum, not raw string
        assertThat(viewModel.state.value.currentPhase).isEqualTo(Phase.Parsing)
        assertThat(viewModel.state.value.activePhaseIndex).isEqualTo(0) // Phase.Parsing index
    }

    @Test
    fun viewModel_emits_phase_enum_for_searching_status() = runTest {
        val viewModel = PlanningViewModel(
            sessionId = "sess-1",
            chatRepository = FakeChatRepository(
                messages = listOf(
                    SessionMessage(role = "agent", status = "searching"),
                ),
            ),
            routeRepository = FakeRouteRepository(),
            sessionRepository = FakeSessionRepository(),
        )

        advanceUntilIdle()

        assertThat(viewModel.state.value.currentPhase).isEqualTo(Phase.Searching)
        assertThat(viewModel.state.value.activePhaseIndex).isEqualTo(1) // Phase.Searching index
    }

    @Test
    fun viewModel_emits_phase_enum_for_drafting_status() = runTest {
        val viewModel = PlanningViewModel(
            sessionId = "sess-1",
            chatRepository = FakeChatRepository(
                messages = listOf(
                    SessionMessage(role = "agent", status = "drafting"),
                ),
            ),
            routeRepository = FakeRouteRepository(),
            sessionRepository = FakeSessionRepository(),
        )

        advanceUntilIdle()

        assertThat(viewModel.state.value.currentPhase).isEqualTo(Phase.Drafting)
        assertThat(viewModel.state.value.activePhaseIndex).isEqualTo(2) // Phase.Drafting index
    }

    @Test
    fun viewModel_emits_phase_enum_for_enriching_status() = runTest {
        val viewModel = PlanningViewModel(
            sessionId = "sess-1",
            chatRepository = FakeChatRepository(
                messages = listOf(
                    SessionMessage(role = "agent", status = "enriching"),
                ),
            ),
            routeRepository = FakeRouteRepository(),
            sessionRepository = FakeSessionRepository(),
        )

        advanceUntilIdle()

        assertThat(viewModel.state.value.currentPhase).isEqualTo(Phase.Enriching)
        assertThat(viewModel.state.value.activePhaseIndex).isEqualTo(3) // Phase.Enriching index
    }

    @Test
    fun viewModel_emits_phase_enum_for_finalizing_status() = runTest {
        val viewModel = PlanningViewModel(
            sessionId = "sess-1",
            chatRepository = FakeChatRepository(
                messages = listOf(
                    SessionMessage(role = "agent", status = "finalizing"),
                ),
            ),
            routeRepository = FakeRouteRepository(),
            sessionRepository = FakeSessionRepository(),
        )

        advanceUntilIdle()

        assertThat(viewModel.state.value.currentPhase).isEqualTo(Phase.Finalizing)
        assertThat(viewModel.state.value.activePhaseIndex).isEqualTo(4) // Phase.Finalizing index
    }

    @Test
    fun viewModel_defaults_to_parsing_phase_for_unknown_status() = runTest {
        val viewModel = PlanningViewModel(
            sessionId = "sess-1",
            chatRepository = FakeChatRepository(
                messages = listOf(
                    SessionMessage(role = "agent", status = "unknown_legacy_phase"),
                ),
            ),
            routeRepository = FakeRouteRepository(),
            sessionRepository = FakeSessionRepository(),
        )

        advanceUntilIdle()

        // Unknown status should default to Parsing (first phase)
        assertThat(viewModel.state.value.currentPhase).isEqualTo(Phase.Parsing)
        assertThat(viewModel.state.value.activePhaseIndex).isEqualTo(0)
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

    private class FakeRouteRepository : RouteRepository {
        override fun subscribeToActiveRoutePlans(sessionId: String): Flow<List<com.laneshadow.data.route.RoutePlan>> =
            flowOf(emptyList())

        override suspend fun cancelPlan(routePlanId: String): Result<Unit> = Result.success(Unit)
    }

    private class FakeSessionRepository : SessionRepository {
        override fun subscribeToSessions(): Flow<List<com.laneshadow.data.session.PlanningSession>> =
            flowOf(emptyList())

        override suspend fun createSession(firstMessage: String): Result<String> =
            Result.success("sess-42")
    }
}
