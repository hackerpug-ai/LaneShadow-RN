package com.laneshadow.ui.auth

import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.laneshadow.data.model.AuthState
import com.laneshadow.BuildConfig
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.navigation.DeepLinkBus
import com.laneshadow.ui.AuthViewModel
import com.laneshadow.ui.atoms.ButtonVariant
import com.laneshadow.ui.atoms.ButtonState
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.LSButton
import com.laneshadow.ui.atoms.LSSpinner
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.SpinnerSize
import com.laneshadow.ui.atoms.TypographyVariant

@Composable
fun OAuthCallbackScreen(
    deepLinkUri: Uri?,
    onNavigateToSignIn: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel(),
) {
    val theme = LocalLaneShadowTheme.current
    val authState by viewModel.authState.collectAsStateWithLifecycle()
    var lastCallbackUri by remember { mutableStateOf<Uri?>(null) }
    var isProcessingCallback by remember { mutableStateOf(false) }
    // Debug-only screenshot hook: when `screen=loading` is passed, keep callback UI in loading.
    // Release behavior is unaffected because BuildConfig.DEBUG is false in non-debug builds.
    val forceLoadingPreview = BuildConfig.DEBUG && (deepLinkUri?.getQueryParameter("screen") == "loading")

    LaunchedEffect(deepLinkUri) {
        if (forceLoadingPreview) {
            return@LaunchedEffect
        }
        deepLinkUri?.let {
            lastCallbackUri = it
            isProcessingCallback = true
            viewModel.handleOAuthCallback(it)
            DeepLinkBus.consumeLatest()
            isProcessingCallback = false
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.md, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        val showLoadingState = forceLoadingPreview || isProcessingCallback || authState !is AuthState.Error
        if (!showLoadingState) {
            LSText(
                text = "Sign-in callback failed",
                variant = TypographyVariant.Ui.Title.Md,
                color = ContentColor.Primary,
            )
            LSText(
                text = (authState as AuthState.Error).message,
                variant = TypographyVariant.Ui.Body.Md,
                color = ContentColor.Secondary,
                modifier = Modifier.fillMaxWidth(),
            )
            LSButton(
                label = "Retry callback",
                variant = ButtonVariant.Primary,
                state = if (lastCallbackUri == null) ButtonState.Disabled else ButtonState.Default,
                modifier = Modifier.fillMaxWidth(),
                onClick = {
                    lastCallbackUri?.let(viewModel::handleOAuthCallback)
                },
            )
            LSButton(
                label = "Back to sign in",
                variant = ButtonVariant.Ghost,
                modifier = Modifier.fillMaxWidth(),
                onClick = onNavigateToSignIn,
            )
        } else {
            LSSpinner(size = SpinnerSize.Md)
            LSText(
                text = "Completing sign-in",
                variant = TypographyVariant.Ui.Title.Md,
                color = ContentColor.Primary,
            )
        }
    }
}
