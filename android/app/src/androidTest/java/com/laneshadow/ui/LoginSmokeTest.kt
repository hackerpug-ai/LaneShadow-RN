package com.laneshadow.ui

import android.net.Uri
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.repository.AuthRepository
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.auth.SignInScreen
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LoginSmokeTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun signInScreenRendersWithoutCrash() {
        composeTestRule.setContent {
            LaneShadowTheme {
                SignInScreen(viewModel = AuthViewModel(FakeAuthRepository()))
            }
        }
        composeTestRule.onNodeWithText("Saddle up.").assertIsDisplayed()
    }

    @Test
    fun signInScreenShowsCreateAccountEntryPoint() {
        composeTestRule.setContent {
            LaneShadowTheme {
                SignInScreen(viewModel = AuthViewModel(FakeAuthRepository()))
            }
        }
        composeTestRule.onNodeWithText("Continue with Apple").assertIsDisplayed()
    }
}

private class FakeAuthRepository : AuthRepository {
    private val authState = MutableStateFlow<AuthState>(AuthState.SignedOut)

    override suspend fun signIn(email: String, password: String): Result<ClerkUser> =
        Result.success(ClerkUser("user-1", email, "Rider", "password"))

    override suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser> =
        Result.success(ClerkUser("user-2", email, name, "password"))

    override suspend fun completeSignUpVerification(code: String): Result<ClerkUser> =
        Result.success(ClerkUser("user-2", "rider@example.com", "Rider", "password"))

    override suspend fun signOut(): Result<Unit> = Result.success(Unit)

    override suspend fun handleUnauthenticated(message: String): Result<Unit> = Result.success(Unit)

    override suspend fun signInWithGoogle(): Result<ClerkUser> =
        Result.success(ClerkUser("google", "rider@example.com", "Rider", "google"))

    override suspend fun signInWithApple(): Result<ClerkUser> =
        Result.success(ClerkUser("apple", "rider@example.com", "Rider", "apple"))

    override suspend fun handleOAuthCallback(uri: Uri): Result<ClerkUser> =
        Result.success(ClerkUser("oauth", "rider@example.com", "Rider", "oauth"))

    override suspend fun getJwtForConvex(): String = "test-jwt"

    override fun observeAuthState(): StateFlow<AuthState> = authState
}
