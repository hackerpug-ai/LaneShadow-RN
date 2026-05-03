package com.laneshadow.ui.error

import android.app.Application
import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.google.common.truth.Truth.assertThat
import com.laneshadow.R
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.repository.AuthRepository
import com.laneshadow.navigation.Route
import com.laneshadow.services.ConvexClientProvider
import com.laneshadow.services.ConvexCurrentUser
import com.laneshadow.services.ConvexGateway
import com.laneshadow.services.ConvexSendMessageResponseDto
import com.laneshadow.services.LaneShadowError
import com.laneshadow.services.NavEvent
import com.laneshadow.services.SignOutFlow
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.emptyFlow
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
class ErrorViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun handle_unauthenticatedError_signsOutAndNavigatesToSignIn() = runTest {
        val authRepository = FakeAuthRepository()
        val convexGateway = RecordingConvexGateway(authRepository)
        val convexClientProvider = ConvexClientProvider(
            authRepository = authRepository,
            appContext = Application(),
            convexGateway = convexGateway,
        )
        val signOutFlow = SignOutFlow(
            convexClientProvider = convexClientProvider,
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )
        val viewModel = ErrorViewModel(signOutFlow)
        val navEvents = mutableListOf<NavEvent>()
        val collectionJob = launch {
            signOutFlow.events.collect { event ->
                navEvents += event
            }
        }
        advanceUntilIdle()

        viewModel.handle(LaneShadowError.Unauthenticated)
        advanceUntilIdle()

