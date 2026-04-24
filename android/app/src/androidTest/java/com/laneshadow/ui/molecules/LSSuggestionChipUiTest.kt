package com.laneshadow.ui.molecules

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.assertHeightIsEqualTo
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSSuggestionChipUiTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun on_tap_fires_exactly_once() {
        var tapCount = 0

        composeTestRule.setContent {
            LaneShadowTheme {
                LSSuggestionChip(
                    label = "Twisty back roads",
                    onTap = { tapCount += 1 },
                    modifier = Modifier.testTag("suggestion-chip"),
                )
            }
        }

        composeTestRule.onNodeWithTag("suggestion-chip")
            .assertHeightIsEqualTo(32.dp)
            .performClick()

        composeTestRule.runOnIdle {
            assertEquals(1, tapCount)
        }
    }
}
