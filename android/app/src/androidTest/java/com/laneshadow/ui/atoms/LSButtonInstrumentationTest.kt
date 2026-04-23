package com.laneshadow.ui.atoms

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHasNoClickAction
import androidx.compose.ui.test.assertHeightIsEqualTo
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertWidthIsAtLeast
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSButtonInstrumentationTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun pressed_state_applies_action_pressed_token() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSButton(
                    label = "Save Ride",
                    variant = ButtonVariant.Primary,
                    state = ButtonState.Pressed,
                    onClick = {},
                    modifier = Modifier.testTag("button"),
                )
            }
        }

        composeTestRule.onNodeWithTag("button")
            .assert(SemanticsMatcher.expectValue(LSButtonBackgroundColorKey, GeneratedTokens.color.Action.Primary.pressed))
            .assert(SemanticsMatcher.expectValue(LSButtonVisualStateKey, ButtonState.Pressed.name))
    }

    @Test
    fun disabled_state_suppresses_click_and_applies_token() {
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
            .assert(
                SemanticsMatcher.expectValue(
                    LSButtonBackgroundColorKey,
                    GeneratedTokens.color.Action.Primary.default.copy(alpha = 0.38f),
                ),
            )

        composeTestRule.runOnIdle {
            assertEquals(0, clickCount)
        }
    }

    @Test
    fun outline_with_leading_icon_renders_chip() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSButton(
                    label = "NEW",
                    variant = ButtonVariant.Outline,
                    leadingIcon = IconName.Sparkle,
                    onClick = {},
                    modifier = Modifier.testTag("button"),
                )
            }
        }

        composeTestRule.onNodeWithTag("button")
            .assert(SemanticsMatcher.expectValue(LSButtonLeadingIconNameKey, IconName.Sparkle.value))
            .assert(SemanticsMatcher.expectValue(LSButtonBorderColorKey, GeneratedTokens.color.Border.default))
            .assert(SemanticsMatcher.expectValue(LSButtonIconGapKey, 8.dp))
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
            .assert(SemanticsMatcher.expectValue(LSButtonTouchTargetKey, LaneShadowButtonMinTouchTarget))
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
