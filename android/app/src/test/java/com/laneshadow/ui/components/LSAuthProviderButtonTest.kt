package com.laneshadow.ui.components

import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.Column
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.LSButtonBackgroundColorKey
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class LSAuthProviderButtonTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun auth_provider_button_exposes_provider_specific_accessibility_and_style_contract() {
        var googleClicks = 0
        var appleClicks = 0

        composeTestRule.setContent {
            LaneShadowTheme {
                Column {
                    LSAuthProviderButton(
                        provider = AuthProvider.Google,
                        onClick = { googleClicks += 1 },
                        modifier = Modifier.testTag("google-provider"),
                    )
                    LSAuthProviderButton(
                        provider = AuthProvider.Apple,
                        onClick = { appleClicks += 1 },
                        modifier = Modifier.testTag("apple-provider"),
                    )
                }
            }
        }

        composeTestRule.onNodeWithTag("google-provider")
            .assertIsDisplayed()
            .assertHasClickAction()
            .assert(
                SemanticsMatcher.expectValue(
                    LSButtonBackgroundColorKey,
                    GeneratedTokens.color.Action.Secondary.default,
                ),
            )
            .performClick()
        composeTestRule.onNodeWithContentDescription("Continue with Google").assertIsDisplayed()

        composeTestRule.onNodeWithTag("apple-provider")
            .assertIsDisplayed()
            .assertHasClickAction()
            .assert(
                SemanticsMatcher.expectValue(
                    LSButtonBackgroundColorKey,
                    GeneratedTokens.color.Action.Primary.default,
                ),
            )
            .performClick()
        composeTestRule.onNodeWithContentDescription("Continue with Apple").assertIsDisplayed()

        composeTestRule.waitForIdle()
        assertEquals(1, googleClicks)
        assertEquals(1, appleClicks)
    }
}
