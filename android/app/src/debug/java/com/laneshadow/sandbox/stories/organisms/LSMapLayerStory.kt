package com.laneshadow.sandbox.stories.organisms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.atoms.CameraPosition
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.LSMap
import com.laneshadow.ui.atoms.MapMode
import com.laneshadow.ui.molecules.BottomSheetDetent
import com.laneshadow.ui.molecules.LSBottomSheet
import com.laneshadow.ui.organisms.BottomSheetSpec
import com.laneshadow.ui.organisms.DrawerSpec
import com.laneshadow.ui.organisms.GlassOverlaySlot
import com.laneshadow.ui.organisms.LSMapLayer
import com.laneshadow.ui.organisms.LSTopBar
import com.laneshadow.ui.organisms.SheetDetent
import com.laneshadow.ui.organisms.ScrimSpec
import com.laneshadow.ui.organisms.TopBarTrailing
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSMapLayerStory {
    val all: List<Story> = listOf(
        Story(
            id = "organisms.maplayer.map-only",
            tier = ComponentTier.Organism,
            component = "LSMapLayer",
            name = "Map Only",
            summary = "LSMap(mode:.preview) fills the entire phone-screen. No other slots populated.",
            content = { MapOnlyStory() },
        ),
        Story(
            id = "organisms.maplayer.map-topbar",
            tier = ComponentTier.Organism,
            component = "LSMapLayer",
            name = "Map + TopBar",
            summary = "LSTopBar at z-index 5, above everything. Map below. Matches Idle screen pattern.",
            content = { MapTopBarStory() },
        ),
        Story(
            id = "organisms.maplayer.map-top-overlay",
            tier = ComponentTier.Organism,
            component = "LSMapLayer",
            name = "Map + Top Overlay",
            summary = "NavigatorMessage in topOverlays slot. Positioned below TopBar with safe-area padding.",
            content = { MapTopOverlayStory() },
        ),
        Story(
            id = "organisms.maplayer.map-bottom-overlay",
            tier = ComponentTier.Organism,
            component = "LSMapLayer",
            name = "Map + Bottom Overlay",
            summary = "ChatInput in bottomOverlays. Anchored above bottom safe area at z-index 2.",
            content = { MapBottomOverlayStory() },
        ),
        Story(
            id = "organisms.maplayer.map-scrim-drawer",
            tier = ComponentTier.Organism,
            component = "LSMapLayer",
            name = "Map + Scrim + Drawer",
            summary = "LSScrim z-1, SessionsDrawer at z-4 above scrim. Matches SCR-05 Sessions pattern.",
            content = { MapScrimDrawerStory() },
        ),
        Story(
            id = "organisms.maplayer.map-sheet",
            tier = ComponentTier.Organism,
            component = "LSMapLayer",
            name = "Map + Sheet",
            summary = "RouteSheet at z-index 3, anchored bottom. TopBar still visible above sheet at z-5.",
            content = { MapSheetStory() },
        ),
        Story(
            id = "organisms.maplayer.full-stack",
            tier = ComponentTier.Organism,
            component = "LSMapLayer",
            name = "Full Stack",
            summary = "All slots populated: map + scrim + top/bottom overlays + sheet + top bar. Maximum composition story.",
            content = { FullStackStory() },
        ),
    )
}

@Composable
private fun MapOnlyStory() {
    LaneShadowTheme {
        LSMapLayer(
            map = {
                LSMap(
                    mode = MapMode.Preview,
                    camera = CameraPosition(
                        center = LatLng(37.7749, -122.4194),
                        zoom = 12.0,
                    ),
                )
            },
        )
    }
}

@Composable
private fun MapTopBarStory() {
    LaneShadowTheme {
        LSMapLayer(
            map = {
                LSMap(
                    mode = MapMode.Preview,
                    camera = CameraPosition(
                        center = LatLng(37.7749, -122.4194),
                        zoom = 12.0,
                    ),
                )
            },
            topBar = {
                LSTopBar(
                    onMenuTap = {},
                    onNewTap = {},
                )
            },
        )
    }
}

@Composable
private fun MapTopOverlayStory() {
    LaneShadowTheme {
        LSMapLayer(
            map = {
                LSMap(
                    mode = MapMode.Preview,
                    camera = CameraPosition(
                        center = LatLng(37.7749, -122.4194),
                        zoom = 12.0,
                    ),
                )
            },
            topBar = {
                LSTopBar(
                    onMenuTap = {},
                    onNewTap = {},
                )
            },
            topOverlays = listOf(
                GlassOverlaySlot("navigator-message") {
                    Column(
                        modifier = Modifier
                            .padding(com.laneshadow.theme.LocalLaneShadowTheme.current.space.md),
                        verticalArrangement = Arrangement.spacedBy(com.laneshadow.theme.LocalLaneShadowTheme.current.space.sm),
                    ) {
                        com.laneshadow.ui.atoms.LSText(
                            text = "THE NAVIGATOR",
                            variant = com.laneshadow.ui.atoms.TypographyVariant.Ui.Label.Sm,
                            color = com.laneshadow.ui.atoms.ContentColor.Primary,
                        )
                        com.laneshadow.ui.atoms.LSText(
                            text = "Here are three routes south through the coastal hills.",
                            variant = com.laneshadow.ui.atoms.TypographyVariant.Opinion.Md,
                            color = com.laneshadow.ui.atoms.ContentColor.Primary,
                        )
                    }
                }
            ),
        )
    }
}

