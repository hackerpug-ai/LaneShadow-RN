import LaneShadowTheme
import SwiftUI

struct ThemeToggle: View {
    @Environment(\.theme) private var theme

    @Binding var isPressed: Bool
    let label: String
    let variant: ThemeToggleVariant
    let size: ThemeToggleSize
    let iconName: String?
    let isEnabled: Bool

    init(
        _ label: String,
        isPressed: Binding<Bool>,
        variant: ThemeToggleVariant = .default,
        size: ThemeToggleSize = .md,
        iconName: String? = nil,
        isEnabled: Bool = true
    ) {
        self.label = label
        _isPressed = isPressed
        self.variant = variant
        self.size = size
        self.iconName = iconName
        self.isEnabled = isEnabled
    }

    var body: some View {
        Button {
            guard isEnabled else { return }
            isPressed.toggle()
        } label: {
            HStack(spacing: theme.space.sm) {
                if let iconName {
                    ThemeIcon(
                        name: iconName,
                        size: theme.space.md,
                        color: isPressed ? theme.colors.onSurface.default : theme.colors.muted.default
                    )
                }

                ThemeText(
                    label,
                    variant: .labelMd,
                    color: isPressed ? theme.colors.onSurface.default : theme.colors.muted.default
                )
            }
            .padding(.horizontal, theme.space.md)
            .padding(.vertical, size.verticalPadding(in: theme))
            .background(backgroundColor)
            .overlay {
                RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
                    .stroke(borderColor, lineWidth: borderColor == .clear ? 0 : 1)
            }
            .clipShape(RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous))
        }
        .buttonStyle(.plain)
        .opacity(isEnabled ? 1 : 0.7)
        .animation(.easeInOut(duration: 0.16), value: isPressed)
        .accessibilityLabel(label)
    }

    private var backgroundColor: Color {
        guard isEnabled else { return theme.colors.muted.disabled ?? theme.colors.muted.default }
        return isPressed ? theme.colors.accent.default : theme.colors.background.default
    }

    private var borderColor: Color {
        variant == .outline ? theme.colors.border.default : .clear
    }
}

enum ThemeToggleVariant: String, CaseIterable {
    case `default`
    case outline
}

enum ThemeToggleSize: String, CaseIterable {
    case sm
    case md
    case lg

    fileprivate func verticalPadding(in theme: Theme) -> CGFloat {
        switch self {
        case .sm, .md: theme.space.sm
        case .lg: theme.space.md
        }
    }
}
