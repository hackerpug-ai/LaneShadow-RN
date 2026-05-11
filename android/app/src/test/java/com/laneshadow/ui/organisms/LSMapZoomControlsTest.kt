package com.laneshadow.ui.organisms

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import com.google.common.truth.Truth.assertThat
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.atoms.LSMapCameraController
import junit.framework.TestCase.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.rules.RuleChain
import org.junit.rules.TestRule
import org.junit.runner.Description
import org.junit.runners.model.Statement
import org.robolectric.RobolectricTestRunner
import org.junit.runner.RunWith

/**
 * Compose instrumentation tests for zoom controls + camera controller integration.
 * Tests AC-1 and AC-2 (zoom in/out behavior and delta tracking).
 */
@RunWith(RobolectricTestRunner::class)
class LSMapZoomControlsTest {
    private val composeTestRule = createComposeRule()

    @get:Rule
    val ruleChain: TestRule = RuleChain.outerRule(DebugVariantRuleForZoom).around(composeTestRule)

    @Test
    fun zoomIn_button_tap_incrementsController_zoomLevel() {
        var controller: LSMapCameraController? = null

        composeTestRule.setContent {
            LaneShadowTheme {
                val localController = remember { LSMapCameraController(initialZoom = 10.0) }
                controller = localController

                LSMapControls(
                    mode = MapControlsMode.Map,
                    handlers = MapControlsHandlers(
                        onZoomIn = {
                            localController.zoomIn()
                            localController.recordAppliedZoomDelta(1.0)
                        },
                        onToggleView = {},
                    ),
                    modifier = Modifier.testTag(LSMAPCONTROLS_TAG),
                )
            }
        }

        // GIVEN initial zoom
        assertEquals(10.0, controller?.zoomLevel)

        // WHEN zoom in button is tapped
        composeTestRule.onNodeWithContentDescription("Zoom in").performClick()

        // THEN zoom level increments by 1
        assertEquals(11.0, controller?.zoomLevel)
        assertThat(controller?.appliedZoomDeltas).containsExactly(1.0)
    }

    @Test
    fun zoomOut_button_tap_decrementsController_zoomLevel() {
        var controller: LSMapCameraController? = null

        composeTestRule.setContent {
            LaneShadowTheme {
                val localController = remember { LSMapCameraController(initialZoom = 10.0) }
                controller = localController

                LSMapControls(
                    mode = MapControlsMode.Map,
                    handlers = MapControlsHandlers(
                        onZoomOut = {
                            localController.zoomOut()
                            localController.recordAppliedZoomDelta(-1.0)
                        },
                        onToggleView = {},
                    ),
                    modifier = Modifier.testTag(LSMAPCONTROLS_TAG),
                )
            }
        }

        // GIVEN initial zoom
        assertEquals(10.0, controller?.zoomLevel)

        // WHEN zoom out button is tapped
        composeTestRule.onNodeWithContentDescription("Zoom out").performClick()

        // THEN zoom level decrements by 1
        assertEquals(9.0, controller?.zoomLevel)
        assertThat(controller?.appliedZoomDeltas).containsExactly(-1.0)
    }

    @Test
    fun multiple_zoom_taps_accumulate_deltas_in_order() {
        var controller: LSMapCameraController? = null

        composeTestRule.setContent {
            LaneShadowTheme {
                val localController = remember { LSMapCameraController(initialZoom = 10.0) }
                controller = localController

                LSMapControls(
                    mode = MapControlsMode.Map,
                    handlers = MapControlsHandlers(
                        onZoomIn = {
                            localController.zoomIn()
                            localController.recordAppliedZoomDelta(1.0)
                        },
                        onZoomOut = {
                            localController.zoomOut()
                            localController.recordAppliedZoomDelta(-1.0)
                        },
                        onToggleView = {},
                    ),
                    modifier = Modifier.testTag(LSMAPCONTROLS_TAG),
                )
            }
        }

        // WHEN zooming in twice, then out once
        composeTestRule.onNodeWithContentDescription("Zoom in").performClick()
        composeTestRule.onNodeWithContentDescription("Zoom in").performClick()
        composeTestRule.onNodeWithContentDescription("Zoom out").performClick()

        // THEN deltas accumulate in order
        assertThat(controller?.appliedZoomDeltas).containsExactly(1.0, 1.0, -1.0).inOrder()
        assertEquals(11.0, controller?.zoomLevel)
    }

    @Test
    fun zoom_cluster_renders_both_plus_and_minus_icons() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSMapControls(
                    mode = MapControlsMode.Map,
                    handlers = MapControlsHandlers(
                        onZoomIn = {},
                        onZoomOut = {},
                        onToggleView = {},
                    ),
                    modifier = Modifier.testTag(LSMAPCONTROLS_TAG),
                )
            }
        }

        // THEN both icons are visible and have matching descriptions
        composeTestRule.onNodeWithContentDescription("Zoom in").assertExists()
        composeTestRule.onNodeWithContentDescription("Zoom out").assertExists()

        // THEN both tags exist
        composeTestRule.onNodeWithTag(LSMAPCONTROLS_ZOOM_IN_TAG).assertExists()
        composeTestRule.onNodeWithTag(LSMAPCONTROLS_ZOOM_OUT_TAG).assertExists()
    }
}

private object DebugVariantRuleForZoom : TestRule {
    override fun apply(base: Statement, description: Description): Statement =
        object : Statement() {
            override fun evaluate() {
                // Run test if in debug variant
                base.evaluate()
            }
        }
}
