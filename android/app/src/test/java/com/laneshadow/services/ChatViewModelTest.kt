package com.laneshadow.services

import androidx.lifecycle.SavedStateHandle
import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.chat.SessionMessage
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicReference
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.flow.take
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestDispatcher
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestWatcher
import org.junit.runner.Description

@OptIn(ExperimentalCoroutinesApi::class)
class ChatViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun dispatch_sendMessage_emitsPlanningAndStartsSendJob() = runTest {
        val chatRepository = FakeChatRepository()
        val sessionRepository = FakeSessionRepository()
        val appStateRepository = FakeAppStateRepository()
        val savedStateHandle = SavedStateHandle()
        val viewModel = ChatViewModel(
            chatRepository = chatRepository,
            sessionRepository = sessionRepository,
            appStateRepository = appStateRepository,
            savedStateHandle = savedStateHandle,
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
            clock = { 1_000L },
        )

        val emissions = mutableListOf<RideFlowState>()
        val collector = launch {
            viewModel.flowState.take(2).toList(emissions)
        }

        advanceUntilIdle()
        assertThat(emissions.first()).isEqualTo(RideFlowState.Idle())

        viewModel.dispatch(RideFlowAction.SendMessage("hi"))
        advanceUntilIdle()

        assertThat(emissions).hasSize(2)
        assertThat(emissions[1]).isInstanceOf(RideFlowState.Planning::class.java)
        assertThat(viewModel.sendJob).isNotNull()
        assertThat(sessionRepository.createdSessions.get()).isEqualTo(1)
        assertThat(chatRepository.sentMessages.get()).isEqualTo(1)
        assertThat(chatRepository.lastSessionId.get()).isEqualTo("session-1")
        assertThat(chatRepository.lastMessage.get()).isEqualTo("hi")
        assertThat(sessionRepository.lastFirstMessage.get()).isEqualTo("")
        assertThat(savedStateHandle.get<String>("sessionId")).isEqualTo("session-1")
        assertThat(appStateRepository.lastViewedSessionId).isEqualTo("session-1")
        assertThat(viewModel.flowState.value).isEqualTo(
            RideFlowState.Planning(sessionId = "session-1"),
        )

        collector.cancel()
    }

    private class FakeChatRepository : ChatRepository {
        val sentMessages = AtomicInteger(0)
        val lastSessionId = AtomicReference<String?>(null)
        val lastMessage = AtomicReference<String?>(null)

        override fun subscribeToMessages(sessionId: String): Flow<List<SessionMessage>> = emptyFlow()

        override suspend fun sendMessage(sessionId: String, content: String): Result<Unit> {
            sentMessages.incrementAndGet()
            lastSessionId.set(sessionId)
            lastMessage.set(content)
            return Result.success(Unit)
        }

        override suspend fun cancelPlan(routePlanId: String): Result<Unit> = Result.success(Unit)
    }

    private class FakeSessionRepository : SessionRepository {
        val createdSessions = AtomicInteger(0)
        val lastFirstMessage = AtomicReference<String?>(null)

        override suspend fun createSession(firstMessage: String): Result<String> {
            createdSessions.incrementAndGet()
            lastFirstMessage.set(firstMessage)
            return Result.success("session-1")
        }
    }

    private class FakeAppStateRepository : AppStateRepository {
        override val appState = kotlinx.coroutines.flow.flowOf(AppPreferences())
        var lastViewedSessionId: String? = null

        override suspend fun setLastViewedSessionId(sessionId: String?) {
            lastViewedSessionId = sessionId
        }
        override suspend fun setSessionCamera(sessionId: String, camera: CameraPosition) = Unit
        override suspend fun setDefaultCamera(camera: CameraPosition?) = Unit
        override suspend fun setThemeMode(themeMode: ThemeMode) = Unit
        override suspend fun setHasCompletedOnboarding(hasCompletedOnboarding: Boolean) = Unit
        override suspend fun clearSessionLocalState() = Unit
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
class MainDispatcherRule(
    private val dispatcher: TestDispatcher = UnconfinedTestDispatcher(),
) : TestWatcher() {
    override fun starting(description: Description) {
        Dispatchers.setMain(dispatcher)
    }

    override fun finished(description: Description) {
        Dispatchers.resetMain()
    }
}
