package com.laneshadow.ui.atoms

import android.content.res.Configuration
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.graphics.Color
import com.google.common.truth.Truth.assertThat
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.ThemeLoader
import com.laneshadow.theme.laneShadowThemeValues
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import java.io.File
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

/**
 * Behavior tests for MapSketchAnimationLayer composable using Robolectric.
 *
 * These tests verify the actual runtime animation behavior by advancing the Compose test clock
 * and asserting on animation progress and alpha values.
 *
 * Robolectric allows Compose Animations with mainClock control to run in the JVM test environment,
 * enabling these tests to execute via testDebugUnitTest (not requiring a connected device).
 *
 * Verifies:
 * - Path-draw progress animates at 1400ms linear (0→1 at 700ms ≈ 0.5)
 * - Head-dot breathing animates at 1400ms ease-in-out reversed (0→1→0 over 2800ms)
 * - Reduced-motion collapses both animations to static state (1.0f)
 * - Empty path renders nothing without crash
 * - Stroke color uses semantic.route.best token (light and dark themes)
 */
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [34])
class MapSketchAnimationLayerBehaviorTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    private val themeValues by lazy {
        laneShadowThemeValues(
            ThemeLoader.fromStream(
                File("../../tokens/platforms/kotlin/src/main/assets/semantic.tokens.json").inputStream(),
            ),
            darkTheme = false,
        )
    }

    /**
     * Helper to wrap content in theme and Material.
     */
    @Composable
    private fun ThemeContent(content: @Composable () -> Unit) {
        CompositionLocalProvider(LocalLaneShadowTheme provides themeValues) {
            MaterialTheme {
                content()
            }
        }
    }

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
            ThemeContent {
                MapSketchAnimationLayer(
                    path = listOf(LatLng(0.0, 0.0), LatLng(1.0, 1.0)),
                    onProgressUpdate = { observedPathProgress = it }
                )
            }
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
            ThemeContent {
                MapSketchAnimationLayer(
                    path = listOf(LatLng(0.0, 0.0), LatLng(1.0, 1.0)),
                    onProgressUpdate = { observedPathProgress = it }
                )
            }
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
            ThemeContent {
                MapSketchAnimationLayer(
                    path = listOf(LatLng(0.0, 0.0), LatLng(1.0, 1.0)),
                    onHeadDotAlphaUpdate = { observedHeadDotAlpha = it }
                )
            }
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
            ThemeContent {
                MapSketchAnimationLayer(
                    path = listOf(LatLng(0.0, 0.0), LatLng(1.0, 1.0)),
                    onHeadDotAlphaUpdate = { observedHeadDotAlpha = it }
                )
            }
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
            ThemeContent {
                MapSketchAnimationLayer(
                    path = listOf(LatLng(0.0, 0.0), LatLng(1.0, 1.0)),
                    reducedMotionOverride = true,  // FORCE reduced-motion branch
                    onProgressUpdate = { observedPathProgress = it },
                    onHeadDotAlphaUpdate = { observedHeadDotAlpha = it },
                )
            }
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
            ThemeContent {
                MapSketchAnimationLayer(
                    path = emptyList(),
                    onProgressUpdate = { progressCallCount += 1 }
                )
            }
        }

        // Advance clock beyond one full animation cycle
        composeTestRule.mainClock.advanceTimeBy(1500L)

        // With empty path, early return prevents callbacks from ever being invoked
        assertThat(progressCallCount).isEqualTo(0)
    }

    /**
     * AC-5: Stroke color resolves to LaneShadowTheme.semantic.route.best (light theme)
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
            ThemeContent {
                MapSketchAnimationLayer(
                    path = listOf(LatLng(0.0, 0.0), LatLng(1.0, 1.0)),
                    onStrokeColorResolved = { resolvedStrokeColor = it }
                )
            }
        }

        composeTestRule.mainClock.advanceTimeBy(1L)

        // Verify resolved color matches the expected token (light theme uses Route.best)
        assertThat(resolvedStrokeColor).isEqualTo(GeneratedTokens.color.Route.best)
    }

    /**
     * AC-5 variant: Stroke color resolves in dark theme
     *
     * GIVEN MapSketchAnimationLayer runs with dark theme forced via Robolectric Configuration
     * WHEN stroke color callback fires
     * THEN resolved color equals GeneratedTokens.color.Route.dark.best
     */
    @Test
    fun ac5_stroke_color_resolved_via_callback_dark_theme() {
        composeTestRule.mainClock.autoAdvance = false
        var resolvedStrokeColor: Color? = null

        // Force dark mode in Robolectric BEFORE setContent
        val config = RuntimeEnvironment.getApplication().resources.configuration
        val originalUiMode = config.uiMode
        config.uiMode = (config.uiMode and Configuration.UI_MODE_NIGHT_MASK.inv()) or
                        Configuration.UI_MODE_NIGHT_YES
        RuntimeEnvironment.getApplication().onConfigurationChanged(config)

        try {
            composeTestRule.setContent {
                ThemeContent {
                    MapSketchAnimationLayer(
                        path = listOf(LatLng(0.0, 0.0), LatLng(1.0, 1.0)),
                        onStrokeColorResolved = { resolvedStrokeColor = it },
                    )
                }
            }

            composeTestRule.mainClock.advanceTimeBy(100L)

            // EXCLUSIVE assertion — must equal the DARK token
            assertThat(resolvedStrokeColor).isEqualTo(GeneratedTokens.color.Route.dark.best)
        } finally {
            // Restore so other tests don't inherit dark mode
            config.uiMode = originalUiMode
            RuntimeEnvironment.getApplication().onConfigurationChanged(config)
        }
    }
}
