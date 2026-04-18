import LaneShadowTheme
import SwiftUI

struct ThemeCheckbox: View {
    @Environment(\.theme) private var theme

    @Binding var isChecked: Bool
    let label: String?
    let isEnabled: Bool
    let isIndeterminate: Bool

    init(
        isChecked: Binding<Bool>,
        label: String? = nil,
        isEnabled: Bool = true,
        isIndeterminate: Bool = false
    ) {
        _isChecked = isChecked
        self.label = label
        self.isEnabled = isEnabled
        self.isIndeterminate = isIndeterminate
    }

    var body: some View {
        Button {
            guard isEnabled else { return }
            isChecked.toggle()
        } label: {
            HStack(spacing: theme.space.sm) {
                ZStack {
                    RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
                        .fill(isActive ? theme.colors.primary.default : theme.colors.background.default)
                        .frame(width: theme.space.lg, height: theme.space.lg)

                    if isIndeterminate {
                        Capsule(style: .continuous)
                            .fill(theme.colors.onPrimary.default)
                            .frame(width: theme.space.sm, height: max(theme.space.xs / 3, 2))
                    } else if isChecked {
                        ThemeIcon(name: "check", size: theme.space.md, color: theme.colors.onPrimary.default)
                    }
                }

                if let label, !label.isEmpty {
                    ThemeText(label, variant: .bodyMd)
                }
            }
        }
        .buttonStyle(.plain)
        .opacity(isEnabled ? 1 : 0.7)
        .animation(.easeInOut(duration: 0.16), value: isChecked)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(label ?? "ThemeCheckbox")
        .accessibilityValue(isActive ? "Selected" : "Unselected")
    }

    private var isActive: Bool {
        isChecked || isIndeterminate
    }
}
