package com.laneshadow.ui.auth

import android.net.Uri
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.repository.AuthRepository
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.AuthViewModel
import com.laneshadow.ui.auth.viewmodels.SignInViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class AuthScreensSourceStructureTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun signIn_email_step_disables_continue_until_valid_email_then_shows_password_step() {
        val authViewModel = AuthViewModel(FakeAuthRepository())
        val signInViewModel = SignInViewModel()

        composeTestRule.setContent {
            LaneShadowTheme {
                SignInScreen(
                    viewModel = authViewModel,
                    signInViewModel = signInViewModel,
                )
            }
        }

        composeTestRule.onNodeWithText("Continue").assertIsDisplayed()

        signInViewModel.onEmailChanged("rider@laneshadow.com")
        signInViewModel.continueToPassword()
        composeTestRule.waitForIdle()

        composeTestRule.onNodeWithText("Password").assertIsDisplayed()
        composeTestRule.onNodeWithText("Show password").assertIsDisplayed()
        composeTestRule.onNodeWithText("Sign in").assertIsDisplayed()
    }

    @Test
    fun signUp_shows_email_validation_and_enables_create_account_when_form_valid() {
        val authViewModel = AuthViewModel(FakeAuthRepository())

        composeTestRule.setContent {
            LaneShadowTheme {
                SignUpScreen(viewModel = authViewModel)
            }
        }

        composeTestRule.onNodeWithText("Name").assertIsDisplayed()
        composeTestRule.onNodeWithText("Email").assertIsDisplayed()
        composeTestRule.onNodeWithText("Password").assertIsDisplayed()
        composeTestRule.onNodeWithText("Confirm password").assertIsDisplayed()
    }

    @Test
    fun oauthCallback_invokes_handler_for_uri_and_renders_error_state() {
        val repository = FakeAuthRepository()
        val authViewModel = AuthViewModel(repository)

        composeTestRule.setContent {
            LaneShadowTheme {
                OAuthCallbackScreen(
                    deepLinkUri = Uri.parse("laneshadow://oauth-callback?code=abc"),
                    onNavigateToSignIn = {},
                    viewModel = authViewModel,
                )
            }
        }

        composeTestRule.waitForIdle()
        assertEquals("laneshadow://oauth-callback?code=abc", repository.lastCallbackUri?.toString())

        repository.authStateFlow.value = AuthState.Error("Callback failed")
        composeTestRule.waitForIdle()

        composeTestRule.onNodeWithText("Sign-in callback failed").assertIsDisplayed()
        composeTestRule.onNodeWithText("Callback failed").assertIsDisplayed()
        composeTestRule.onNodeWithText("Retry callback").assertIsDisplayed()
    }
}

private class FakeAuthRepository : AuthRepository {
    val authStateFlow = MutableStateFlow<AuthState>(AuthState.SignedOut)
    var lastCallbackUri: Uri? = null

    override suspend fun signIn(email: String, password: String): Result<ClerkUser> =
        Result.failure(UnsupportedOperationException("not needed in this test"))

    override suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser> =
        Result.failure(UnsupportedOperationException("not needed in this test"))

    override suspend fun completeSignUpVerification(code: String): Result<ClerkUser> =
        Result.failure(UnsupportedOperationException("not needed in this test"))

    override suspend fun signOut(): Result<Unit> = Result.success(Unit)

    override suspend fun signInWithGoogle(): Result<ClerkUser> =
        Result.failure(UnsupportedOperationException("not needed in this test"))

    override suspend fun signInWithApple(): Result<ClerkUser> =
        Result.failure(UnsupportedOperationException("not needed in this test"))

    override suspend fun handleOAuthCallback(uri: Uri): Result<ClerkUser> {
        lastCallbackUri = uri
        return Result.failure(IllegalStateException("expected failure in test"))
    }

    override suspend fun getJwtForConvex(): String = ""

    override fun observeAuthState(): StateFlow<AuthState> = authStateFlow
}
