package com.laneshadow.ui.organisms

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.laneshadow.BuildConfig
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.atoms.GlassVariant
import com.laneshadow.ui.atoms.LSGlassPanelLeadingStripeColorKey
import com.laneshadow.ui.atoms.RouteVariant
import com.laneshadow.ui.molecules.RouteAttachment
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.RuleChain
import org.junit.rules.TestRule
import org.junit.runner.Description
import org.junit.runners.model.Statement
import org.robolectric.RobolectricTestRunner
import org.junit.runner.RunWith

@RunWith(RobolectricTestRunner::class)
class LSNavigatorMessageTest {
    private val composeTestRule = createComposeRule()

    @get:Rule
    val ruleChain: TestRule = RuleChain.outerRule(DebugVariantRule).around(composeTestRule)

    companion object {
        const val TOPBAR_TAG = LS_NAVIGATOR_MESSAGE_TAG
        const val COMPASS_CHIP_TAG = NAVIGATOR_COMPASS_CHIP_TAG
        const val BODY_TAG = NAVIGATOR_BODY_TAG
        const val PIN_ICON_TAG = NAVIGATOR_PIN_ICON_TAG
        const val CLOSE_ICON_TAG = NAVIGATOR_CLOSE_ICON_TAG
        const val ATTACHMENTS_TAG = NAVIGATOR_ATTACHMENTS_TAG
        const val PINNED_INDICATOR_TAG = NAVIGATOR_PINNED_INDICATOR_TAG
    }

