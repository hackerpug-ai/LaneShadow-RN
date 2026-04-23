package com.laneshadow.ui.atoms

import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.LocalLaneShadowTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSTextFieldInstrumentationTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun focused_state_applies_focused_border_token() {
        var expectedBorderColor = Color.Unspecified

        composeTestRule.setContent {
            LaneShadowTheme {
                expectedBorderColor = resolveLSInputBorderColor(LocalLaneShadowTheme.current, InputState.Focused)
                LSTextField(
                    value = "",
                    onValueChange = {},
                    placeholder = "Where to?",
                    modifier = Modifier.testTag("text-field"),
                )
            }
        }

        composeTestRule.onNodeWithTag("text-field").performClick()

        composeTestRule.onNodeWithTag("text-field")
            .assert(
                SemanticsMatcher.expectValue(
                    LSInputBorderColorKey,
                    expectedBorderColor,
                ),
            )
            .assert(SemanticsMatcher.expectValue(LSInputVisualStateKey, InputState.Focused.name))
    }
}
