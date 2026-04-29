package com.laneshadow.ui.auth

import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.AuthViewModel
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.LSSpinner
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.SpinnerSize
import com.laneshadow.ui.atoms.TypographyVariant

@Composable
fun OAuthCallbackScreen(
    deepLinkUri: Uri?,
    viewModel: AuthViewModel = hiltViewModel(),
) {
    val theme = LocalLaneShadowTheme.current

    LaunchedEffect(deepLinkUri) {
        deepLinkUri?.let(viewModel::handleOAuthCallback)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.md, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        LSSpinner(size = SpinnerSize.Md)
        LSText(
            text = "Completing sign-in",
            variant = TypographyVariant.Ui.Title.Md,
            color = ContentColor.Primary,
        )
    }
}
