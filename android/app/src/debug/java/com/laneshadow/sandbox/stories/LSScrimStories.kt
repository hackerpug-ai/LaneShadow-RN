package com.laneshadow.sandbox.stories

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.LSScrim
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSScrimStories {
    val all: List<Story> = listOf(
        scrimStory(
            id = "atoms.scrim.default",
            name = "Default",
            summary = "Default token-backed scrim opacity over a map-like surface.",
        ) { LSScrim() },
        scrimStory(
            id = "atoms.scrim.blocking",
            name = "Blocking",
            summary = "Blocking scrim variant that captures taps.",
        ) { LSScrim(blocking = true) },
        scrimStory(
            id = "atoms.scrim.customOpacity",
            name = "Custom Opacity",
            summary = "Scrim with a stronger custom opacity override.",
        ) { LSScrim(opacity = 0.5f) },
    )
}

private fun scrimStory(
    id: String,
    name: String,
    summary: String,
    content: @Composable () -> Unit,
): Story =
    Story(
        id = id,
        tier = ComponentTier.Atom,
        component = "LSScrim",
        name = name,
        summary = summary,
        content = {
            Box(
                modifier = Modifier
                    .width(200.dp)
                    .height(140.dp)
                    .padding(0.dp),
            ) {
                ScrimStoryMap()
                content()
            }
        },
    )

@Composable
private fun ScrimStoryMap() {
    val theme = LocalLaneShadowTheme.current

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(theme.colors.surfaceVariant.default),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(theme.space.md)
                .background(Color.White.copy(alpha = 0.16f)),
        )
    }
}
