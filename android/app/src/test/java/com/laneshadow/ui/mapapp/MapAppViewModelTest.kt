package com.laneshadow.ui.mapapp

import com.laneshadow.data.chat.ChatRepository
import com.laneshadow.data.route.RouteRepository
import com.laneshadow.data.session.SessionRepository
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito

class MapAppViewModelTest {
    private lateinit var viewModel: MapAppViewModel
    private val sessionRepository: SessionRepository = Mockito.mock(SessionRepository::class.java)
    private val chatRepository: ChatRepository = Mockito.mock(ChatRepository::class.java)
    private val routeRepository: RouteRepository = Mockito.mock(RouteRepository::class.java)

    @Before
    fun setUp() {
        viewModel = MapAppViewModel(
            sessionRepository = sessionRepository,
            chatRepository = chatRepository,
            routeRepository = routeRepository,
        )
    }

    @Test
    fun testInitialStateIsIdle() = runTest {
        val state = viewModel.state.first()
        assert(state is MapAppState.Idle)
    }

    @Test
    fun testGoToPlanning() = runTest {
        val sessionId = "test-session-123"
        viewModel.goToPlanning(sessionId)
        val state = viewModel.state.first()
        assert(state is MapAppState.Planning)
        assert((state as MapAppState.Planning).sessionId == sessionId)
    }

    @Test
    fun testGoToIdle() = runTest {
        val sessionId = "test-session-123"
        viewModel.goToPlanning(sessionId)
        viewModel.goToIdle()
        val state = viewModel.state.first()
        assert(state is MapAppState.Idle)
    }

    @Test
    fun testConfirmPlanningCancellation() = runTest {
        val sessionId = "test-session-123"
        viewModel.goToPlanning(sessionId)
        viewModel.confirmPlanningCancellation()
        val state = viewModel.state.first()
        assert(state is MapAppState.Idle)
    }

    @Test
    fun testGoToRouteResults() = runTest {
        val sessionId = "test-session-123"
        val routePlanId = "route-plan-456"
        viewModel.goToRouteResults(sessionId, routePlanId)
        val state = viewModel.state.first()
        assert(state is MapAppState.RouteResults)
        val resultState = state as MapAppState.RouteResults
        assert(resultState.sessionId == sessionId)
        assert(resultState.routePlanId == routePlanId)
    }
}
