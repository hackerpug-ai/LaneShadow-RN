import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSMapLayerStory {
    static let all: [Story] = [
        // Story 1: Map Only
        Story(
            id: "organisms.maplayer.mapOnly",
            tier: .organism,
            component: "MapLayer",
            name: "Map Only",
            summary: "LSMap(mode:.preview) fills the entire screen. No other slots populated."
        ) { _ in
            LSMapLayer {
                LSMap(
                    mode: .preview,
                    camera: CameraPosition(
                        center: LatLng(lat: 37.7749, lon: -122.4194),
                        zoom: 12.0
                    )
                )
            }
        },

        // Story 2: Map + TopBar
        Story(
            id: "organisms.maplayer.mapTopBar",
            tier: .organism,
            component: "MapLayer",
            name: "Map + TopBar",
            summary: "LSTopBar at z-index 5, above everything. Map below. Matches Idle screen pattern."
        ) { _ in
            LSMapLayer(
                map: {
                    LSMap(
                        mode: .preview,
                        camera: CameraPosition(
                            center: LatLng(lat: 37.7749, lon: -122.4194),
                            zoom: 12.0
                        )
                    )
                },
                topBar: LSTopBar(
                    onMenuTap: {},
                    onNewTap: {}
                )
            )
        },

        // Story 3: Map + Top Overlay
        Story(
            id: "organisms.maplayer.mapTopOverlay",
            tier: .organism,
            component: "MapLayer",
            name: "Map + Top Overlay",
            summary: "NavigatorMessage in topOverlays slot. Positioned below TopBar with safe-area padding."
        ) { _ in
            LSMapLayer(
                map: {
                    LSMap(
                        mode: .preview,
                        camera: CameraPosition(
                            center: LatLng(lat: 37.7749, lon: -122.4194),
                            zoom: 12.0
                        )
                    )
                },
                topOverlays: [
                    GlassOverlaySlot(id: "navigator") {
                        LSGlassPanel(variant: .chrome) {
                            VStack(alignment: .leading, spacing: 8) {
                                LSText("THE NAVIGATOR", variant: .label.sm, color: .primary)
                                LSText(
                                    "Here are three routes south through the coastal hills.",
                                    variant: .heading.md
                                )
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                ],
                topBar: LSTopBar(
                    onMenuTap: {},
                    onNewTap: {}
                )
            )
        },

        // Story 4: Map + Bottom Overlay
        Story(
            id: "organisms.maplayer.mapBottomOverlay",
            tier: .organism,
            component: "MapLayer",
            name: "Map + Bottom Overlay",
            summary: "ChatInput in bottomOverlays. Anchored above bottom safe area at z-index 2."
        ) { _ in
            LSMapLayer(
                map: {
                    LSMap(
                        mode: .preview,
                        camera: CameraPosition(
                            center: LatLng(lat: 37.7749, lon: -122.4194),
                            zoom: 12.0
                        )
                    )
                },
                bottomOverlays: [
                    GlassOverlaySlot(id: "chat") {
                        LSGlassPanel(variant: .chrome) {
                            HStack(spacing: 8) {
                                LSText(
                                    "Where do you want to ride?",
                                    variant: .body.md
                                )
                                Spacer()
                                LSIcon(name: .send, size: .sm, color: .primary)
                            }
                        }
                        .frame(height: 46)
                    }
                ],
                topBar: LSTopBar(
                    onMenuTap: {},
                    onNewTap: {}
                )
            )
        },

        // Story 5: Map + Scrim + Drawer
        Story(
            id: "organisms.maplayer.mapScrimDrawer",
            tier: .organism,
            component: "MapLayer",
            name: "Map + Scrim + Drawer",
            summary: "LSScrim z-1, SessionsDrawer at z-4 above scrim. Matches SCR-05 Sessions pattern."
        ) { _ in
            LSMapLayer(
                map: {
                    LSMap(
                        mode: .preview,
                        camera: CameraPosition(
                            center: LatLng(lat: 37.7749, lon: -122.4194),
                            zoom: 12.0
                        )
                    )
                },
                scrim: ScrimSpec(opacity: 0.35),
                leadingDrawer: DrawerSpec {
                    LSGlassPanel(variant: .chrome) {
                        VStack(alignment: .leading, spacing: 12) {
                            LSText("Rides", variant: .heading.md)
                            LSText("This Week", variant: .label.sm)
                            Rectangle()
                                .fill(Color(uiColor: .separator))
                                .frame(height: 1)
                            LSText("Santa Cruz Loop", variant: .body.md)
                            LSText("Skyline to the Sea", variant: .body.md)
                            LSText("PCH Evening Run", variant: .body.md)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } onDismiss: {
                    // Dismiss handler
                }
            )
        },

        // Story 6: Map + Sheet
        Story(
            id: "organisms.maplayer.mapSheet",
            tier: .organism,
            component: "MapLayer",
            name: "Map + Sheet",
            summary: "RouteSheet at z-index 3, anchored bottom. TopBar still visible above sheet at z-5."
        ) { _ in
            LSMapLayer(
                map: {
                    LSMap(
                        mode: .preview,
                        camera: CameraPosition(
                            center: LatLng(lat: 37.7749, lon: -122.4194),
                            zoom: 12.0
                        )
                    )
                },
                bottomSheet: BottomSheetSpec(detent: .medium) {
                    VStack(alignment: .leading, spacing: 12) {
                        LSText("The Skyline Spine", variant: .heading.lg)
                        LSText("via Kings Mountain Rd · 47 mi", variant: .body.sm)
                        HStack(spacing: 8) {
                            LSGlassPanel(variant: .chrome) {
                                LSText("Save", variant: .label.md)
                            }
                            LSGlassPanel(variant: .chrome) {
                                LSText("Ride this", variant: .label.md, color: .primary)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                },
                topBar: LSTopBar(
                    onMenuTap: {}
                )
            )
        },

        // Story 7: Full Stack
        Story(
            id: "organisms.maplayer.fullStack",
            tier: .organism,
            component: "MapLayer",
            name: "Full Stack",
            summary: "All slots populated: map + scrim + top/bottom overlays + sheet + top bar. Maximum composition."
        ) { _ in
            LSMapLayer(
                map: {
                    LSMap(
                        mode: .preview,
                        camera: CameraPosition(
                            center: LatLng(lat: 37.7749, lon: -122.4194),
                            zoom: 12.0
                        )
                    )
                },
                scrim: ScrimSpec(opacity: 0.2),
                topOverlays: [
                    GlassOverlaySlot(id: "navigator") {
                        LSGlassPanel(variant: .chrome) {
                            VStack(alignment: .leading, spacing: 4) {
                                LSText("THE NAVIGATOR", variant: .label.sm, color: .primary)
                                LSText("Best route selected.", variant: .heading.sm)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                ],
                bottomOverlays: [
                    GlassOverlaySlot(id: "chat") {
                        LSGlassPanel(variant: .chrome) {
                            HStack(spacing: 8) {
                                LSText("Refine route...", variant: .body.md)
                                Spacer()
                                LSIcon(name: .send, size: .sm, color: .primary)
                            }
                        }
                        .frame(height: 46)
                    }
                ],
                bottomSheet: BottomSheetSpec(detent: .medium) {
                    VStack(alignment: .leading, spacing: 12) {
                        LSText("The Skyline Spine", variant: .heading.lg)
                        HStack(spacing: 8) {
                            LSGlassPanel(variant: .chrome) {
                                LSText("Save", variant: .label.md)
                            }
                            LSGlassPanel(variant: .chrome) {
                                LSText("Ride this", variant: .label.md, color: .primary)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                },
                topBar: LSTopBar(
                    onMenuTap: {},
                    onNewTap: {}
                )
            )
        },

        // Dark mode variants
        Story(
            id: "organisms.maplayer.mapOnlyDark",
            tier: .organism,
            component: "MapLayer",
            name: "Map Only · Dark",
            summary: "map-paper resolves to #1B140E. Grid contours use ink-tinted alpha."
        ) { _ in
            LSMapLayer {
                LSMap(
                    mode: .preview,
                    camera: CameraPosition(
                        center: LatLng(lat: 37.7749, lon: -122.4194),
                        zoom: 12.0
                    )
                )
            }
            .preferredColorScheme(.dark)
        },

        Story(
            id: "organisms.maplayer.fullStackDark",
            tier: .organism,
            component: "MapLayer",
            name: "Full Stack · Dark",
            summary: "All seven slots on dark canvas. Deeper scrim, ink-alpha glass borders."
        ) { _ in
            LSMapLayer(
                map: {
                    LSMap(
                        mode: .preview,
                        camera: CameraPosition(
                            center: LatLng(lat: 37.7749, lon: -122.4194),
                            zoom: 12.0
                        )
                    )
                },
                scrim: ScrimSpec(opacity: 0.2),
                topOverlays: [
                    GlassOverlaySlot(id: "navigator") {
                        LSGlassPanel(variant: .chrome) {
                            VStack(alignment: .leading, spacing: 4) {
                                LSText("THE NAVIGATOR", variant: .label.sm, color: .primary)
                                LSText("Best route selected.", variant: .heading.sm)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                ],
                bottomOverlays: [
                    GlassOverlaySlot(id: "chat") {
                        LSGlassPanel(variant: .chrome) {
                            HStack(spacing: 8) {
                                LSText("Refine route...", variant: .body.md)
                                Spacer()
                                LSIcon(name: .send, size: .sm, color: .primary)
                            }
                        }
                        .frame(height: 46)
                    }
                ],
                bottomSheet: BottomSheetSpec(detent: .medium) {
                    VStack(alignment: .leading, spacing: 12) {
                        LSText("The Skyline Spine", variant: .heading.lg)
                        HStack(spacing: 8) {
                            LSGlassPanel(variant: .chrome) {
                                LSText("Save", variant: .label.md)
                            }
                            LSGlassPanel(variant: .chrome) {
                                LSText("Ride this", variant: .label.md, color: .primary)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                },
                topBar: LSTopBar(
                    onMenuTap: {},
                    onNewTap: {}
                )
            )
            .preferredColorScheme(.dark)
        },
    ]
}
