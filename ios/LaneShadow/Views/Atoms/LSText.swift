import LaneShadowTheme
import SwiftUI

public enum ContentColor: CaseIterable, Sendable {
    case primary
    case secondary
    case tertiary
    case subtle
    case onSignal

    public func resolved(in theme: Theme) -> Color {
        switch self {
        case .primary:
            theme.colors.onSurface.default
        case .secondary:
            theme.colors.onSecondary.default
        case .tertiary:
            theme.colors.onSecondary.default.opacity(0.82)
        case .subtle:
            theme.colors.onSecondary.default.opacity(0.62)
        case .onSignal:
            theme.colors.onPrimary.default
        }
    }
}

public struct LSText: View {
    @Environment(\.theme) private var theme

    private let value: String
    private let variant: TypographyVariant
    private let color: ContentColor

    public init(
        _ value: String,
        variant: TypographyVariant,
        color: ContentColor = .primary
    ) {
        self.value = value
        self.variant = variant
        self.color = color
    }

    public var body: some View {
        let style = variant.style(in: theme)

        Text(value)
            .font(style.font)
            .lineSpacing(max(0, style.lineHeight - style.fontSize))
            .foregroundStyle(color.resolved(in: theme))
            .accessibilityIdentifier("lstext-\(variant.tokenPath)")
    }
}
