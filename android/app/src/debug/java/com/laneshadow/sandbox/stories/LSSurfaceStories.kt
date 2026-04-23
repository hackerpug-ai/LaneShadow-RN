package com.laneshadow.sandbox.stories

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.AccentColor
import com.laneshadow.ui.atoms.GlassVariant
import com.laneshadow.ui.atoms.LSCard
import com.laneshadow.ui.atoms.LSGlassPanel
import com.laneshadow.ui.atoms.LSPanel
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.TypographyVariant
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSSurfaceStories {
    val all: List<Story> = listOf(
        Story(
            id = "atoms.card.default",
            tier = ComponentTier.Atom,
            component = "LSCard",
            name = "Default",
            summary = "Elevated card surface using card background, large radius, and elevation.",
            content = { SurfaceStoryFrame { LSCard { SurfaceStoryCopy("Card surface") } } },
        ),
        Story(
            id = "atoms.panel.default",
            tier = ComponentTier.Atom,
            component = "LSPanel",
            name = "Default",
            summary = "Flat panel surface for grouped content within the primary canvas.",
            content = { SurfaceStoryFrame { LSPanel { SurfaceStoryCopy("Panel surface") } } },
        ),
        Story(
            id = "atoms.glasspanel.chrome",
            tier = ComponentTier.Atom,
            component = "LSGlassPanel",
            name = "Chrome",
            summary = "Ambient translucent chrome panel with blur-backed glass styling.",
            content = {
                SurfaceStoryFrame {
                    LSGlassPanel(variant = GlassVariant.Chrome) {
                        SurfaceStoryCopy("Glass chrome")
                    }
                }
            },
        ),
        Story(
            id = "atoms.glasspanel.callout.signal",
            tier = ComponentTier.Atom,
            component = "LSGlassPanel",
            name = "Callout Signal",
            summary = "Glass callout with signal stripe for navigational emphasis.",
            content = {
                SurfaceStoryFrame {
                    LSGlassPanel(variant = GlassVariant.Callout(AccentColor.Signal)) {
                        SurfaceStoryCopy("Signal callout")
                    }
                }
            },
        ),
        Story(
            id = "atoms.glasspanel.callout.warning",
            tier = ComponentTier.Atom,
            component = "LSGlassPanel",
            name = "Callout Warning",
            summary = "Glass callout with warning stripe for degraded-state messaging.",
            content = {
                SurfaceStoryFrame {
                    LSGlassPanel(variant = GlassVariant.Callout(AccentColor.Warning)) {
                        SurfaceStoryCopy("Warning callout")
                    }
                }
            },
        ),
    )
}

@Composable
private fun SurfaceStoryFrame(content: @Composable () -> Unit) {
    LaneShadowTheme {
        val theme = LocalLaneShadowTheme.current
        Column(
            modifier = Modifier.padding(theme.space.xl),
            verticalArrangement = Arrangement.spacedBy(theme.space.md),
        ) {
            content()
        }
    }
}

@Composable
private fun SurfaceStoryCopy(label: String) {
    LSText(
        text = label,
        variant = TypographyVariant.Ui.Body.Md,
    )
}
