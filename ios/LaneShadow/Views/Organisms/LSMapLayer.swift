import LaneShadowTheme
import SwiftUI

/// The foundational map canvas organism used on every Navigator screen.
/// Stacks map → scrim → top/bottom overlays → bottomSheet → leadingDrawer → topBar.
public struct LSMapLayer<MapContent: View, TopBarContent: View>: View {
    @Environment(\.theme) private var theme

    /// Reserved vertical space for the topBar (chip tap-target height + breathing room).
    /// Top overlays (capsule, etc.) are pushed below this height so they never sit
    /// underneath the menu/NEW chips.
    private static var topBarReservedHeight: CGFloat {
        64
    }

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
                .ignoresSafeArea(edges: .all)
                .accessibilityIdentifier("maplayer.map")

            // z-index 1: Scrim (above map, below overlays + drawer).
            // When a `leadingDrawer` is present and no explicit scrim was
            // passed, auto-derive one that dismisses the drawer on tap so
            // the drawer always sits ABOVE its dimming surface.
            if let resolvedScrim = scrim ?? Self.defaultScrim(forDrawer: leadingDrawer) {
                LSScrim(
                    opacity: resolvedScrim.opacity,
                    blocking: resolvedScrim.onTap != nil,
                    onTap: resolvedScrim.onTap.map { handler in { handler() } }
                )
                .accessibilityIdentifier("maplayer.scrim")
            }

            // z-index 2: Top overlays (below topBar — clearance reserves topBar height)
            ForEach(topOverlays) { overlay in
                overlay.content()
                    .padding(.horizontal, theme.space.md)
                    .padding(.top, theme.space.md + Self.topBarReservedHeight)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                    .accessibilityIdentifier("maplayer.topOverlay.\(overlay.id)")
            }

            // z-index 2: Bottom overlays (above bottom safe-area)
            ForEach(bottomOverlays) { overlay in
                overlay.content()
                    .padding(.horizontal, theme.space.md)
                    .padding(.bottom, theme.space.md)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
                    .accessibilityIdentifier("maplayer.bottomOverlay.\(overlay.id)")
            }

            // z-index 3: Bottom sheet (above overlays)
            if let bottomSheet {
                LSBottomSheet(
                    isPresented: .constant(true),
                    detent: bottomSheet.detent == .medium ? .medium : .large,
                    onDismiss: {}
                ) {
                    bottomSheet.content()
                }
                .accessibilityIdentifier("maplayer.bottomSheet")
            }

            // z-index 4: Leading drawer (above sheet, overlays, and scrim).
            // The drawer chrome extends top-to-bottom; content inside owns
            // its own safe-area padding (see LSSessionsDrawer).
            if let leadingDrawer {
                leadingDrawer.content()
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                    .ignoresSafeArea(edges: [.top, .bottom])
                    .accessibilityIdentifier("maplayer.drawer")
            }

            // z-index 5: Top bar (highest z, under status bar)
            if let topBar {
                topBar
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                    .accessibilityIdentifier("maplayer.topBar")
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

private extension LSMapLayer {
    @MainActor
    static func defaultScrim(forDrawer drawer: DrawerSpec?) -> ScrimSpec? {
        guard let drawer else { return nil }
        return ScrimSpec(opacity: 0.35, onTap: drawer.onDismiss)
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
