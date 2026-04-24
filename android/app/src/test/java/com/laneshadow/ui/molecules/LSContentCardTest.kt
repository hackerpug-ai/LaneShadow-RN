package com.laneshadow.ui.molecules

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.height
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.BuildConfig
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.LSCardBackgroundColorKey
import com.laneshadow.ui.atoms.LSCardContentPaddingKey
import com.laneshadow.ui.atoms.LSCardCornerRadiusKey
import com.laneshadow.ui.atoms.LSCardShadowElevationKey
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.junit.rules.RuleChain
import org.junit.rules.TestRule
import org.junit.runner.Description
import org.junit.runners.model.Statement

@RunWith(RobolectricTestRunner::class)
class LSContentCardTest {
    private val composeTestRule = createComposeRule()

    @get:Rule
    val ruleChain: TestRule = RuleChain.outerRule(DebugVariantRule).around(composeTestRule)

    @Test
    fun default_render_uses_surface_card_tokens() {
        var expectedCornerRadius: Dp = 0.dp
        var expectedElevation: Dp = 0.dp
        var expectedPadding: Dp = 0.dp

        composeTestRule.setContent {
            LaneShadowTheme {
                val theme = LocalLaneShadowTheme.current
                expectedCornerRadius = theme.radius.lg
                expectedElevation = theme.elevation.light.level2
                expectedPadding = theme.space.lg

                LSContentCard(
                    title = "Route X",
                    subtitle = "42 mi · 1h 12m",
                    modifier = Modifier.testTag("content-card"),
                )
            }
        }

        composeTestRule.onNodeWithTag("content-card")
            .assert(SemanticsMatcher.expectValue(LSCardCornerRadiusKey, expectedCornerRadius))
            .assert(SemanticsMatcher.expectValue(LSCardShadowElevationKey, expectedElevation))
            .assert(SemanticsMatcher.expectValue(LSCardContentPaddingKey, expectedPadding))
            .assert(SemanticsMatcher.keyIsDefined(LSCardBackgroundColorKey))

        composeTestRule.onNodeWithText("Route X").assertIsDisplayed().assertTextEquals("Route X")
        composeTestRule.onNodeWithText("42 mi · 1h 12m").assertIsDisplayed().assertTextEquals("42 mi · 1h 12m")
    }

    @Test
    fun header_and_actions_slots_compose_correctly() {
        composeTestRule.setContent {
            LaneShadowTheme {
                Column {
                    LSContentCard(
                        title = "Route X",
                        subtitle = "42 mi · 1h 12m",
                        header = {
                            Box(
                                modifier = Modifier
                                    .testTag("card-header")
                                    .height(LocalLaneShadowTheme.current.space.xxxl),
                            )
                        },
                        actions = {
                            Box(
                                modifier = Modifier
                                    .testTag("card-actions")
                                    .height(LocalLaneShadowTheme.current.space.xl),
                            )
                        },
                        modifier = Modifier.testTag("card-with-slots"),
                    )

                    LSContentCard(
                        title = "Route Y",
                        subtitle = "30 mi · 58m",
                        modifier = Modifier.testTag("card-without-slots"),
                    )
                }
            }
        }

        val headerTop = composeTestRule.onNodeWithTag("card-header").fetchSemanticsNode().boundsInRoot.top
        val titleTop = composeTestRule.onNodeWithText("Route X").fetchSemanticsNode().boundsInRoot.top

        assertTrue(headerTop < titleTop)
        assertTrue(composeTestRule.onAllNodesWithTag("card-header", useUnmergedTree = true).fetchSemanticsNodes().size == 1)
        assertTrue(composeTestRule.onAllNodesWithTag("card-actions", useUnmergedTree = true).fetchSemanticsNodes().size == 1)
        composeTestRule.onNodeWithTag("card-without-slots").fetchSemanticsNode()
    }
}

private object DebugVariantRule : TestRule {
    override fun apply(base: Statement, description: Description): Statement =
        object : Statement() {
            override fun evaluate() {
                assumeTrue(BuildConfig.BUILD_TYPE == "debug")
                base.evaluate()
            }
        }
}