@Composable
private fun MapBottomOverlayStory() {
    LaneShadowTheme {
        LSMapLayer(
            map = {
                LSMap(
                    mode = MapMode.Preview,
                    camera = CameraPosition(
                        center = LatLng(37.7749, -122.4194),
                        zoom = 12.0,
                    ),
                )
            },
            topBar = {
                LSTopBar(
                    onMenuTap = {},
                    onNewTap = {},
                )
            },
            bottomOverlays = listOf(
                GlassOverlaySlot("chat-input") {
                    com.laneshadow.ui.molecules.LSFormField(
                        label = "Chat",
                        value = "Where do you want to ride?",
                        onValueChange = {},
                        placeholder = "Where do you want to ride?",
                    )
                }
            ),
        )
    }
}

@Composable
private fun MapScrimDrawerStory() {
    LaneShadowTheme {
        LSMapLayer(
            map = {
                LSMap(
                    mode = MapMode.Preview,
                    camera = CameraPosition(
                        center = LatLng(37.7749, -122.4194),
                        zoom = 12.0,
                    ),
                )
            },
            scrim = ScrimSpec(opacity = 0.35f),
            leadingDrawer = DrawerSpec(
                content = {
                    Column(
                        modifier = Modifier
                            .padding(com.laneshadow.theme.LocalLaneShadowTheme.current.space.md),
                        verticalArrangement = Arrangement.spacedBy(com.laneshadow.theme.LocalLaneShadowTheme.current.space.sm),
                    ) {
                        com.laneshadow.ui.atoms.LSText(
                            text = "Rides",
                            variant = com.laneshadow.ui.atoms.TypographyVariant.Ui.Title.Lg,
                            color = com.laneshadow.ui.atoms.ContentColor.Primary,
                        )
                        com.laneshadow.ui.atoms.LSText(
                            text = "Santa Cruz Loop",
                            variant = com.laneshadow.ui.atoms.TypographyVariant.Ui.Body.Md,
                            color = com.laneshadow.ui.atoms.ContentColor.Primary,
                        )
                    }
                },
                onDismiss = {},
            ),
        )
    }
}

@Composable
private fun MapSheetStory() {
    LaneShadowTheme {
        LSMapLayer(
            map = {
                LSMap(
                    mode = MapMode.Preview,
                    camera = CameraPosition(
                        center = LatLng(37.7749, -122.4194),
                        zoom = 12.0,
                    ),
                )
            },
            topBar = {
                LSTopBar(
                    onMenuTap = {},
                )
            },
            bottomSheet = BottomSheetSpec(
                content = {
                    Column(
                        modifier = Modifier
                            .padding(com.laneshadow.theme.LocalLaneShadowTheme.current.space.md),
                        verticalArrangement = Arrangement.spacedBy(com.laneshadow.theme.LocalLaneShadowTheme.current.space.sm),
                    ) {
                        com.laneshadow.ui.atoms.LSText(
                            text = "The Skyline Spine",
                            variant = com.laneshadow.ui.atoms.TypographyVariant.Opinion.Lg,
                            color = com.laneshadow.ui.atoms.ContentColor.Primary,
                        )
                        com.laneshadow.ui.atoms.LSText(
                            text = "via Kings Mountain Rd · 47 mi",
                            variant = com.laneshadow.ui.atoms.TypographyVariant.Ui.Body.Sm,
                            color = com.laneshadow.ui.atoms.ContentColor.Secondary,
                        )
                    }
                },
                detent = SheetDetent.Medium,
                onDismiss = {},
            ),
        )
    }
}

@Composable
private fun FullStackStory() {
    LaneShadowTheme {
        LSMapLayer(
            map = {
                LSMap(
                    mode = MapMode.Preview,
                    camera = CameraPosition(
                        center = LatLng(37.7749, -122.4194),
                        zoom = 12.0,
                    ),
                )
            },
            scrim = ScrimSpec(opacity = 0.2f),
            topBar = {
                LSTopBar(
                    onMenuTap = {},
                    onNewTap = {},
                )
            },
            topOverlays = listOf(
                GlassOverlaySlot("navigator-message") {
                    Column(
                        modifier = Modifier
                            .padding(com.laneshadow.theme.LocalLaneShadowTheme.current.space.md),
                        verticalArrangement = Arrangement.spacedBy(com.laneshadow.theme.LocalLaneShadowTheme.current.space.sm),
                    ) {
                        com.laneshadow.ui.atoms.LSText(
                            text = "THE NAVIGATOR",
                            variant = com.laneshadow.ui.atoms.TypographyVariant.Ui.Label.Sm,
                            color = com.laneshadow.ui.atoms.ContentColor.Primary,
                        )
                        com.laneshadow.ui.atoms.LSText(
                            text = "Best route selected.",
                            variant = com.laneshadow.ui.atoms.TypographyVariant.Opinion.Md,
                            color = com.laneshadow.ui.atoms.ContentColor.Primary,
                        )
                    }
                }
            ),
            bottomOverlays = listOf(
                GlassOverlaySlot("chat-input") {
                    com.laneshadow.ui.molecules.LSFormField(
                        label = "Chat",
                        value = "Refine route...",
                        onValueChange = {},
                        placeholder = "Refine route...",
                    )
                }
            ),
            bottomSheet = BottomSheetSpec(
                content = {
                    Column(
                        modifier = Modifier
                            .padding(com.laneshadow.theme.LocalLaneShadowTheme.current.space.md),
                        verticalArrangement = Arrangement.spacedBy(com.laneshadow.theme.LocalLaneShadowTheme.current.space.sm),
                    ) {
                        com.laneshadow.ui.atoms.LSText(
                            text = "The Skyline Spine",
                            variant = com.laneshadow.ui.atoms.TypographyVariant.Opinion.Lg,
                            color = com.laneshadow.ui.atoms.ContentColor.Primary,
                        )
                    }
                },
                detent = SheetDetent.Medium,
                onDismiss = {},
            ),
        )
    }
}
