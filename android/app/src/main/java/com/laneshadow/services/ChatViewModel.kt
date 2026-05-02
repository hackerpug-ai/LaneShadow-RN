package com.laneshadow.services

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
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
        persistSessionId(next)

        when (action) {
            is RideFlowAction.SendMessage -> launchSendMessage(current, next, action.content)
            RideFlowAction.CancelPlanning -> cancelSendJob()
            else -> Unit
        }
    }

    private fun launchSendMessage(
        current: RideFlowState,
        next: RideFlowState,
        content: String,
    ) {
        if (next !is RideFlowState.Planning) {
            return
        }

        sendJob?.cancel()
        sendJob = viewModelScope.launch {
            if (current is RideFlowState.RouteResults || current is RideFlowState.RouteDetails) {
                chatRepository.sendMessage(next.sessionId, content)
            } else {
                sessionRepository.createSession(content)
            }
            appStateRepository.setLastViewedSessionId(next.sessionId)
        }
    }

    private fun cancelSendJob() {
        sendJob?.cancel()
        sendJob = null
    }

    private fun persistSessionId(state: RideFlowState) {
        val sessionId = when (state) {
            is RideFlowState.WithSession -> state.sessionId
            is RideFlowState.Error -> state.sessionId
            is RideFlowState.Idle -> state.sessionId
        }
        savedStateHandle[SESSION_ID_KEY] = sessionId
    }

    private companion object {
        const val SESSION_ID_KEY = "sessionId"
    }
}

interface ChatRepository {
    suspend fun sendMessage(sessionId: String, content: String): Result<Unit> = Result.success(Unit)
}

interface SessionRepository {
    suspend fun createSession(firstMessage: String = ""): Result<String> = Result.success("")
}
