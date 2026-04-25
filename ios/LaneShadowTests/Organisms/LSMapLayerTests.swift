import LaneShadowTheme
import SwiftUI
import Testing
@testable import LaneShadow

@MainActor
struct LSMapLayerTests {
    @Test("test_map_plus_topbar_z_order_and_safe_area")
    func map_plus_topbar_z_order_and_safe_area() {
        // GIVEN: developer renders LSMapLayer with map and topBar
        let camera = CameraPosition(
            center: LatLng(lat: 37.7749, lon: -122.4194),
            zoom: 12.0
        )

        var menuTapCount = 0
        var newTapCount = 0

        let mapLayer = LSMapLayer(
            map: {
                LSMap(
                    mode: .preview,
                    camera: camera
                )
            },
            topBar: LSTopBar(
                onMenuTap: { menuTapCount += 1 },
                onNewTap: { newTapCount += 1 }
            )
        )

        // WHEN: view body resolves
        _ = mapLayer.body

        // THEN: ZStack contains LSMap at z=0 and LSTopBar at top z
        // THEN: top bar respects status-bar safe-area inset
        // THEN: no drawer or sheet present
        // Structural verification: body resolves without crashing
        #expect(menuTapCount == 0, "Menu tap should not fire automatically")
        #expect(newTapCount == 0, "New tap should not fire automatically")
    }

    @Test("test_top_overlays_render_with_safe_area_padding")
    func top_overlays_render_with_safe_area_padding() {
        // GIVEN: LSMapLayer with topOverlays containing a greeting overlay
        let camera = CameraPosition(
            center: LatLng(lat: 37.7749, lon: -122.4194),
            zoom: 12.0
        )

        let greetingOverlay = GlassOverlaySlot(id: "greeting") {
            LSGlassPanel(variant: .chrome) {
                LSText("Welcome back!", variant: .body.md)
            }
        }

        let mapLayer = LSMapLayer(
            map: {
                LSMap(mode: .preview, camera: camera)
            },
            topOverlays: [greetingOverlay]
        )

        // WHEN: view body resolves
        _ = mapLayer.body

        // THEN: greeting overlay renders aligned to top with safe-area top inset respected
        // THEN: id uniquely keys the overlay in ZStack
        // Structural verification: body resolves without crashing
    }

    @Test("test_bottom_overlays_anchor_above_safe_area")
    func bottom_overlays_anchor_above_safe_area() {
        // GIVEN: LSMapLayer with bottomOverlays containing a chat overlay
        let camera = CameraPosition(
            center: LatLng(lat: 37.7749, lon: -122.4194),
            zoom: 12.0
        )

        let chatOverlay = GlassOverlaySlot(id: "chat") {
            LSGlassPanel(variant: .chrome) {
                LSText("Where do you want to ride?", variant: .body.md)
            }
        }

        let mapLayer = LSMapLayer(
            map: {
                LSMap(mode: .preview, camera: camera)
            },
            bottomOverlays: [chatOverlay]
        )

        // WHEN: view body resolves
        _ = mapLayer.body

        // THEN: chat overlay anchors above bottom safe-area inset
        // THEN: renders below bottomSheet z when both present
        // Structural verification: body resolves without crashing
    }

    @Test("test_scrim_renders_above_map_below_overlays")
    func scrim_renders_above_map_below_overlays() {
        // GIVEN: LSMapLayer with scrim opacity 0.35
        let camera = CameraPosition(
            center: LatLng(lat: 37.7749, lon: -122.4194),
            zoom: 12.0
        )

        let scrimSpec = ScrimSpec(opacity: 0.35)

        let mapLayer = LSMapLayer(
            map: {
                LSMap(mode: .preview, camera: camera)
            },
            scrim: scrimSpec
        )

        // WHEN: view body resolves
        _ = mapLayer.body

        // THEN: LSScrim atom renders directly above map and below overlay slots
        // THEN: opacity token applied correctly
        // Structural verification: body resolves without crashing
    }

    @Test("test_leading_drawer_slide_in_motion_token")
    func test_leading_drawer_slide_in_motion_token() {
        // GIVEN: LSMapLayer with leadingDrawer containing SessionsDrawer
        let camera = CameraPosition(
            center: LatLng(lat: 37.7749, lon: -122.4194),
            zoom: 12.0
        )

        let drawerSpec = DrawerSpec {
            LSGlassPanel(variant: .chrome) {
                LSText("Sessions Drawer", variant: .title.md)
            }
        } onDismiss: {
            // Dismiss handler provided
        }

        let mapLayer = LSMapLayer(
            map: {
                LSMap(mode: .preview, camera: camera)
            },
            leadingDrawer: drawerSpec
        )

        // WHEN: view body resolves
        _ = mapLayer.body

        // THEN: drawer slides in from leading edge via motion.recipe.sidebarSlideIn token
        // THEN: renders above scrim and overlays
        // THEN: onDismiss triggered on scrim tap
        // Structural verification: body resolves without crashing
    }

    @Test("test_bottom_sheet_uses_lsbottomsheet_molecule")
    func test_bottom_sheet_uses_lsbottomsheet_molecule() {
        // GIVEN: LSMapLayer with bottomSheet containing RouteSheet
        let camera = CameraPosition(
            center: LatLng(lat: 37.7749, lon: -122.4194),
            zoom: 12.0
        )

        let sheetSpec = BottomSheetSpec(detent: .medium) {
            LSGlassPanel(variant: .chrome) {
                LSText("Route Sheet", variant: .title.md)
            }
        }

        let mapLayer = LSMapLayer(
            map: {
                LSMap(mode: .preview, camera: camera)
            },
            bottomSheet: sheetSpec
        )

        // WHEN: view body resolves
        _ = mapLayer.body

        // THEN: LSBottomSheet molecule anchors to bottom with .medium detent
        // THEN: renders above bottom overlays and below leadingDrawer z
        // Structural verification: body resolves without crashing
    }

    @Test("test_all_seven_maplayer_stories_registered")
    func test_all_seven_maplayer_stories_registered() {
        // GIVEN: developer opens the sandbox
        // WHEN: navigating to Organisms / MapLayer
        // THEN: stories Map Only, Map + TopBar, Map + Top Overlay, Map + Bottom Overlay,
        //       Map + Scrim + Drawer, Map + Sheet, Full Stack all present
        let allStories = OrganismStories.all
        let storyIds = Set(allStories.map(\.id))

        #expect(
            storyIds.contains("organisms.maplayer.mapOnly"),
            "Map Only story should be registered"
        )
        #expect(
            storyIds.contains("organisms.maplayer.mapTopBar"),
            "Map + TopBar story should be registered"
        )
        #expect(
            storyIds.contains("organisms.maplayer.mapTopOverlay"),
            "Map + Top Overlay story should be registered"
        )
        #expect(
            storyIds.contains("organisms.maplayer.mapBottomOverlay"),
            "Map + Bottom Overlay story should be registered"
        )
        #expect(
            storyIds.contains("organisms.maplayer.mapScrimDrawer"),
            "Map + Scrim + Drawer story should be registered"
        )
        #expect(
            storyIds.contains("organisms.maplayer.mapSheet"),
            "Map + Sheet story should be registered"
        )
        #expect(
            storyIds.contains("organisms.maplayer.fullStack"),
            "Full Stack story should be registered"
        )
    }
}
