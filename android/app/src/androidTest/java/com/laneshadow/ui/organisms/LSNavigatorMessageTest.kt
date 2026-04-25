package com.laneshadow.ui.organisms

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.RouteVariant
import com.laneshadow.ui.molecules.RouteAttachment
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSNavigatorMessageTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    // Test tags
    companion object {
        const val NAVIGATOR_MESSAGE_TAG = "ls-navigator-message"
        const val NAVIGATOR_COMPASS_CHIP_TAG = "navigator-compass-chip"
        const val NAVIGATOR_BODY_TAG = "navigator-body"
        const val NAVIGATOR_PIN_ICON_TAG = "navigator-pin-icon"
        const val NAVIGATOR_CLOSE_ICON_TAG = "navigator-close-icon"
        const val NAVIGATOR_ATTACHMENTS_TAG = "navigator-attachments"
    }

    @Test
    fun renders_signal_callout_with_compass_label_body_and_attachments() {
        val attachments = listOf(
            RouteAttachment(
                id = "route-1",
                title = "The Skyline Spine",
                via = "via Kings Mountain Rd",
                distance = "47 mi",
                duration = "1h 22m",
                scenicScore = 4,
                variant = RouteVariant.Best,
                isBest = true,
            ),
            RouteAttachment(
                id = "route-2",
                title = "Old La Honda",
                via = "via Page Mill Rd",
                distance = "38 mi",
                duration = "1h 05m",
                scenicScore = 3,
                variant = RouteVariant.Alt1,
            ),
            RouteAttachment(
                id = "route-3",
                title = "Coastal Connector",
                via = "via Hwy 1",
                distance = "52 mi",
                duration = "1h 35m",
                scenicScore = 2,
                variant = RouteVariant.Alt2,
            ),
        )

        composeTestRule.setContent {
            LaneShadowTheme {
                LSNavigatorMessage(
                    body = "Take 280 south to 92 east, then Skyline. Best window closes at 3pm.",
                    attachments = attachments,
                    pinned = true,
                    onPin = {},
                    onDismiss = {},
                )
            }
        }

        // Verify compass chip is displayed
        composeTestRule.onNodeWithTag(NAVIGATOR_COMPASS_CHIP_TAG)
            .assertIsDisplayed()

        // Verify "THE NAVIGATOR" label is displayed
        composeTestRule.onNodeWithText("THE NAVIGATOR")
            .assertIsDisplayed()

        // Verify body text is displayed
        composeTestRule.onNodeWithTag(NAVIGATOR_BODY_TAG)
            .assertIsDisplayed()

        composeTestRule.onNodeWithText("Take 280 south to 92 east, then Skyline. Best window closes at 3pm.")
            .assertIsDisplayed()

        // Verify attachments container is displayed
        composeTestRule.onNodeWithTag(NAVIGATOR_ATTACHMENTS_TAG)
            .assertIsDisplayed()

        // Verify all three route titles are displayed
        composeTestRule.onNodeWithText("The Skyline Spine")
            .assertIsDisplayed()
        composeTestRule.onNodeWithText("Old La Honda")
            .assertIsDisplayed()
        composeTestRule.onNodeWithText("Coastal Connector")
            .assertIsDisplayed()

        // Verify pin icon is displayed (pinned = true)
        composeTestRule.onNodeWithTag(NAVIGATOR_PIN_ICON_TAG)
            .assertIsDisplayed()

        // Verify close icon is displayed
        composeTestRule.onNodeWithTag(NAVIGATOR_CLOSE_ICON_TAG)
            .assertIsDisplayed()
    }
}
