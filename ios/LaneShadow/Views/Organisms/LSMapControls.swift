import LaneShadowTheme
import NativeTheme
import SwiftUI

/// Mode for the map controls workbar.
/// - `.map`: Shows zoom, recenter, layers, optional save, and chat-toggle at bottom
/// - `.chat`: Collapses to show only the map-toggle at bottom
public enum LSMapControlsMode: Hashable, Sendable {
    case map
    case chat
}

/// Right-side vertical workbar for map view controls.
///
/// **Design Contract:**
/// - Layout: VStack with 40pt square glass chips arranged vertically
/// - Position: Vertically centered along the right edge (via consumer placement, not internal)
/// - Spacing: `theme.space.xs` (4pt) between chips
/// - Chips: Surface.overlay background, hairline borders, radius.md corners, elev.chrome shadow
///
/// **Handler Semantics:**
/// Production names from `react-native/components/map/map-controls.tsx`:
/// - `onLayers` (semantic) backs the layers/reset toggle (production calls it `onClear`)
/// - All other handlers match their names exactly
///
/// **Token Purity:**
/// All colors, spacing, radii, and shadows resolve through `LaneShadowTheme` tokens.
/// Zero hardcoded hex, RGB, or numeric values.
public struct LSMapControls: View {
    @Environment(\.theme) private var theme

    private let mode: LSMapControlsMode
    private let hasRouteToSave: Bool
    private let isSavedRoute: Bool
    private let onZoomIn: (() -> Void)?
    private let onZoomOut: (() -> Void)?
    private let onRecenter: (() -> Void)?
    private let onLayers: (() -> Void)?
    private let onSaveRoute: (() -> Void)?
    private let onToggleView: (() -> Void)?

    public init(
        mode: LSMapControlsMode = .map,
        hasRouteToSave: Bool = false,
        isSavedRoute: Bool = false,
        onZoomIn: (() -> Void)? = nil,
        onZoomOut: (() -> Void)? = nil,
        onRecenter: (() -> Void)? = nil,
        onLayers: (() -> Void)? = nil,
        onSaveRoute: (() -> Void)? = nil,
        onToggleView: (() -> Void)? = nil
    ) {
        self.mode = mode
        self.hasRouteToSave = hasRouteToSave
        self.isSavedRoute = isSavedRoute
        self.onZoomIn = onZoomIn
        self.onZoomOut = onZoomOut
        self.onRecenter = onRecenter
        self.onLayers = onLayers
        self.onSaveRoute = onSaveRoute
        self.onToggleView = onToggleView
    }

