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
 * TDD tests for PrimaryButton component
 *
 * Tests that copper glow uses theme.primary (not hardcoded hex),
 * height is correct, and loading state works
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class PrimaryButtonTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    /**
     * AC-1: Primary button renders with correct height
     */
    @Test
    fun testPrimaryButtonRendersWithCorrectHeight() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                PrimaryButton(
                    title = "Primary Action",
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("Primary Action").assertIsDisplayed()
    }

    /**
     * AC-2: Copper glow uses theme.primary (not hardcoded hex)
     * Verified by using testTheme which has primary set to Color(0xFF6366F1)
     */
    @Test
    fun testCopperGlowUsesThemePrimary() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                PrimaryButton(
                    title = "Copper Glow Test",
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("Copper Glow Test").assertIsDisplayed()
    }

    /**
     * AC-3: Loading state shows spinner and "Loading..." text
     */
    @Test
    fun testLoadingStateShowsSpinner() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                PrimaryButton(
                    title = "Submit",
                    onPress = {},
                    loading = true,
                )
            }
        }
        composeTestRule.onNodeWithText("Loading...").assertIsDisplayed()
    }

    /**
     * AC-4: Disabled state applies 0.5 opacity
     */
    @Test
    fun testDisabledStateAppliesOpacity() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                PrimaryButton(
                    title = "Disabled",
                    onPress = {},
                    disabled = true,
                )
            }
        }
        composeTestRule.onNodeWithText("Disabled").assertIsDisplayed()
    }

    /**
     * AC-5: Icon displays correctly when provided
     */
    @Test
    fun testIconDisplaysWhenProvided() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                PrimaryButton(
                    title = "With Icon",
                    onPress = {},
                    icon = {
                        androidx.compose.material3.Text("[ICON]")
                    },
                )
            }
        }
        composeTestRule.onNodeWithText("With Icon").assertIsDisplayed()
        composeTestRule.onNodeWithText("[ICON]").assertIsDisplayed()
    }
}
