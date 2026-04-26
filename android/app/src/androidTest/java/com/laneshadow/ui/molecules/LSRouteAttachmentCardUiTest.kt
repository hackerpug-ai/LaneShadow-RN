package com.laneshadow.ui.molecules

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.atoms.LSCardContentPaddingKey
import com.laneshadow.ui.atoms.RouteVariant
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSRouteAttachmentCardUiTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun on_tap_fires_exactly_once() {
        var tapCount = 0

        composeTestRule.setContent {
            LaneShadowTheme {
                LSRouteAttachmentCard(
                    route = RouteAttachment(
                        id = "best-route",
                        title = "Pacific Coast Sweep",
                        via = "via Highway 1 and Skyline",
                        distance = "82 MI",
                        duration = "2H 15M",
                        scenicScore = 5,
                        variant = RouteVariant.Best,
                        weatherBadge = RouteAttachmentWeather(
                            condition = WeatherCondition.Clear,
                            label = "CLEAR",
                        ),
                        isBest = true,
                    ),
                    onTap = { tapCount += 1 },
                    modifier = Modifier.testTag("route-card"),
                )
            }
        }

        composeTestRule.onNodeWithTag("route-card").performClick()
        composeTestRule.runOnIdle {
            assertEquals(1, tapCount)
        }

        composeTestRule.onNodeWithTag("route-card").performClick()
        composeTestRule.runOnIdle {
            assertEquals(2, tapCount)
        }
    }

    @Test
    fun route_card_exposes_lscard_semantics_and_circle_scenic_icons() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSRouteAttachmentCard(
                    route = RouteAttachment(
                        id = "alt-route",
                        title = "Canyon Sweep",
                        via = "via Ridge Road",
                        distance = "62 MI",
                        duration = "1H 45M",
                        scenicScore = 3,
                        variant = RouteVariant.Alt1,
                    ),
                    modifier = Modifier.testTag("route-card"),
                )
            }
        }

        composeTestRule.onNodeWithTag("route-card")
            .assert(SemanticsMatcher.expectValue(LSCardContentPaddingKey, 0.dp))
            .assert(SemanticsMatcher.expectValue(LSRouteAttachmentCardScenicFilledDotsKey, 3))

        composeTestRule.onNodeWithTag("$LSRouteAttachmentCardScenicDotTagPrefix-0")
            .assert(SemanticsMatcher.expectValue(LSRouteAttachmentCardScenicDotFilledKey, true))
        composeTestRule.onNodeWithTag("$LSRouteAttachmentCardScenicDotTagPrefix-1")
            .assert(SemanticsMatcher.expectValue(LSRouteAttachmentCardScenicDotFilledKey, true))
        composeTestRule.onNodeWithTag("$LSRouteAttachmentCardScenicDotTagPrefix-2")
            .assert(SemanticsMatcher.expectValue(LSRouteAttachmentCardScenicDotFilledKey, true))
        composeTestRule.onNodeWithTag("$LSRouteAttachmentCardScenicDotTagPrefix-3")
            .assert(SemanticsMatcher.expectValue(LSRouteAttachmentCardScenicDotFilledKey, false))
        composeTestRule.onNodeWithTag("$LSRouteAttachmentCardScenicDotTagPrefix-4")
            .assert(SemanticsMatcher.expectValue(LSRouteAttachmentCardScenicDotFilledKey, false))
        composeTestRule.onNodeWithTag(LSRouteAttachmentCardScenicLabelTag)
            .assert(SemanticsMatcher.keyIsDefined(SemanticsProperties.Text))
    }
}
