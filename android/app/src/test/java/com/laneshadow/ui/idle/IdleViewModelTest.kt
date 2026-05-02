package com.laneshadow.ui.idle

import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.chat.ChatRepository
import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.data.session.SessionRepository
import com.laneshadow.data.session.PlanningSession
import com.laneshadow.data.user.CurrentUser
import com.laneshadow.data.user.UserRepository
import com.laneshadow.services.MainDispatcherRule
import com.laneshadow.ui.atoms.LatLng
import java.io.IOException
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Rule
import org.junit.Test

class IdleViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun state_emitsGreetingWithDisplayNameFromCurrentUser() = runTest {
        val viewModel = IdleViewModel(
            userRepository = FakeUserRepository(
                currentUser = CurrentUser(
                    displayName = "Avery",
                    email = "avery@example.com",
                ),
            ),
            sessionRepository = FakeSessionRepository(),
            chatRepository = FakeChatRepository(),
        )

        advanceUntilIdle()

        assertThat(viewModel.state.value.greeting).contains("Avery")
        assertThat(viewModel.state.value.greeting)
            .containsMatch("Good (morning|afternoon|evening), Avery")
    }

    @Test
    fun onSuggestionTap_createsSessionThenSendsMessageAndSetsNavigateTo() = runTest {
        val sessionRepository = FakeSessionRepository()
        val chatRepository = FakeChatRepository()
        val viewModel = IdleViewModel(
            userRepository = FakeUserRepository(
                currentUser = CurrentUser(
                    displayName = "Avery",
                    email = "avery@example.com",
                ),
            ),
            sessionRepository = sessionRepository,
            chatRepository = chatRepository,
        )

        viewModel.onSuggestionTap(SuggestionChip(text = "Plan a scenic 2-hour ride"))
        advanceUntilIdle()

        assertThat(sessionRepository.createSessionCalls.get()).isEqualTo(1)
        assertThat(chatRepository.sendMessageCalls.get()).isEqualTo(1)
        assertThat(chatRepository.lastSessionId).isEqualTo("sess-42")
        assertThat(chatRepository.lastContent).isEqualTo("Plan a scenic 2-hour ride")
        assertThat(viewModel.state.value.navigateTo).isEqualTo(IdleNavTarget.Planning("sess-42"))
    }

    @Test
    fun onSend_createSessionFailure_surfacesErrorToastAndStaysOnIdle() = runTest {
        val sessionRepository = FakeSessionRepository(
            createSessionResult = Result.failure(IOException("offline")),
        )
        val chatRepository = FakeChatRepository()
        val viewModel = IdleViewModel(
            userRepository = FakeUserRepository(
                currentUser = CurrentUser(
                    displayName = "Avery",
                    email = "avery@example.com",
                ),
            ),
            sessionRepository = sessionRepository,
            chatRepository = chatRepository,
        )

        viewModel.onSend("plan a ride")
        advanceUntilIdle()

        assertThat(sessionRepository.createSessionCalls.get()).isEqualTo(1)
        assertThat(chatRepository.sendMessageCalls.get()).isEqualTo(0)
        assertThat(viewModel.state.value.errorToast).contains("offline")
        assertThat(viewModel.state.value.navigateTo).isNull()
    }

    @Test
    fun state_surfacesCurrentUserSubscriptionFailures() = runTest {
        val viewModel = IdleViewModel(
            userRepository = FailingUserRepository(IOException("offline")),
            sessionRepository = FakeSessionRepository(),
            chatRepository = FakeChatRepository(),
        )

        advanceUntilIdle()

        assertThat(viewModel.state.value.subscriptionError).contains("offline")
        assertThat(viewModel.state.value.isLoading).isFalse()
    }

    private class FakeUserRepository(
        private val currentUser: CurrentUser?,
    ) : UserRepository {
        override fun subscribeToCurrentUser(): Flow<CurrentUser?> = flowOf(currentUser)
    }

    private class FailingUserRepository(
        private val error: Throwable,
    ) : UserRepository {
        override fun subscribeToCurrentUser(): Flow<CurrentUser?> = flow {
            throw error
        }
    }

    private class FakeSessionRepository : SessionRepository {
        val createSessionCalls = AtomicInteger(0)
        private val _createSessionResult: Result<String>

        constructor(createSessionResult: Result<String> = Result.success("sess-42")) {
            _createSessionResult = createSessionResult
        }

        override fun subscribeToSessions(): Flow<List<PlanningSession>> = flowOf(emptyList())

        override suspend fun createSession(firstMessage: String): Result<String> {
            createSessionCalls.incrementAndGet()
            return _createSessionResult
        }
    }

    private class FakeChatRepository : ChatRepository {
        val sendMessageCalls = AtomicInteger(0)
        var lastSessionId: String? = null
        var lastContent: String? = null

        override fun subscribeToMessages(sessionId: String): Flow<List<SessionMessage>> =
            flowOf(emptyList())

        override suspend fun sendMessage(
            sessionId: String,
            content: String,
            currentLocation: LatLng?,
        ): Result<Unit> {
            sendMessageCalls.incrementAndGet()
            lastSessionId = sessionId
            lastContent = content
            return Result.success(Unit)
        }
    }
}
