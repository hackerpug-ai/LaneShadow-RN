package com.laneshadow.ui.atoms

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.assertHeightIsEqualTo
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.LocalLaneShadowTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSPillInstrumentationTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun pill_md_measured_height_matches_sizing_pill_md() {
        var expectedCornerRadius = Dp.Unspecified

        composeTestRule.setContent {
            LaneShadowTheme {
                expectedCornerRadius = LocalLaneShadowTheme.current.radius.full
                LSPill(
                    size = PillSize.Md,
                    modifier = Modifier.testTag("pill"),
                ) {
                    LSText(
                        text = "Tag",
                        variant = TypographyVariant.Ui.Label.Sm,
                        modifier = Modifier.testTag("pill-content"),
                    )
                }
            }
        }

        composeTestRule.onNodeWithTag("pill")
            .assertHeightIsEqualTo(32.dp)
            .assert(SemanticsMatcher.expectValue(LSPillCornerRadiusKey, expectedCornerRadius))
    }

    @Test
    fun pill_sm_measured_height_matches_sizing_pill_sm() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSPill(
                    size = PillSize.Sm,
                    modifier = Modifier.testTag("pill"),
                ) {
                    LSText(
                        text = "Tag",
                        variant = TypographyVariant.Ui.Label.Sm,
                    )
                }
            }
        }

        composeTestRule.onNodeWithTag("pill").assertHeightIsEqualTo(24.dp)
    }

    @Test
    fun pill_lg_measured_height_matches_sizing_pill_lg() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSPill(
                    size = PillSize.Lg,
                    modifier = Modifier.testTag("pill"),
                ) {
                    LSText(
                        text = "Tag",
                        variant = TypographyVariant.Ui.Label.Sm,
                    )
                }
            }
        }

        composeTestRule.onNodeWithTag("pill").assertHeightIsEqualTo(40.dp)
    }

    @Test
    fun pill_custom_padding_overrides_default() {
        val customPadding = PaddingValues(horizontal = 20.dp, vertical = 4.dp)

        composeTestRule.setContent {
            LaneShadowTheme {
                LSPill(
                    size = PillSize.Md,
                    padding = customPadding,
                    modifier = Modifier.testTag("pill"),
                ) {
                    LSText(
                        text = "Tag",
                        variant = TypographyVariant.Ui.Label.Sm,
                        modifier = Modifier.testTag("pill-content"),
                    )
                }
            }
        }

        composeTestRule.onNodeWithTag("pill")
            .assertHeightIsEqualTo(32.dp)
            .assert(SemanticsMatcher.expectValue(LSPillHorizontalPaddingKey, 20.dp))
            .assert(SemanticsMatcher.expectValue(LSPillVerticalPaddingKey, 4.dp))
    }
}
