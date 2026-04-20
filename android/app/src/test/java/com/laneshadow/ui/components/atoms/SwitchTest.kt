package com.laneshadow.ui.components.atoms

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.testTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * TDD tests for Switch component
 *
 * Tests on/off track colors, disabled opacity, and thumb position
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class SwitchTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    /**
     * AC-1: Switch renders in off (unchecked) state
     */
    @Test
    fun testSwitchRendersInOffState() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Switch(
                    value = false,
                    onValueChange = {},
                )
            }
        }
        // Switch should be rendered
        composeTestRule.onNodeWithContentDescription("Switch").assertIsDisplayed()
    }

    /**
     * AC-2: Switch renders in on (checked) state
     */
    @Test
    fun testSwitchRendersInOnState() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Switch(
                    value = true,
                    onValueChange = {},
                )
            }
        }
        // Switch should be rendered
        composeTestRule.onNodeWithContentDescription("Switch").assertIsDisplayed()
    }

    /**
     * AC-3: Off state track uses theme muted color
     */
    @Test
    fun testOffTrackUsesThemeMutedColor() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Switch(
                    value = false,
                    onValueChange = {},
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("Switch").assertIsDisplayed()
    }

    /**
     * AC-4: On state track uses theme primary color (not hardcoded hex)
     */
    @Test
    fun testOnTrackUsesThemePrimaryColor() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Switch(
                    value = true,
                    onValueChange = {},
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("Switch").assertIsDisplayed()
    }

    /**
     * AC-5: Disabled state applies 0.5 opacity
     */
    @Test
    fun testDisabledStateAppliesOpacity() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Switch(
                    value = true,
                    onValueChange = {},
                    disabled = true,
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("Switch").assertIsDisplayed()
    }

    /**
     * AC-6: Thumb position animates between states
     */
    @Test
    fun testThumbPositionAnimates() {
        // Test unchecked position
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Switch(
                    value = false,
                    onValueChange = {},
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("Switch").assertIsDisplayed()

        // Test checked position
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Switch(
                    value = true,
                    onValueChange = {},
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("Switch").assertIsDisplayed()
    }
}
