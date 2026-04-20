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
 * TDD tests for Textarea component
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class TextareaTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun testTextareaRenders() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Textarea(
                    value = "Multi-line text",
                    onValueChange = {},
                )
            }
        }
        composeTestRule.onNodeWithText("Multi-line text").assertIsDisplayed()
    }

    @Test
    fun testTextareaWithPlaceholder() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Textarea(
                    value = "",
                    onValueChange = {},
                    placeholder = "Enter your message",
                )
            }
        }
        composeTestRule.onNodeWithText("Enter your message").assertIsDisplayed()
    }
}
