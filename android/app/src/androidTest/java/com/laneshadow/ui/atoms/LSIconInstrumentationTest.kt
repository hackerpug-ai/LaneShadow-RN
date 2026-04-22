package com.laneshadow.ui.atoms

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHeightIsEqualTo
import androidx.compose.ui.test.assertWidthIsEqualTo
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSIconInstrumentationTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun icon_compass_md_resolves_size_stroke_and_default_color() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSIcon(
                    name = IconName.Compass,
                    modifier = Modifier.testTag("compass-icon"),
                )
            }
        }

        composeTestRule.onNodeWithTag("compass-icon")
            .assertWidthIsEqualTo(GeneratedTokens.sizing.icon.md)
            .assertHeightIsEqualTo(GeneratedTokens.sizing.icon.md)
            .assert(SemanticsMatcher.expectValue(LSIconStrokeWidthKey, GeneratedTokens.icon.stroke.width))
    }

    @Test
    fun icon_color_signal_resolves_color_signal_default() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSIcon(
                    name = IconName.StarFill,
                    color = IconColor.Signal,
                    modifier = Modifier.testTag("signal-icon"),
                )
            }
        }

        composeTestRule.onNodeWithTag("signal-icon")
            .assert(SemanticsMatcher.expectValue(LSIconColorKey, GeneratedTokens.color.Signal.default))
    }
}
