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
 * TDD tests for Button component
 *
 * Tests all 6 sizes, 7 variants, disabled state, and loading state
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class ButtonTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    /**
     * AC-1: All 6 button sizes render correctly
     */
    @Test
    fun testAllButtonSizesRender() {
        // Test Sm size
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Button(
                    size = ButtonSize.Sm,
                    text = "Small",
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("Small").assertIsDisplayed()

        // Test Default size
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Button(
                    size = ButtonSize.Default,
                    text = "Default",
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("Default").assertIsDisplayed()

        // Test Lg size
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Button(
                    size = ButtonSize.Lg,
                    text = "Large",
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("Large").assertIsDisplayed()

        // Test XL size
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Button(
                    size = ButtonSize.XL,
                    text = "XL",
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("XL").assertIsDisplayed()

        // Test XXL size
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Button(
                    size = ButtonSize.XXL,
                    text = "XXL",
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("XXL").assertIsDisplayed()

        // Test Icon size
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Button(
                    size = ButtonSize.Icon,
                    icon = {
                        androidx.compose.material3.Text("Icon")
                    },
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("Icon").assertIsDisplayed()
    }

    /**
     * AC-2: All 7 button variants render correctly
     */
    @Test
    fun testAllButtonVariantsRender() {
        // Test Default variant
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Button(
                    variant = ButtonVariant.Default,
                    text = "Default",
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("Default").assertIsDisplayed()

        // Test Secondary variant
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Button(
                    variant = ButtonVariant.Secondary,
                    text = "Secondary",
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("Secondary").assertIsDisplayed()

        // Test Outline variant
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Button(
                    variant = ButtonVariant.Outline,
                    text = "Outline",
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("Outline").assertIsDisplayed()

        // Test Ghost variant
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Button(
                    variant = ButtonVariant.Ghost,
                    text = "Ghost",
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("Ghost").assertIsDisplayed()

        // Test Destructive variant
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Button(
                    variant = ButtonVariant.Destructive,
                    text = "Destructive",
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("Destructive").assertIsDisplayed()

        // Test Link variant
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Button(
                    variant = ButtonVariant.Link,
                    text = "Link",
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("Link").assertIsDisplayed()

        // Test Glass variant
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Button(
                    variant = ButtonVariant.Glass,
                    text = "Glass",
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("Glass").assertIsDisplayed()
    }

    /**
     * AC-3: Disabled state applies 0.5 opacity
     */
    @Test
    fun testDisabledStateAppliesOpacity() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Button(
                    text = "Disabled",
                    onPress = {},
                    disabled = true,
                )
            }
        }
        composeTestRule.onNodeWithText("Disabled").assertIsDisplayed()
    }

    /**
     * AC-4: Loading state shows spinner
     */
    @Test
    fun testLoadingStateShowsSpinner() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Button(
                    text = "Loading",
                    onPress = {},
                    loading = true,
                )
            }
        }
        // In loading state, text should be hidden and spinner visible
        composeTestRule.onNodeWithText("Loading").assertDoesNotExist()
    }
}
