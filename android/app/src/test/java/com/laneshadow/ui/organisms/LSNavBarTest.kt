package com.laneshadow.ui.organisms

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import com.laneshadow.BuildConfig
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.molecules.LSToolbarLeadingTag
import com.laneshadow.ui.molecules.LSToolbarTrailingTag
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.RuleChain
import org.junit.rules.TestRule
import org.junit.runner.Description
import org.junit.runners.model.Statement
import org.robolectric.RobolectricTestRunner
import org.junit.runner.RunWith

@RunWith(RobolectricTestRunner::class)
class LSNavBarTest {
    private val composeTestRule = createComposeRule()

    @get:Rule
    val ruleChain: TestRule = RuleChain.outerRule(DebugVariantRule).around(composeTestRule)

    @Test
    fun delegates_to_lstoolbar_molecule() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSNavBar(
                    title = "Filter",
                    leading = NavBarLeading.Back(onClick = {}),
                    trailing = NavBarTrailing.Action(icon = IconName.Close, onClick = {}),
                    modifier = Modifier.testTag("ls-navbar-test"),
                )
            }
        }

        // Verify LSToolbar test tags are present (delegation confirmed)
        composeTestRule.onNodeWithTag(LSToolbarLeadingTag)
            .assertExists()

        composeTestRule.onNodeWithTag(LSToolbarTrailingTag)
            .assertExists()

        // Verify title is present
        composeTestRule.onNodeWithText("Filter")
            .assertExists()
    }

    @Test
    fun back_leading_renders_correctly() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSNavBar(
                    title = "Routes",
                    leading = NavBarLeading.Back(onClick = {}),
                    modifier = Modifier.testTag("ls-navbar-test"),
                )
            }
        }

        // Verify back button exists
        composeTestRule.onNodeWithTag(LSToolbarLeadingTag)
            .assertExists()

        // Verify title is present
        composeTestRule.onNodeWithText("Routes")
            .assertExists()
    }

    @Test
    fun close_trailing_renders_correctly() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSNavBar(
                    title = "Search",
                    trailing = NavBarTrailing.Action(icon = IconName.Close, onClick = {}),
                    modifier = Modifier.testTag("ls-navbar-test"),
                )
            }
        }

        // Verify close button exists
        composeTestRule.onNodeWithTag(LSToolbarTrailingTag)
            .assertExists()

        // Verify title is present
        composeTestRule.onNodeWithText("Search")
            .assertExists()
    }

    @Test
    fun title_only_renders_correctly() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSNavBar(
                    title = "Settings",
                    modifier = Modifier.testTag("ls-navbar-test"),
                )
            }
        }

        // Verify title is present
        composeTestRule.onNodeWithText("Settings")
            .assertExists()

        // Verify no leading slot (should not exist)
        composeTestRule.onNodeWithTag(LSToolbarLeadingTag)
            .assertDoesNotExist()
    }
}
