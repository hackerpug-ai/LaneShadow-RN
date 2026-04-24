package com.laneshadow.ui.molecules

import com.laneshadow.theme.ThemeLoader
import com.laneshadow.theme.laneShadowThemeValues
import androidx.compose.ui.unit.dp
import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LSBottomSheetTest {
    private val source by lazy {
        File("src/main/java/com/laneshadow/ui/molecules/LSBottomSheet.kt").readText()
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
    fun medium_detent_uses_overlay_surface_and_enter_motion() {
        val enterMotion = bottomSheetEnterMotion(theme)

        assertEquals(0.5f, resolveBottomSheetDetentFraction(BottomSheetDetent.Medium))
        assertEquals(500.dp, resolveBottomSheetDetentHeight(1000.dp, BottomSheetDetent.Medium))
        assertEquals(theme.motion.duration.getValue("normal"), enterMotion.durationMillis)
        assertEquals(
            theme.motion.easing.getValue("decelerate").map(Double::toFloat),
            enterMotion.easingPoints,
        )
        assertTrue(source.contains("ModalBottomSheet("))
        assertTrue(source.contains("LSGlassPanel("))
        assertTrue(source.contains("GeneratedTokens.color.Surface.overlay"))
        assertTrue(source.contains("BottomSheetEnterRecipePath = \"motion.recipe.chatOverlayEnter\""))
        assertTrue(source.contains("BottomSheetHandleWidth = 36.dp"))
        assertTrue(source.contains("GeneratedTokens.color.Border.subtle"))
        assertFalse(source.contains("theme.motion.duration[\"standard\"]"))
        assertFalse(source.contains("theme.motion.easing[\"decelerated\"]"))
        assertFalse(source.contains("?: 240"))
    }

    @Test
    fun small_and_large_detents_use_fractional_heights() {
        assertEquals(0.25f, resolveBottomSheetDetentFraction(BottomSheetDetent.Small))
        assertEquals(0.9f, resolveBottomSheetDetentFraction(BottomSheetDetent.Large))
        assertEquals(250.dp, resolveBottomSheetDetentHeight(1000.dp, BottomSheetDetent.Small))
        assertEquals(900.dp, resolveBottomSheetDetentHeight(1000.dp, BottomSheetDetent.Large))
        assertTrue(source.contains("BottomSheetDetentSmallFraction = 0.25f"))
        assertTrue(source.contains("BottomSheetDetentLargeFraction = 0.9f"))
        assertTrue(source.contains(".height(detentHeight)"))
    }
}
