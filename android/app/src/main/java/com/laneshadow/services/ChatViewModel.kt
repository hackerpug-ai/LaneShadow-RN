package com.laneshadow.services

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.data.route.RoutePlan
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val chatRepository: ChatRepository,
    private val sessionRepository: SessionRepository,
    private val appStateRepository: AppStateRepository,
    private val savedStateHandle: SavedStateHandle,
    private val ioDispatcher: CoroutineDispatcher,
    private val clock: () -> Long,
) : ViewModel() {
    private val _flowState = MutableStateFlow<RideFlowState>(
        RideFlowState.Idle(sessionId = savedStateHandle.get<String>(SESSION_ID_KEY)),
    )

    val flowState: StateFlow<RideFlowState> = _flowState.asStateFlow()
    private val pendingMessages = MutableStateFlow<List<PendingMessage>>(emptyList())
    private val activePlanId = MutableStateFlow<String?>(null)
    private val confirmedMessages: StateFlow<List<SessionMessage>> = flowState
        .map { state -> state.sessionIdOrNull() }
        .distinctUntilChanged()
        .flatMapLatest { sessionId ->
            if (sessionId == null) {
                flowOf(emptyList())
            } else {
                chatRepository.subscribeToMessages(sessionId)
            }
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList(),
        )

    val displayMessages: StateFlow<List<DisplayMessage>> = combine(
        confirmedMessages,
        pendingMessages,
    ) { confirmed, pending ->
        reconcile(
            pendingMessages = pending,
            confirmedMessages = confirmed,
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = emptyList(),
    )

    internal var sendJob: Job? = null

    init {
        observeConfirmedMessages()
        observeActiveRoutePlans()
    }

    fun dispatch(action: RideFlowAction) {
        val current = _flowState.value
        val next = reduce(current, action)

        _flowState.value = next

        when (action) {
            is RideFlowAction.SendMessage -> launchSendMessage(current, next, action.content)
            is RideFlowAction.PlanningError -> {
                clearPendingMessages()
                persistSessionId(next)
            }
            RideFlowAction.CancelPlanning -> {
                cancelSendJob()
                clearPendingMessages()
                cancelActivePlan(current)
                persistSessionId(next)
            }
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

        val pendingMessage = appendPendingMessage(current, planning, content)
        sendJob?.cancel()
        sendJob = viewModelScope.launch(ioDispatcher) {
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
                        removePendingMessage(pendingMessage.tempId)
                        transitionToPlanningError(
                            planning = planning,
                            error = error,
                            persistSessionId = false,
                        )
                        return@launch
                    }

                    if (createdSessionId.isBlank()) {
                        removePendingMessage(pendingMessage.tempId)
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
                    rewritePendingSessionId(
                        fromSessionId = pendingMessage.sessionId,
                        toSessionId = createdSessionId,
                    )
                    createdSessionId
                }
            }

            appStateRepository.setLastViewedSessionId(sessionId)

            val sendResult = chatRepository.sendMessage(sessionId, content)
            if (sendResult.isFailure) {
                removePendingMessage(pendingMessage.tempId)
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

    private fun cancelActivePlan(state: RideFlowState) {
        val planId = (state as? RideFlowState.Planning)?.planId ?: activePlanId.value ?: return
        viewModelScope.launch(ioDispatcher) {
            chatRepository.cancelPlan(planId)
        }
    }

    private fun observeActiveRoutePlans() {
        flowState
            .map { state -> state.sessionIdOrNull() }
            .distinctUntilChanged()
            .flatMapLatest { sessionId ->
                activePlanId.value = null
                if (sessionId == null) {
                    flowOf(emptyList())
                } else {
                    chatRepository.subscribeToActiveRoutePlans(sessionId)
                }
            }
            .onEach { plans ->
                activePlanId.value = plans.firstActivePlanId()
            }
            .launchIn(viewModelScope)
    }

    private fun observeConfirmedMessages() {
        confirmedMessages
            .onEach { confirmed ->
                pendingMessages.update { currentPending ->
                    currentPending.filterNot { pending ->
                        confirmed.any { confirmedMessage ->
                            matchesPendingMessage(
                                pending = pending,
                                confirmed = confirmedMessage,
                            )
                        }
                    }
                }
            }
            .launchIn(viewModelScope)
    }

    private fun appendPendingMessage(
        current: RideFlowState,
        planning: RideFlowState.Planning,
        content: String,
    ): PendingMessage {
        val timestamp = clock()
        val pendingMessage = PendingMessage(
            tempId = "temp-$timestamp",
            sessionId = current.sessionIdOrNull() ?: planning.sessionId,
            content = content,
            sentAt = timestamp,
        )
        pendingMessages.update { currentPending -> currentPending + pendingMessage }
        return pendingMessage
    }

    private fun removePendingMessage(tempId: String) {
        pendingMessages.update { currentPending ->
            currentPending.filterNot { pending -> pending.tempId == tempId }
        }
    }

    private fun rewritePendingSessionId(
        fromSessionId: String,
        toSessionId: String,
    ) {
        if (fromSessionId == toSessionId) {
            return
        }

        pendingMessages.update { currentPending ->
            currentPending.map { pending ->
                if (pending.sessionId == fromSessionId) {
                    pending.copy(sessionId = toSessionId)
                } else {
                    pending
                }
            }
        }
    }

    private fun clearPendingMessages() {
        pendingMessages.value = emptyList()
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
            is RideFlowState.Idle -> state.sessionId
        }
        if (sessionId == null) {
            savedStateHandle.remove<String>(SESSION_ID_KEY)
        } else {
            savedStateHandle[SESSION_ID_KEY] = sessionId
        }
    }

    private fun RideFlowState.sessionIdOrNull(): String? =
        when (this) {
            is RideFlowState.WithSession -> sessionId
            is RideFlowState.Idle -> sessionId
            else -> null
        }

    private companion object {
        const val SESSION_ID_KEY = "sessionId"
    }
}

interface ChatRepository {
    fun subscribeToMessages(sessionId: String): Flow<List<SessionMessage>>

    fun subscribeToActiveRoutePlans(sessionId: String): Flow<List<RoutePlan>>

    suspend fun sendMessage(sessionId: String, content: String): Result<Unit>

    suspend fun cancelPlan(routePlanId: String): Result<Unit>
}

interface SessionRepository {
    suspend fun createSession(firstMessage: String): Result<String>
}

@Singleton
class ConvexChatRepository @Inject constructor(
    private val convexClientProvider: ConvexClientProvider,
) : ChatRepository {
    override fun subscribeToMessages(sessionId: String): Flow<List<SessionMessage>> =
        convexClientProvider.observeSessionMessages(sessionId)

    override fun subscribeToActiveRoutePlans(sessionId: String): Flow<List<RoutePlan>> =
        convexClientProvider.observeActiveRoutePlans(sessionId)

    override suspend fun sendMessage(sessionId: String, content: String): Result<Unit> =
        convexClientProvider.sendMessage(sessionId, content)

    override suspend fun cancelPlan(routePlanId: String): Result<Unit> =
        convexClientProvider.cancelPlan(routePlanId)
}

@Singleton
class ConvexSessionRepository @Inject constructor(
    private val convexClientProvider: ConvexClientProvider,
) : SessionRepository {
    override suspend fun createSession(firstMessage: String): Result<String> =
        convexClientProvider.createSession(firstMessage)
}

private fun List<RoutePlan>.firstActivePlanId(): String? =
    firstOrNull { plan ->
        plan.id.isNotBlank() && plan.status.isActiveRoutePlanStatus()
    }?.id

private fun String.isActiveRoutePlanStatus(): Boolean =
    equals("pending", ignoreCase = true) ||
        equals("running", ignoreCase = true)
