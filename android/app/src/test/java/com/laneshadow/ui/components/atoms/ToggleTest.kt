package com.laneshadow.ui.components.atoms

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.testTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * TDD tests for Toggle component
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class ToggleTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun testToggleRendersDefaultVariant() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Toggle(
                    pressed = false,
                    onPressedChange = {},
                    text = "Toggle Button",
                )
            }
        }
        composeTestRule.onNodeWithText("Toggle Button").assertIsDisplayed()
    }

    @Test
    fun testToggleRendersOutlineVariant() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Toggle(
                    pressed = false,
                    onPressedChange = {},
                    text = "Outline Toggle",
                    variant = ToggleVariant.Outline,
                )
            }
        }
        composeTestRule.onNodeWithText("Outline Toggle").assertIsDisplayed()
    }

    @Test
    fun testTogglePressedState() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Toggle(
                    pressed = true,
                    onPressedChange = {},
                    text = "Pressed Toggle",
                )
            }
        }
        composeTestRule.onNodeWithText("Pressed Toggle").assertIsDisplayed()
    }

    @Test
    fun testToggleDisabledState() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Toggle(
                    pressed = false,
                    onPressedChange = {},
                    text = "Disabled Toggle",
                    disabled = true,
                )
            }
        }
        composeTestRule.onNodeWithText("Disabled Toggle").assertIsDisplayed()
    }
}
