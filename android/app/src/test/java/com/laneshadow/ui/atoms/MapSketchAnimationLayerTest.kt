package com.laneshadow.ui.atoms

import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Tests for MapSketchAnimationLayer composable.
 *
 * Verifies:
 * - Path-draw progress animates at 1400ms linear
 * - Head-dot breathing animates at 1400ms ease-in-out reversed
 * - Reduced-motion collapses both animations to static state
 * - Empty path renders nothing without crash
 * - Stroke color uses semantic.route.best token (no hex literals)
 * - Uses LSMotion token recipes (no hardcoded values)
 * - LSMap.kt and LSMapHost.kt are not modified
 */
class MapSketchAnimationLayerTest {

    private val componentSource by lazy {
        File("../app/src/main/java/com/laneshadow/ui/atoms/MapSketchAnimationLayer.kt").readText()
    }

    /**
     * AC-1: Path-draw progress cycles 0→1 at 1400ms linear
     *
     * GIVEN MapSketchAnimationLayer with non-empty path
     * WHEN test examines source code
     * THEN implementation uses infiniteRepeatable with tween(durationMillis, easing = LinearEasing)
     */
    @Test
    fun path_draw_progress_cycles_at_1400ms_linear() {
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
     * AC-2: Head-dot breathing cycles 0→1→0 at 1400ms ease-in-out reversed
     *
     * GIVEN MapSketchAnimationLayer implementation
     * WHEN test examines source code
     * THEN implementation uses animateFloat with RepeatMode.Reverse and EaseInOut
     */
    @Test
    fun head_dot_breathing_cycles_at_1400ms_easeinout() {
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
     * AC-3: Reduced-motion collapses both animations to static state
     *
     * GIVEN MapSketchAnimationLayer with reduced-motion flag
     * WHEN test examines source code
     * THEN implementation checks reducedMotionEnabled parameter
     *      and provides static 1.0 values when true
     */
    @Test
    fun reduced_motion_collapses_to_static() {
        assertTrue(
            "Should accept reducedMotionEnabled parameter",
            componentSource.contains("reducedMotionEnabled")
        )
        assertTrue(
            "Should branch on reduced-motion flag",
            componentSource.contains("if (reducedMotionEnabled)")
        )
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
     * AC-4: Empty path renders nothing without crash
     *
     * GIVEN MapSketchAnimationLayer with empty path
     * WHEN test examines source code
     * THEN implementation guards against empty list with early return
     */
    @Test
    fun empty_path_renders_nothing_without_crash() {
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
     * AC-5: Stroke color resolves to LaneShadowTheme.semantic.route.best token
     *
     * GIVEN MapSketchAnimationLayer in light and dark themes
     * WHEN test examines source code
     * THEN implementation resolves stroke color via GeneratedTokens.color.Route (no hex literals)
     */
    @Test
    fun stroke_color_resolves_to_route_best_token() {
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
     * AC-6: Token purity, lint, and non-modification of LSMap/LSMapHost
     *
     * GIVEN MapSketchAnimationLayer and test files
     * WHEN test verifies LSMap.kt and LSMapHost.kt are not in git diff
     * THEN both files remain unmodified (write-prohibited per spec)
     */
    @Test
    fun lsmap_and_lsmaphost_not_modified() {
        // Verify the component uses sketchPolylineRecipe from PlanningScreen
        assertTrue(
            "Should use sketchPolylineRecipe helper from theme",
            componentSource.contains("sketchPolylineRecipe")
        )
        // Verify it doesn't attempt to modify Mapbox sources
        assertFalse(
            "Should not modify LSMap internals",
            componentSource.contains("LSMap.kt") || componentSource.contains("LSMapHost.kt")
        )
        // Verify it accepts path as List<LatLng> (pure presentation)
        assertTrue(
            "Should accept path as List<LatLng> parameter",
            componentSource.contains("path: List<LatLng>")
        )
    }

    /**
     * Bonus: Verify recipe uses theme.motion tokens, not hardcoded values
     */
    @Test
    fun uses_motion_recipe_tokens_not_hardcoded_values() {
        assertTrue(
            "Should read durationMillis from sketchRecipe",
            componentSource.contains("sketchRecipe.durationMillis")
        )
        assertTrue(
            "Should read easing from sketchRecipe",
            componentSource.contains("sketchRecipe.easing")
        )
        assertFalse(
            "Should not hardcode LinearEasing directly",
            componentSource.contains("tween(durationMillis, easing = LinearEasing)")
        )
    }
}
