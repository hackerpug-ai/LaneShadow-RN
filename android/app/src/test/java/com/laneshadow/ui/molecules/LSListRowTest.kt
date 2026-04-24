package com.laneshadow.ui.molecules

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.BuildConfig
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.LocalLaneShadowTheme
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
class LSListRowTest {
    private val composeTestRule = createComposeRule()

    @get:Rule
    val ruleChain: TestRule = RuleChain.outerRule(DebugVariantRuleForListRow).around(composeTestRule)

    @Test
    fun row_with_avatar_subtitle_chevron_meets_token_spec() {
        var expectedTouchTarget: Dp = 0.dp
        var expectedRowGap: Dp = 0.dp
        var expectedVerticalPadding: Dp = 0.dp
        var expectedChevronSize: Dp = 0.dp

        composeTestRule.setContent {
            LaneShadowTheme {
                val theme = LocalLaneShadowTheme.current
                expectedTouchTarget = theme.sizing.touchTarget
                expectedRowGap = theme.space.sm
                expectedVerticalPadding = theme.space.xs
                expectedChevronSize = theme.sizing.icon.md

                LSListRow(
                    title = "Name",
                    subtitle = "Detail",
                    leading = LSListRowLeading.Avatar(initials = "Ada"),
                    trailing = LSListRowTrailing.Chevron,
                    modifier = Modifier.testTag("list-row"),
                )
            }
        }

        composeTestRule.onNodeWithTag("list-row")
            .assert(SemanticsMatcher.expectValue(LSListRowMinHeightKey, expectedTouchTarget))
            .assert(SemanticsMatcher.expectValue(LSListRowGapKey, expectedRowGap))
            .assert(SemanticsMatcher.expectValue(LSListRowVerticalPaddingKey, expectedVerticalPadding))
            .assert(SemanticsMatcher.expectValue(LSListRowSubtitleVariantKey, "Ui.Body.Md"))
            .assert(SemanticsMatcher.expectValue(LSListRowChevronSizeKey, expectedChevronSize))

        composeTestRule.onNodeWithContentDescription("Ada").fetchSemanticsNode()
        composeTestRule.onNodeWithContentDescription("Open details").fetchSemanticsNode()
    }
}

private object DebugVariantRuleForListRow : TestRule {
    override fun apply(base: Statement, description: Description): Statement =
        object : Statement() {
            override fun evaluate() {
                assumeTrue(BuildConfig.BUILD_TYPE == "debug")
                base.evaluate()
            }
        }
}
