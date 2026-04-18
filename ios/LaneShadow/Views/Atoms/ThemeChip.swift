import LaneShadowTheme
import SwiftUI

struct ThemeChip: View {
    @Environment(\.theme) private var theme

    let label: String
    let iconName: String?
    let isSelected: Bool
    let isEnabled: Bool
    let action: () -> Void

    init(
        _ label: String,
        iconName: String? = nil,
        isSelected: Bool = false,
        isEnabled: Bool = true,
        action: @escaping () -> Void
    ) {
        self.label = label
        self.iconName = iconName
        self.isSelected = isSelected
        self.isEnabled = isEnabled
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: theme.space.xs) {
                if let iconName {
                    ThemeIcon(name: iconName, size: theme.space.md, color: iconColor)
                }

                ThemeText(label, variant: .labelSm, color: foregroundColor)
            }
            .padding(.horizontal, theme.space.md)
            .padding(.vertical, 6)
            .background(backgroundColor)
            .overlay {
                Capsule(style: .continuous)
                    .stroke(borderColor, lineWidth: 1)
            }
            .clipShape(Capsule(style: .continuous))
        }
        .buttonStyle(.plain)
        .opacity(isEnabled ? 1 : 0.7)
        .accessibilityLabel(label)
    }

    private var backgroundColor: Color {
        guard isEnabled else { return theme.colors.muted.disabled ?? theme.colors.muted.default }
        return isSelected ? theme.colors.primary.default.opacity(0.12) : .clear
    }

    private var borderColor: Color {
        isSelected ? theme.colors.primary.default.opacity(0.4) : theme.colors.border.default
    }

    private var foregroundColor: Color {
        guard isEnabled else { return theme.colors.onSurface.disabled ?? theme.colors.onSurface.default }
        return isSelected ? theme.colors.primary.default : theme.colors.onSurface.default
    }

    private var iconColor: Color {
        isSelected ? theme.colors.primary.default : theme.colors.muted.default
    }
}
