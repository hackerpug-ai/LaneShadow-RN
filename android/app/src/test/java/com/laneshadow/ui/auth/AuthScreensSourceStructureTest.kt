package com.laneshadow.ui.auth

import android.net.Uri
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performTextClearance
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performClick
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.repository.AuthRepository
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.AuthViewModel
import com.laneshadow.ui.auth.viewmodels.SignInViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File

@RunWith(RobolectricTestRunner::class)
class AuthScreensSourceStructureTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun signIn_continue_button_validates_email_and_click_advances_to_password_step() {
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

        val continueButton = composeTestRule.onNodeWithTag("signin_continue_button")
        continueButton.assertIsDisplayed()
        continueButton.assertIsNotEnabled()

        enterTextInField("signin_email_field", "invalid-email")
        continueButton.assertIsNotEnabled()

        enterTextInField("signin_email_field", "rider@laneshadow.com")
        continueButton.assertIsEnabled()

        continueButton.performClick()

        composeTestRule.onNodeWithText("Password").assertIsDisplayed()
        composeTestRule.onNodeWithText("Show password").assertIsDisplayed()
        composeTestRule.onNodeWithText("Sign in").assertIsDisplayed()
    }

    @Test
    fun signUp_create_account_stays_disabled_for_invalid_form_and_enables_when_valid() {
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

        val createAccountButton = composeTestRule.onNodeWithTag("signup_create_account_button")
        createAccountButton.assertIsNotEnabled()

        enterTextInField("signup_name_field", "Avery Rider")
        enterTextInField("signup_email_field", "invalid-email")
        enterTextInField("signup_password_field", "secret123")
        enterTextInField("signup_confirm_password_field", "secret124")

        createAccountButton.assertIsNotEnabled()

        enterTextInField("signup_email_field", "rider@laneshadow.com")
        enterTextInField("signup_confirm_password_field", "secret123")

        createAccountButton.assertIsEnabled()
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

    @Test
    fun authNavGraph_oauth_callback_navigation_is_single_top_and_centralized() {
        val source = File("src/main/java/com/laneshadow/navigation/AuthNavGraph.kt").readText()

        assertTrue(
            "OAuth callback route should be navigated through a single-top option",
            Regex(
                "navController\\.navigate\\(Route\\.OAuthCallback\\) \\{[\\s\\S]*?launchSingleTop = true",
            ).containsMatchIn(source),
        )
        assertEquals(
            "AuthNavGraph should only contain one explicit OAuth callback navigation call site",
            1,
            source.split("navController.navigate(Route.OAuthCallback)").size - 1,
        )
    }
}

private fun AuthScreensSourceStructureTest.enterTextInField(fieldTag: String, value: String) {
    composeTestRule
        .onNode(
            matcher = hasSetTextAction() and hasAnyAncestor(hasTestTag(fieldTag)),
            useUnmergedTree = true,
        )
        .performTextClearance()
    composeTestRule
        .onNode(
            matcher = hasSetTextAction() and hasAnyAncestor(hasTestTag(fieldTag)),
            useUnmergedTree = true,
        )
        .performTextInput(value)
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
