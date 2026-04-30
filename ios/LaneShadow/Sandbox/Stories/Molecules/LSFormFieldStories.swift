import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSFormFieldStories {
    static let all: [Story] = [
        Story(
            id: "molecules.formfield.default",
            tier: .molecule,
            component: "LSFormField",
            name: "Default",
            summary: "Form field with label and input."
        ) { _ in
            FormFieldDefaultStory()
        },
        Story(
            id: "molecules.formfield.focused",
            tier: .molecule,
            component: "LSFormField",
            name: "Focused",
            summary: "Form field with focused input."
        ) { _ in
            FormFieldFocusedStory()
        },
        Story(
            id: "molecules.formfield.error",
            tier: .molecule,
            component: "LSFormField",
            name: "Error",
            summary: "Form field with error message."
        ) { _ in
            FormFieldErrorStory()
        },
        Story(
            id: "molecules.formfield.auth.email-default",
            tier: .molecule,
            component: "LSFormField",
            name: "Auth Email Default",
            summary: "Auth email field with leading mail icon and helper text."
        ) { _ in
            AuthEmailFormFieldStory()
        },
        Story(
            id: "molecules.formfield.auth.password-secure",
            tier: .molecule,
            component: "LSFormField",
            name: "Auth Password Secure",
            summary: "Auth password field with lock icon and eye affordance."
        ) { _ in
            AuthPasswordFormFieldStory()
        },
        Story(
            id: "molecules.formfield.auth.error",
            tier: .molecule,
            component: "LSFormField",
            name: "Auth Error",
            summary: "Auth field in error state with error copy."
        ) { _ in
            AuthErrorFormFieldStory()
        },
        Story(
            id: "molecules.formfield.auth.disabled",
            tier: .molecule,
            component: "LSFormField",
            name: "Auth Disabled",
            summary: "Disabled auth field state."
        ) { _ in
            AuthDisabledFormFieldStory()
        },
        Story(
            id: "molecules.auth-provider-button.apple",
            tier: .molecule,
            component: "LSAuthProviderButton",
            name: "Apple",
            summary: "Apple auth provider button."
        ) { _ in
            AuthProviderAppleStory()
        },
        Story(
            id: "molecules.auth-provider-button.google",
            tier: .molecule,
            component: "LSAuthProviderButton",
            name: "Google",
            summary: "Google auth provider button."
        ) { _ in
            AuthProviderGoogleStory()
        },
    ]
}

private struct FormFieldDefaultStory: View {
    @State private var email = ""

    var body: some View {
        MoleculeStoryFrame {
            LSFormField(
                label: "Email",
                value: $email,
                placeholder: "you@example.com"
            )
        }
    }
}

private struct FormFieldFocusedStory: View {
    @State private var email = "user@example.com"

    var body: some View {
        MoleculeStoryFrame {
            LSFormField(
                label: "Email",
                value: $email,
                placeholder: "you@example.com"
            )
        }
    }
}

private struct FormFieldErrorStory: View {
    @State private var email = "invalid-email"

    var body: some View {
        MoleculeStoryFrame {
            LSFormField(
                label: "Email",
                value: $email,
                placeholder: "you@example.com",
                error: "Please enter a valid email address"
            )
        }
    }
}

private struct AuthEmailFormFieldStory: View {
    @State private var email = ""

    var body: some View {
        MoleculeStoryFrame {
            LSFormField(
                label: "Email",
                value: $email,
                placeholder: "you@example.com",
                helperText: "We’ll check if this account already exists.",
                leadingIcon: .route
            )
        }
    }
}

private struct AuthPasswordFormFieldStory: View {
    @State private var password = "password"

    var body: some View {
        MoleculeStoryFrame {
            LSFormField(
                label: "Password",
                value: $password,
                placeholder: "••••••••",
                helperText: "At least 8 characters.",
                isSecureEntry: true,
                leadingIcon: .star,
                trailingIcon: .circle
            )
        }
    }
}

private struct AuthErrorFormFieldStory: View {
    @State private var email = "invalid-email"

    var body: some View {
        MoleculeStoryFrame {
            LSFormField(
                label: "Email",
                value: $email,
                placeholder: "you@example.com",
                error: "Enter a valid email address.",
                leadingIcon: .route
            )
        }
    }
}

private struct AuthDisabledFormFieldStory: View {
    @State private var email = "elena@ridelaneshadow.com"

    var body: some View {
        MoleculeStoryFrame {
            LSFormField(
                label: "Email",
                value: $email,
                placeholder: "you@example.com",
                helperText: "Field is disabled while submitting.",
                state: .disabled,
                leadingIcon: .route
            )
        }
    }
}

private struct AuthProviderAppleStory: View {
    var body: some View {
        MoleculeStoryFrame {
            LSAuthProviderButton(provider: .apple) {}
        }
    }
}

private struct AuthProviderGoogleStory: View {
    var body: some View {
        MoleculeStoryFrame {
            LSAuthProviderButton(provider: .google) {}
        }
    }
}

struct MoleculeStoryFrame<Content: View>: View {
    @Environment(\.theme) private var theme

    private let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: theme.space.lg) {
            content
        }
        .padding(theme.space.lg)
        .background(theme.colors.surface.default)
    }
}