    public var body: some View {
        let appearance = Self.resolvedAppearance(
            mode: mode,
            hasRouteToSave: hasRouteToSave,
            isSavedRoute: isSavedRoute,
            onZoomIn: onZoomIn,
            onZoomOut: onZoomOut,
            in: theme
        )

        return VStack(alignment: .trailing, spacing: appearance.chipGapSpacing) {
            ForEach(appearance.chipsInOrder, id: \.self) { chipKind in
                switch chipKind {
                case .zoomCluster:
                    zoomClusterChip

                case .recenter:
                    sfSymbolControlChip(
                        sfSymbol: "location.circle",
                        accessibilityLabel: "Recenter map",
                        action: onRecenter
                    )

                case .layers:
                    controlChip(
                        icon: .layers,
                        accessibilityLabel: "Toggle layers",
                        action: onLayers
                    )

                case let .save(isSaved):
                    if isSaved {
                        saveChipSaved
                    } else {
                        saveChipUnsaved
                    }

                case .modeToggle:
                    controlChip(
                        icon: mode == .map ? .send : .map,
                        accessibilityLabel: appearance.modeToggleAccessibilityLabel,
                        action: onToggleView
                    )
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("lsmapcontrols")
    }

    // MARK: - Private Views

    /// Zoom cluster: two 40pt buttons separated by a hairline divider in a single rounded card
    private var zoomClusterChip: some View {
        HStack(spacing: 0) {
            // Zoom in button
            Button(action: onZoomIn ?? {}) {
                LSIcon(name: .plus, size: .md, color: .primary)
            }
            .frame(width: chipSize, height: chipSize)
            .contentShape(Rectangle())
            .accessibilityIdentifier("lsmapcontrols-zoom-in")

            // Divider
            Divider()
                .frame(width: theme.borderWidth.thin)

            // Zoom out button (using SF Symbol since custom icons don't have minus)
            Button(action: onZoomOut ?? {}) {
                LSIconSymbolIOS(name: "minus", size: chipIconSize, color: .primary)
            }
            .frame(width: chipSize, height: chipSize)
            .contentShape(Rectangle())
            .accessibilityIdentifier("lsmapcontrols-zoom-out")
        }
        .frame(height: chipSize)
        .background(chipBackground)
        .overlay(chipBorder)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous))
        .shadow(
            color: shadowStyle.shadowColor.opacity(shadowStyle.opacity),
            radius: shadowStyle.radius,
            x: shadowStyle.offsetX,
            y: shadowStyle.offsetY
        )
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("lsmapcontrols-zoom-cluster")
    }

    /// Standard control chip (layers, mode toggle)
    private func controlChip(
        icon: IconName,
        accessibilityLabel: String,
        action: (() -> Void)?
    ) -> some View {
        Button(action: action ?? {}) {
            LSIcon(name: icon, size: .md, color: .primary)
        }
        .frame(width: chipSize, height: chipSize)
        .contentShape(Rectangle())
        .background(chipBackground)
        .overlay(chipBorder)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous))
        .shadow(
            color: shadowStyle.shadowColor.opacity(shadowStyle.opacity),
            radius: shadowStyle.radius,
            x: shadowStyle.offsetX,
            y: shadowStyle.offsetY
        )
        .buttonStyle(PlainButtonStyle())
        .accessibilityLabel(accessibilityLabel)
        .accessibilityIdentifier("lsmapcontrols-\(icon.rawValue)")
    }

    /// SF Symbol control chip (recenter)
    private func sfSymbolControlChip(
        sfSymbol: String,
        accessibilityLabel: String,
        action: (() -> Void)?
    ) -> some View {
        Button(action: action ?? {}) {
            LSIconSymbolIOS(name: sfSymbol, size: chipIconSize, color: .primary)
        }
        .frame(width: chipSize, height: chipSize)
        .contentShape(Rectangle())
        .background(chipBackground)
        .overlay(chipBorder)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous))
        .shadow(
            color: shadowStyle.shadowColor.opacity(shadowStyle.opacity),
            radius: shadowStyle.radius,
            x: shadowStyle.offsetX,
            y: shadowStyle.offsetY
        )
        .buttonStyle(PlainButtonStyle())
        .accessibilityLabel(accessibilityLabel)
        .accessibilityIdentifier("lsmapcontrols-\(sfSymbol)")
    }

    /// Save chip when route is not yet saved
    private var saveChipUnsaved: some View {
        Button(action: onSaveRoute ?? {}) {
            LSIcon(name: .bookmark, size: .md, color: .primary)
        }
        .frame(width: chipSize, height: chipSize)
        .contentShape(Rectangle())
        .background(chipBackground)
        .overlay(chipBorder)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous))
        .shadow(
            color: shadowStyle.shadowColor.opacity(shadowStyle.opacity),
            radius: shadowStyle.radius,
            x: shadowStyle.offsetX,
            y: shadowStyle.offsetY
        )
        .buttonStyle(PlainButtonStyle())
        .accessibilityLabel("Save route")
        .accessibilityIdentifier("lsmapcontrols-save")
    }

    /// Save chip when route is already saved (copper signal variant)
    private var saveChipSaved: some View {
        Button(action: onSaveRoute ?? {}) {
            LSIcon(name: .bookmark, size: .md, color: .onSignal)
        }
        .frame(width: chipSize, height: chipSize)
        .contentShape(Rectangle())
        .background(LaneShadowTheme.color.signal.default)
        .overlay {
            RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
                .stroke(LaneShadowTheme.color.border.default, lineWidth: theme.borderWidth.thin)
        }
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous))
        .shadow(
            color: shadowStyle.shadowColor.opacity(shadowStyle.opacity),
            radius: shadowStyle.radius,
            x: shadowStyle.offsetX,
            y: shadowStyle.offsetY
        )
        .buttonStyle(PlainButtonStyle())
        .accessibilityLabel("Saved route")
        .accessibilityIdentifier("lsmapcontrols-save-saved")
    }

    // MARK: - Tokens

    /// 40pt chip width/height (theme.space.xl + theme.space.md + theme.space.xs = 24 + 12 + 4)
    private var chipSize: CGFloat {
        theme.space.xl + theme.space.md + theme.space.xs
    }

    /// Icon size for chips (matching theme.iconSize.medium)
    private var chipIconSize: CGFloat {
        theme.iconSize.medium
    }

    /// Elevation shadow for chrome elements (elev.chrome from design spec)
    private var shadowStyle: ElevationStyle {
        theme.elevation.level8
    }

    /// Surface.overlay with blur (matching LSTopBar pattern)
    private var chipBackground: some View {
        Color.clear
            .background(LaneShadowTheme.color.surface.overlay)
            .background(.regularMaterial)
    }

    /// Hairline border using theme.border.default at theme.borderWidth.thin
    private var chipBorder: some View {
        RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
            .stroke(LaneShadowTheme.color.border.default, lineWidth: theme.borderWidth.thin)
    }
}

// MARK: - Preview

#Preview("Map Mode") {
    ZStack {
        Color.black.ignoresSafeArea()
        LSMapControls(
            mode: .map,
            hasRouteToSave: false,
            onZoomIn: {},
            onZoomOut: {},
            onRecenter: {},
            onLayers: {},
            onToggleView: {}
        )
        .padding()
    }
}

#Preview("Map Mode with Unsaved Route") {
    ZStack {
        Color.black.ignoresSafeArea()
        LSMapControls(
            mode: .map,
            hasRouteToSave: true,
            isSavedRoute: false,
            onZoomIn: {},
            onZoomOut: {},
            onRecenter: {},
            onLayers: {},
            onSaveRoute: {},
            onToggleView: {}
        )
        .padding()
    }
}

#Preview("Map Mode with Saved Route") {
    ZStack {
        Color.black.ignoresSafeArea()
        LSMapControls(
            mode: .map,
            hasRouteToSave: true,
            isSavedRoute: true,
            onZoomIn: {},
            onZoomOut: {},
            onRecenter: {},
            onLayers: {},
            onSaveRoute: {},
            onToggleView: {}
        )
        .padding()
    }
}

#Preview("Chat Mode") {
    ZStack {
        Color.black.ignoresSafeArea()
        LSMapControls(
            mode: .chat,
            hasRouteToSave: true,
            isSavedRoute: false,
            onToggleView: {}
        )
        .padding()
    }
}
