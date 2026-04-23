package com.laneshadow.ui.atoms

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSTextAreaInstrumentationTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun textarea_auto_grows_then_scrolls_at_maxRows() {
        val overflowingText = (1..8).joinToString("\n") { "Line $it" }

        composeTestRule.setContent {
            LaneShadowTheme {
                LSTextArea(
                    value = overflowingText,
                    onValueChange = {},
                    maxRows = 6,
                    modifier = Modifier.testTag("text-area"),
                )
            }
        }

        composeTestRule.onNodeWithTag("text-area")
            .assert(SemanticsMatcher.expectValue(LSTextAreaVisibleRowsKey, 6))
            .assert(SemanticsMatcher.expectValue(LSTextAreaScrollEnabledKey, true))
    }
}
