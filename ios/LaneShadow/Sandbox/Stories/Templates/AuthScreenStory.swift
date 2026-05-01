import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum AuthScreenStory {
    static let all: [Story] = [
        story(
            id: "templates.auth-screen.entry",
            name: "S00 · Entry",
            summary: "Initial three-button entry view: Continue with Apple, Google, or Email.",
            mode: .entry,
            email: ""
        ),
        story(
            id: "templates.auth-screen.email-entry",
            name: "S01 · Email Entry",
            summary: "Email field after the user chose Continue with Email, with CTA and footer links.",
            mode: .emailEntry,
            email: ""
        ),
        story(
            id: "templates.auth-screen.existing-user",
            name: "S02 · Existing User",
            summary: "Welcome back branch with recognized email row, password field, eye toggle, and forgot-password link.",
            mode: .existingUser
        ),
        story(
            id: "templates.auth-screen.new-user",
            name: "S03 · New User",
            summary: "Set up shop branch with copper prompt, display-name field, password helper, and create-account CTA.",
            mode: .newUser,
            email: "jamie.miller@hey.com"
        ),
        story(
            id: "templates.auth-screen.invalid-email",
            name: "V01 · Invalid Email",
            summary: "Email field error state with red border and inline validation copy.",
            mode: .invalidEmail,
            email: "not-an-email"
        ),
        story(
            id: "templates.auth-screen.submitting",
            name: "V02 · Submitting",
            summary: "Disabled provider and email controls with the primary CTA collapsed behind a spinner.",
            mode: .submitting,
            email: "elena@ridelaneshadow.com"
        ),
        story(
            id: "templates.auth-screen.dark",
            name: "S04 · Dark",
            summary: "Dark colorScheme AuthScreen variant with inverted Apple button and token-resolved paper background.",
            mode: .emailEntry,
            email: "",
            colorScheme: .dark
        ),
    ]

    private static func story(
        id: String,
        name: String,
        summary: String,
        mode: AuthScreenMode,
        email: String = "elena@ridelaneshadow.com",
        colorScheme: ColorScheme? = nil
    ) -> Story {
        Story(
            id: id,
            tier: .template,
            component: "AuthScreen",
            name: name,
            summary: summary,
            previewMode: .fullScreen
        ) { _ in
            AuthScreen(
                viewModel: AuthScreenViewModel.preview(
                    mode: mode,
                    auth: ClerkAuth(),
                    email: email
                )
            )
            .preferredColorScheme(colorScheme)
        }
    }
}
