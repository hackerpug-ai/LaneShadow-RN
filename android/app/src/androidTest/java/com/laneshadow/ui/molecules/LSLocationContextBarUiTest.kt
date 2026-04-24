package com.laneshadow.ui.molecules

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.assertHasNoClickAction
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import com.laneshadow.theme.LaneShadowTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class LSLocationContextBarUiTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun mode_pill_tap_fires_on_mode_change_once() {
        var modeChangeCount = 0

        composeTestRule.setContent {
            LaneShadowTheme {
                LSLocationContextBar(
                    location = "Near Santa Cruz, CA",
                    mode = LocationMode.Manual,
                    onModeChange = { modeChangeCount += 1 },
                )
            }
        }

        composeTestRule.onNodeWithTag(LSLocationContextBarModePillTag).performClick()
        composeTestRule.runOnIdle {
            assertEquals(1, modeChangeCount)
        }

        composeTestRule.onNodeWithTag(LSLocationContextBarLocationPillTag).assertHasNoClickAction()
        composeTestRule.runOnIdle {
            assertEquals(1, modeChangeCount)
        }
    }
}
