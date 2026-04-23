package com.laneshadow.ui.atoms

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSGlassPanelInstrumentationTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun glasspanel_chrome_resolves_glass_tokens_and_applies_blur() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSGlassPanel(
                    variant = GlassVariant.Chrome,
                    modifier = Modifier.testTag("glass-panel"),
                ) {}
            }
        }

        composeTestRule.onNodeWithTag("glass-panel")
            .assert(SemanticsMatcher.expectValue(LSGlassPanelBackgroundColorKey, GeneratedTokens.color.Surface.glass))
            .assert(SemanticsMatcher.expectValue(LSGlassPanelCornerRadiusKey, 20.dp))
            .assert(SemanticsMatcher.expectValue(LSGlassPanelBlurRadiusKey, 13.dp))
            .assert(SemanticsMatcher.expectValue(LSGlassPanelBlurStrategyKey, resolveGlassBlurStrategy(android.os.Build.VERSION.SDK_INT).name))
    }

    @Test
    fun glasspanel_falls_back_gracefully_on_api_below_31() {
        org.junit.Assert.assertEquals(GlassBlurStrategy.ModifierBlur, resolveGlassBlurStrategy(30))
    }
}
