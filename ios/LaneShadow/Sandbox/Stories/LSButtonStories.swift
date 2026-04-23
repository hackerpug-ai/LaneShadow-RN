import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSButtonStories {
    static let all: [Story] = [
        story(id: "atoms.button.primary", for: .primary),
        story(id: "atoms.button.secondary", for: .secondary),
        story(id: "atoms.button.ghost", for: .ghost),
        story(id: "atoms.button.accept", for: .accept),
        story(id: "atoms.button.destructive", for: .destructive),
        story(id: "atoms.button.outline", for: .outline),
    ]

    private static func story(id: String, for variant: LSButtonVariant) -> Story {
        Story(
            id: id,
            tier: .atom,
            component: "LSButton",
            name: variant.storyName,
            summary: "Token-resolved \(variant.storyName.lowercased()) button atom.",
            argTypes: [
                ArgType("title", label: "Title", control: .text),
                ArgType("isDisabled", label: "Disabled", control: .boolean),
                ArgType("leadingIcon", label: "Leading Icon", control: .select(options: ["none", "sparkle", "plus"])),
            ],
            initialArgs: ArgValues([
                "title": variant.defaultTitle,
                "isDisabled": false,
                "leadingIcon": variant == .outline ? "sparkle" : "none",
            ])
        ) { args in
            LSButtonStoryView(variant: variant, args: args)
        }
    }
}

private struct LSButtonStoryView: View {
    @Environment(\.theme) private var theme

    let variant: LSButtonVariant
    let args: ArgValues

    var body: some View {
        VStack(alignment: .leading, spacing: theme.space.lg) {
            LSButton(
                title: args.string("title", default: variant.defaultTitle),
                variant: variant,
                leadingIcon: leadingIcon,
                isDisabled: args.bool("isDisabled")
            ) {}

            LSButton(
                title: "Disabled",
                variant: variant,
                leadingIcon: variant == .outline ? .sparkle : nil,
                isDisabled: true
            ) {}

            VStack(alignment: .leading, spacing: theme.space.md) {
                Text("State Matrix")
                    .font(theme.type.label.sm.font)
                    .foregroundStyle(theme.colors.onSurface.default)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: theme.space.md) {
                        statePreview("Default", state: .default)
                        statePreview("Hover", state: .hover)
                        statePreview("Pressed", state: .pressed)
                        statePreview("Focus", state: .focus)
                        statePreview("Disabled", state: .disabled)
                    }
                    .padding(.vertical, theme.space.xs)
                }
            }
        }
        .padding(theme.space.lg)
    }

    private var leadingIcon: IconName? {
        switch args.string("leadingIcon", default: "none") {
        case "sparkle":
            .sparkle
        case "plus":
            .plus
        default:
            nil
        }
    }

    private func statePreview(_ title: String, state: LSButtonInteractionState) -> some View {
        VStack(alignment: .leading, spacing: theme.space.sm) {
            Text(title)
                .font(theme.type.label.sm.font)
                .foregroundStyle(theme.colors.onSurface.default)

            LSButton(
                title: variant.defaultTitle,
                variant: variant,
                leadingIcon: state == .default ? leadingIcon : nil,
                isDisabled: state == .disabled
            ) {}
                .lsButtonInteractionStateOverride(state == .disabled ? nil : state)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private extension LSButtonVariant {
    var storyName: String {
        switch self {
        case .primary:
            "Primary"
        case .secondary:
            "Secondary"
        case .ghost:
            "Ghost"
        case .accept:
            "Accept"
        case .destructive:
            "Destructive"
        case .outline:
            "Outline"
        }
    }

    var defaultTitle: String {
        switch self {
        case .primary:
            "Continue"
        case .secondary:
            "Cancel"
        case .ghost:
            "Learn More"
        case .accept:
            "Accept"
        case .destructive:
            "Delete"
        case .outline:
            "NEW"
        }
    }
}
