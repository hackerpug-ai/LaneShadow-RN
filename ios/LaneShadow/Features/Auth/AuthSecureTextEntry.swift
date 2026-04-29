import LaneShadowTheme
import SwiftUI

struct AuthSecureTextEntry: View {
    @Environment(\.theme) private var theme

    @Binding var value: String
    let placeholder: String
    @Binding var visibility: AuthPasswordVisibilityState

    var body: some View {
        HStack(spacing: theme.space.sm) {
            Group {
                if visibility.isSecureEntry {
                    SecureField(placeholder, text: $value)
                } else {
                    TextField(placeholder, text: $value)
                }
            }
            .font(theme.type.body.lg.font)
            .foregroundStyle(theme.colors.onSurface.default)

            Button {
                visibility.toggle()
            } label: {
                LSText(visibility.isSecureEntry ? "Show" : "Hide", variant: .body.sm)
            }
            .buttonStyle(.plain)
            .accessibilityIdentifier("auth-password-visibility-toggle")
        }
        .padding(.horizontal, theme.space.md)
        .frame(minHeight: theme.control.minHeight)
        .background(theme.colors.input.default)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.sm))
        .overlay {
            RoundedRectangle(cornerRadius: theme.radius.sm)
                .stroke(theme.colors.border.default, lineWidth: theme.borderWidth.thin)
        }
    }
}
