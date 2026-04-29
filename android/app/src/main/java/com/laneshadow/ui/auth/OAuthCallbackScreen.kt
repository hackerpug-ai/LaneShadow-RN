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
import com.laneshadow.ui.organisms.LSInlineErrorCallout
import kotlinx.coroutines.delay

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

    LaunchedEffect(deepLinkUri) {
        deepLinkUri?.let {
            lastCallbackUri = it
            isProcessingCallback = true
            delay(500)
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
        if (authState is AuthState.Error && !isProcessingCallback) {
            LSInlineErrorCallout(
                body = (authState as AuthState.Error).message,
                onSuggestionTap = {},
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
