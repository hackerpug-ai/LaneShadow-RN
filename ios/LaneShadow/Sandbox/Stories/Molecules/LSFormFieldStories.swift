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
