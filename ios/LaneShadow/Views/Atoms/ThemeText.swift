import LaneShadowTheme
import NativeTheme
import SwiftUI

struct ThemeText: View {
    @Environment(\.theme) private var theme

    let content: String
    let variant: ThemeTextVariant
    let color: Color?

    init(_ content: String, variant: ThemeTextVariant = .bodyMd, color: Color? = nil) {
        self.content = content
        self.variant = variant
        self.color = color
    }

    var body: some View {
        let typography = variant.typography(in: theme)
        let lineHeightDelta = max(typography.lineHeight - typography.fontSize, 0)

        return Text(content)
            .font(typography.font)
            .lineSpacing(lineHeightDelta)
            .foregroundStyle(color ?? theme.colors.onSurface.default)
    }
}

enum ThemeTextVariant: String, CaseIterable {
    case labelSm
    case labelMd
    case labelLg
    case bodySm
    case bodyMd
    case bodyLg
    case titleSm
    case titleMd
    case titleLg
    case headingSm
    case headingMd
    case headingLg
    case displaySm
    case displayMd
    case displayLg

    func typography(in theme: Theme) -> TypographyStyle {
        switch self {
        case .labelSm: theme.type.label.sm
        case .labelMd: theme.type.label.md
        case .labelLg: theme.type.label.lg
        case .bodySm: theme.type.body.sm
        case .bodyMd: theme.type.body.md
        case .bodyLg: theme.type.body.lg
        case .titleSm: theme.type.title.sm
        case .titleMd: theme.type.title.md
        case .titleLg: theme.type.title.lg
        case .headingSm: theme.type.heading.sm
        case .headingMd: theme.type.heading.md
        case .headingLg: theme.type.heading.lg
        case .displaySm: theme.type.display.sm
        case .displayMd: theme.type.display.md
        case .displayLg: theme.type.display.lg
        }
    }
}
