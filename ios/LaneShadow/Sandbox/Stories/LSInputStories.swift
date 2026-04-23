import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSInputStories {
    static let all: [Story] = [
        Story(
            id: "atoms.textfield.default",
            tier: .atom,
            component: "LSTextField",
            name: "Default",
            summary: "Token-backed single-line field with placeholder text."
        ) { _ in
            TextFieldDefaultStory()
        },
        Story(
            id: "atoms.textfield.focused",
            tier: .atom,
            component: "LSTextField",
            name: "Focused",
            summary: "Focused field with copper border treatment."
        ) { _ in
            TextFieldFocusedStory()
        },
        Story(
            id: "atoms.textfield.error",
            tier: .atom,
            component: "LSTextField",
            name: "Error",
            summary: "Error treatment with helper copy."
        ) { _ in
            TextFieldErrorStory()
        },
        Story(
            id: "atoms.textfield.disabled",
            tier: .atom,
            component: "LSTextField",
            name: "Disabled",
            summary: "Disabled field with suppressed editing."
        ) { _ in
            TextFieldDisabledStory()
        },
        Story(
            id: "atoms.textfield.with-icon",
            tier: .atom,
            component: "LSTextField",
            name: "With Icon",
            summary: "Leading icon slot routed through LSIcon."
        ) { _ in
            TextFieldIconStory()
        },
        Story(
            id: "atoms.textarea.default",
            tier: .atom,
            component: "LSTextArea",
            name: "Default",
            summary: "Token-backed multi-line field."
        ) { _ in
            TextAreaDefaultStory()
        },
        Story(
            id: "atoms.textarea.autogrow",
            tier: .atom,
            component: "LSTextArea",
            name: "Auto Grow",
            summary: "Auto-growing multi-line field sized from content."
        ) { _ in
            TextAreaAutogrowStory()
        },
    ]
}

private struct TextFieldDefaultStory: View {
    @State private var value = ""

    var body: some View {
        InputStoryFrame {
            LSTextField(value: $value, placeholder: "Email")
        }
    }
}

private struct TextFieldFocusedStory: View {
    @State private var value = "Marin Headlands"

    var body: some View {
        InputStoryFrame {
            LSTextField(value: $value, placeholder: "Destination", state: .focused)
        }
    }
}

private struct TextFieldErrorStory: View {
    @State private var value = "xxxxxx"

    var body: some View {
        InputStoryFrame {
            LSTextField(
                value: $value,
                placeholder: "Destination",
                state: .error,
                helperText: "Location not recognized. Try a city or landmark."
            )
        }
    }
}

private struct TextFieldDisabledStory: View {
    @State private var value = "Set by Navigator"

    var body: some View {
        InputStoryFrame {
            LSTextField(
                value: $value,
                placeholder: "Set automatically",
                state: .disabled,
                helperText: "This field is managed upstream."
            )
        }
    }
}

private struct TextFieldIconStory: View {
    @State private var value = ""

    var body: some View {
        InputStoryFrame {
            LSTextField(
                value: $value,
                placeholder: "Search routes",
                leadingIcon: .route
            )
        }
    }
}

private struct TextAreaDefaultStory: View {
    @State private var value = ""

    var body: some View {
        InputStoryFrame {
            LSTextArea(value: $value, placeholder: "Add notes", autoGrow: false)
        }
    }
}

private struct TextAreaAutogrowStory: View {
    @State private var value = """
    Scenic turnout before the ridge.
    Coffee stop near the lake.
    Fuel before the canyon stretch.
    """

    var body: some View {
        InputStoryFrame {
            LSTextArea(value: $value, placeholder: "Route notes", autoGrow: true)
        }
    }
}

private struct InputStoryFrame<Content: View>: View {
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
