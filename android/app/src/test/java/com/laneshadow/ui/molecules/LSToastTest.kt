package com.laneshadow.ui.molecules

import androidx.compose.ui.graphics.Color
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.theme.ThemeLoader
import com.laneshadow.theme.laneShadowThemeValues
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LSToastTest {
    private val source by lazy {
        File("src/main/java/com/laneshadow/ui/molecules/LSToast.kt").readText()
    }
    private val storySource by lazy {
        File("src/debug/java/com/laneshadow/sandbox/stories/molecules/LSToastStory.kt").readText()
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
    fun success_variant_uses_status_color_and_token_dismiss_timing() {
        val successStyle = resolveLSToastStyle(ToastVariant.Success)
        val dismissContract = toastDismissContract(theme)

        assertEquals(GeneratedTokens.color.Status.Success.default, successStyle.backgroundColor)
        assertEquals(GeneratedTokens.color.Status.Success.default, successStyle.progressColor)
        assertEquals(5_000, dismissContract.visibleMillis)
        assertEquals(theme.motion.duration.getValue("fast"), dismissContract.exitMotion.durationMillis)
        assertEquals(listOf(0f, 0f, 1f, 1f), dismissContract.exitMotion.easingPoints)
        assertEquals(5_000, toastAutoDismissMillis(theme))
        assertTrue(source.contains("ToastDismissRecipePath = \"motion.recipe.chatOverlayDismiss\""))
        assertTrue(source.contains("suspend fun show("))
        assertTrue(source.contains("LSGlassPanel("))
        assertFalse(source.contains("theme.motion.duration[\"fast\"]"))
        assertFalse(source.contains("?: 120"))
        assertFalse(storySource.contains("refreshKey"))
        assertFalse(storySource.contains("onDismissed ="))
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
