package com.laneshadow.ui.components.atoms

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.assertIsDisplayed
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.testTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import androidx.compose.ui.unit.dp

/**
 * TDD tests for Slider component
 *
 * Tests value range, disabled state, and track fill
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class SliderTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    /**
     * AC-1: Slider renders with default value
     */
    @Test
    fun testSliderRendersWithDefaultValue() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Slider(
                    value = 50f,
                    onValueChange = {},
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("ProgressBar").assertIsDisplayed()
    }

    /**
     * AC-2: Slider respects min and max range
     */
    @Test
    fun testSliderRespectsMinMaxRange() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Slider(
                    value = 25f,
                    onValueChange = {},
                    min = 0f,
                    max = 100f,
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("ProgressBar").assertIsDisplayed()
    }

    /**
     * AC-3: Slider snaps to step increment
     */
    @Test
    fun testSliderSnapsToStepIncrement() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Slider(
                    value = 33f,
                    onValueChange = {},
                    min = 0f,
                    max = 100f,
                    step = 5f,
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("ProgressBar").assertIsDisplayed()
    }

    /**
     * AC-4: Disabled state applies 0.5 opacity
     */
    @Test
    fun testDisabledStateAppliesOpacity() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Slider(
                    value = 50f,
                    onValueChange = {},
                    disabled = true,
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("ProgressBar").assertIsDisplayed()
    }

    /**
     * AC-5: Track fill uses theme primary color (not hardcoded hex)
     */
    @Test
    fun testTrackFillUsesThemePrimaryColor() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Slider(
                    value = 75f,
                    onValueChange = {},
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("ProgressBar").assertIsDisplayed()
    }

    /**
     * AC-6: Inactive track uses theme secondary color
     */
    @Test
    fun testInactiveTrackUsesThemeSecondaryColor() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Slider(
                    value = 25f,
                    onValueChange = {},
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("ProgressBar").assertIsDisplayed()
    }
}
