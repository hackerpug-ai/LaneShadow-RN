import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSChatInputStories {
    static let all: [Story] = [
        Story(
            id: "molecules.chatinput.default",
            tier: .molecule,
            component: "LSChatInput",
            name: "Default",
            summary: "Empty state with sliders trailing icon."
        ) { _ in
            ChatInputDefaultStory()
        },
        Story(
            id: "molecules.chatinput.with-text",
            tier: .molecule,
            component: "LSChatInput",
            name: "With Text",
            summary: "Non-empty value with send button shown."
        ) { _ in
            ChatInputWithTextStory()
        },
        Story(
            id: "molecules.chatinput.with-suggestions-location",
            tier: .molecule,
            component: "LSChatInput",
            name: "With Suggestions + Location",
            summary: "With suggestion chips and location context bar."
        ) { _ in
            ChatInputWithSuggestionsAndLocationStory()
        },
        Story(
            id: "molecules.chatinput.thinking",
            tier: .molecule,
            component: "LSChatInput",
            name: "Thinking",
            summary: "Spinner state with disabled input."
        ) { _ in
            ChatInputThinkingStory()
        },
        Story(
            id: "molecules.chatinput.disabled",
            tier: .molecule,
            component: "LSChatInput",
            name: "Disabled",
            summary: "Disabled state with opacity applied."
        ) { _ in
            ChatInputDisabledStory()
        },
        Story(
            id: "molecules.chatinput.refining-prompt",
            tier: .molecule,
            component: "LSChatInput",
            name: "Refining Prompt",
            summary: "Long placeholder text for refinement context."
        ) { _ in
            ChatInputRefiningPromptStory()
        },
    ]
}

private struct ChatInputDefaultStory: View {
    @State private var text = ""

    var body: some View {
        MoleculeStoryFrame {
            LSChatInput(
                value: $text,
                placeholder: "Plan a ride…",
                onSend: { _ in },
                onCollapse: { },
                onFilter: { }
            )
        }
    }
}

private struct ChatInputWithTextStory: View {
    @State private var text = "30-mile gravel ride from Sugar House"

    var body: some View {
        MoleculeStoryFrame {
            LSChatInput(
                value: $text,
                placeholder: "Plan a ride…",
                onSend: { _ in },
                onCollapse: { },
                onFilter: { }
            )
        }
    }
}

private struct ChatInputWithSuggestionsAndLocationStory: View {
    @State private var text = ""

    var body: some View {
        MoleculeStoryFrame {
            LSChatInput(
                value: $text,
                placeholder: "Plan a ride…",
                onSend: { _ in },
                onCollapse: { },
                onFilter: { },
                suggestions: [
                    SuggestionChip(label: "Twisty back roads"),
                    SuggestionChip(label: "Avoid highway"),
                    SuggestionChip(label: "Scenic canyon")
                ],
                locationBadge: LocationContext(
                    label: "Near Santa Cruz, CA",
                    mode: .manual
                )
            )
        }
    }
}

private struct ChatInputThinkingStory: View {
    @State private var text = "Plan a coastal route"

    var body: some View {
        MoleculeStoryFrame {
            LSChatInput(
                value: $text,
                placeholder: "Plan a ride…",
                onSend: { _ in },
                onCollapse: { },
                onFilter: { },
                isThinking: true
            )
        }
    }
}

private struct ChatInputDisabledStory: View {
    @State private var text = "No connection"

    var body: some View {
        MoleculeStoryFrame {
            LSChatInput(
                value: $text,
                placeholder: "Plan a ride…",
                onSend: { _ in },
                onCollapse: { },
                onFilter: { },
                isEnabled: false
            )
        }
    }
}

private struct ChatInputRefiningPromptStory: View {
    @State private var text = ""

    var body: some View {
        MoleculeStoryFrame {
            LSChatInput(
                value: $text,
                placeholder: "Refine your route preferences — add waypoints, surface types, elevation targets, or scenic priorities…",
                onSend: { _ in },
                onCollapse: { },
                onFilter: { }
            )
        }
    }
}
