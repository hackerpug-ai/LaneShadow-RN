package com.laneshadow.navigation

import android.net.Uri
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.laneshadow.data.model.AuthState
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.AuthViewModel
import com.laneshadow.ui.atoms.ButtonVariant
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.InputState
import com.laneshadow.ui.atoms.LSButton
import com.laneshadow.ui.atoms.LSSpinner
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.LSTextField
import com.laneshadow.ui.atoms.SpinnerSize
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.ui.auth.AuthScreen
import com.laneshadow.ui.auth.OAuthCallbackScreen
import com.laneshadow.ui.auth.SignUpScreen
import com.laneshadow.ui.organisms.LSInlineErrorCallout

@Composable
fun AuthNavGraph(
    navController: NavHostController = rememberNavController(),
    authViewModel: AuthViewModel,
    uiTestBypassEnabled: Boolean = false,
) {
    var callbackUri by remember { mutableStateOf<Uri?>(null) }
    val authState by authViewModel.authState.collectAsStateWithLifecycle()
    val navigateToOAuthCallback = remember(navController) {
        { uri: Uri ->
            callbackUri = uri
            navController.navigate(Route.OAuthCallback) {
                popUpTo(Route.Splash) { inclusive = true }
                launchSingleTop = true
            }
        }
    }

    LaunchedEffect(navController) {
        DeepLinkBus.callbacks.collect { uri ->
            navigateToOAuthCallback(uri)
        }
    }

    LaunchedEffect(authState) {
        if (authState == AuthState.VerificationRequired) {
            navController.navigate(Route.Verify) {
                launchSingleTop = true
            }
        }
    }

    NavHost(
        navController = navController,
        startDestination = Route.Splash,
        modifier = Modifier.semantics { testTagsAsResourceId = true },
    ) {
        composable<Route.Splash> {
            val theme = LocalLaneShadowTheme.current
            LaunchedEffect(Unit) {
                if (DeepLinkBus.latestCallbackUri == null) {
                    navController.navigate(Route.SignIn) {
                        popUpTo(Route.Splash) { inclusive = true }
                    }
                }
            }
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally,
                verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(
                    theme.space.md,
                    androidx.compose.ui.Alignment.CenterVertically,
                ),
            ) {
                LSSpinner(size = SpinnerSize.Md)
                LSText(
                    text = "Loading",
                    variant = TypographyVariant.Ui.Body.Md,
                    color = ContentColor.Primary,
                )
            }
        }
        composable<Route.SignIn> {
            AuthScreen(
                viewModel = authViewModel,
                showBackButton = true,
                showSignUpEntry = true,
                uiTestBypassEnabled = uiTestBypassEnabled,
                onSignUpRequested = {
                    navController.navigate(Route.SignUp) {
                        launchSingleTop = true
                    }
                },
                onBypassAuth = {
                    authViewModel.bypassForTesting()
                },
            )
        }
        composable<Route.SignUp> {
            SignUpScreen(
                viewModel = authViewModel,
                onNavigateToSignIn = {
                    navController.navigate(Route.SignIn) {
                        popUpTo(Route.SignUp) { inclusive = true }
                    }
                },
            )
        }
        composable<Route.OAuthCallback> {
            OAuthCallbackScreen(
                deepLinkUri = callbackUri,
                onNavigateToSignIn = {
                    navController.navigate(Route.SignIn) {
                        popUpTo(Route.OAuthCallback) { inclusive = true }
                        launchSingleTop = true
                    }
                },
                viewModel = authViewModel,
            )
        }
        composable<Route.Verify> {
            VerifyRoute(
                onVerify = authViewModel::completeSignUpVerification,
                onNavigateToSignIn = {
                    navController.navigate(Route.SignIn) {
                        popUpTo(Route.SignIn) { inclusive = true }
                    }
                },
            )
        }
    }
}

@Composable
private fun VerifyRoute(
    onVerify: (String) -> Unit,
    onNavigateToSignIn: () -> Unit,
) {
    var code by rememberSaveable { mutableStateOf("") }
    var error by rememberSaveable { mutableStateOf<String?>(null) }
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(theme.space.lg)
            .testTag("auth_verify_root"),
    ) {
        LSText(
            text = "Verify",
            variant = TypographyVariant.Opinion.Lg,
            color = ContentColor.Primary,
        )

        error?.let { message ->
            LSInlineErrorCallout(
                body = message,
                onSuggestionTap = {},
                modifier = Modifier.fillMaxWidth(),
            )
        }

        LSTextField(
            value = code,
            onValueChange = {
                code = it
                error = null
            },
            placeholder = "Verification code",
            state = if (error != null) InputState.Error else InputState.Default,
            modifier = Modifier.testTag("auth_verify_code_input"),
        )

        LSButton(
            label = "Verify",
            variant = ButtonVariant.Primary,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("auth_verify_submit"),
            onClick = {
                if (code.isBlank()) {
                    error = "Enter your verification code."
                } else {
                    onVerify(code)
                }
            },
        )

        LSButton(
            label = "Back to sign in",
            variant = ButtonVariant.Ghost,
            onClick = onNavigateToSignIn,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
