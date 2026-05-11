package com.laneshadow.ui.organisms

import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.atoms.LSMapCameraController
import com.laneshadow.ui.atoms.RecenterOutcome
import org.junit.Rule
import org.junit.Test
import org.junit.rules.RuleChain
import org.junit.rules.TestRule
import org.junit.runner.Description
import org.junit.runners.model.Statement
import org.robolectric.RobolectricTestRunner
import org.junit.runner.RunWith
import org.junit.Assert.assertEquals

/**
 * Compose instrumentation tests for recenter button + camera controller integration.
 * Tests AC-3 and AC-5 (recenter with and without location permission).
 */
@RunWith(RobolectricTestRunner::class)
class LSMapRecenterTest {
    private val composeTestRule = createComposeRule()

    @get:Rule
    val ruleChain: TestRule = RuleChain.outerRule(DebugVariantRuleForRecenter).around(composeTestRule)

    @Test
    fun recenter_button_tap_requestsRecenter_withPermissionGranted() {
        var controller: LSMapCameraController? = null
        var recenterHandled = false

        composeTestRule.setContent {
            LaneShadowTheme {
                val localController = remember { LSMapCameraController() }
                controller = localController

                LSMapControls(
                    mode = MapControlsMode.Map,
                    handlers = MapControlsHandlers(
                        onRecenter = {
                            localController.recenterToUserLocation()
                            // Simulate location available
                            recenterHandled = localController.consumePendingRecenterRequest(RecenterOutcome.Applied)
                        },
                        onToggleView = {},
                    ),
                    modifier = Modifier.testTag(LSMAPCONTROLS_TAG),
                )
            }
        }

        // WHEN recenter button is tapped
        composeTestRule.onNodeWithContentDescription("Recenter map").performClick()

        // THEN controller marks recenter as requested and then applied
        assertEquals(1, controller?.recenterRequestCount)
        assertEquals(1, controller?.handledRecenterRequestCount)
        assertEquals(RecenterOutcome.Applied, controller?.lastRecenterOutcome)
        assertEquals(true, recenterHandled)
    }

    @Test
    fun recenter_button_tap_noOp_withPermissionDenied() {
        var controller: LSMapCameraController? = null
        var recenterHandled = false

        composeTestRule.setContent {
            LaneShadowTheme {
                val localController = remember { LSMapCameraController() }
                controller = localController

                LSMapControls(
                    mode = MapControlsMode.Map,
                    handlers = MapControlsHandlers(
                        onRecenter = {
                            localController.recenterToUserLocation()
                            // Simulate no location available (permission denied)
                            recenterHandled = localController.consumePendingRecenterRequest(RecenterOutcome.UnavailableNoUserLocation)
                        },
                        onToggleView = {},
                    ),
                    modifier = Modifier.testTag(LSMAPCONTROLS_TAG),
                )
            }
        }

        // WHEN recenter button is tapped with no permission
        composeTestRule.onNodeWithContentDescription("Recenter map").performClick()

        // THEN controller marks as unavailable (no crash)
        assertEquals(1, controller?.recenterRequestCount)
        assertEquals(1, controller?.handledRecenterRequestCount)
        assertEquals(RecenterOutcome.UnavailableNoUserLocation, controller?.lastRecenterOutcome)
        assertEquals(true, recenterHandled)
    }

    @Test
    fun recenter_request_not_consumed_twice() {
        var controller: LSMapCameraController? = null

        composeTestRule.setContent {
            LaneShadowTheme {
                val localController = remember { LSMapCameraController() }
                controller = localController

                LSMapControls(
                    mode = MapControlsMode.Map,
                    handlers = MapControlsHandlers(
                        onRecenter = {
                            localController.recenterToUserLocation()
                        },
                        onToggleView = {},
                    ),
                    modifier = Modifier.testTag(LSMAPCONTROLS_TAG),
                )
            }
        }

        // WHEN recenter button is tapped
        composeTestRule.onNodeWithContentDescription("Recenter map").performClick()

        // THEN first consume succeeds
        var firstConsume = controller?.consumePendingRecenterRequest(RecenterOutcome.Applied)
        assertEquals(true, firstConsume)

        // BUT second consume fails (already handled)
        var secondConsume = controller?.consumePendingRecenterRequest(RecenterOutcome.Applied)
        assertEquals(false, secondConsume)
    }
}

private object DebugVariantRuleForRecenter : TestRule {
    override fun apply(base: Statement, description: Description): Statement =
        object : Statement() {
            override fun evaluate() {
                // Run test if in debug variant
                base.evaluate()
            }
        }
}
