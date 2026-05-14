package com.laneshadow.ui.atoms

import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Unit tests for MapSketchAnimationLayer composable source code verification.
 *
 * These tests verify the structure and patterns used in the implementation.
 * Runtime animation behavior is tested via instrumented tests in androidTest/.
 *
 * Verifies:
 * - Uses sketchPolylineRecipe tokens (not hardcoded values)
 * - Uses Settings.Global.ANIMATOR_DURATION_SCALE for reduced-motion
 * - Path progress is actually clipped (not stubbed with "For testing purposes")
 * - Stroke color uses semantic.route.best token (no hex literals)
 * - Empty path guard exists
 */
class MapSketchAnimationLayerTest {

    private val componentSource by lazy {
        readComponentSource()
    }

    /**
     * AC-1: Path-draw progress animation pattern exists
     *
     * Verifies the source code includes infiniteRepeatable with tween pattern.
     */
    @Test
    fun ac1_source_includes_animation_pattern() {
        assertTrue(
            "Should use animateFloat for path progress",
            componentSource.contains("animateFloat")
        )
        assertTrue(
            "Should use infiniteRepeatable spec",
            componentSource.contains("infiniteRepeatable")
        )
        assertTrue(
            "Should use tween animation",
            componentSource.contains("tween(")
        )
        assertTrue(
            "Should use easing from recipe",
            componentSource.contains("easing = sketchRecipe.easing")
        )
        // Verify 1400ms duration comes from sketchRecipe, not hardcoded
        assertFalse(
            "Should not hardcode 1400ms directly",
            componentSource.contains("tween(1400")
        )
    }

    /**
     * AC-2: Head-dot breathing animation pattern exists
     *
     * Verifies the source code includes RepeatMode.Reverse and EaseInOut.
     */
    @Test
    fun ac2_source_includes_breathing_pattern() {
        assertTrue(
            "Should animate head-dot opacity",
            componentSource.contains("headDotAlpha")
        )
        assertTrue(
            "Should use RepeatMode.Reverse for breathing",
            componentSource.contains("RepeatMode.Reverse")
        )
        assertTrue(
            "Should use EaseInOut easing",
            componentSource.contains("EaseInOut")
        )
        assertTrue(
            "Should have infiniteRepeatable for head-dot",
            componentSource.contains("infiniteRepeatable")
        )
    }

    /**
     * AC-3: Reduced-motion guard using Settings.Global exists
     *
     * Verifies the source code reads ANIMATOR_DURATION_SCALE and checks for 0f.
     */
    @Test
    fun ac3_source_includes_settings_global_reduced_motion_read() {
        assertTrue(
            "Should read Settings.Global.ANIMATOR_DURATION_SCALE",
            componentSource.contains("Settings.Global.getFloat")
        )
        assertTrue(
            "Should read ANIMATOR_DURATION_SCALE key",
            componentSource.contains("Settings.Global.ANIMATOR_DURATION_SCALE")
        )
        assertTrue(
            "Should check for 0f (reduced-motion enabled)",
            componentSource.contains("== 0f")
        )

        // Verify if-branch on reducedMotionEnabled
        assertTrue(
            "Should branch on reducedMotionEnabled",
            componentSource.contains("if (reducedMotionEnabled)")
        )

        // Verify static values in reduced-motion path
        assertTrue(
            "Should emit static progress (1f) in reduced-motion path",
            componentSource.contains("onProgressUpdate?.invoke(1f)")
        )
        assertTrue(
            "Should emit static alpha (1f) in reduced-motion path",
            componentSource.contains("onHeadDotAlphaUpdate?.invoke(1f)")
        )
    }

    /**
     * AC-4: Empty path guard exists
     *
     * Verifies the source code includes an early return for empty paths.
     */
    @Test
    fun ac4_source_includes_empty_path_guard() {
        assertTrue(
            "Should check for empty path",
            componentSource.contains("path.isEmpty()")
        )
        assertTrue(
            "Should return early if path is empty",
            componentSource.contains("if (path.isEmpty())")
        )
    }

