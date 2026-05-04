package com.laneshadow.ui.planning

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.laneshadow.data.chat.ChatRepository
import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.data.route.RouteRepository
import com.laneshadow.data.route.RoutePlan
import com.laneshadow.data.session.PlanningSession
import com.laneshadow.data.session.SessionRepository
import com.laneshadow.services.LaneShadowError
import com.laneshadow.services.Phase
import com.laneshadow.services.toLaneShadowError
import com.laneshadow.services.PlannedRouteOptions
import com.laneshadow.services.laneShadowErrorForCode
import dagger.assisted.Assisted
import dagger.assisted.AssistedFactory
import dagger.assisted.AssistedInject
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

@HiltViewModel(assistedFactory = PlanningViewModel.Factory::class)
class PlanningViewModel @AssistedInject constructor(
    @Assisted private val sessionId: String,
    private val chatRepository: ChatRepository,
    private val routeRepository: RouteRepository,
    private val sessionRepository: SessionRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(PlanningUiState(sessionId = sessionId))
    val state: StateFlow<PlanningUiState> = _state.asStateFlow()

    private var lastCompletedPlanId: String? = null
    private var lastFailedPlanId: String? = null

    init {
        observeSessions()
        observeMessages()
        observeActivePlans()
    }

    fun cancel() {
        val planId = _state.value.activePlanId ?: return
        viewModelScope.launch {
            routeRepository.cancelPlan(planId)
        }
    }

    fun consumeTransition() {
        _state.update { current ->
            current.copy(transition = null)
        }
    }

    private fun observeSessions() {
        viewModelScope.launch {
            sessionRepository.subscribeToSessions()
                .catch { error ->
                    reportSubscriptionFailure(
                        error = error,
                        fallbackMessage = "Unable to load planning sessions.",
                    )
                }
                .collect { sessions ->
                    _state.update { current ->
                        current.copy(
                            recentSessions = sessions,
                        )
                    }
                }
        }
    }

    private fun observeMessages() {
        viewModelScope.launch {
            chatRepository.subscribeToMessages(sessionId)
                .catch { error ->
                    reportSubscriptionFailure(
                        error = error,
                        fallbackMessage = "Unable to load planning messages.",
                    )
                }
                .collect { messages ->
                    val latestAgentMessage = messages.latestAgentMessage()
                    val phase = Phase.fromLabel(latestAgentMessage?.status) ?: Phase.Parsing
                    val phaseIndex = Phase.entries.indexOf(phase)
                    _state.update { current ->
                        current.copy(
                            messages = messages,
                            currentPhase = phase,
                            activePhaseIndex = phaseIndex,
                            headerLabel = phaseHeaderForIndex(phaseIndex),
                            phaseHeaders = defaultPhaseHeaders(),
                        )
                    }
                }
        }
    }

    private fun observeActivePlans() {
        viewModelScope.launch {
            routeRepository.subscribeToActiveRoutePlans(sessionId)
                .catch { error ->
                    reportSubscriptionFailure(
                        error = error,
                        fallbackMessage = "Unable to load active plans.",
                    )
                }
                .collect { plans ->
                    val activePlan = plans.firstOrNull()
                    val completedPlan = plans.firstOrNull { it.status.equals("completed", ignoreCase = true) }
                    val failedPlan = plans.firstOrNull { it.status.equals("failed", ignoreCase = true) }
                    _state.update { current ->
                        current.copy(
                            activePlanId = activePlan?.id ?: current.activePlanId,
                            isThinking = plans.any { plan -> plan.status.equals("pending", true) || plan.status.equals("running", true) },
                        )
                    }

                    if (completedPlan != null && completedPlan.id != lastCompletedPlanId) {
                        lastCompletedPlanId = completedPlan.id
                        _state.update { current ->
                            current.copy(
                                transition = PlanningTransition.Success(
                                    routeOptions = PlannedRouteOptions(
                                        planId = completedPlan.id,
                                        options = completedPlan.options,
                                    ),
                                ),
                                isThinking = false,
                            )
                        }
                    } else if (failedPlan != null && failedPlan.id != lastFailedPlanId) {
                        lastFailedPlanId = failedPlan.id
                        val failure = failedPlan.toFailureTransition()
                        _state.update { current ->
                            current.copy(
                                transition = failure,
                                isThinking = false,
                                subscriptionError = failure.message,
                            )
                        }
                    }
                }
        }
    }

    private fun reportSubscriptionFailure(
        error: Throwable,
        fallbackMessage: String,
    ) {
        val laneShadowError = toLaneShadowError(error)
        _state.update { current ->
            if (current.transition is PlanningTransition.Failure) {
                current.copy(
                    isThinking = false,
                    subscriptionError = error.message ?: fallbackMessage,
                )
            } else {
                val message = error.message ?: fallbackMessage
                current.copy(
                    isThinking = false,
                    subscriptionError = message,
                    transition = PlanningTransition.Failure(
                        error = laneShadowError,
                        message = message,
                    ),
                )
            }
        }
    }

    @AssistedFactory
    interface Factory {
        fun create(sessionId: String): PlanningViewModel
    }
}

private fun List<SessionMessage>.latestAgentMessage(): SessionMessage? =
    lastOrNull { message ->
        message.role.equals("agent", ignoreCase = true) ||
            message.role.equals("system", ignoreCase = true)
    } ?: lastOrNull()

private fun RoutePlan.toFailureTransition(): PlanningTransition.Failure {
    val message = errorMessage?.takeIf { it.isNotBlank() }
        ?: statusMessage?.takeIf { it.isNotBlank() }
        ?: "Route planning failed."
    val normalizedErrorCode = errorCode?.takeIf { it.isNotBlank() }
    val error = normalizedErrorCode
        ?.let(::laneShadowErrorForCode)
        ?: LaneShadowError.Unknown(
            originalMessage = message,
            originalCode = normalizedErrorCode ?: "UNKNOWN",
        )

    return PlanningTransition.Failure(
        error = error,
        message = message,
    )
}
