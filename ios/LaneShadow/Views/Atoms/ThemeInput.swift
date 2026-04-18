import LaneShadowTheme
import SwiftUI

struct ThemeInput: View {
    @Environment(\.theme) private var theme

    let label: String?
    @Binding var text: String
    let placeholder: String
    let leftIconName: String?
    let rightIconName: String?
    let isError: Bool
    let isEditable: Bool

    init(
        label: String? = nil,
        text: Binding<String>,
        placeholder: String = "",
        leftIconName: String? = nil,
        rightIconName: String? = nil,
        isError: Bool = false,
        isEditable: Bool = true
    ) {
        self.label = label
        _text = text
        self.placeholder = placeholder
        self.leftIconName = leftIconName
        self.rightIconName = rightIconName
        self.isError = isError
        self.isEditable = isEditable
    }

    var body: some View {
        VStack(alignment: .leading, spacing: theme.space.xs) {
            if let label, !label.isEmpty {
                ThemeText(label, variant: .labelSm, color: theme.colors.muted.default)
            }

            ThemeInputChrome(
                leftIconName: leftIconName,
                rightIconName: rightIconName,
                isError: isError,
                isEditable: isEditable
            ) {
                TextField("", text: $text, prompt: prompt)
                    .textInputAutocapitalization(.never)
                    .disableAutocorrection(true)
                    .foregroundStyle(foregroundColor)
                    .disabled(!isEditable)
                    .accessibilityLabel(label ?? placeholder)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var prompt: Text? {
        placeholder.isEmpty ? nil : Text(placeholder).foregroundStyle(theme.colors.muted.default)
    }

    private var foregroundColor: Color {
        isEditable ? theme.colors.onSurface
            .default : (theme.colors.onSurface.disabled ?? theme.colors.onSurface.default)
    }
}

struct ThemeInputChrome<Content: View>: View {
    @Environment(\.theme) private var theme

    let leftIconName: String?
    let rightIconName: String?
    let isError: Bool
    let isEditable: Bool
    @ViewBuilder let content: () -> Content

    var body: some View {
        HStack(spacing: theme.space.sm) {
            if let leftIconName {
                ThemeIcon(name: leftIconName, size: theme.space.lg, color: iconTint)
            }

            content()
                .frame(maxWidth: .infinity, alignment: .leading)

            if let rightIconName {
                ThemeIcon(name: rightIconName, size: theme.space.lg, color: iconTint)
            }
        }
        .padding(.horizontal, theme.space.md)
        .padding(.vertical, theme.space.sm)
        .background(theme.colors.surface.default)
        .overlay {
            RoundedRectangle(cornerRadius: theme.radius.xl, style: .continuous)
                .stroke(borderColor, lineWidth: 1)
        }
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.xl, style: .continuous))
        .opacity(isEditable ? 1 : 0.72)
    }

    private var borderColor: Color {
        isError ? theme.colors.danger.default : theme.colors.border.default
    }

    private var iconTint: Color {
        if isError {
            return theme.colors.danger.default
        }

        return isEditable ? theme.colors.muted
            .default : (theme.colors.onSurface.disabled ?? theme.colors.onSurface.default)
    }
}
