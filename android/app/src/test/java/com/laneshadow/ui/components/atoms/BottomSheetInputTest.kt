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
 * TDD tests for BottomSheetInput component
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class BottomSheetInputTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun testBottomSheetInputRenders() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                BottomSheetInput(
                    value = "Test value",
                    onValueChange = {},
                    placeholder = "Enter text",
                )
            }
        }
        composeTestRule.onNodeWithText("Test value").assertIsDisplayed()
    }

    @Test
    fun testBottomSheetInputWithLabel() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                BottomSheetInput(
                    value = "",
                    onValueChange = {},
                    label = "Email Address",
                )
            }
        }
        composeTestRule.onNodeWithText("Email Address").assertIsDisplayed()
    }

    @Test
    fun testBottomSheetInputErrorState() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                BottomSheetInput(
                    value = "invalid",
                    onValueChange = {},
                    error = true,
                )
            }
        }
        composeTestRule.onNodeWithText("invalid").assertIsDisplayed()
    }
}
