import LaneShadowTheme
import SwiftUI

struct ThemeSwitch: View {
    @Environment(\.theme) private var theme

    @Binding var isOn: Bool
    let label: String?
    let isEnabled: Bool

    init(
        isOn: Binding<Bool>,
        label: String? = nil,
        isEnabled: Bool = true
    ) {
        _isOn = isOn
        self.label = label
        self.isEnabled = isEnabled
    }

    var body: some View {
        Button {
            guard isEnabled else { return }
            isOn.toggle()
        } label: {
            HStack(spacing: theme.space.sm) {
                if let label, !label.isEmpty {
                    ThemeText(label, variant: .bodyMd)
                }

                RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                    .fill(trackColor)
                    .frame(width: theme.space.xxxxl, height: theme.space.xxl)
                    .overlay(alignment: isOn ? .trailing : .leading) {
                        Circle()
                            .fill(theme.colors.surface.default)
                            .frame(width: theme.space.lg, height: theme.space.lg)
                            .padding(theme.space.xs)
                    }
            }
        }
        .buttonStyle(.plain)
        .opacity(isEnabled ? 1 : 0.7)
        .animation(.easeInOut(duration: 0.18), value: isOn)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(label ?? "ThemeSwitch")
        .accessibilityValue(isOn ? "On" : "Off")
    }

    private var trackColor: Color {
        if !isEnabled {
            return isOn ? (theme.colors.primary.disabled ?? theme.colors.primary.default) :
                (theme.colors.input.disabled ?? theme.colors.input.default)
        }

        return isOn ? theme.colors.primary.default : theme.colors.input.default
    }
}
