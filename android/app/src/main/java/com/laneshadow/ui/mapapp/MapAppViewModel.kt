package com.laneshadow.ui.mapapp

import androidx.lifecycle.ViewModel
import com.laneshadow.data.chat.ChatRepository
import com.laneshadow.data.route.RouteRepository
import com.laneshadow.data.session.SessionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

@HiltViewModel
class MapAppViewModel @Inject constructor(
    private val sessionRepository: SessionRepository,
    private val chatRepository: ChatRepository,
    private val routeRepository: RouteRepository,
) : ViewModel() {
    private val _state = MutableStateFlow<MapAppState>(MapAppState.Idle)
    val state: StateFlow<MapAppState> = _state.asStateFlow()

    fun goToPlanning(sessionId: String) {
        _state.update { MapAppState.Planning(sessionId) }
    }

    fun goToIdle() {
        _state.update { MapAppState.Idle }
    }

    fun confirmPlanningCancellation() {
        _state.update { MapAppState.Idle }
    }

    fun goToRouteResults(sessionId: String, routePlanId: String) {
        _state.update { MapAppState.RouteResults(sessionId, routePlanId) }
    }
}
