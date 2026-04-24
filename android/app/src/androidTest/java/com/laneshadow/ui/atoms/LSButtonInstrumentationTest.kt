package com.laneshadow.ui.atoms

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.assertHasNoClickAction
import androidx.compose.ui.test.assertHeightIsEqualTo
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertWidthIsAtLeast
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSButtonInstrumentationTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun disabled_state_suppresses_click() {
        var clickCount = 0

        composeTestRule.setContent {
            LaneShadowTheme {
                LSButton(
                    label = "Disabled",
                    variant = ButtonVariant.Primary,
                    state = ButtonState.Disabled,
                    onClick = { clickCount += 1 },
                    modifier = Modifier.testTag("button"),
                )
            }
        }

        composeTestRule.onNodeWithTag("button")
            .assertIsNotEnabled()
            .assertHasNoClickAction()

        composeTestRule.runOnIdle {
            assertEquals(0, clickCount)
        }
    }

    @Test
    fun touch_target_meets_minimum_size() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSButton(
                    label = "Go",
                    variant = ButtonVariant.Primary,
                    onClick = {},
                    modifier = Modifier.testTag("button"),
                )
            }
        }

        composeTestRule.onNodeWithTag("button")
            .assertHeightIsEqualTo(LaneShadowButtonHeight)
            .assertWidthIsAtLeast(LaneShadowButtonMinTouchTarget)
    }

    @Test
    fun onClick_fires_exactly_once_per_tap() {
        var clickCount = 0

        composeTestRule.setContent {
            LaneShadowTheme {
                LSButton(
                    label = "Tap",
                    variant = ButtonVariant.Primary,
                    onClick = { clickCount += 1 },
                    modifier = Modifier.testTag("button"),
                )
            }
        }

        composeTestRule.onNodeWithTag("button").performClick()

        composeTestRule.runOnIdle {
            assertEquals(1, clickCount)
        }
    }
}
