package com.laneshadow.ui.molecules

import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.BuildConfig
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
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
class LSNavHeaderTest {
    private val composeTestRule = createComposeRule()

    @get:Rule
    val ruleChain: TestRule = RuleChain.outerRule(DebugVariantRuleForNavHeader).around(composeTestRule)

    @Test
    fun large_title_variant_uses_opinion_lg_typography() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSNavHeader(
                    variant = NavHeaderVariant.LargeTitle,
                    title = "Chat",
                    modifier = Modifier.testTag("nav-header-large"),
                )
            }
        }

        composeTestRule.onNodeWithTag("nav-header-large")
            .assert(SemanticsMatcher.expectValue(LSNavHeaderTitleVariantKey, "Opinion.Lg"))
            .assert(SemanticsMatcher.keyIsDefined(LSNavHeaderBackgroundColorKey))

        composeTestRule.onNodeWithTag("ls-nav-header-title").fetchSemanticsNode()
    }

    @Test
    fun large_title_with_subtitle_renders_both_nodes() {
        var expectedSubtitleGap: Dp = 0.dp
        var expectedSubtitleColor: Color = Color.Unspecified

        composeTestRule.setContent {
            LaneShadowTheme {
                val theme = LocalLaneShadowTheme.current
                expectedSubtitleGap = theme.space.xs
                expectedSubtitleColor = GeneratedTokens.color.Content.tertiary

                LSNavHeader(
                    variant = NavHeaderVariant.LargeTitleWithSubtitle,
                    title = "Chat",
                    subtitle = "12 rides this week",
                    modifier = Modifier.testTag("nav-header-large-subtitle"),
                )
            }
        }

        composeTestRule.onNodeWithTag("nav-header-large-subtitle")
            .assert(SemanticsMatcher.expectValue(LSNavHeaderTitleVariantKey, "Opinion.Lg"))
            .assert(SemanticsMatcher.expectValue(LSNavHeaderSubtitleVariantKey, "Ui.Body.Md"))
            .assert(SemanticsMatcher.expectValue(LSNavHeaderSubtitleColorKey, expectedSubtitleColor))
            .assert(SemanticsMatcher.expectValue(LSNavHeaderVerticalGapKey, expectedSubtitleGap))

        composeTestRule.onNodeWithTag("ls-nav-header-title").fetchSemanticsNode()
        composeTestRule.onNodeWithTag("ls-nav-header-subtitle").fetchSemanticsNode()
    }
}

private object DebugVariantRuleForNavHeader : TestRule {
    override fun apply(base: Statement, description: Description): Statement =
        object : Statement() {
            override fun evaluate() {
                assumeTrue(BuildConfig.BUILD_TYPE == "debug")
                base.evaluate()
            }
        }
}
