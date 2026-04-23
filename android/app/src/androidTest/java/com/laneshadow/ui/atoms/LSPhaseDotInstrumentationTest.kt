package com.laneshadow.ui.atoms

import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHeightIsEqualTo
import androidx.compose.ui.test.assertWidthIsEqualTo
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSPhaseDotInstrumentationTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun phaseDot_pending_resolves_border_strong_token() {
        var expectedBorderColor = Color.Transparent

        composeTestRule.setContent {
            LaneShadowTheme {
                expectedBorderColor = LocalLaneShadowTheme.current.colors.border.default
                LSPhaseDot(
                    state = PhaseDotState.Pending,
                    modifier = Modifier.testTag("phase-dot"),
                )
            }
        }

        composeTestRule.onNodeWithTag("phase-dot")
            .assertWidthIsEqualTo(10.dp)
            .assertHeightIsEqualTo(10.dp)
            .assert(SemanticsMatcher.expectValue(LSPhaseDotFillColorKey, Color.Transparent))
            .assert(SemanticsMatcher.expectValue(LSPhaseDotStrokeColorKey, expectedBorderColor))
            .assert(SemanticsMatcher.expectValue(LSPhaseDotStrokeWidthKey, 1.dp))
            .assert(SemanticsMatcher.expectValue(LSPhaseDotAnimatedKey, false))
    }

    @Test
    fun phaseDot_active_filled_signal_with_pulse() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSPhaseDot(
                    state = PhaseDotState.Active,
                    modifier = Modifier.testTag("phase-dot"),
                )
            }
        }

        composeTestRule.onNodeWithTag("phase-dot")
            .assert(SemanticsMatcher.expectValue(LSPhaseDotFillColorKey, GeneratedTokens.color.Signal.default))
            .assert(SemanticsMatcher.expectValue(LSPhaseDotAnimatedKey, true))

        composeTestRule.onNodeWithTag(LSPhaseDotPulseTag)
            .assertExists()
            .assert(SemanticsMatcher.expectValue(LSPhaseDotPulseRecipeKey, PhaseDotPulseRecipePath))
            .assert(
                SemanticsMatcher("pulse scale stays within recipe range") { semantics ->
                    if (!semantics.config.contains(LSPhaseDotPulseScaleKey)) {
                        return@SemanticsMatcher false
                    }
                    val scale = semantics.config[LSPhaseDotPulseScaleKey]
                    scale in 0f..1.5f
                },
            )
            .assert(
                SemanticsMatcher("pulse alpha stays within recipe range") { semantics ->
                    if (!semantics.config.contains(LSPhaseDotPulseAlphaKey)) {
                        return@SemanticsMatcher false
                    }
                    val alpha = semantics.config[LSPhaseDotPulseAlphaKey]
                    alpha in 0f..0.4f
                },
            )
    }

    @Test
    fun phaseDot_done_filled_success_no_animation() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSPhaseDot(
                    state = PhaseDotState.Done,
                    modifier = Modifier.testTag("phase-dot"),
                )
            }
        }

        composeTestRule.onNodeWithTag("phase-dot")
            .assert(SemanticsMatcher.expectValue(LSPhaseDotFillColorKey, GeneratedTokens.color.Status.Success.default))
            .assert(SemanticsMatcher.expectValue(LSPhaseDotStrokeWidthKey, 0.dp))
            .assert(SemanticsMatcher.expectValue(LSPhaseDotAnimatedKey, false))

        composeTestRule.onNodeWithTag(LSPhaseDotPulseTag).assertDoesNotExist()
    }
}
