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
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.RuleChain
import org.junit.rules.TestRule
import org.robolectric.RobolectricTestRunner
import org.junit.runner.RunWith

@RunWith(RobolectricTestRunner::class)
class LSMapControlsTest {
    private val composeTestRule = createComposeRule()

    @get:Rule
    val ruleChain: TestRule = RuleChain.outerRule(DebugVariantRule).around(composeTestRule)

    @Test
    fun map_mode_no_route_renders_four_chip_groups() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSMapControls(
                    mode = MapControlsMode.Map,
                    handlers = MapControlsHandlers(
                        onZoomIn = {},
                        onZoomOut = {},
                        onRecenter = {},
                        onClear = {},
                        onToggleView = {},
                    ),
                    hasRouteToSave = false,
                    isSavedRoute = false,
                    modifier = Modifier.testTag(LSMAPCONTROLS_TAG),
                )
            }
        }

        // Verify zoom cluster exists
        composeTestRule.onNodeWithTag(LSMAPCONTROLS_ZOOM_CLUSTER_TAG).assertExists()

        // Verify zoom in and zoom out both exist within the cluster
        composeTestRule.onNodeWithContentDescription("Zoom in").assertExists()
        composeTestRule.onNodeWithContentDescription("Zoom out").assertExists()

        // Verify individual chips exist
        composeTestRule.onNodeWithContentDescription("Recenter map").assertExists()
        composeTestRule.onNodeWithContentDescription("Reset map state").assertExists()
        composeTestRule.onNodeWithContentDescription("Open chat").assertExists()

        // Verify save chip does NOT exist
        composeTestRule.onNodeWithContentDescription("Save route").assertDoesNotExist()
        composeTestRule.onNodeWithContentDescription("Saved route").assertDoesNotExist()
    }

    @Test
    fun map_mode_with_route_renders_save_chip() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSMapControls(
                    mode = MapControlsMode.Map,
                    handlers = MapControlsHandlers(
                        onZoomIn = {},
                        onZoomOut = {},
                        onRecenter = {},
                        onClear = {},
                        onSaveRoute = {},
                        onToggleView = {},
                    ),
                    hasRouteToSave = true,
                    isSavedRoute = false,
                    modifier = Modifier.testTag(LSMAPCONTROLS_TAG),
                )
            }
        }

        // Verify save chip exists with correct description
        composeTestRule.onNodeWithContentDescription("Save route").assertExists()
    }

    @Test
    fun map_mode_places_zoom_cluster_last() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSMapControls(
                    mode = MapControlsMode.Map,
                    handlers = MapControlsHandlers(
                        onZoomIn = {},
                        onZoomOut = {},
                        onRecenter = {},
                        onClear = {},
                        onToggleView = {},
                    ),
                    modifier = Modifier.testTag(LSMAPCONTROLS_TAG),
                )
            }
        }

        assertNodeIsBelow(
            upperTag = LSMAPCONTROLS_TOGGLE_TAG,
            lowerTag = LSMAPCONTROLS_ZOOM_CLUSTER_TAG,
        )
    }

    @Test
    fun save_chip_stays_above_bottom_zoom_cluster() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSMapControls(
                    mode = MapControlsMode.Map,
                    handlers = MapControlsHandlers(
                        onZoomIn = {},
                        onZoomOut = {},
                        onRecenter = {},
                        onClear = {},
                        onSaveRoute = {},
                        onToggleView = {},
                    ),
                    hasRouteToSave = true,
                    modifier = Modifier.testTag(LSMAPCONTROLS_TAG),
                )
            }
        }

        assertNodeIsBelow(
            upperTag = LSMAPCONTROLS_SAVE_TAG,
            lowerTag = LSMAPCONTROLS_TOGGLE_TAG,
        )
        assertNodeIsBelow(
            upperTag = LSMAPCONTROLS_TOGGLE_TAG,
            lowerTag = LSMAPCONTROLS_ZOOM_CLUSTER_TAG,
        )
    }

    @Test
    fun zoom_cluster_remains_vertical_and_accessible() {
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

        composeTestRule.onNodeWithTag(LSMAPCONTROLS_ZOOM_CLUSTER_TAG).assertExists()
        composeTestRule.onNodeWithTag(LSMAPCONTROLS_ZOOM_IN_TAG).assertExists()
        composeTestRule.onNodeWithTag(LSMAPCONTROLS_ZOOM_OUT_TAG).assertExists()
        composeTestRule.onNodeWithContentDescription("Zoom in").assertExists()
        composeTestRule.onNodeWithContentDescription("Zoom out").assertExists()

        assertNodeIsBelow(
            upperTag = LSMAPCONTROLS_ZOOM_IN_TAG,
            lowerTag = LSMAPCONTROLS_ZOOM_OUT_TAG,
        )
    }

    @Test
    fun chat_mode_remains_toggle_only() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSMapControls(
                    mode = MapControlsMode.Chat,
                    handlers = MapControlsHandlers(onToggleView = {}),
                    modifier = Modifier.testTag(LSMAPCONTROLS_TAG),
                )
            }
        }

        composeTestRule.onNodeWithTag(LSMAPCONTROLS_TOGGLE_TAG).assertExists()
        composeTestRule.onNodeWithTag(LSMAPCONTROLS_ZOOM_CLUSTER_TAG).assertDoesNotExist()
        composeTestRule.onNodeWithTag(LSMAPCONTROLS_RECENTER_TAG).assertDoesNotExist()
        composeTestRule.onNodeWithTag(LSMAPCONTROLS_LAYERS_TAG).assertDoesNotExist()
        composeTestRule.onNodeWithTag(LSMAPCONTROLS_SAVE_TAG).assertDoesNotExist()
    }

    @Test
    fun test_isSavedRoute_usesSignalDefaultToken() {
        val source = File("../app/src/main/java/com/laneshadow/ui/organisms/LSMapControls.kt").readText()

        assertTrue(source.contains("LaneShadowTheme.color.Signal.default"))
        assertFalse(source.contains("theme.colors.accent.default  // copper signal color for saved state"))

        composeTestRule.setContent {
            LaneShadowTheme {
                LSMapControls(
                    mode = MapControlsMode.Map,
                    handlers = MapControlsHandlers(
                        onZoomIn = {},
                        onZoomOut = {},
                        onRecenter = {},
                        onClear = {},
                        onSaveRoute = {},
                        onToggleView = {},
                    ),
                    hasRouteToSave = true,
                    isSavedRoute = true,
                    modifier = Modifier.testTag(LSMAPCONTROLS_TAG),
                )
            }
        }

        composeTestRule.onNodeWithContentDescription("Saved route").assertExists()
        composeTestRule.onNodeWithContentDescription("Save route").assertDoesNotExist()
    }

    @Test
    fun chat_mode_collapses_to_single_map_toggle() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSMapControls(
                    mode = MapControlsMode.Chat,
                    handlers = MapControlsHandlers(
                        onToggleView = {},
                    ),
                    modifier = Modifier.testTag(LSMAPCONTROLS_TAG),
                )
            }
        }

        // Verify only the map toggle chip exists
        composeTestRule.onNodeWithContentDescription("Back to map").assertExists()

        // Verify zoom, recenter, layers, save do NOT exist
        composeTestRule.onNodeWithContentDescription("Zoom in").assertDoesNotExist()
        composeTestRule.onNodeWithContentDescription("Zoom out").assertDoesNotExist()
        composeTestRule.onNodeWithContentDescription("Recenter map").assertDoesNotExist()
        composeTestRule.onNodeWithContentDescription("Reset map state").assertDoesNotExist()
        composeTestRule.onNodeWithContentDescription("Save route").assertDoesNotExist()
    }

    @Test
    fun handler_taps_invoke_lambdas_once() {
        var zoomInCount = 0
        var zoomOutCount = 0
        var recenterCount = 0
        var clearCount = 0
        var saveCount = 0
        var toggleCount = 0

        composeTestRule.setContent {
            LaneShadowTheme {
                LSMapControls(
                    mode = MapControlsMode.Map,
                    handlers = MapControlsHandlers(
                        onZoomIn = { zoomInCount++ },
                        onZoomOut = { zoomOutCount++ },
                        onRecenter = { recenterCount++ },
                        onClear = { clearCount++ },
                        onSaveRoute = { saveCount++ },
                        onToggleView = { toggleCount++ },
                    ),
                    hasRouteToSave = true,
                    isSavedRoute = false,
                    modifier = Modifier.testTag(LSMAPCONTROLS_TAG),
                )
            }
        }

        // Tap zoom in
        composeTestRule.onNodeWithContentDescription("Zoom in").performClick()
        assertEquals(1, zoomInCount)

        // Tap zoom out
        composeTestRule.onNodeWithContentDescription("Zoom out").performClick()
        assertEquals(1, zoomOutCount)

        // Tap recenter
        composeTestRule.onNodeWithContentDescription("Recenter map").performClick()
        assertEquals(1, recenterCount)

        // Tap layers
        composeTestRule.onNodeWithContentDescription("Reset map state").performClick()
        assertEquals(1, clearCount)

        // Tap save
        composeTestRule.onNodeWithContentDescription("Save route").performClick()
        assertEquals(1, saveCount)

        // Tap toggle
        composeTestRule.onNodeWithContentDescription("Open chat").performClick()
        assertEquals(1, toggleCount)
    }

    @Test
    fun theme_toggle_reresolves_without_remount() {
        var darkTheme by mutableStateOf(false)

        composeTestRule.setContent {
            LaneShadowTheme(darkTheme = darkTheme) {
                LSMapControls(
                    mode = MapControlsMode.Map,
                    handlers = MapControlsHandlers(
                        onZoomIn = {},
                        onZoomOut = {},
                        onRecenter = {},
                        onClear = {},
                        onSaveRoute = {},
                        onToggleView = {},
                    ),
                    hasRouteToSave = true,
                    isSavedRoute = true,
                    modifier = Modifier.testTag(LSMAPCONTROLS_TAG),
                )
            }
        }

        // Verify saved route chip exists in light theme
        composeTestRule.onNodeWithContentDescription("Saved route").assertExists()
        composeTestRule.onNodeWithTag(LSMAPCONTROLS_SAVE_TAG).assertExists()

        // Capture the instance ID before theme switch
        val lightNode = composeTestRule
            .onNodeWithTag(LSMAPCONTROLS_TAG)
            .fetchSemanticsNode()
        val instanceId = lightNode.config[LSMapControlsInstanceIdKey]

        // === FLIP THE THEME ===
        composeTestRule.runOnIdle { darkTheme = true }

        // Verify the instance ID is stable (composable not remounted)
        val darkNode = composeTestRule
            .onNodeWithTag(LSMAPCONTROLS_TAG)
            .fetchSemanticsNode()
        assertThat(darkNode.config[LSMapControlsInstanceIdKey]).isEqualTo(instanceId)

        // Verify the saved route chip still renders after theme switch
        composeTestRule.onNodeWithContentDescription("Saved route").assertExists()
        composeTestRule.onNodeWithTag(LSMAPCONTROLS_SAVE_TAG).assertExists()

        // Verify all other chips still render correctly
        composeTestRule.onNodeWithTag(LSMAPCONTROLS_ZOOM_CLUSTER_TAG).assertExists()
        composeTestRule.onNodeWithContentDescription("Recenter map").assertExists()
        composeTestRule.onNodeWithContentDescription("Reset map state").assertExists()
        composeTestRule.onNodeWithContentDescription("Open chat").assertExists()
    }

    private fun assertNodeIsBelow(upperTag: String, lowerTag: String) {
        val upperBounds = composeTestRule.onNodeWithTag(upperTag, useUnmergedTree = true)
            .fetchSemanticsNode().boundsInRoot
        val lowerBounds = composeTestRule.onNodeWithTag(lowerTag, useUnmergedTree = true)
            .fetchSemanticsNode().boundsInRoot

        assertTrue(
            "Expected $lowerTag to render below $upperTag but bounds were $upperBounds and $lowerBounds",
            lowerBounds.center.y > upperBounds.center.y,
        )
    }
}
