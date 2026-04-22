import LaneShadowTheme
import NativeTheme
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
            dyn(parseColorString("#1E1A16"), parseColorString("#F2EEE8"))
        case .secondary:
            dyn(parseColorString("#49454F"), parseColorString("#CAC4D0"))
        case .tertiary:
            dyn(parseColorString("#6B6460"), parseColorString("#9CA3AF"))
        case .subtle:
            dyn(parseColorString("#9CA3AF"), parseColorString("#6B6460"))
        case .onSignal:
            dyn(parseColorString("#FFFFFF"), parseColorString("#FFFFFF"))
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
