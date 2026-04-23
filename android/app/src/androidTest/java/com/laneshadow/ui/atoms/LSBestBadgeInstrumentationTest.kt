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
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSBestBadgeInstrumentationTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun bestBadge_resolves_signal_tokens_and_filled_star() {
        var expectedForeground = GeneratedTokens.color.Signal.default

        composeTestRule.setContent {
            LaneShadowTheme {
                expectedForeground = LocalLaneShadowTheme.current.content.onSignal
                LSBestBadge(modifier = Modifier.testTag("badge"))
            }
        }

        composeTestRule.onNodeWithTag("badge")
            .assert(SemanticsMatcher.expectValue(LSBadgeBackgroundColorKey, GeneratedTokens.color.Signal.default))
            .assert(SemanticsMatcher.expectValue(LSBadgeForegroundColorKey, expectedForeground))

        composeTestRule.onNode(SemanticsMatcher.expectValue(LSIconNameKey, IconName.StarFill.value))
            .assertWidthIsEqualTo(GeneratedTokens.sizing.icon.xs)
            .assertHeightIsEqualTo(GeneratedTokens.sizing.icon.xs)
            .assert(SemanticsMatcher.expectValue(LSIconColorKey, GeneratedTokens.color.Signal.default))
    }
}
