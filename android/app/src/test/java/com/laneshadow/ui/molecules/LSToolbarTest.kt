package com.laneshadow.ui.molecules

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.BuildConfig
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.RuleChain
import org.junit.rules.TestRule
import org.junit.runner.Description
import org.junit.runner.RunWith
import org.junit.runners.model.Statement
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class LSToolbarTest {
    private val composeTestRule = createComposeRule()

    @get:Rule
    val ruleChain: TestRule = RuleChain.outerRule(DebugVariantRuleForToolbar).around(composeTestRule)

    @Test
    fun default_render_uses_chrome_tokens() {
        var expectedToolbarHeight: Dp = 0.dp

        composeTestRule.setContent {
            LaneShadowTheme {
                val theme = LocalLaneShadowTheme.current
                expectedToolbarHeight = theme.toolbarComponentSizing.toolbarHeight

                LSToolbar(
                    leading = LSToolbarLeading.Back(onClick = {}),
                    title = "Details",
                    trailing = LSToolbarTrailing.Action(icon = IconName.Menu, onClick = {}),
                    modifier = Modifier.testTag("toolbar-default"),
                )
            }
        }

        composeTestRule.onNodeWithTag("toolbar-default")
            .assert(SemanticsMatcher.expectValue(LSToolbarHeightKey, expectedToolbarHeight))
            .assert(SemanticsMatcher.keyIsDefined(LSToolbarBackgroundColorKey))
            .assert(SemanticsMatcher.expectValue(LSToolbarTitleVariantKey, "Ui.Title.Md"))
            .assert(SemanticsMatcher.expectValue(LSToolbarInsetsAppliedKey, true))

        composeTestRule.onNodeWithTag("ls-toolbar-title").fetchSemanticsNode()
        composeTestRule.onNodeWithContentDescription("Navigate back").fetchSemanticsNode()
        composeTestRule.onNodeWithContentDescription("Toolbar action: menu").fetchSemanticsNode()
    }

    @Test
    fun title_only_and_two_actions_variants() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSToolbar(
                    title = "Library",
                    trailing = LSToolbarTrailing.Actions(
                        first = LSToolbarAction(icon = IconName.Menu, onClick = {}),
                        second = LSToolbarAction(icon = IconName.Share, onClick = {}),
                    ),
                    modifier = Modifier.testTag("toolbar-two-actions"),
                )

                LSToolbar(
                    title = "Title Only",
                    modifier = Modifier.testTag("toolbar-title-only"),
                )
            }
        }

        composeTestRule.onNodeWithTag("toolbar-two-actions")
            .assert(SemanticsMatcher.keyIsDefined(LSToolbarTrailingGapKey))

        assertTrue(composeTestRule.onAllNodesWithTag(LSToolbarLeadingTag).fetchSemanticsNodes().isEmpty())
        composeTestRule.onNodeWithContentDescription("Toolbar action: menu").fetchSemanticsNode()
        composeTestRule.onNodeWithContentDescription("Toolbar action: share").fetchSemanticsNode()
        composeTestRule.onNodeWithTag("toolbar-title-only").fetchSemanticsNode()
    }
}

private object DebugVariantRuleForToolbar : TestRule {
    override fun apply(base: Statement, description: Description): Statement =
        object : Statement() {
            override fun evaluate() {
                assumeTrue(BuildConfig.BUILD_TYPE == "debug")
                base.evaluate()
            }
        }
}
