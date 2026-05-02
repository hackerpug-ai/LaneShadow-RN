package com.laneshadow.services

import androidx.lifecycle.SavedStateHandle
import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.chat.SessionMessage
import java.lang.reflect.Field
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class ChatViewModelOptimisticTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun dispatch_sendMessage_immediatelyAppendsPendingMessageWithTempId() = runTest {
        val createSessionGate = CompletableDeferred<Result<String>>()
        val sendMessageGate = CompletableDeferred<Result<Unit>>()
        val chatRepository = FakeChatRepository(
            confirmedMessages = MutableStateFlow(emptyList()),
            sendMessageGate = sendMessageGate,
        )
        val sessionRepository = FakeSessionRepository(createSessionGate)
        val viewModel = createViewModel(
            chatRepository = chatRepository,
            sessionRepository = sessionRepository,
            clock = { 1_000L },
            savedStateHandle = SavedStateHandle(mapOf("sessionId" to "sess-1")),
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )

        val collectionJob = launch { viewModel.displayMessages.collect { } }
        runCurrent()

        viewModel.dispatch(RideFlowAction.SendMessage("plan a ride"))

        assertThat(viewModel.displayMessages.value).containsExactly(
            DisplayMessage.Pending(
                tempId = "temp-1000",
                content = "plan a ride",
                sentAt = 1_000L,
            ),
        )
        assertThat(pendingMessages(viewModel)).containsExactly(
            PendingMessage(
                tempId = "temp-1000",
                sessionId = "sess-1",
                content = "plan a ride",
                sentAt = 1_000L,
            ),
        )

        viewModel.sendJob?.cancel()
        createSessionGate.cancel()
        sendMessageGate.cancel()
        collectionJob.cancel()
    }

    @Test
    fun reconcile_matchingConfirmedEmission_removesPendingAndKeepsServerEntry() = runTest {
        val confirmedMessages = MutableStateFlow<List<SessionMessage>>(emptyList())
        val createSessionGate = CompletableDeferred<Result<String>>()
        val chatRepository = FakeChatRepository(
            confirmedMessages = confirmedMessages,
        )
        val sessionRepository = FakeSessionRepository(createSessionGate)
        val viewModel = createViewModel(
            chatRepository = chatRepository,
            sessionRepository = sessionRepository,
            clock = { 1_000L },
            savedStateHandle = SavedStateHandle(mapOf("sessionId" to "sess-1")),
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )

        val collectionJob = launch { viewModel.displayMessages.collect { } }
        runCurrent()

        viewModel.dispatch(RideFlowAction.SendMessage("plan a ride"))

        assertThat(viewModel.displayMessages.value).containsExactly(
            DisplayMessage.Pending(
                tempId = "temp-1000",
                content = "plan a ride",
                sentAt = 1_000L,
            ),
        )

        confirmedMessages.value = listOf(
            SessionMessage(
                id = "msg-99",
                sessionId = "sess-1",
                role = "user",
                content = "plan a ride",
                status = "complete",
                createdAt = 1_200L,
            ),
        )
        runCurrent()

        assertThat(viewModel.displayMessages.value).containsExactly(
            DisplayMessage.Complete(
                serverId = "msg-99",
                content = "plan a ride",
            ),
        )
        assertThat(pendingMessages(viewModel)).isEmpty()

        viewModel.sendJob?.cancel()
        createSessionGate.cancel()
        collectionJob.cancel()
    }

    @Test
    fun reconcile_contentMismatch_keepsBothEntries() = runTest {
        val confirmedMessages = MutableStateFlow<List<SessionMessage>>(emptyList())
        val createSessionGate = CompletableDeferred<Result<String>>()
        val chatRepository = FakeChatRepository(
            confirmedMessages = confirmedMessages,
        )
        val sessionRepository = FakeSessionRepository(createSessionGate)
        val viewModel = createViewModel(
            chatRepository = chatRepository,
            sessionRepository = sessionRepository,
            clock = { 1_000L },
            savedStateHandle = SavedStateHandle(mapOf("sessionId" to "sess-1")),
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )

        val collectionJob = launch { viewModel.displayMessages.collect { } }
        runCurrent()

        viewModel.dispatch(RideFlowAction.SendMessage("plan a ride"))

        assertThat(viewModel.displayMessages.value).containsExactly(
            DisplayMessage.Pending(
                tempId = "temp-1000",
                content = "plan a ride",
                sentAt = 1_000L,
            ),
        )

        confirmedMessages.value = listOf(
            SessionMessage(
                id = "msg-100",
                sessionId = "sess-1",
                role = "user",
                content = "different message",
                status = "complete",
                createdAt = 1_200L,
            ),
        )
        runCurrent()

        assertThat(viewModel.displayMessages.value).containsExactly(
            DisplayMessage.Pending(
                tempId = "temp-1000",
                content = "plan a ride",
                sentAt = 1_000L,
            ),
            DisplayMessage.Complete(
                serverId = "msg-100",
                content = "different message",
            ),
        ).inOrder()
        assertThat(pendingMessages(viewModel)).hasSize(1)

        viewModel.sendJob?.cancel()
        createSessionGate.cancel()
        collectionJob.cancel()
    }

    @Test
    fun dispatch_cancelPlanning_callsCancelPlanAndCancelsSendJob() = runTest {
        val chatRepository = FakeChatRepository(
            confirmedMessages = MutableStateFlow(emptyList()),
        )
        val viewModel = createViewModel(
            chatRepository = chatRepository,
            sessionRepository = FakeSessionRepository(),
            clock = { 1_000L },
            savedStateHandle = SavedStateHandle(mapOf("sessionId" to "sess-1")),
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )
        val activeJob = Job()
        viewModel.sendJob = activeJob
        seedFlowState(
            viewModel = viewModel,
            state = RideFlowState.Planning(
                sessionId = "sess-1",
                planId = "plan-7",
            ),
        )

        viewModel.dispatch(RideFlowAction.CancelPlanning)

        assertThat(chatRepository.cancelPlanCalls).containsExactly("plan-7")
        assertThat(activeJob.isCancelled).isTrue()
    }

    @Test
    fun displayMessages_agentStreamingStatus_surfacesAsStreamingVariant() = runTest {
        val confirmedMessages = MutableStateFlow<List<SessionMessage>>(emptyList())
        val chatRepository = FakeChatRepository(
            confirmedMessages = confirmedMessages,
        )
        val viewModel = createViewModel(
            chatRepository = chatRepository,
            sessionRepository = FakeSessionRepository(),
            clock = { 1_000L },
            savedStateHandle = SavedStateHandle(mapOf("sessionId" to "sess-1")),
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )
        val collectionJob = launch { viewModel.displayMessages.collect { } }
        runCurrent()

        confirmedMessages.value = listOf(
            SessionMessage(
                id = "msg-99",
                sessionId = "sess-1",
                role = "agent",
                content = "working",
                status = "drafting",
                createdAt = 1_200L,
            ),
        )
        runCurrent()

        assertThat(viewModel.displayMessages.value).containsExactly(
            DisplayMessage.Streaming(
                serverId = "msg-99",
                content = "working",
                status = "drafting",
            ),
        )

        collectionJob.cancel()
    }

    private fun pendingMessages(viewModel: ChatViewModel): List<PendingMessage> {
        val pendingMessagesField: Field = ChatViewModel::class.java.getDeclaredField("pendingMessages")
        pendingMessagesField.isAccessible = true
        @Suppress("UNCHECKED_CAST")
        val pendingMessages = pendingMessagesField.get(viewModel) as MutableStateFlow<List<PendingMessage>>
        return pendingMessages.value
    }

    private fun createViewModel(
        chatRepository: ChatRepository,
        sessionRepository: SessionRepository,
        clock: () -> Long,
        savedStateHandle: SavedStateHandle,
        ioDispatcher: CoroutineDispatcher,
    ): ChatViewModel =
        ChatViewModel(
            chatRepository = chatRepository,
            sessionRepository = sessionRepository,
            appStateRepository = FakeAppStateRepository(),
            savedStateHandle = savedStateHandle,
            ioDispatcher = ioDispatcher,
            clock = clock,
        )

    private fun seedFlowState(
        viewModel: ChatViewModel,
        state: RideFlowState,
    ) {
        val flowStateField: Field = ChatViewModel::class.java.getDeclaredField("_flowState")
        flowStateField.isAccessible = true
        @Suppress("UNCHECKED_CAST")
        val flowState = flowStateField.get(viewModel) as MutableStateFlow<RideFlowState>
        flowState.value = state
    }

    private class FakeChatRepository(
        private val confirmedMessages: MutableStateFlow<List<SessionMessage>>,
        private val sendMessageGate: CompletableDeferred<Result<Unit>>? = null,
    ) : ChatRepository {
        val subscribeCalls = AtomicInteger(0)
        val sendMessageCalls = AtomicInteger(0)
        val cancelPlanCalls = mutableListOf<String>()

        override fun subscribeToMessages(sessionId: String): Flow<List<SessionMessage>> {
            subscribeCalls.incrementAndGet()
            return confirmedMessages
        }

        override suspend fun sendMessage(sessionId: String, content: String): Result<Unit> {
            sendMessageCalls.incrementAndGet()
            return sendMessageGate?.await() ?: Result.success(Unit)
        }

        override suspend fun cancelPlan(routePlanId: String): Result<Unit> {
            cancelPlanCalls += routePlanId
            return Result.success(Unit)
        }
    }

    private class FakeSessionRepository(
        private val createSessionGate: CompletableDeferred<Result<String>>? = null,
    ) : SessionRepository {
        val createSessionCalls = AtomicInteger(0)

        override suspend fun createSession(firstMessage: String): Result<String> {
            createSessionCalls.incrementAndGet()
            return createSessionGate?.await() ?: Result.success("sess-1")
        }
    }

    private class FakeAppStateRepository : AppStateRepository {
        override val appState = kotlinx.coroutines.flow.flowOf(AppPreferences())

        override suspend fun setLastViewedSessionId(sessionId: String?) = Unit
        override suspend fun setSessionCamera(sessionId: String, camera: CameraPosition) = Unit
        override suspend fun setDefaultCamera(camera: CameraPosition?) = Unit
        override suspend fun setThemeMode(themeMode: ThemeMode) = Unit
        override suspend fun setHasCompletedOnboarding(hasCompletedOnboarding: Boolean) = Unit
        override suspend fun clearSessionLocalState() = Unit
    }
}
