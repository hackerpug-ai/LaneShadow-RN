import LaneShadowTheme
import SwiftUI

struct AuthSecureTextEntry: View {
    @Binding var value: String
    let placeholder: String
    @Binding var visibility: AuthPasswordVisibilityState

    var body: some View {
        HStack {
            LSTextField(
                value: $value,
                placeholder: placeholder,
                isSecureEntry: visibility.isSecureEntry
            )

            Button {
                visibility.toggle()
            } label: {
                LSText(visibility.isSecureEntry ? "Show" : "Hide", variant: .body.sm)
            }
            .buttonStyle(.plain)
            .accessibilityIdentifier("auth-password-visibility-toggle")
        }
    }
}
