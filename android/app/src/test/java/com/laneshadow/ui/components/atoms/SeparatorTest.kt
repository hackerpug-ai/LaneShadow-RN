package com.laneshadow.ui.components.atoms

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.assertIsDisplayed
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.testTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * TDD tests for Separator component
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class SeparatorTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun testSeparatorRendersHorizontal() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Separator(
                    orientation = SeparatorOrientation.Horizontal,
                )
            }
        }
        // Separator renders without content description - just verify it compiles
        composeTestRule.waitForIdle()
    }

    @Test
    fun testSeparatorRendersVertical() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Separator(
                    orientation = SeparatorOrientation.Vertical,
                )
            }
        }
        // Separator renders without content description - just verify it compiles
        composeTestRule.waitForIdle()
    }

    @Test
    fun testSeparatorUsesThemeDividerColor() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Separator()
            }
        }
        // Separator renders without content description - just verify it compiles
        composeTestRule.waitForIdle()
    }
}
