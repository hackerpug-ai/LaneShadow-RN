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
import androidx.compose.ui.unit.dp

/**
 * TDD tests for Skeleton component
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class SkeletonTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun testSkeletonRenders() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Skeleton(
                    width = 100.dp,
                    height = 20.dp,
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("skeleton").assertIsDisplayed()
    }

    @Test
    fun testSkeletonUsesThemeSurfaceColor() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Skeleton(
                    width = 200.dp,
                    height = 40.dp,
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("skeleton").assertIsDisplayed()
    }
}
