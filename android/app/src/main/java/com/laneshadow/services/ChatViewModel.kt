package com.laneshadow.services

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val chatRepository: ChatRepository,
    private val sessionRepository: SessionRepository,
    private val appStateRepository: AppStateRepository,
    private val savedStateHandle: SavedStateHandle,
) : ViewModel() {
    private val _flowState = MutableStateFlow<RideFlowState>(
        RideFlowState.Idle(sessionId = savedStateHandle.get<String>(SESSION_ID_KEY)),
    )

    val flowState: StateFlow<RideFlowState> = _flowState.asStateFlow()

    internal var sendJob: Job? = null

    fun dispatch(action: RideFlowAction) {
        val current = _flowState.value
        val next = reduce(current, action)

        _flowState.value = next

        when (action) {
            is RideFlowAction.SendMessage -> launchSendMessage(current, next, action.content)
            is RideFlowAction.PlanningError -> persistSessionId(next)
            RideFlowAction.CancelPlanning -> cancelSendJob()
            else -> persistSessionId(next)
        }
    }

    private fun launchSendMessage(
        current: RideFlowState,
        next: RideFlowState,
        content: String,
    ) {
        val planning = next as? RideFlowState.Planning ?: return
        if (planning == current) {
            return
        }

        sendJob?.cancel()
        sendJob = viewModelScope.launch {
            val sessionId = when (current) {
                is RideFlowState.RouteResults,
                is RideFlowState.RouteDetails,
                -> {
                    persistSessionId(planning)
                    current.sessionId
                }

                else -> {
                    val createResult = sessionRepository.createSession("")
                    val createdSessionId = createResult.getOrElse { error ->
                        transitionToPlanningError(
                            planning = planning,
                            error = error,
                            persistSessionId = false,
                        )
                        return@launch
                    }

                    if (createdSessionId.isBlank()) {
                        transitionToPlanningError(
                            planning = planning,
                            error = IllegalStateException("createSession returned blank sessionId"),
                            persistSessionId = false,
                        )
                        return@launch
                    }

                    val reconciledPlanning = planning.copy(sessionId = createdSessionId)
                    _flowState.value = reconciledPlanning
                    persistSessionId(reconciledPlanning)
                    createdSessionId
                }
            }

            appStateRepository.setLastViewedSessionId(sessionId)

            val sendResult = chatRepository.sendMessage(sessionId, content)
            if (sendResult.isFailure) {
                transitionToPlanningError(
                    planning = planning.copy(sessionId = sessionId),
                    error = sendResult.exceptionOrNull() ?: IllegalStateException("sendMessage failed"),
                    persistSessionId = true,
                )
            }
        }
    }

    private fun cancelSendJob() {
        sendJob?.cancel()
        sendJob = null
    }

    private fun transitionToPlanningError(
        planning: RideFlowState.Planning,
        error: Throwable,
        persistSessionId: Boolean,
    ) {
        val errorState = reduce(
            planning,
            RideFlowAction.PlanningError(error.message ?: "Unknown error"),
        )
        _flowState.value = errorState
        if (persistSessionId) {
            persistSessionId(errorState)
        }
    }

    private fun persistSessionId(state: RideFlowState) {
        val sessionId = when (state) {
            is RideFlowState.WithSession -> state.sessionId
            is RideFlowState.Error -> state.sessionId
            is RideFlowState.Idle -> state.sessionId
        }
        if (sessionId == null) {
            savedStateHandle.remove<String>(SESSION_ID_KEY)
        } else {
            savedStateHandle[SESSION_ID_KEY] = sessionId
        }
    }

    private companion object {
        const val SESSION_ID_KEY = "sessionId"
    }
}

interface ChatRepository {
    suspend fun sendMessage(sessionId: String, content: String): Result<Unit>
}

interface SessionRepository {
    suspend fun createSession(firstMessage: String): Result<String>
}

@Singleton
class ConvexChatRepository @Inject constructor(
    private val convexClientProvider: ConvexClientProvider,
) : ChatRepository {
    override suspend fun sendMessage(sessionId: String, content: String): Result<Unit> =
        convexClientProvider.sendMessage(sessionId, content)
}

@Singleton
class ConvexSessionRepository @Inject constructor(
    private val convexClientProvider: ConvexClientProvider,
) : SessionRepository {
    override suspend fun createSession(firstMessage: String): Result<String> =
        convexClientProvider.createSession(firstMessage)
}
