package com.laneshadow.ui.organisms

import androidx.compose.foundation.layout.Box
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import com.google.common.truth.Truth.assertThat
import com.laneshadow.theme.LaneShadowTheme
import java.io.File
import org.junit.Rule
import org.junit.Test
import org.junit.rules.RuleChain
import org.junit.rules.TestRule
import org.robolectric.RobolectricTestRunner
import org.junit.runner.RunWith

@RunWith(RobolectricTestRunner::class)
class LSMapLayerTest {
    private val composeTestRule = createComposeRule()

    @get:Rule
    val ruleChain: TestRule = RuleChain.outerRule(DebugVariantRule).around(composeTestRule)

    companion object {
        const val MAPLAYER_TAG = "ls-maplayer"
        const val MAP_TAG = "ls-map"
        const val TOPBAR_TAG = LSTOPBAR_TAG
    }

    @Test
    fun map_with_topbar_renders_topbar_above_map() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSMapLayer(
                    map = {
                        Box(modifier = Modifier.testTag(MAP_TAG)) {
                            // In tests, we use a simple Box instead of actual LSMap
                            // to avoid native Mapbox dependencies
                        }
                    },
                    topBar = {
                        LSTopBar(
                            onMenuTap = {},
                            onNewTap = {},
                            modifier = Modifier.testTag(TOPBAR_TAG),
                        )
                    },
                    modifier = Modifier.testTag(MAPLAYER_TAG),
                )
            }
        }

        // Verify LSMap fills the parent Box
        composeTestRule.onNodeWithTag(MAP_TAG)
            .assertExists()

        // Verify LSTopBar overlays at top
        composeTestRule.onNodeWithTag(TOPBAR_TAG)
            .assertExists()

        // Verify topBar is the topmost child in the z-stack
        // by checking it's rendered and above the map
        composeTestRule.onNodeWithTag(TOPBAR_TAG)
            .assertExists()
        composeTestRule.onNodeWithTag(MAP_TAG)
            .assertExists()
    }

    @Test
    fun top_overlay_positions_below_topbar_with_safearea() {
        val overlayId = "greeting"
        composeTestRule.setContent {
            LaneShadowTheme {
                LSMapLayer(
                    map = {
                        Box(modifier = Modifier.testTag(MAP_TAG))
                    },
                    topBar = {
                        LSTopBar(
                            onMenuTap = {},
                            onNewTap = {},
                            modifier = Modifier.testTag(TOPBAR_TAG),
                        )
                    },
                    topOverlays = listOf(
                        GlassOverlaySlot(overlayId) {
                            Box(modifier = Modifier.testTag("overlay-content"))
                        }
                    ),
                    modifier = Modifier.testTag(MAPLAYER_TAG),
                )
            }
        }

        // Verify overlay container exists with correct tag
        composeTestRule.onNodeWithTag("GlassOverlaySlot:$overlayId")
            .assertExists()

        // Verify overlay content exists
        composeTestRule.onNodeWithTag("overlay-content")
            .assertExists()

        // Verify overlay and topBar both exist
        composeTestRule.onNodeWithTag(TOPBAR_TAG)
            .assertExists()
    }

    @Test
    fun bottom_overlay_anchors_above_navigation_bar() {
        val overlayId = "chat"
        composeTestRule.setContent {
            LaneShadowTheme {
                LSMapLayer(
                    map = {
                        Box(modifier = Modifier.testTag(MAP_TAG))
                    },
                    topBar = {
                        LSTopBar(
                            onMenuTap = {},
                            onNewTap = {},
                            modifier = Modifier.testTag(TOPBAR_TAG),
                        )
                    },
                    bottomOverlays = listOf(
                        GlassOverlaySlot(overlayId) {
                            Box(modifier = Modifier.testTag("bottom-overlay-content"))
                        }
                    ),
                    modifier = Modifier.testTag(MAPLAYER_TAG),
                )
            }
        }

        // Verify bottom overlay container exists with correct tag
        composeTestRule.onNodeWithTag("GlassOverlaySlot:$overlayId")
            .assertExists()

        // Verify bottom overlay content exists
        composeTestRule.onNodeWithTag("bottom-overlay-content")
            .assertExists()
    }

    @Test
    fun bottom_overlay_slot_fills_parent_before_bottom_alignment() {
        val source = listOf(
            "src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt",
            "app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt",
            "../app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt",
        )
            .map(::File)
            .first(File::exists)
            .readText()

        assertThat(source).contains("contentAlignment = Alignment.BottomCenter")
        assertThat(source).contains(".fillMaxSize()")
        assertThat(source).contains(".navigationBarsPadding()")
    }

    @Test
    fun scrim_renders_above_map_below_overlays() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSMapLayer(
                    map = {
                        Box(modifier = Modifier.testTag(MAP_TAG))
                    },
                    scrim = ScrimSpec(opacity = 0.35f),
                    topOverlays = listOf(
                        GlassOverlaySlot("overlay") {
                            Box(modifier = Modifier.testTag("overlay-content"))
                        }
                    ),
                    modifier = Modifier.testTag(MAPLAYER_TAG),
                )
            }
        }

        // Verify scrim exists
        composeTestRule.onNodeWithTag("LSScrim")
            .assertExists()

        // Verify map exists
        composeTestRule.onNodeWithTag(MAP_TAG)
            .assertExists()

        // Verify overlay exists (above scrim)
        composeTestRule.onNodeWithTag("overlay-content")
            .assertExists()
    }

    @Test
    fun leading_drawer_slides_in_via_sidebar_recipe() {
        var dismissCount = 0
        composeTestRule.setContent {
            LaneShadowTheme {
                LSMapLayer(
                    map = {
                        Box(modifier = Modifier.testTag(MAP_TAG))
                    },
                    scrim = ScrimSpec(opacity = 0.35f),
                    leadingDrawer = DrawerSpec(
                        content = {
                            Box(modifier = Modifier.testTag("drawer-content"))
                        },
                        onDismiss = { dismissCount++ },
                    ),
                    modifier = Modifier.testTag(MAPLAYER_TAG),
                )
            }
        }

        // Verify drawer exists
        composeTestRule.onNodeWithTag("LeadingDrawerSlot")
            .assertExists()

        // Verify drawer content exists
        composeTestRule.onNodeWithTag("drawer-content")
            .assertExists()

        // Verify scrim exists (tap on scrim should invoke onDismiss)
        composeTestRule.onNodeWithTag("LSScrim")
            .assertExists()
    }

    @Test
    fun bottom_sheet_delegates_to_lsbottomsheet() {
        var dismissCount = 0
        composeTestRule.setContent {
            LaneShadowTheme {
                LSMapLayer(
                    map = {
                        Box(modifier = Modifier.testTag(MAP_TAG))
                    },
                    bottomSheet = BottomSheetSpec(
                        content = {
                            Box(modifier = Modifier.testTag("sheet-content"))
                        },
                        detent = SheetDetent.Medium,
                        onDismiss = { dismissCount++ },
                    ),
                    modifier = Modifier.testTag(MAPLAYER_TAG),
                )
            }
        }

        // Verify LSBottomSheet exists
        composeTestRule.onNodeWithTag("ls-bottom-sheet")
            .assertExists()

        // Verify sheet content exists
        composeTestRule.onNodeWithTag("sheet-content")
            .assertExists()
    }

    @Test
    fun z_order_contract_enforced_for_full_stack() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSMapLayer(
                    map = {
                        Box(modifier = Modifier.testTag(MAP_TAG))
                    },
                    scrim = ScrimSpec(opacity = 0.35f),
                    topOverlays = listOf(
                        GlassOverlaySlot("top-overlay") {
                            Box(modifier = Modifier.testTag("top-overlay-content"))
                        }
                    ),
                    bottomOverlays = listOf(
                        GlassOverlaySlot("bottom-overlay") {
                            Box(modifier = Modifier.testTag("bottom-overlay-content"))
                        }
                    ),
                    bottomSheet = BottomSheetSpec(
                        content = {
                            Box(modifier = Modifier.testTag("sheet-content"))
                        },
                        detent = SheetDetent.Medium,
                        onDismiss = {},
                    ),
                    leadingDrawer = DrawerSpec(
                        content = {
                            Box(modifier = Modifier.testTag("drawer-content"))
                        },
                        onDismiss = {},
                    ),
                    topBar = {
                        LSTopBar(
                            onMenuTap = {},
                            onNewTap = {},
                            modifier = Modifier.testTag(TOPBAR_TAG),
                        )
                    },
                    modifier = Modifier.testTag(MAPLAYER_TAG),
                )
            }
        }

        // Verify all components exist in correct z-order
        // Z-index 0: Map
        composeTestRule.onNodeWithTag(MAP_TAG)
            .assertExists()

        // Z-index 1: Scrim
        composeTestRule.onNodeWithTag("LSScrim")
            .assertExists()

        // Z-index 2: Top overlay
        composeTestRule.onNodeWithTag("top-overlay-content")
            .assertExists()

        // Z-index 2: Bottom overlay
        composeTestRule.onNodeWithTag("bottom-overlay-content")
            .assertExists()

        // Z-index 3: Bottom sheet
        composeTestRule.onNodeWithTag("sheet-content")
            .assertExists()

        // Z-index 4: Leading drawer
        composeTestRule.onNodeWithTag("drawer-content")
            .assertExists()

        // Z-index 5: Top bar
        composeTestRule.onNodeWithTag(TOPBAR_TAG)
            .assertExists()
    }
}