        assertThat(authRepository.signOutCalls.get()).isEqualTo(1)
        assertThat(convexGateway.logoutCount.get()).isEqualTo(1)
        assertThat(navEvents).containsExactly(NavEvent.Navigate(Route.SignIn))
        assertThat(viewModel.uiState.value).isEqualTo(ErrorUiState.Hidden)
        collectionJob.cancel()
    }

    @Test
    fun handle_retryAndResetSuggestions_emitDistinctRecoveryEvents() = runTest {
        val signOutFlow = SignOutFlow(
            convexClientProvider = ConvexClientProvider(
                authRepository = FakeAuthRepository(),
                appContext = Application(),
                convexGateway = RecordingConvexGateway(),
            ),
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )
        val viewModel = ErrorViewModel(signOutFlow)

        viewModel.handle(LaneShadowError.AgentTimeout)
        advanceUntilIdle()

        val events = mutableListOf<ErrorRecoveryEvent>()
        val collectionJob = launch {
            viewModel.recoveryEvents.collect { event ->
                events += event
            }
        }
        advanceUntilIdle()

        viewModel.handle(
            ErrorSuggestion(
                id = "retry",
                labelResId = R.string.error_action_try_again,
                isPrimary = true,
                action = ErrorSuggestionAction.Retry,
            ),
        )
        viewModel.handle(
            ErrorSuggestion(
                id = "reset",
                labelResId = R.string.error_action_start_over,
                action = ErrorSuggestionAction.Reset,
            ),
        )

        advanceUntilIdle()

        assertThat(events).containsExactly(
            ErrorRecoveryEvent.Retry,
            ErrorRecoveryEvent.StartOver,
        ).inOrder()
        assertThat(viewModel.uiState.value).isEqualTo(ErrorUiState.Visible(LaneShadowError.AgentTimeout))
        collectionJob.cancel()
    }

    @Test
    fun suggestions_planLimitExceeded_omitsTryAgainChip() = runTest {
        val authRepository = FakeAuthRepository()
        val signOutFlow = SignOutFlow(
            convexClientProvider = ConvexClientProvider(
                authRepository = authRepository,
                appContext = Application(),
                convexGateway = RecordingConvexGateway(),
            ),
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )
        val viewModel = ErrorViewModel(signOutFlow)

        viewModel.handle(LaneShadowError.PlanLimitExceeded)
        advanceUntilIdle()

        val context = ApplicationProvider.getApplicationContext<Context>()
        val labels = viewModel.suggestions.value.map { context.getString(it.labelResId) }

        assertThat(labels).containsExactly(
            context.getString(R.string.error_action_start_over),
        )
        assertThat(labels).doesNotContain(context.getString(R.string.error_action_try_again))
    }

    @Test
    fun suggestions_authRequired_usesResourceBackedSignInLabel() = runTest {
        val signOutFlow = SignOutFlow(
            convexClientProvider = ConvexClientProvider(
                authRepository = FakeAuthRepository(),
                appContext = Application(),
                convexGateway = RecordingConvexGateway(),
            ),
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )
        val viewModel = ErrorViewModel(signOutFlow)
        val context = ApplicationProvider.getApplicationContext<Context>()

        viewModel.handle(LaneShadowError.AuthRequired)
        advanceUntilIdle()

        val suggestions = viewModel.suggestions.value
        assertThat(suggestions).hasSize(1)
        assertThat(context.getString(suggestions.single().labelResId))
            .isEqualTo(context.getString(R.string.error_action_sign_in))
    }

    private class FakeAuthRepository : AuthRepository {
        val signOutCalls = AtomicInteger(0)
        private val authState = MutableStateFlow<AuthState>(AuthState.SignedOut)

        override suspend fun signIn(email: String, password: String): Result<ClerkUser> =
            Result.failure(UnsupportedOperationException())

        override suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser> =
            Result.failure(UnsupportedOperationException())

        override suspend fun completeSignUpVerification(code: String): Result<ClerkUser> =
            Result.failure(UnsupportedOperationException())

        override suspend fun signOut(): Result<Unit> {
            signOutCalls.incrementAndGet()
            authState.value = AuthState.SignedOut
            return Result.success(Unit)
        }

        override suspend fun handleUnauthenticated(message: String): Result<Unit> =
            Result.failure(UnsupportedOperationException())

        override suspend fun signInWithGoogle(): Result<ClerkUser> =
            Result.failure(UnsupportedOperationException())

        override suspend fun signInWithApple(): Result<ClerkUser> =
            Result.failure(UnsupportedOperationException())

        override suspend fun handleOAuthCallback(uri: android.net.Uri): Result<ClerkUser> =
            Result.failure(UnsupportedOperationException())

        override suspend fun getJwtForConvex(): String =
            throw UnsupportedOperationException()

        override suspend fun bypassForTesting(): Result<ClerkUser> =
            Result.failure(UnsupportedOperationException())

        override fun observeAuthState(): StateFlow<AuthState> = authState
    }

    private class RecordingConvexGateway(
        private val authRepository: AuthRepository? = null,
    ) : ConvexGateway {
        val logoutCount = AtomicInteger(0)

        override suspend fun bindAuthToken(token: String): Result<Unit> = Result.success(Unit)

        override suspend fun clearAuth(context: android.content.Context): Result<Unit> {
            logoutCount.incrementAndGet()
            authRepository?.signOut()
            return Result.success(Unit)
        }

        override suspend fun getCurrentUser(): ConvexCurrentUser? = null

        override fun observeCurrentUser(): Flow<ConvexCurrentUser?> = emptyFlow()

        override fun observePlanningSessions(): Flow<List<com.laneshadow.data.session.PlanningSession>> =
            emptyFlow()

        override fun observeSessionMessages(sessionId: String): Flow<List<com.laneshadow.data.chat.SessionMessage>> =
            emptyFlow()

        override fun observeActiveRoutePlans(sessionId: String): Flow<List<com.laneshadow.data.route.RoutePlan>> =
            emptyFlow()

        override fun observeSessions(): Flow<List<com.laneshadow.ui.organisms.Session>> =
            emptyFlow()

        override suspend fun sendMessage(
            sessionId: String,
            content: String,
            currentLocation: com.laneshadow.ui.atoms.LatLng?,
        ): Result<ConvexSendMessageResponseDto> =
            Result.failure(UnsupportedOperationException())

        override suspend fun createSession(firstMessage: String): Result<String> =
            Result.failure(UnsupportedOperationException())

        override suspend fun cancelPlan(routePlanId: String): Result<Unit> =
            Result.failure(UnsupportedOperationException())
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
