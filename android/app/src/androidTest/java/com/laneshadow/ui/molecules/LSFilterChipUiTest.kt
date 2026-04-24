package com.laneshadow.ui.molecules

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSFilterChipUiTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun on_toggle_fires_exactly_once() {
        var toggleCount = 0

        composeTestRule.setContent {
            LaneShadowTheme {
                LSFilterChip(
                    label = "Scenic",
                    selected = false,
                    onToggle = { toggleCount += 1 },
                    modifier = Modifier.testTag("filter-chip"),
                )
            }
        }

        composeTestRule.onNodeWithTag("filter-chip").performClick()

        composeTestRule.runOnIdle {
            assertEquals(1, toggleCount)
        }
    }
}
