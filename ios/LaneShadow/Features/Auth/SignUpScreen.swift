import LaneShadowTheme
import SwiftUI

struct SignUpScreen: View {
    @Environment(\.theme) private var theme

    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""

    var body: some View {
        AuthBackgroundContainer {
            VStack(spacing: theme.space.md) {
                LSText("Create account", variant: .title.md)
                LSTextField(value: $name, placeholder: "Name")
                LSTextField(value: $email, placeholder: "Email")
                LSTextField(value: $password, placeholder: "Password")
                LSTextField(value: $confirmPassword, placeholder: "Confirm password")
                LSButton("Create account") {}
            }
            .padding(theme.space.lg)
        }
        .navigationTitle("Sign Up")
    }
}
