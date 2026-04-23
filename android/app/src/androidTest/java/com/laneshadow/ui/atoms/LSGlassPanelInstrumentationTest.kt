package com.laneshadow.ui.atoms

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSGlassPanelInstrumentationTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun glasspanel_chrome_resolves_glass_tokens_and_applies_blur() {
        var expectedBackgroundColor = Color.Unspecified
        composeTestRule.setContent {
            LaneShadowTheme {
                val theme = com.laneshadow.theme.LocalLaneShadowTheme.current
                expectedBackgroundColor = theme.colors.card.default.copy(alpha = 0.72f)
                LSGlassPanelBackdrop {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.verticalGradient(
                                    colors = listOf(
                                        theme.colors.surface.default,
                                        theme.colors.card.default,
                                        theme.colors.secondaryContainer.default,
                                    ),
                                ),
                            ),
                    ) {
                        LSGlassPanel(
                            variant = GlassVariant.Chrome,
                            modifier = Modifier.testTag("glass-panel"),
                        ) {}
                    }
                }
            }
        }

        composeTestRule.onNodeWithTag("glass-panel")
            .assert(SemanticsMatcher.expectValue(LSGlassPanelBackgroundColorKey, expectedBackgroundColor))
            .assert(SemanticsMatcher.expectValue(LSGlassPanelCornerRadiusKey, 20.dp))
            .assert(SemanticsMatcher.expectValue(LSGlassPanelBlurRadiusKey, 13.dp))
            .assert(SemanticsMatcher.expectValue(LSGlassPanelBlurStrategyKey, GlassBlurStrategy.HazeBackdrop.name))
    }

    @Test
    fun glasspanel_falls_back_gracefully_on_api_below_31() {
        org.junit.Assert.assertEquals(GlassBlurStrategy.ModifierBlur, resolveGlassBlurStrategy(30))
    }
}
