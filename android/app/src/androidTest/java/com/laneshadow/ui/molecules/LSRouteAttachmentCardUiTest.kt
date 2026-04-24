package com.laneshadow.ui.molecules

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.atoms.RouteVariant
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

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
                            condition = WeatherCondition.Sun,
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
}
