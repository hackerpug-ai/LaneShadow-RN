package com.laneshadow.ui.atoms

import com.laneshadow.theme.ThemeLoader
import com.laneshadow.theme.laneShadowThemeValues
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Test

class LSCardTest {
    @Test
    fun card_resolves_surface_card_radius_lg_elevation_2_spacing_4() {
        val theme = loadTheme()
        val style = resolveLSCardStyle(theme)

        assertEquals(theme.colors.card.default, style.backgroundColor)
        assertEquals(theme.radius.lg, style.cornerRadius)
        assertEquals(theme.elevation.light.level2, style.shadowElevation)
        assertEquals(theme.space.lg, style.contentPadding)
    }

    @Test
    fun card_uses_runtime_dark_theme_card_color() {
        val darkTheme = loadTheme(darkTheme = true)
        val style = resolveLSCardStyle(darkTheme)

        assertEquals(darkTheme.colors.card.default, style.backgroundColor)
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