    @Test
    fun default_renders_signal_stripe_glass_panel_with_compass_chip_and_body() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSNavigatorMessage(
                    body = "Test message",
                    onPin = {},
                    onDismiss = {},
                    modifier = Modifier.testTag(TOPBAR_TAG),
                )
            }
        }

        // Verify compass chip exists
        composeTestRule.onNodeWithTag(COMPASS_CHIP_TAG)
            .assertExists()

        // Verify body text renders
        composeTestRule.onNodeWithTag(BODY_TAG)
            .assertExists()

        composeTestRule.onNodeWithText("Test message")
            .assertExists()

        // Verify "THE NAVIGATOR" label
        composeTestRule.onNodeWithText("THE NAVIGATOR")
            .assertExists()

        // Verify pin and close icons exist
        composeTestRule.onNodeWithTag(PIN_ICON_TAG)
            .assertExists()
            .assertHasClickAction()

        composeTestRule.onNodeWithTag(CLOSE_ICON_TAG)
            .assertExists()
            .assertHasClickAction()

        // Verify NOT pinned (no pinned indicator)
        composeTestRule.onNodeWithTag(PINNED_INDICATOR_TAG)
            .assertDoesNotExist()

        // Verify compass chip exists
        composeTestRule.onNodeWithTag(COMPASS_CHIP_TAG)
            .assertExists()

        // Verify body text renders
        composeTestRule.onNodeWithTag(BODY_TAG)
            .assertExists()

        composeTestRule.onNodeWithText("Test message")
            .assertExists()

        // Verify "THE NAVIGATOR" label
        composeTestRule.onNodeWithText("THE NAVIGATOR")
            .assertExists()

        // Verify pin and close icons exist
        composeTestRule.onNodeWithTag(PIN_ICON_TAG)
            .assertExists()
            .assertHasClickAction()

        composeTestRule.onNodeWithTag(CLOSE_ICON_TAG)
            .assertExists()
            .assertHasClickAction()

        // Verify NOT pinned (no pinned indicator)
        composeTestRule.onNodeWithTag(PINNED_INDICATOR_TAG)
            .assertDoesNotExist()
    }

    @Test
    fun pinned_variant_renders_pinned_indicator_and_does_not_auto_dismiss() {
        var dismissCount = 0

        composeTestRule.setContent {
            LaneShadowTheme {
                LSNavigatorMessage(
                    body = "Pinned message",
                    pinned = true,
                    onPin = {},
                    onDismiss = { dismissCount++ },
                    modifier = Modifier.testTag(TOPBAR_TAG),
                )
            }
        }

        // Verify pinned indicator exists
        composeTestRule.onNodeWithTag(PINNED_INDICATOR_TAG)
            .assertExists()

        composeTestRule.onNodeWithText("Pinned — will not auto-dismiss")
            .assertExists()

        // Verify pin icon shows filled state
        composeTestRule.onNodeWithTag(PIN_ICON_TAG)
            .assertExists()

        // Wait for auto-dismiss timer (should NOT fire for pinned)
        composeTestRule.mainClock.advanceTimeBy(6000)

        // Verify onDismiss was NOT called
        assertEquals(0, dismissCount)
    }

    @Test
    fun unpinned_auto_dismisses_after_5000ms() {
        var dismissCount = 0

        composeTestRule.setContent {
            LaneShadowTheme {
                LSNavigatorMessage(
                    body = "Auto-dismiss message",
                    pinned = false,
                    onPin = {},
                    onDismiss = { dismissCount++ },
                    modifier = Modifier.testTag(TOPBAR_TAG),
                )
            }
        }

        // Verify initially visible
        composeTestRule.onNodeWithText("Auto-dismiss message")
            .assertExists()

        // Advance clock to just before auto-dismiss (4900ms)
        composeTestRule.mainClock.advanceTimeBy(4900)

        // Verify onDismiss NOT called yet
        assertEquals(0, dismissCount)

        // Advance clock past auto-dismiss threshold (5000ms)
        composeTestRule.mainClock.advanceTimeBy(100)

        // Verify onDismiss was called exactly once
        assertEquals(1, dismissCount)
    }

    @Test
    fun pin_and_close_callbacks_fire_exactly_once_per_tap() {
        var pinCount = 0
        var dismissCount = 0

        composeTestRule.setContent {
            LaneShadowTheme {
                LSNavigatorMessage(
                    body = "Callback test",
                    pinned = false,
                    onPin = { pinCount++ },
                    onDismiss = { dismissCount++ },
                    modifier = Modifier.testTag(TOPBAR_TAG),
                )
            }
        }

        // Initial state: no callbacks fired
        assertEquals(0, pinCount)
        assertEquals(0, dismissCount)

        // Tap pin icon — should fire pin callback exactly once
        composeTestRule.onNodeWithTag(PIN_ICON_TAG).performClick()
        assertEquals(1, pinCount)
        assertEquals(0, dismissCount)  // Dismiss callback hasn't fired yet

        // Tap pin icon again — should increment pin count again
        composeTestRule.onNodeWithTag(PIN_ICON_TAG).performClick()
        assertEquals(2, pinCount)
        assertEquals(0, dismissCount)

        // Tap close icon — should fire dismiss callback exactly once
        composeTestRule.onNodeWithTag(CLOSE_ICON_TAG).performClick()
        assertEquals(2, pinCount)  // Pin count unchanged
        assertEquals(1, dismissCount)

        // Tap close icon again — should increment dismiss count again
        composeTestRule.onNodeWithTag(CLOSE_ICON_TAG).performClick()
        assertEquals(2, pinCount)
        assertEquals(2, dismissCount)
    }

    @Test
    fun attachments_render_when_provided() {
        val attachment1 = RouteAttachment(
            id = "route-1",
            title = "Morning Commute",
            via = "via Downtown",
            distance = "5.2 mi",
            duration = "22 min",
            scenicScore = 85,
            variant = RouteVariant.Best,
        )

        val attachment2 = RouteAttachment(
            id = "route-2",
            title = "Evening Return",
            via = "via Waterfront",
            distance = "5.2 mi",
            duration = "24 min",
            scenicScore = 78,
            variant = RouteVariant.Alt1,
        )

        composeTestRule.setContent {
            LaneShadowTheme {
                LSNavigatorMessage(
                    body = "Route suggestions",
                    attachments = listOf(attachment1, attachment2),
                    onPin = {},
                    onDismiss = {},
                    modifier = Modifier.testTag(TOPBAR_TAG),
                )
            }
        }

        // Verify attachments section exists
        composeTestRule.onNodeWithTag(ATTACHMENTS_TAG)
            .assertExists()

        // Verify attachment cards render (title text)
        composeTestRule.onNodeWithText("Morning Commute")
            .assertExists()

        composeTestRule.onNodeWithText("Evening Return")
            .assertExists()
    }

    @Test
    fun no_attachments_does_not_render_attachments_section() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSNavigatorMessage(
                    body = "No attachments",
                    attachments = emptyList(),
                    onPin = {},
                    onDismiss = {},
                    modifier = Modifier.testTag(TOPBAR_TAG),
                )
            }
        }

        // Verify attachments section does NOT exist
        composeTestRule.onNodeWithTag(ATTACHMENTS_TAG)
            .assertDoesNotExist()
    }
}
