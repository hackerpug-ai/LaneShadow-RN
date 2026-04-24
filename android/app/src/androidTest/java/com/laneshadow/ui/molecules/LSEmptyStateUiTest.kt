package com.laneshadow.ui.molecules

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class LSEmptyStateUiTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun action_button_fires_callback_once() {
        var clickCount = 0

        composeTestRule.setContent {
            LaneShadowTheme {
                LSEmptyState(
                    icon = IconName.Pin,
                    title = "No rides yet",
                    body = "Record your first ride.",
                    actionText = "Get Started",
                    onAction = { clickCount++ },
                )
            }
        }

        // Initially, no clicks
        assertEquals(0, clickCount)

        // Click the action button
        composeTestRule
            .onNodeWithText("Get Started")
            .performClick()

        // Callback should fire exactly once
        assertEquals(1, clickCount)
    }
}
