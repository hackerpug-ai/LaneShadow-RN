package com.laneshadow.ui.auth

import android.net.Uri
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performTextClearance
import androidx.compose.ui.test.performTextInput
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.repository.AuthRepository
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.AuthViewModel
import com.laneshadow.ui.auth.models.AuthScreenStep
import com.laneshadow.ui.auth.models.AuthScreenUiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.File

@RunWith(RobolectricTestRunner::class)
@Config(application = android.app.Application::class)
class AuthScreensSourceStructureTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun authScreen_email_entry_renders_design_anatomy() {
        composeTestRule.setContent {
            LaneShadowTheme {
                AuthScreenContent(
                    state = AuthScreenUiState(),
                    showBackButton = false,
                )
            }
        }

        composeTestRule.onNodeWithText("Saddle up.").assertIsDisplayed()
        composeTestRule.onNodeWithText("Continue with Apple").assertIsDisplayed()
        composeTestRule.onNodeWithText("OR CONTINUE WITH EMAIL").assertIsDisplayed()

        val continueButton = composeTestRule.onNodeWithTag("auth_continue_button")
        continueButton.fetchSemanticsNode()
    }

    @Test
    fun authScreen_existing_user_branch_renders_password_step() {
        composeTestRule.setContent {
            LaneShadowTheme {
                AuthScreenContent(
                    state = AuthScreenUiState(
                        step = AuthScreenStep.ExistingUser,
                        email = "elena@ridelaneshadow.com",
                    ),
                    showBackButton = false,
                )
            }
        }

        composeTestRule.onNodeWithText("Welcome back.").fetchSemanticsNode()
        composeTestRule.onNodeWithText("elena@ridelaneshadow.com").fetchSemanticsNode()
        composeTestRule.onNodeWithText("Password").fetchSemanticsNode()
        composeTestRule.onNodeWithText("Show password").fetchSemanticsNode()
        composeTestRule.onNodeWithText("Sign in").fetchSemanticsNode()
    }

    @Test
    fun authScreen_new_user_branch_renders_create_account_fields() {
        val state = AuthScreenUiState(
            step = AuthScreenStep.NewUser,
            email = "jamie.miller@hey.com",
            displayName = "Jamie",
            password = "copperride42",
        )

        composeTestRule.setContent {
            LaneShadowTheme {
                AuthScreenContent(state = state)
            }
        }

        composeTestRule.onNodeWithText("Set up shop.").assertIsDisplayed()
        composeTestRule.onNodeWithText("Create your password.").assertIsDisplayed()
        composeTestRule.onNodeWithText("Display name").assertIsDisplayed()
        composeTestRule.onNodeWithText("Create password").fetchSemanticsNode()
        composeTestRule.onNodeWithTag("auth_create_account_button").fetchSemanticsNode()
    }

    @Test
    fun authScreen_invalid_email_and_submitting_states_render_inline() {
        composeTestRule.setContent {
            LaneShadowTheme {
                AuthScreenContent(
                    state = AuthScreenUiState(
                        email = "elena@hey",
                        emailError = "That doesn't look like a complete email address.",
                        isSubmitting = true,
                    ),
                )
            }
        }

        composeTestRule.onNodeWithText("That doesn't look like a complete email address.").fetchSemanticsNode()
        composeTestRule.onNodeWithTag("auth_cta_spinner").fetchSemanticsNode()
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
