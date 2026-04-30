package com.laneshadow.ui.auth

import com.google.common.truth.Truth.assertThat
import com.laneshadow.ui.auth.models.AuthScreenStep
import com.laneshadow.ui.auth.viewmodels.AuthEmailBranchResolver
import com.laneshadow.ui.auth.viewmodels.AuthEmailBranchResult
import com.laneshadow.ui.auth.viewmodels.AuthScreenViewModel
import com.laneshadow.ui.auth.viewmodels.SignInRouteAuthEmailBranchResolver
import com.laneshadow.ui.auth.viewmodels.SignUpRouteAuthEmailBranchResolver
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
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
class AuthScreenViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun continueFromEmail_rejects_invalid_email_withoutResolverCall() = runTest {
        val resolver = RecordingEmailBranchResolver(AuthEmailBranchResult.ExistingUser)
        val viewModel = AuthScreenViewModel(resolver)

        viewModel.onEmailChanged("elena@hey")
        viewModel.continueFromEmail()
        advanceUntilIdle()

        assertThat(viewModel.uiState.value.step).isEqualTo(AuthScreenStep.EmailEntry)
        assertThat(viewModel.uiState.value.emailError).contains("complete email")
        assertThat(resolver.requests).isEmpty()
    }

    @Test
    fun signInRouteResolver_returnsExistingUserForValidRouteEmail() = runTest {
        assertThat(SignInRouteAuthEmailBranchResolver.resolve("same.email@example.com"))
            .isEqualTo(AuthEmailBranchResult.ExistingUser)
    }

    @Test
    fun signUpRouteResolver_returnsNewUserForValidRouteEmail() = runTest {
        assertThat(SignUpRouteAuthEmailBranchResolver.resolve("same.email@example.com"))
            .isEqualTo(AuthEmailBranchResult.NewUser)
    }

    @Test
    fun continueFromEmail_usesResolverExistingUserResultWithoutEmailHeuristics() = runTest {
        val resolver = RecordingEmailBranchResolver(AuthEmailBranchResult.ExistingUser)
        val viewModel = AuthScreenViewModel(resolver)

        viewModel.onEmailChanged("  elena@ridelaneshadow.com  ")
        viewModel.continueFromEmail()
        advanceUntilIdle()

        assertThat(resolver.requests).containsExactly("elena@ridelaneshadow.com")
        assertThat(viewModel.uiState.value.step).isEqualTo(AuthScreenStep.ExistingUser)
        assertThat(viewModel.uiState.value.isSubmitting).isFalse()
    }

    @Test
    fun continueFromEmail_usesResolverNewUserResultWithoutEmailHeuristics() = runTest {
        val resolver = RecordingEmailBranchResolver(AuthEmailBranchResult.NewUser)
        val viewModel = AuthScreenViewModel(resolver)

        viewModel.onEmailChanged("elena@ridelaneshadow.com")
        viewModel.continueFromEmail()
        advanceUntilIdle()

        assertThat(resolver.requests).containsExactly("elena@ridelaneshadow.com")
        assertThat(viewModel.uiState.value.step).isEqualTo(AuthScreenStep.NewUser)
        assertThat(viewModel.uiState.value.isSubmitting).isFalse()
    }

    @Test
    fun continueFromEmail_setsSubmittingWhileResolverIsPending() = runTest {
        val result = CompletableDeferred<AuthEmailBranchResult>()
        val resolver = PendingEmailBranchResolver(result)
        val viewModel = AuthScreenViewModel(resolver)

        viewModel.onEmailChanged("elena@ridelaneshadow.com")
        viewModel.continueFromEmail()

        assertThat(viewModel.uiState.value.isSubmitting).isTrue()
        assertThat(viewModel.uiState.value.step).isEqualTo(AuthScreenStep.EmailEntry)
        assertThat(resolver.requests).containsExactly("elena@ridelaneshadow.com")

        result.complete(AuthEmailBranchResult.ExistingUser)
        advanceUntilIdle()

        assertThat(viewModel.uiState.value.step).isEqualTo(AuthScreenStep.ExistingUser)
        assertThat(viewModel.uiState.value.isSubmitting).isFalse()
    }

    private class RecordingEmailBranchResolver(
        private val result: AuthEmailBranchResult,
    ) : AuthEmailBranchResolver {
        val requests = mutableListOf<String>()

        override suspend fun resolve(email: String): AuthEmailBranchResult {
            requests += email
            return result
        }
    }

    private class PendingEmailBranchResolver(
        private val result: CompletableDeferred<AuthEmailBranchResult>,
    ) : AuthEmailBranchResolver {
        val requests = mutableListOf<String>()

        override suspend fun resolve(email: String): AuthEmailBranchResult {
            requests += email
            return result.await()
        }
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
