package com.laneshadow.navigation

import android.app.Application
import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.chat.ChatRepository
import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.repository.AuthRepository
import com.laneshadow.data.route.RoutePlan
import com.laneshadow.data.session.PlanningSession
import com.laneshadow.services.AppPreferences
import com.laneshadow.services.AppStateRepository
import com.laneshadow.services.CameraPosition
import com.laneshadow.services.ConvexClientProvider
import com.laneshadow.services.ConvexCurrentUser
import com.laneshadow.services.ConvexGateway
import com.laneshadow.services.ConvexSendMessageResponseDto
import com.laneshadow.services.MainDispatcherRule
import com.laneshadow.services.SignOutFlow
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.organisms.Session
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Rule
import org.junit.Test

@OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
class MainNavViewModelTest {
    private val testDispatcher = UnconfinedTestDispatcher()

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule(testDispatcher)

    @Test
    fun retryPlanning_sendsCachedPlanningRequest() = runTest {
        val chatRepository = RecordingChatRepository()
        val appStateRepository = RecordingAppStateRepository()
        val viewModel = MainNavViewModel(
            signOutFlow = testSignOutFlow(),
            chatRepository = chatRepository,
            appStateRepository = appStateRepository,
        )

        viewModel.cachePlanningRetry(
            sessionId = "sess-1",
            content = "Plan a scenic ride",
        )
        viewModel.retryPlanning()
        advanceUntilIdle()

        assertThat(chatRepository.sendMessageCalls.get()).isEqualTo(1)
        assertThat(chatRepository.lastSessionId).isEqualTo("sess-1")
        assertThat(chatRepository.lastContent).isEqualTo("Plan a scenic ride")
    }

    @Test
    fun startOver_clearsAppStateWithoutNavigatingOnly() = runTest {
        val chatRepository = RecordingChatRepository()
        val appStateRepository = RecordingAppStateRepository()
        val viewModel = MainNavViewModel(
            signOutFlow = testSignOutFlow(),
            chatRepository = chatRepository,
            appStateRepository = appStateRepository,
        )

        viewModel.startOver()
        advanceUntilIdle()

        assertThat(appStateRepository.clearSessionLocalStateCalls.get()).isEqualTo(1)
        assertThat(chatRepository.sendMessageCalls.get()).isEqualTo(0)
    }

    private fun testSignOutFlow(): SignOutFlow {
        val authRepository = FakeAuthRepository()
        val convexGateway = NoopConvexGateway()
        val convexClientProvider = ConvexClientProvider(
            authRepository = authRepository,
            appContext = Application(),
            convexGateway = convexGateway,
        )
        return SignOutFlow(
            convexClientProvider = convexClientProvider,
            ioDispatcher = testDispatcher,
        )
    }

    private class RecordingChatRepository : ChatRepository {
        val sendMessageCalls = AtomicInteger(0)
        var lastSessionId: String? = null
        var lastContent: String? = null

        override fun subscribeToMessages(sessionId: String): Flow<List<SessionMessage>> = emptyFlow()

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

    private class RecordingAppStateRepository : AppStateRepository {
        val clearSessionLocalStateCalls = AtomicInteger(0)
        private val appStateFlow = MutableStateFlow(AppPreferences())

        override val appState: Flow<AppPreferences> = appStateFlow

        override suspend fun setLastViewedSessionId(sessionId: String?) = Unit
        override suspend fun setSessionCamera(sessionId: String, camera: CameraPosition) = Unit
        override suspend fun setDefaultCamera(camera: CameraPosition?) = Unit
        override suspend fun setThemeMode(themeMode: com.laneshadow.services.ThemeMode) = Unit
        override suspend fun setHasCompletedOnboarding(hasCompletedOnboarding: Boolean) = Unit

        override suspend fun clearSessionLocalState() {
            clearSessionLocalStateCalls.incrementAndGet()
        }
    }

    private class FakeAuthRepository : AuthRepository {
        private val authState = MutableStateFlow<AuthState>(AuthState.SignedOut)

        override suspend fun signIn(email: String, password: String): Result<ClerkUser> =
            Result.failure(UnsupportedOperationException())

        override suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser> =
            Result.failure(UnsupportedOperationException())

        override suspend fun completeSignUpVerification(code: String): Result<ClerkUser> =
            Result.failure(UnsupportedOperationException())

        override suspend fun signOut(): Result<Unit> {
            authState.value = AuthState.SignedOut
            return Result.success(Unit)
        }

        override suspend fun handleUnauthenticated(message: String): Result<Unit> =
            Result.success(Unit)

        override suspend fun signInWithGoogle(): Result<ClerkUser> =
            Result.failure(UnsupportedOperationException())

        override suspend fun signInWithApple(): Result<ClerkUser> =
            Result.failure(UnsupportedOperationException())

        override suspend fun handleOAuthCallback(uri: android.net.Uri): Result<ClerkUser> =
            Result.failure(UnsupportedOperationException())

        override suspend fun getJwtForConvex(): String =
            "test-jwt"

        override suspend fun bypassForTesting(): Result<ClerkUser> =
            Result.failure(UnsupportedOperationException())

        override fun observeAuthState(): StateFlow<AuthState> = authState
    }

    private class NoopConvexGateway : ConvexGateway {
        override suspend fun bindAuthToken(token: String): Result<Unit> = Result.success(Unit)

        override suspend fun clearAuth(context: android.content.Context): Result<Unit> =
            Result.success(Unit)

        override suspend fun getCurrentUser(): ConvexCurrentUser? = null

        override fun observeCurrentUser(): Flow<ConvexCurrentUser?> = emptyFlow()

        override fun observePlanningSessions(): Flow<List<PlanningSession>> = emptyFlow()

        override fun observeSessionMessages(sessionId: String): Flow<List<SessionMessage>> =
            emptyFlow()

        override fun observeActiveRoutePlans(sessionId: String): Flow<List<RoutePlan>> = emptyFlow()

        override fun observeSessions(): Flow<List<Session>> = emptyFlow()

        override suspend fun sendMessage(
            sessionId: String,
            content: String,
            currentLocation: LatLng?,
        ): Result<ConvexSendMessageResponseDto> =
            Result.failure(UnsupportedOperationException())

        override suspend fun createSession(firstMessage: String): Result<String> =
            Result.failure(UnsupportedOperationException())

        override suspend fun cancelPlan(routePlanId: String): Result<Unit> =
            Result.failure(UnsupportedOperationException())
    }
}
