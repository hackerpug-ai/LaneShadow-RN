package com.laneshadow.sandbox.stories.molecules

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.AuthProvider
import com.laneshadow.ui.components.LSAuthProviderButton
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSAuthProviderButtonStory {
    val all: List<Story> = listOf(
        Story(
            id = "molecules.auth-provider-button.apple",
            tier = ComponentTier.Molecule,
            component = "LSAuthProviderButton",
            name = "Apple",
            summary = "Apple social auth provider button.",
            content = { AuthProviderButtonStory(provider = AuthProvider.Apple) },
        ),
        Story(
            id = "molecules.auth-provider-button.google",
            tier = ComponentTier.Molecule,
            component = "LSAuthProviderButton",
            name = "Google",
            summary = "Google social auth provider button.",
            content = { AuthProviderButtonStory(provider = AuthProvider.Google) },
        ),
    )
}

@Composable
private fun AuthProviderButtonStory(provider: AuthProvider) {
    LaneShadowTheme {
        val theme = LocalLaneShadowTheme.current

        Column(
            modifier = Modifier.padding(theme.space.lg),
            verticalArrangement = Arrangement.spacedBy(theme.space.md),
        ) {
            LSAuthProviderButton(
                provider = provider,
                onClick = {},
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
