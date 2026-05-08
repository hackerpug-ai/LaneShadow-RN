import LaneShadowTheme
import NativeTheme
import SwiftUI
import UIKit

struct LSMapControlsAppearance: Equatable {
    let chipsInOrder: [LSMapControlsChipKind]
    let isSaveChipVisible: Bool
    let saveChipBackgroundToken: String?
    let saveChipGlyphColorToken: String
    let saveChipAccessibilityLabel: String?
    let modeToggleGlyphToken: String
    let modeToggleAccessibilityLabel: String
    let chipBackgroundToken: String
    let chipBorderToken: String
    let chipGapSpacing: CGFloat
    let chipSize: CGFloat
    let chipIconSize: CGFloat
    let cornerRadius: CGFloat
    let zoomCallbacksBound: Bool
}

struct LSMapControlsResolvedThemeColors: Equatable {
    let surfaceOverlay: String
    let borderDefault: String
    let signalDefault: String
}

enum LSMapControlsChipKind: Hashable {
    case zoomCluster
    case recenter
    case layers
    case save(isSaved: Bool)
    case modeToggle
}

extension LSMapControls {
    static func resolvedAppearance(
        mode: LSMapControlsMode,
        hasRouteToSave: Bool,
        isSavedRoute: Bool,
        onZoomIn: (() -> Void)? = nil,
        onZoomOut: (() -> Void)? = nil,
        in theme: Theme
    ) -> LSMapControlsAppearance {
        let chipSize = theme.space.xl + theme.space.md + theme.space.xs
        let chipIconSize = theme.iconSize.medium

        var chipsInOrder: [LSMapControlsChipKind] = []

        if mode == .map {
            chipsInOrder.append(.zoomCluster)
            chipsInOrder.append(.recenter)
            chipsInOrder.append(.layers)

            if hasRouteToSave {
                chipsInOrder.append(.save(isSaved: isSavedRoute))
            }
        }

        chipsInOrder.append(.modeToggle)

        let modeToggleGlyph = mode == .map ? "send" : "map"
        let modeToggleLabel = mode == .map ? "Open chat" : "Back to map"

        let saveBackgroundToken = isSavedRoute ? "color.signal.default" : nil
        let saveAccessibilityLabel: String? = hasRouteToSave ? (isSavedRoute ? "Saved route" : "Save route") : nil
        let zoomCallbacksBound = onZoomIn != nil && onZoomOut != nil

        return LSMapControlsAppearance(
            chipsInOrder: chipsInOrder,
            isSaveChipVisible: mode == .map && hasRouteToSave,
            saveChipBackgroundToken: saveBackgroundToken,
            saveChipGlyphColorToken: isSavedRoute ? "color.signal.onSignal" : "color.content.primary",
            saveChipAccessibilityLabel: saveAccessibilityLabel,
            modeToggleGlyphToken: modeToggleGlyph,
            modeToggleAccessibilityLabel: modeToggleLabel,
            chipBackgroundToken: "color.surface.overlay",
            chipBorderToken: "color.border.default",
            chipGapSpacing: theme.space.xs,
            chipSize: chipSize,
            chipIconSize: chipIconSize,
            cornerRadius: theme.radius.md,
            zoomCallbacksBound: zoomCallbacksBound
        )
    }

    static func resolvedThemeColors(for interfaceStyle: UIUserInterfaceStyle) -> LSMapControlsResolvedThemeColors {
        let traitCollection = UITraitCollection(userInterfaceStyle: interfaceStyle)

        return LSMapControlsResolvedThemeColors(
            surfaceOverlay: resolvedColorDescription(
                LaneShadowTheme.color.surface.overlay,
                traitCollection: traitCollection
            ),
            borderDefault: resolvedColorDescription(
                LaneShadowTheme.color.border.default,
                traitCollection: traitCollection
            ),
            signalDefault: resolvedColorDescription(
                LaneShadowTheme.color.signal.default,
                traitCollection: traitCollection
            )
        )
    }

    private static func resolvedColorDescription(
        _ color: Color,
        traitCollection: UITraitCollection
    ) -> String {
        let resolved = UIColor(color).resolvedColor(with: traitCollection)
        var red: CGFloat = 0
        var green: CGFloat = 0
        var blue: CGFloat = 0
        var alpha: CGFloat = 0
        resolved.getRed(&red, green: &green, blue: &blue, alpha: &alpha)

        return "\(red)-\(green)-\(blue)-\(alpha)"
    }
}
