package com.laneshadow.ui.atoms

import androidx.compose.ui.unit.dp
import com.laneshadow.theme.ThemeLoader
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
        assertEquals(theme.colors.accent.default, style.leadingStripeColor)
    }

    @Test
    fun all_accent_colors_resolve_through_color_accent_tokens() {
        val theme = loadTheme()

        val resolved = AccentColor.entries.associateWith { accent ->
            resolveAccentColor(theme, accent)
        }

        assertEquals(theme.colors.accent.default, resolved.getValue(AccentColor.Signal))
        assertEquals(theme.colors.warning.default, resolved.getValue(AccentColor.Warning))
    }

    @Test
    fun glasspanel_uses_runtime_dark_theme_glass_fill() {
        val darkTheme = loadTheme(darkTheme = true)
        val style = resolveLSGlassPanelStyle(darkTheme, GlassVariant.Chrome)

        assertEquals(darkTheme.colors.card.default.copy(alpha = 0.72f), style.backgroundColor)
    }

    private fun loadTheme(darkTheme: Boolean = false) =
        laneShadowThemeValues(
            tokens = ThemeLoader.fromStream(
                javaClass.classLoader?.getResourceAsStream("semantic.tokens.json")
                    ?: File("../../tokens/platforms/kotlin/src/main/assets/semantic.tokens.json").inputStream(),
            ),
            darkTheme = darkTheme,
        )
}
