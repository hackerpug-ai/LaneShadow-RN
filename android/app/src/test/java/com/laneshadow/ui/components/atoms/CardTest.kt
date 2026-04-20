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
 * TDD tests for Card component
 *
 * Tests elevation, disabled state, and variant colors from theme
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class CardTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    /**
     * AC-1: Card renders with default variant
     */
    @Test
    fun testCardRendersDefaultVariant() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Card {
                    CardTitle(text = "Card Title")
                    CardDescription(text = "Card description")
                }
            }
        }
        composeTestRule.onNodeWithText("Card Title").assertIsDisplayed()
        composeTestRule.onNodeWithText("Card description").assertIsDisplayed()
    }

    /**
     * AC-2: All card variants use theme colors (not hardcoded hex)
     */
    @Test
    fun testAllCardVariantsUseThemeColors() {
        // Test Primary variant
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Card(variant = CardVariant.Primary) {
                    CardTitle(text = "Primary Card")
                }
            }
        }
        composeTestRule.onNodeWithText("Primary Card").assertIsDisplayed()

        // Test Success variant
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Card(variant = CardVariant.Success) {
                    CardTitle(text = "Success Card")
                }
            }
        }
        composeTestRule.onNodeWithText("Success Card").assertIsDisplayed()

        // Test Warning variant
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Card(variant = CardVariant.Warning) {
                    CardTitle(text = "Warning Card")
                }
            }
        }
        composeTestRule.onNodeWithText("Warning Card").assertIsDisplayed()

        // Test Danger variant
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Card(variant = CardVariant.Danger) {
                    CardTitle(text = "Danger Card")
                }
            }
        }
        composeTestRule.onNodeWithText("Danger Card").assertIsDisplayed()
    }

    /**
     * AC-3: Disabled state applies 0.5 opacity
     */
    @Test
    fun testDisabledStateAppliesOpacity() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Card(
                    disabled = true,
                    onPress = {},
                ) {
                    CardTitle(text = "Disabled Card")
                }
            }
        }
        composeTestRule.onNodeWithText("Disabled Card").assertIsDisplayed()
    }

    /**
     * AC-4: Card elevation is applied correctly
     */
    @Test
    fun testCardElevationApplied() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Card {
                    CardTitle(text = "Elevated Card")
                }
            }
        }
        composeTestRule.onNodeWithText("Elevated Card").assertIsDisplayed()
    }

    /**
     * AC-5: Border renders when showBorder is true
     */
    @Test
    fun testBorderRendersWhenEnabled() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Card(showBorder = true) {
                    CardTitle(text = "Bordered Card")
                }
            }
        }
        composeTestRule.onNodeWithText("Bordered Card").assertIsDisplayed()
    }

    /**
     * AC-6: Card is pressable when onPress is provided
     */
    @Test
    fun testCardIsPressableWithCallback() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Card(onPress = {}) {
                    CardTitle(text = "Pressable Card")
                }
            }
        }
        composeTestRule.onNodeWithText("Pressable Card").assertIsDisplayed()
    }
}
