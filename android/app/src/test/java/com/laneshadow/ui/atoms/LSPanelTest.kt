package com.laneshadow.ui.atoms

import com.laneshadow.theme.ThemeLoader
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.theme.laneShadowThemeValues
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Test

class LSPanelTest {
    @Test
    fun panel_resolves_surface_primary_radius_md_no_elevation_spacing_3() {
        val theme = loadTheme()
        val style = resolveLSPanelStyle(theme)

        assertEquals(GeneratedTokens.color.Surface.primary, style.backgroundColor)
        assertEquals(theme.radius.md, style.cornerRadius)
        assertEquals(theme.elevation.light.level0, style.shadowElevation)
        assertEquals(theme.space.md, style.contentPadding)
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
