package com.laneshadow.ui.molecules

import androidx.compose.ui.graphics.Color
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LSToastTest {
    private val source by lazy {
        File("src/main/java/com/laneshadow/ui/molecules/LSToast.kt").readText()
    }

    @Test
    fun success_variant_uses_status_color_and_token_dismiss_timing() {
        val successStyle = resolveLSToastStyle(ToastVariant.Success)

        assertEquals(GeneratedTokens.color.Status.Success.default, successStyle.backgroundColor)
        assertEquals(GeneratedTokens.color.Status.Success.default, successStyle.progressColor)
        assertTrue(source.contains("ToastDismissRecipePath = \"motion.recipe.chatOverlayDismiss\""))
        assertTrue(source.contains("theme.motion.duration[\"fast\"]"))
        assertTrue(source.contains("suspend fun show("))
        assertTrue(source.contains("LSGlassPanel("))
    }

    @Test
    fun all_four_status_variants_resolve_correct_colors() {
        val colors = listOf(
            resolveLSToastStyle(ToastVariant.Default).backgroundColor,
            resolveLSToastStyle(ToastVariant.Success).backgroundColor,
            resolveLSToastStyle(ToastVariant.Warning).backgroundColor,
            resolveLSToastStyle(ToastVariant.Error).backgroundColor,
        )

        assertEquals(GeneratedTokens.color.Surface.overlay, colors[0])
        assertEquals(GeneratedTokens.color.Status.Success.default, colors[1])
        assertEquals(GeneratedTokens.color.Status.Warning.default, colors[2])
        assertEquals(GeneratedTokens.color.Status.Error.default, colors[3])
        assertDistinct(colors)
    }

    private fun assertDistinct(colors: List<Color>) {
        colors.forEachIndexed { index, color ->
            colors.drop(index + 1).forEach { other ->
                assertNotEquals(color, other)
            }
        }
    }
}
