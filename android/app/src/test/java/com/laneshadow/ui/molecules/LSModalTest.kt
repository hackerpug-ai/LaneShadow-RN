package com.laneshadow.ui.molecules

import com.laneshadow.theme.ThemeLoader
import com.laneshadow.theme.laneShadowThemeValues
import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LSModalTest {
    private val source by lazy {
        File("src/main/java/com/laneshadow/ui/molecules/LSModal.kt").readText()
    }
    private val theme by lazy {
        laneShadowThemeValues(
            ThemeLoader.fromStream(
                File("../../tokens/platforms/kotlin/src/main/assets/semantic.tokens.json").inputStream(),
            ),
            darkTheme = false,
        )
    }

    @Test
    fun modal_composes_from_ls_atoms() {
        assertTrue(source.contains("Dialog("))
        assertTrue(source.contains("LSCard("))
        assertTrue(source.contains("LSText("))
        assertTrue(source.contains("LSButton("))
        assertTrue(source.contains("class Destructive"))
        assertTrue(source.contains("class Ghost"))
        assertTrue(source.contains("ButtonVariant.Destructive"))
        assertTrue(source.contains("ButtonVariant.Ghost"))
        assertFalse(source.contains("AlertDialog("))
        assertFalse(source.contains("TextButton("))
    }

    @Test
    fun modal_enter_motion_uses_overlay_contract_without_fallbacks() {
        val enterMotion = modalEnterMotion(theme)

        assertEquals(theme.motion.duration.getValue("normal"), enterMotion.durationMillis)
        assertEquals(
            theme.motion.easing.getValue("decelerate").map(Double::toFloat),
            enterMotion.easingPoints,
        )
        assertFalse(source.contains("theme.motion.duration[\"standard\"]"))
        assertFalse(source.contains("theme.motion.easing[\"decelerated\"]"))
        assertFalse(source.contains("?: 240"))
    }
}