    /**
     * AC-5: Stroke color resolves to LaneShadowTheme tokens
     *
     * Verifies the source code uses GeneratedTokens and no hex literals.
     */
    @Test
    fun ac5_source_uses_theme_tokens_not_hex_literals() {
        assertTrue(
            "Should use GeneratedTokens for color resolution",
            componentSource.contains("GeneratedTokens.color.Route")
        )
        assertTrue(
            "Should resolve light theme route.best",
            componentSource.contains("GeneratedTokens.color.Route.best")
        )
        assertTrue(
            "Should resolve dark theme route.best",
            componentSource.contains("GeneratedTokens.color.Route.dark.best")
        )
        assertFalse(
            "Should not contain hex color literals",
            componentSource.contains("Color(0x")
        )
        assertFalse(
            "Should not contain hardcoded color hex",
            componentSource.matches(Regex(".*#[0-9A-Fa-f]{6}.*"))
        )
    }

    /**
     * AC-6: Uses sketchPolylineRecipe and does NOT stub path progress
     *
     * Verifies the recipe is reused and path clipping is real (not stubbed).
     */
    @Test
    fun ac6_source_uses_recipe_and_real_path_clipping() {
        assertTrue(
            "Should use sketchPolylineRecipe",
            componentSource.contains("sketchPolylineRecipe")
        )
        assertTrue(
            "Should read durationMillis from recipe",
            componentSource.contains("sketchRecipe.durationMillis")
        )
        assertTrue(
            "Should read easing from recipe",
            componentSource.contains("sketchRecipe.easing")
        )

        // Verify path clipping is REAL, not stubbed
        assertFalse(
            "Should NOT have 'For testing purposes' stub comment",
            componentSource.contains("For testing purposes")
        )
        assertFalse(
            "Should NOT have 'real integration would clip' deferral",
            componentSource.contains("real integration would clip")
        )

        // Verify path progress is actually used in drawing
        assertTrue(
            "Should use pathProgress in clipping logic",
            componentSource.contains("pathProgress")
        )
    }

    /**
     * AC-6: Head-dot color is theme-aware
     *
     * Verifies head-dot uses the same stroke color (passed as parameter).
     */
    @Test
    fun ac6_head_dot_uses_theme_aware_color() {
        assertTrue(
            "Should pass headDotColor to SketchHeadDot",
            componentSource.contains("headDotColor = strokeColor")
        )
        assertTrue(
            "Should have headDotColor parameter",
            componentSource.contains("headDotColor: Color")
        )
    }

    /**
     * AC-6: Parameter reducedMotionEnabled is REMOVED (self-detects)
     *
     * Verifies the parameter is not in the function signature
     * (it now self-detects via Settings.Global).
     */
    @Test
    fun ac6_reduced_motion_parameter_removed() {
        // The parameter should NOT be in the Composable signature
        // It's now computed via Settings.Global inside the composable
        val functionSignature = componentSource.substringBefore(") {")
        assertFalse(
            "Should not have reducedMotionEnabled parameter in signature",
            functionSignature.contains("reducedMotionEnabled: Boolean")
        )
    }

    /**
     * Helper: Read MapSketchAnimationLayer source
     */
    private fun readComponentSource(): String {
        val androidDir = File("../android/app/src/main/java/com/laneshadow/ui/atoms/MapSketchAnimationLayer.kt")
        if (androidDir.exists()) {
            return androidDir.readText()
        }

        val appDir = File("app/src/main/java/com/laneshadow/ui/atoms/MapSketchAnimationLayer.kt")
        if (appDir.exists()) {
            return appDir.readText()
        }

        // Fallback to find relative to test execution
        val absolutePath = File(
            "/Users/justinrich/Projects/LaneShadow/android/app/src/main/java/com/laneshadow/ui/atoms/MapSketchAnimationLayer.kt"
        )
        if (absolutePath.exists()) {
            return absolutePath.readText()
        }

        throw IllegalStateException(
            "Could not locate MapSketchAnimationLayer.kt. Tried: " +
                "$androidDir, $appDir, $absolutePath"
        )
    }
}
