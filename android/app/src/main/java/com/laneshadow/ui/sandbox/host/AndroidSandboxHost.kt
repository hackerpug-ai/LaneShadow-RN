package com.laneshadow.ui.sandbox.host

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.sandbox.stories.AppStories

@Composable
fun AndroidSandboxHost() {
    LaneShadowTheme {
        val theme = LocalLaneShadowTheme.current
        Surface(
            color = theme.colors.background.default,
            modifier = Modifier.fillMaxSize(),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(theme.space.lg),
                verticalArrangement = Arrangement.spacedBy(theme.space.sm),
            ) {
                Text(
                    text = "AndroidSandboxHost",
                    style = theme.type.heading.md,
                    color = theme.colors.onSurface.default,
                )
                Text(
                    text = "Registered stories: ${AppStories.all.size}",
                    style = theme.type.body.md,
                    color = theme.colors.onSurface.default,
                )
            }
        }
    }
}
