import LaneShadowTheme
import SwiftUI

/// The foundational map canvas organism used on every Navigator screen.
/// Stacks map → scrim → top/bottom overlays → bottomSheet → leadingDrawer → topBar.
public struct LSMapLayer<MapContent: View, TopBarContent: View>: View {
    @Environment(\.theme) private var theme

    private let map: MapContent
    private let scrim: ScrimSpec?
    private let topOverlays: [GlassOverlaySlot]
    private let bottomOverlays: [GlassOverlaySlot]
    private let leadingDrawer: DrawerSpec?
    private let bottomSheet: BottomSheetSpec?
    private let topBar: TopBarContent?

    public init(
        @ViewBuilder map: () -> MapContent,
        scrim: ScrimSpec? = nil,
        topOverlays: [GlassOverlaySlot] = [],
        bottomOverlays: [GlassOverlaySlot] = [],
        leadingDrawer: DrawerSpec? = nil,
        bottomSheet: BottomSheetSpec? = nil,
        @ViewBuilder topBar: () -> TopBarContent?
    ) {
        self.map = map()
        self.scrim = scrim
        self.topOverlays = topOverlays
        self.bottomOverlays = bottomOverlays
        self.leadingDrawer = leadingDrawer
        self.bottomSheet = bottomSheet
        self.topBar = topBar()
    }

    public var body: some View {
        ZStack {
            // z-index 0: Map (base layer)
            map
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .accessibilityIdentifier("maplayer.map")

            // z-index 1: Scrim (above map, below overlays)
            if let scrim {
                LSScrim(opacity: scrim.opacity)
                    .accessibilityIdentifier("maplayer.scrim")
            }

            // z-index 2: Top overlays (below topBar)
            ForEach(topOverlays) { overlay in
                overlay.content()
                    .padding(.horizontal, theme.space.md)
                    .padding(.top)
                    .accessibilityIdentifier("maplayer.topOverlay.\(overlay.id)")
            }

            // z-index 2: Bottom overlays (above bottom safe-area)
            ForEach(bottomOverlays) { overlay in
                overlay.content()
                    .padding(.horizontal, theme.space.md)
                    .padding(.bottom)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
                    .accessibilityIdentifier("maplayer.bottomOverlay.\(overlay.id)")
            }

            // z-index 3: Bottom sheet (above overlays)
            if let bottomSheet {
                // Bottom sheet rendering deferred to AC-6
                EmptyView()
                    .accessibilityIdentifier("maplayer.bottomSheet")
            }

            // z-index 4: Leading drawer (above sheet and overlays)
            if let leadingDrawer {
                // Drawer rendering deferred to AC-5
                EmptyView()
                    .accessibilityIdentifier("maplayer.drawer")
            }

            // z-index 5: Top bar (highest z, under status bar)
            if let topBar {
                topBar
                    .accessibilityIdentifier("maplayer.topBar")
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .ignoresSafeArea(edges: .all)
    }
}

// MARK: - Convenience Initializer

public extension LSMapLayer where TopBarContent == LSTopBar {
    init(
        @ViewBuilder map: () -> MapContent,
        scrim: ScrimSpec? = nil,
        topOverlays: [GlassOverlaySlot] = [],
        bottomOverlays: [GlassOverlaySlot] = [],
        leadingDrawer: DrawerSpec? = nil,
        bottomSheet: BottomSheetSpec? = nil,
        topBar: LSTopBar? = nil
    ) {
        self.map = map()
        self.scrim = scrim
        self.topOverlays = topOverlays
        self.bottomOverlays = bottomOverlays
        self.leadingDrawer = leadingDrawer
        self.bottomSheet = bottomSheet
        self.topBar = topBar
    }
}
