package com.laneshadow.ui.atoms

import androidx.compose.ui.unit.dp
import com.laneshadow.theme.ThemeLoader
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.theme.laneShadowThemeValues
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Test

class LSGlassPanelTest {
    @Test
    fun glasspanel_callout_renders_3dp_leading_stripe_with_accent_color() {
        val theme = loadTheme()
        val style = resolveLSGlassPanelStyle(theme, GlassVariant.Callout(AccentColor.Signal))

        assertEquals(3.dp, style.leadingStripeWidth)
        assertEquals(GeneratedTokens.color.Signal.default, style.leadingStripeColor)
    }

    @Test
    fun all_accent_colors_resolve_through_color_accent_tokens() {
        val theme = loadTheme()

        val resolved = AccentColor.entries.associateWith { accent ->
            resolveAccentColor(theme, accent)
        }

        assertEquals(GeneratedTokens.color.Signal.default, resolved.getValue(AccentColor.Signal))
        assertEquals(GeneratedTokens.color.Status.Warning.default, resolved.getValue(AccentColor.Warning))
    }

    private fun loadTheme() =
        laneShadowThemeValues(
            tokens = ThemeLoader.fromStream(
                javaClass.classLoader?.getResourceAsStream("semantic.tokens.json")
                    ?: File("../../tokens/platforms/kotlin/src/main/assets/semantic.tokens.json").inputStream(),
            ),
            darkTheme = false,
        )
}
