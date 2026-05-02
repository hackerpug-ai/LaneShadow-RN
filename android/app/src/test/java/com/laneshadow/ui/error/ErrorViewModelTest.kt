package com.laneshadow.ui.error

import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.repository.AuthRepository
import com.laneshadow.navigation.Route
import com.laneshadow.services.LaneShadowError
import com.laneshadow.services.NavEvent
import com.laneshadow.services.SignOutFlow
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.async
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
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
        val signOutFlow = SignOutFlow(
            authRepository = authRepository,
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )
        val viewModel = ErrorViewModel(signOutFlow)
        val navEvent = async(start = CoroutineStart.UNDISPATCHED) {
            signOutFlow.events.first()
        }

        viewModel.handle(LaneShadowError.Unauthenticated)
        advanceUntilIdle()

        assertThat(authRepository.signOutCalls.get()).isEqualTo(1)
        assertThat(navEvent.await()).isEqualTo(NavEvent.Navigate(Route.SignIn))
        assertThat(viewModel.uiState.value).isEqualTo(ErrorUiState.Hidden)
    }

    @Test
    fun suggestions_planLimitExceeded_omitsTryAgainChip() = runTest {
        val authRepository = FakeAuthRepository()
        val signOutFlow = SignOutFlow(
            authRepository = authRepository,
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )
        val viewModel = ErrorViewModel(signOutFlow)

        viewModel.handle(LaneShadowError.PlanLimitExceeded)
        advanceUntilIdle()

        val labels = viewModel.suggestions.value.map { it.label }

        assertThat(labels).contains("Start over")
        assertThat(labels).doesNotContain("Try again")
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
