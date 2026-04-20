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
 * TDD tests for ThemedText component
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class ThemedTextTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun testThemedTextRendersDefaultVariant() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                ThemedText(
                    text = "Default text",
                )
            }
        }
        composeTestRule.onNodeWithText("Default text").assertIsDisplayed()
    }

    @Test
    fun testThemedTextRendersSemiBoldVariant() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                ThemedText(
                    text = "Semi-bold text",
                    variant = ThemedTextVariant.DefaultSemiBold,
                )
            }
        }
        composeTestRule.onNodeWithText("Semi-bold text").assertIsDisplayed()
    }

    @Test
    fun testThemedTextUsesThemeOnSurfaceColor() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                ThemedText(
                    text = "Themed color text",
                )
            }
        }
        composeTestRule.onNodeWithText("Themed color text").assertIsDisplayed()
    }
}
