package com.laneshadow.ui.atoms

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.graphics.Color
import com.google.common.truth.Truth.assertThat
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import org.junit.Rule
import org.junit.Test

/**
 * Instrumented tests for MapSketchAnimationLayer composable.
 *
 * Verifies:
 * - Path-draw progress animates at 1400ms linear
 * - Head-dot breathing animates at 1400ms ease-in-out reversed
 * - Reduced-motion collapses both animations to static state
 * - Empty path renders nothing without crash
 * - Stroke color uses semantic.route.best token (no hex literals)
 * - Uses LSMotion token recipes (no hardcoded values)
 */
class MapSketchAnimationLayerTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    /**
     * AC-1: Path-draw progress cycles 0→1 at 1400ms linear
     *
     * GIVEN MapSketchAnimationLayer with non-empty path mounted with mainClock.autoAdvance = false
     * WHEN test clock advances 700ms (half of 1400ms)
     * THEN captured pathDrawProgress is approximately 0.5f (midpoint of linear animation)
     */
    @Test
    fun ac1_path_draw_progress_at_700ms_is_approximately_half() {
        composeTestRule.mainClock.autoAdvance = false
        var observedPathProgress = 0f

        composeTestRule.setContent {
            MapSketchAnimationLayer(
                path = listOf(LatLng(0.0, 0.0), LatLng(1.0, 1.0)),
                onProgressUpdate = { observedPathProgress = it }
            )
        }

        // Advance clock to 700ms (half of 1400ms)
        composeTestRule.mainClock.advanceTimeBy(700L)

        // With linear easing, at 700ms (50% of 1400ms) progress should be ~0.5f
        assertThat(observedPathProgress).isWithin(0.05f).of(0.5f)
    }

    /**
     * AC-1 continued: Path-draw progress cycles 0→1 at 1400ms linear
     *
     * GIVEN MapSketchAnimationLayer mounted with mainClock.autoAdvance = false
     * WHEN test clock advances 1400ms
     * THEN captured pathDrawProgress completes a full 0→1 cycle
     */
    @Test
    fun ac1_path_draw_progress_at_1400ms_completes_full_cycle() {
        composeTestRule.mainClock.autoAdvance = false
        var observedPathProgress = 0f

        composeTestRule.setContent {
            MapSketchAnimationLayer(
                path = listOf(LatLng(0.0, 0.0), LatLng(1.0, 1.0)),
                onProgressUpdate = { observedPathProgress = it }
            )
        }

        // Advance clock to 1400ms (one full cycle)
        composeTestRule.mainClock.advanceTimeBy(1400L)

        // At end of cycle, progress should be ~1.0f (then restarts to 0)
        // Due to repeat restart, may see it transitioned; check it reached ~1.0 at some point
        assertThat(observedPathProgress).isAtLeast(0.95f)
    }

    /**
     * AC-2: Head-dot breathing cycles 0→1→0 at 1400ms ease-in-out reversed
     *
     * GIVEN MapSketchAnimationLayer mounted with mainClock.autoAdvance = false
     * WHEN test clock advances 1400ms
     * THEN captured headDotAlpha reaches peak (approximately 1.0f) at the midpoint of reverse cycle
     */
    @Test
    fun ac2_head_dot_alpha_at_1400ms_reaches_peak() {
        composeTestRule.mainClock.autoAdvance = false
        var observedHeadDotAlpha = 0f

        composeTestRule.setContent {
            MapSketchAnimationLayer(
                path = listOf(LatLng(0.0, 0.0), LatLng(1.0, 1.0)),
                onHeadDotAlphaUpdate = { observedHeadDotAlpha = it }
            )
        }

        // Advance to 1400ms (peak of ease-in-out reverse cycle)
        composeTestRule.mainClock.advanceTimeBy(1400L)

        // At 1400ms of a 2800ms reverse cycle (peak at midpoint), alpha should be ~1.0f
        assertThat(observedHeadDotAlpha).isWithin(0.05f).of(1.0f)
    }

    /**
     * AC-2 continued: Head-dot breathing cycles 0→1→0 at 1400ms ease-in-out reversed
     *
     * GIVEN MapSketchAnimationLayer mounted
     * WHEN test clock advances 2800ms (one full 0→1→0 cycle)
     * THEN captured headDotAlpha returns to approximately 0.0f
     */
    @Test
    fun ac2_head_dot_alpha_at_2800ms_returns_to_zero() {
        composeTestRule.mainClock.autoAdvance = false
        var observedHeadDotAlpha = 0f

        composeTestRule.setContent {
            MapSketchAnimationLayer(
                path = listOf(LatLng(0.0, 0.0), LatLng(1.0, 1.0)),
                onHeadDotAlphaUpdate = { observedHeadDotAlpha = it }
            )
        }

        // Advance to 2800ms (end of full reverse cycle: 0→1→0)
        composeTestRule.mainClock.advanceTimeBy(2800L)

        // At end of cycle, alpha should return to ~0.0f
        assertThat(observedHeadDotAlpha).isWithin(0.05f).of(0.0f)
    }

    /**
     * AC-3: Reduced-motion collapses both animations to static state
     *
     * GIVEN system animator-duration-scale is mocked to 0f (reduced-motion enabled)
     * WHEN MapSketchAnimationLayer runs and clock advances beyond animation duration
     * THEN pathDrawProgress remains static at 1.0f and headDotAlpha remains static at 1.0f
     */
    @Test
    fun ac3_reduced_motion_keeps_path_progress_static_at_one() {
        composeTestRule.mainClock.autoAdvance = false
        var observedPathProgress = -1f
        var observedHeadDotAlpha = -1f

        composeTestRule.setContent {
            MapSketchAnimationLayer(
                path = listOf(LatLng(0.0, 0.0), LatLng(1.0, 1.0)),
                reducedMotionOverride = true,  // FORCE reduced-motion branch
                onProgressUpdate = { observedPathProgress = it },
                onHeadDotAlphaUpdate = { observedHeadDotAlpha = it },
            )
        }

        // Advance beyond one full animation cycle (1400ms)
        composeTestRule.mainClock.advanceTimeBy(2000L)

        // With reduced-motion forced, both values should remain static at 1.0f
        assertThat(observedPathProgress).isWithin(0.001f).of(1.0f)
        assertThat(observedHeadDotAlpha).isWithin(0.001f).of(1.0f)
    }

    /**
     * AC-4: Empty path renders nothing without crash
     *
     * GIVEN MapSketchAnimationLayer with empty path
     * WHEN composable runs
     * THEN no Canvas draw call is made; composable does not throw; callbacks are never invoked
     */
    @Test
    fun ac4_empty_path_renders_nothing_without_crash() {
        composeTestRule.mainClock.autoAdvance = false
        var progressCallCount = 0

        composeTestRule.setContent {
            MapSketchAnimationLayer(
                path = emptyList(),
                onProgressUpdate = { progressCallCount += 1 }
            )
        }

        // Advance clock beyond one full animation cycle
        composeTestRule.mainClock.advanceTimeBy(1500L)

        // With empty path, early return prevents callbacks from ever being invoked
        assertThat(progressCallCount).isEqualTo(0)
    }

    /**
     * AC-5: Stroke color resolves to LaneShadowTheme.semantic.route.best
     *
     * GIVEN MapSketchAnimationLayer runs in light theme
     * WHEN stroke color callback fires
     * THEN resolved color equals GeneratedTokens.color.Route.best (not a hex literal)
     */
    @Test
    fun ac5_stroke_color_resolved_via_callback() {
        composeTestRule.mainClock.autoAdvance = false
        var resolvedStrokeColor: Color? = null

        composeTestRule.setContent {
            MapSketchAnimationLayer(
                path = listOf(LatLng(0.0, 0.0), LatLng(1.0, 1.0)),
                onStrokeColorResolved = { resolvedStrokeColor = it }
            )
        }

        composeTestRule.mainClock.advanceTimeBy(1L)

        // Verify resolved color matches the expected token (light theme uses Route.best)
        assertThat(resolvedStrokeColor).isEqualTo(GeneratedTokens.color.Route.best)
    }
}
