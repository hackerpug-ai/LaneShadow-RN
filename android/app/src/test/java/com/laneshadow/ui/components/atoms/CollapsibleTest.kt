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
 * TDD tests for Collapsible component
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class CollapsibleTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun testCollapsibleRendersHeader() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Collapsible(
                    title = "Section Title",
                    isOpen = false,
                    onToggle = {},
                ) {
                    androidx.compose.material3.Text("Content")
                }
            }
        }
        composeTestRule.onNodeWithText("Section Title").assertIsDisplayed()
    }

    @Test
    fun testCollapsibleShowsContentWhenOpen() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Collapsible(
                    title = "Section",
                    isOpen = true,
                    onToggle = {},
                ) {
                    androidx.compose.material3.Text("Visible Content")
                }
            }
        }
        composeTestRule.onNodeWithText("Visible Content").assertIsDisplayed()
    }

    @Test
    fun testCollapsibleHidesContentWhenClosed() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Collapsible(
                    title = "Section",
                    isOpen = false,
                    onToggle = {},
                ) {
                    androidx.compose.material3.Text("Hidden Content")
                }
            }
        }
        composeTestRule.onNodeWithText("Hidden Content").assertDoesNotExist()
    }
}
