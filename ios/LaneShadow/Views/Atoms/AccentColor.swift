import LaneShadowTheme
import NativeTheme
import SwiftUI

public enum AccentColor: CaseIterable, Hashable, Sendable {
    case signal
    case warning

    public var tokenPath: String {
        switch self {
        case .signal:
            "color.signal.default"
        case .warning:
            "color.status.warning.default"
        }
    }

    public func resolved(in theme: Theme) -> Color {
        switch self {
        case .signal:
            theme.colors.primary.default
        case .warning:
            theme.colors.warning.default
        }
    }
}

public enum Spacing: CaseIterable, Hashable, Sendable {
    case spacing3
    case spacing4
    case spacing5

    func value(in theme: Theme) -> CGFloat {
        switch self {
        case .spacing3:
            theme.space.md
        case .spacing4:
            theme.space.lg
        case .spacing5:
            theme.space.xl
        }
    }
}

enum LSSurfaceColorToken {
    case card
    case primary
    case glass

    var tokenPath: String {
        switch self {
        case .card:
            "color.surface.card"
        case .primary:
            "color.surface.primary"
        case .glass:
            "color.surface.glass"
        }
    }

    func resolved(in theme: Theme) -> Color {
        switch self {
        case .card:
            theme.colors.card.default
        case .primary:
            theme.colors.surface.default
        case .glass:
            LSTokenColor.surfaceGlass
        }
    }
}

private enum LSTokenColor {
    static let surfaceGlass = dyn(
        parseColorString("rgba(253,251,248,0.72)"),
        parseColorString("rgba(45,34,24,0.72)")
    )
}
