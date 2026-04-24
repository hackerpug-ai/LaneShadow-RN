package com.laneshadow.ui.molecules

import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSContentCardTest {
    @Test
    fun default_render_uses_lscard_and_theme_tokens() {
        val source = File("src/main/java/com/laneshadow/ui/molecules/LSContentCard.kt").readText()
        val style = resolveLSContentCardStyle()

        assertEquals(GeneratedTokens.color.Surface.card, style.cardBackgroundColor)
        assertEquals(GeneratedTokens.color.Border.default, style.cardBorderColor)
        assertEquals(GeneratedTokens.color.Content.primary, style.titleColor)
        assertEquals(GeneratedTokens.color.Content.secondary, style.subtitleColor)

        assertTrue(source.contains("LSCard("))
        assertTrue(source.contains("LSText as LSLabel"))
        assertFalse(source.contains("import androidx.compose.material3.Text"))
        assertFalse(source.contains("Color(0xFF"))
    }

    @Test
    fun header_and_actions_slots_are_optional_without_reserved_gap() {
        val source = File("src/main/java/com/laneshadow/ui/molecules/LSContentCard.kt").readText()

        assertTrue(source.contains("header: (@Composable () -> Unit)? = null"))
        assertTrue(source.contains("actions: (@Composable () -> Unit)? = null"))
        assertTrue(source.contains("header?.let"))
        assertTrue(source.contains("actions?.let"))
        assertFalse(source.contains("Spacer("))
        assertFalse(source.contains("height(0.dp)"))
    }
}
