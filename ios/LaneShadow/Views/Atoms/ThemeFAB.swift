import LaneShadowTheme
import SwiftUI

struct ThemeFAB: View {
    @Environment(\.theme) private var theme

    let iconName: String
    let label: String?
    let isVisible: Bool
    let accessibilityLabel: String?
    let action: () -> Void

    init(
        iconName: String,
        label: String? = nil,
        isVisible: Bool = true,
        accessibilityLabel: String? = nil,
        action: @escaping () -> Void
    ) {
        self.iconName = iconName
        self.label = label
        self.isVisible = isVisible
        self.accessibilityLabel = accessibilityLabel
        self.action = action
    }

    var body: some View {
        Group {
            if isVisible {
                Button(action: action) {
                    HStack(spacing: theme.space.sm) {
                        ThemeIcon(name: iconName, size: theme.space.lg, color: theme.colors.onPrimary.default)

                        if let label, !label.isEmpty {
                            ThemeText(label, variant: .labelMd, color: theme.colors.onPrimary.default)
                        }
                    }
                    .padding(.horizontal, label == nil ? theme.space.md : theme.space.lg)
                    .frame(height: theme.space.xxxl)
                    .background(theme.colors.primary.default)
                    .clipShape(Capsule(style: .continuous))
                    .shadow(color: theme.colors.scrim.default.opacity(0.18), radius: 8, x: 0, y: 4)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(accessibilityLabel ?? label ?? "ThemeFAB")
            }
        }
    }
}
