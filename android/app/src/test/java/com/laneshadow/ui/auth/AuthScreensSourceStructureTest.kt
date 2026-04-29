package com.laneshadow.ui.auth

import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AuthScreensSourceStructureTest {
    private val signInSource =
        File("../app/src/main/java/com/laneshadow/ui/auth/SignInScreen.kt").readText()
    private val signUpSource =
        File("../app/src/main/java/com/laneshadow/ui/auth/SignUpScreen.kt").readText()
    private val callbackSource =
        File("../app/src/main/java/com/laneshadow/ui/auth/OAuthCallbackScreen.kt").readText()
    private val navSource =
        File("../app/src/main/java/com/laneshadow/navigation/AuthNavGraph.kt").readText()
    private val deepLinkSource =
        File("../app/src/main/java/com/laneshadow/navigation/DeepLinkBus.kt").readText()

    @Test
    fun signIn_screen_has_multistep_validation_loading_error_and_oauth_wiring() {
        assertTrue(signInSource.contains("when (uiState.step)"))
        assertTrue(signInSource.contains("SignInStep.Email"))
        assertTrue(signInSource.contains("SignInStep.Password"))
        assertTrue(signInSource.contains("label = \"Email\""))
        assertTrue(signInSource.contains("label = \"Password\""))
        assertTrue(signInSource.contains("continueToPassword"))
        assertTrue(signInSource.contains("LSInlineErrorCallout"))
        assertTrue(signInSource.contains("if (uiState.isLoading)"))
        assertTrue(signInSource.contains("LSSpinner"))
        assertTrue(signInSource.contains("AuthProvider.Google"))
        assertTrue(signInSource.contains("AuthProvider.Apple"))
        assertTrue(signInSource.contains("viewModel::signInWithGoogle"))
        assertTrue(signInSource.contains("viewModel::signInWithApple"))
    }

    @Test
    fun signUp_screen_has_required_fields_spinner_and_error_callout() {
        assertTrue(signUpSource.contains("label = \"Name\""))
        assertTrue(signUpSource.contains("label = \"Email\""))
        assertTrue(signUpSource.contains("label = \"Password\""))
        assertTrue(signUpSource.contains("label = \"Confirm password\""))
        assertTrue(signUpSource.contains("LSInlineErrorCallout"))
        assertTrue(signUpSource.contains("if (isSubmitting)"))
        assertTrue(signUpSource.contains("LSSpinner"))
    }

    @Test
    fun oauth_callback_screen_has_processing_and_error_ui_and_no_artificial_delay() {
        assertTrue(callbackSource.contains("handleOAuthCallback"))
        assertTrue(callbackSource.contains("Completing sign-in"))
        assertTrue(callbackSource.contains("Sign-in callback failed"))
        assertFalse(callbackSource.contains("delay(500)"))
    }

    @Test
    fun auth_nav_graph_replays_and_routes_oauth_callbacks_from_bus() {
        assertTrue(navSource.contains("DeepLinkBus.callbacks.collect"))
        assertTrue(navSource.contains("DeepLinkBus.latestCallbackUri"))
        assertTrue(navSource.contains("navController.navigate(Route.OAuthCallback)"))
        assertTrue(deepLinkSource.contains("replay = 1"))
        assertTrue(deepLinkSource.contains("latestCallbackUri"))
        assertTrue(deepLinkSource.contains("consumeLatest"))
    }
}
