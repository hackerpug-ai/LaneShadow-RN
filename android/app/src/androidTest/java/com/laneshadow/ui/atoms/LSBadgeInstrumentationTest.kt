package com.laneshadow.ui.atoms

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHeightIsEqualTo
import androidx.compose.ui.test.assertWidthIsEqualTo
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.Dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSBadgeInstrumentationTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun badge_status_recording_resolves_token_colors() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSBadge(
                    label = "REC",
                    variant = BadgeVariant.Status.Recording,
                    modifier = Modifier.testTag("badge"),
                )
            }
        }

        composeTestRule.onNodeWithTag("badge")
            .assert(SemanticsMatcher.expectValue(LSBadgeBackgroundColorKey, badgeColor("#FEE2E2")))
            .assert(SemanticsMatcher.expectValue(LSBadgeForegroundColorKey, GeneratedTokens.color.Status.Error.default))
    }

    @Test
    fun badge_status_success_resolves_token_colors() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSBadge(
                    label = "ON",
                    variant = BadgeVariant.Status.Success,
                    modifier = Modifier.testTag("badge"),
                )
            }
        }

        composeTestRule.onNodeWithTag("badge")
            .assert(SemanticsMatcher.expectValue(LSBadgeBackgroundColorKey, badgeColor("#DCFCE7")))
            .assert(SemanticsMatcher.expectValue(LSBadgeForegroundColorKey, GeneratedTokens.color.Status.Success.default))
    }

    @Test
    fun badge_weather_rain_resolves_tokens_and_icon() {
        var expectedBorder = GeneratedTokens.color.Weather.Rain.default
        var expectedBorderWidth = Dp.Unspecified

        composeTestRule.setContent {
            LaneShadowTheme {
                expectedBorder = GeneratedTokens.color.Weather.Rain.default.copy(
                    alpha = weatherBorderAlpha(LocalLaneShadowTheme.current),
                )
                expectedBorderWidth = BadgeBorderWidth

                LSBadge(
                    label = "RAIN",
                    variant = BadgeVariant.Weather.Rain,
                    modifier = Modifier.testTag("badge"),
                )
            }
        }

        composeTestRule.onNodeWithTag("badge")
            .assert(SemanticsMatcher.expectValue(LSBadgeBackgroundColorKey, badgeColor("#DBEAF4")))
            .assert(SemanticsMatcher.expectValue(LSBadgeForegroundColorKey, GeneratedTokens.color.Weather.Rain.default))
            .assert(SemanticsMatcher.expectValue(LSBadgeBorderColorKey, expectedBorder))
            .assert(SemanticsMatcher.expectValue(LSBadgeBorderWidthKey, expectedBorderWidth))

        composeTestRule.onNode(SemanticsMatcher.expectValue(LSIconNameKey, IconName.Rain.value))
            .assertWidthIsEqualTo(GeneratedTokens.sizing.icon.xs)
            .assertHeightIsEqualTo(GeneratedTokens.sizing.icon.xs)
            .assert(SemanticsMatcher.expectValue(LSIconColorKey, GeneratedTokens.color.Weather.Rain.default))
    }

    @Test
    fun badge_weather_wind_resolves_tokens_and_icon() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSBadge(
                    label = "GUSTS",
                    variant = BadgeVariant.Weather.Wind,
                    modifier = Modifier.testTag("badge"),
                )
            }
        }

        composeTestRule.onNodeWithTag("badge")
            .assert(SemanticsMatcher.expectValue(LSBadgeBackgroundColorKey, badgeColor("#E1E6EC")))
            .assert(SemanticsMatcher.expectValue(LSBadgeForegroundColorKey, GeneratedTokens.color.Weather.Wind.default))

        composeTestRule.onNode(SemanticsMatcher.expectValue(LSIconNameKey, IconName.Wind.value))
            .assertWidthIsEqualTo(GeneratedTokens.sizing.icon.xs)
            .assertHeightIsEqualTo(GeneratedTokens.sizing.icon.xs)
            .assert(SemanticsMatcher.expectValue(LSIconColorKey, GeneratedTokens.color.Weather.Wind.default))
    }
}
