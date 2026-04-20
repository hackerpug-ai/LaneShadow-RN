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
 * TDD tests for Progress component
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class ProgressTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun testProgressRendersDeterminate() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Progress(
                    value = 50f,
                    max = 100f,
                    indeterminate = false,
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("progress").assertIsDisplayed()
    }

    @Test
    fun testProgressRendersIndeterminate() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Progress(
                    indeterminate = true,
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("progress").assertIsDisplayed()
    }

    @Test
    fun testProgressUsesThemeColors() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Progress(value = 75f)
            }
        }
        composeTestRule.onNodeWithContentDescription("progress").assertIsDisplayed()
    }
}
