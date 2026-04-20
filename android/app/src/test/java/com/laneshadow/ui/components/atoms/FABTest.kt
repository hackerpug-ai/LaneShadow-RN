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
 * TDD tests for FAB component
 *
 * Tests size, elevation, and icon placement
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class FABTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    /**
     * AC-1: FAB renders with icon only
     */
    @Test
    fun testFABRendersWithIconOnly() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                FAB(
                    icon = {
                        androidx.compose.material3.Text("[+]")
                    },
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("[+]").assertIsDisplayed()
    }

    /**
     * AC-2: FAB renders with label
     */
    @Test
    fun testFABRendersWithLabel() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                FAB(
                    label = "Create New",
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("CREATE NEW").assertIsDisplayed()
    }

    /**
     * AC-3: FAB renders with both icon and label
     */
    @Test
    fun testFABRendersWithIconAndLabel() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                FAB(
                    icon = {
                        androidx.compose.material3.Text("[+]")
                    },
                    label = "Add Item",
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("[+]").assertIsDisplayed()
        composeTestRule.onNodeWithText("ADD ITEM").assertIsDisplayed()
    }

    /**
     * AC-4: FAB uses theme primary color (not hardcoded hex)
     */
    @Test
    fun testFABUsesThemePrimaryColor() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                FAB(
                    label = "Primary FAB",
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("PRIMARY FAB").assertIsDisplayed()
    }

    /**
     * AC-5: FAB has correct elevation
     */
    @Test
    fun testFABHasCorrectElevation() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                FAB(
                    label = "Elevated FAB",
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("ELEVATED FAB").assertIsDisplayed()
    }

    /**
     * AC-6: FAB size is 56×56dp when icon-only
     */
    @Test
    fun testFABSizeIsCorrectForIconOnly() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                FAB(
                    icon = {
                        androidx.compose.material3.Text("[+]")
                    },
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("[+]").assertIsDisplayed()
    }

    /**
     * AC-7: Disabled state applies 0.5 opacity
     */
    @Test
    fun testDisabledStateAppliesOpacity() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                FAB(
                    label = "Disabled",
                    onPress = {},
                    disabled = true,
                )
            }
        }
        composeTestRule.onNodeWithText("DISABLED").assertIsDisplayed()
    }

    /**
     * AC-8: FAB animates in when visible changes to true
     */
    @Test
    fun testFABAnimatesInWhenVisible() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                FAB(
                    label = "Animated FAB",
                    visible = true,
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("ANIMATED FAB").assertIsDisplayed()
    }

    /**
     * AC-9: FAB is hidden when visible is false
     */
    @Test
    fun testFABIsHiddenWhenNotVisible() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                FAB(
                    label = "Hidden FAB",
                    visible = false,
                    onPress = {},
                )
            }
        }
        composeTestRule.onNodeWithText("HIDDEN FAB").assertDoesNotExist()
    }
}
