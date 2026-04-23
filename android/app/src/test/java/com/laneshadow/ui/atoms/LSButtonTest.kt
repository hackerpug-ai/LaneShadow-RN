package com.laneshadow.ui.atoms

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.ThemeLoader
import com.laneshadow.theme.laneShadowThemeValues
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSButtonTest {
    @Test
    fun primary_variant_resolves_action_primary_tokens() {
        val theme = loadTheme()
        val style = resolveLSButtonVisualStyle(theme, ButtonVariant.Primary, ButtonState.Default)

        assertEquals(GeneratedTokens.color.Action.Primary.default, style.backgroundColor)
        assertEquals(ContentColor.OnSignal, style.contentColor)
        assertEquals(Color.Transparent, style.borderColor)
        assertEquals(0.dp, style.borderWidth)
        assertEquals(LaneShadowButtonHeight, 44.dp)
        assertEquals(LaneShadowButtonMinTouchTarget, 44.dp)
        assertEquals(theme.radius.md, 10.dp)
        assertEquals(theme.space.lg, 16.dp)
    }

    @Test
    fun all_six_variants_resolve_correct_action_tokens() {
        val theme = loadTheme()

        val styles = ButtonVariant.entries.associateWith { variant ->
            resolveLSButtonVisualStyle(theme, variant, ButtonState.Default)
        }

        assertEquals(6, styles.size)
        assertEquals(GeneratedTokens.color.Action.Primary.default, styles.getValue(ButtonVariant.Primary).backgroundColor)
        assertEquals(GeneratedTokens.color.Action.Secondary.default, styles.getValue(ButtonVariant.Secondary).backgroundColor)
        assertEquals(theme.colors.tertiary.default, styles.getValue(ButtonVariant.Tertiary).backgroundColor)
        assertEquals(Color.Transparent, styles.getValue(ButtonVariant.Outline).backgroundColor)
        assertEquals(theme.colors.border.default, styles.getValue(ButtonVariant.Outline).borderColor)
        assertEquals(Color.Transparent, styles.getValue(ButtonVariant.Ghost).backgroundColor)
        assertEquals(theme.colors.danger.default, styles.getValue(ButtonVariant.Destructive).backgroundColor)
    }

    @Test
    fun source_uses_ls_text_ls_icon_and_button_semantics_without_forbidden_refs() {
        val source = File("../app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt").readText()

        assertTrue(source.contains("LSText("))
        assertTrue(source.contains("LSIcon("))
        assertTrue(source.contains("role = androidx.compose.ui.semantics.Role.Button"))
        assertFalse(source.contains("Color(0x"))
        assertFalse(source.contains("androidx.compose.material.icons"))
        assertFalse(source.contains("Icons.Filled"))
        assertFalse(source.contains("Icons.Outlined"))
        assertFalse(source.contains("FontFamily.Serif"))
        assertFalse(source.contains("FontFamily.SansSerif"))
        assertFalse(source.contains("FontFamily.Monospace"))
        assertFalse(source.contains("FontFamily.Default"))
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
