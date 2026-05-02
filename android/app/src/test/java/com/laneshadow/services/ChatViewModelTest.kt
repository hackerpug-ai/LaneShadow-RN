package com.laneshadow.services

import androidx.lifecycle.SavedStateHandle
import com.google.common.truth.Truth.assertThat
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.toList
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
        val viewModel = ChatViewModel(
            chatRepository = chatRepository,
            sessionRepository = sessionRepository,
            appStateRepository = appStateRepository,
            savedStateHandle = SavedStateHandle(),
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
        assertThat(chatRepository.sentMessages.get()).isEqualTo(0)

        collector.cancel()
    }

    private class FakeChatRepository : ChatRepository {
        val sentMessages = AtomicInteger(0)

        override suspend fun sendMessage(sessionId: String, content: String): Result<Unit> {
            sentMessages.incrementAndGet()
            return Result.success(Unit)
        }
    }

    private class FakeSessionRepository : SessionRepository {
        val createdSessions = AtomicInteger(0)

        override suspend fun createSession(firstMessage: String): Result<String> {
            createdSessions.incrementAndGet()
            return Result.success("session-1")
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
