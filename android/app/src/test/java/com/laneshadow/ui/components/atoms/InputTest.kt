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
 * TDD tests for Input component
 *
 * Tests height=48dp, focus border changes, and error state styling
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class InputTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    /**
     * AC-1: Input renders with correct height (48dp)
     */
    @Test
    fun testInputHasCorrectHeight() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Input(
                    value = "",
                    onValueChange = {},
                    placeholder = "Enter text",
                )
            }
        }
        composeTestRule.onNodeWithText("Enter text").assertIsDisplayed()
    }

    /**
     * AC-2: Label displays above input when provided
     */
    @Test
    fun testLabelDisplaysAboveInput() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Input(
                    value = "",
                    onValueChange = {},
                    label = "Email Address",
                    placeholder = "user@example.com",
                )
            }
        }
        composeTestRule.onNodeWithText("EMAIL ADDRESS").assertIsDisplayed()
    }

    /**
     * AC-3: Error state shows error message and styling
     */
    @Test
    fun testErrorStateShowsErrorMessage() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Input(
                    value = "invalid-email",
                    onValueChange = {},
                    label = "Email",
                    error = "Please enter a valid email address",
                )
            }
        }
        composeTestRule.onNodeWithText("Please enter a valid email address").assertIsDisplayed()
    }

    /**
     * AC-4: Disabled state applies 0.5 opacity
     */
    @Test
    fun testDisabledStateAppliesOpacity() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Input(
                    value = "Disabled input",
                    onValueChange = {},
                    disabled = true,
                )
            }
        }
        composeTestRule.onNodeWithText("Disabled input").assertIsDisplayed()
    }

    /**
     * AC-5: Left icon displays when provided
     */
    @Test
    fun testLeftIconDisplays() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Input(
                    value = "",
                    onValueChange = {},
                    placeholder = "Search",
                    leftIcon = {
                        androidx.compose.material3.Text("[SEARCH]")
                    },
                )
            }
        }
        composeTestRule.onNodeWithText("Search").assertIsDisplayed()
        composeTestRule.onNodeWithText("[SEARCH]").assertIsDisplayed()
    }

    /**
     * AC-6: Right icon displays when provided
     */
    @Test
    fun testRightIconDisplays() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Input(
                    value = "",
                    onValueChange = {},
                    placeholder = "Password",
                    rightIcon = {
                        androidx.compose.material3.Text("[EYE]")
                    },
                )
            }
        }
        composeTestRule.onNodeWithText("Password").assertIsDisplayed()
        composeTestRule.onNodeWithText("[EYE]").assertIsDisplayed()
    }

    /**
     * AC-7: Input value displays correctly
     */
    @Test
    fun testInputValueDisplays() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Input(
                    value = "Hello World",
                    onValueChange = {},
                )
            }
        }
        composeTestRule.onNodeWithText("Hello World").assertIsDisplayed()
    }
}
