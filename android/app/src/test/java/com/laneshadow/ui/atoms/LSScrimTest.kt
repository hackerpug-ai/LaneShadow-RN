package com.laneshadow.ui.atoms

import androidx.compose.ui.graphics.Color
import com.laneshadow.theme.LaneShadowColors
import com.laneshadow.ui.components.testTheme
import dev.nativetheme.primitives.ColorSet
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSScrimTest {
    @Test
    fun scrim_resolves_token_color_and_override_opacity() {
        val tokenTheme = testTheme.copy(
            colors = LaneShadowColors(
                primary = testTheme.colors.primary,
                secondary = testTheme.colors.secondary,
                tertiary = testTheme.colors.tertiary,
                success = testTheme.colors.success,
                warning = testTheme.colors.warning,
                warningContainer = testTheme.colors.warningContainer,
                onWarningContainer = testTheme.colors.onWarningContainer,
                danger = testTheme.colors.danger,
                info = testTheme.colors.info,
                surface = testTheme.colors.surface,
                surfaceVariant = testTheme.colors.surfaceVariant,
                background = testTheme.colors.background,
                onSurface = testTheme.colors.onSurface,
                onPrimary = testTheme.colors.onPrimary,
                onSecondary = testTheme.colors.onSecondary,
                secondaryContainer = testTheme.colors.secondaryContainer,
                onSecondaryContainer = testTheme.colors.onSecondaryContainer,
                border = testTheme.colors.border,
                input = testTheme.colors.input,
                ring = testTheme.colors.ring,
                card = testTheme.colors.card,
                popover = testTheme.colors.popover,
                accent = testTheme.colors.accent,
                muted = testTheme.colors.muted,
                divider = testTheme.colors.divider,
                scrim = ColorSet(Color.Black.copy(alpha = 0.35f), null, null, null, null),
                routeSelected = testTheme.colors.routeSelected,
                routeAlternate = testTheme.colors.routeAlternate,
            ),
        )

        val tokenOpacity = defaultScrimOpacity(tokenTheme)

        assertTrue(tokenOpacity > 0f)
        assertTrue(tokenOpacity < 1f)
        assertEquals(tokenTheme.colors.scrim.default, resolvedScrimColor(tokenTheme, tokenOpacity))
        assertEquals(
            tokenTheme.colors.scrim.default.copy(alpha = 0.5f),
            resolvedScrimColor(tokenTheme, 0.5f),
        )
    }

    @Test
    fun scrim_source_references_opacity_token_path_and_avoids_forbidden_literals() {
        val source = java.io.File("../app/src/main/java/com/laneshadow/ui/atoms/LSScrim.kt").readText()

        assertTrue(source.contains(ScrimOpacityTokenPath))
        assertFalse(Regex("""Color\(0x""").containsMatchIn(source))
        assertFalse(Regex("""androidx\.compose\.material\.icons""").containsMatchIn(source))
        assertFalse(Regex("""Icons\.(Filled|Outlined)""").containsMatchIn(source))
        assertFalse(Regex("""FontFamily\.Serif""").containsMatchIn(source))
    }
}
