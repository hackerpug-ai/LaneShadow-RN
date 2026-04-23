import LaneShadowTheme
import NativeSandbox
import SwiftUI
import UIKit

@MainActor
enum LSDisplayStories {
    private static let groupLabel = "Atoms / Display"

    static let all: [Story] = [
        Story(
            id: "atoms.avatar.image",
            tier: .atom,
            component: "LSAvatar",
            name: "Avatar Image",
            summary: "\(groupLabel) image avatar."
        ) { _ in
            LSAvatar(image: UIImage(systemName: "person.fill"), size: .md)
        },
        Story(
            id: "atoms.avatar.initials",
            tier: .atom,
            component: "LSAvatar",
            name: "Avatar Initials",
            summary: "\(groupLabel) initials fallback."
        ) { _ in
            LSAvatar(initials: "JR", size: .md)
        },
        Story(
            id: "atoms.avatar.size-matrix",
            tier: .atom,
            component: "LSAvatar",
            name: "Avatar Size Matrix",
            summary: "\(groupLabel) size matrix."
        ) { _ in
            LSAvatarSizeMatrixStory()
        },
        Story(
            id: "atoms.divider.default",
            tier: .atom,
            component: "LSDivider",
            name: "Divider",
            summary: "\(groupLabel) subtle divider."
        ) { _ in
            LSDisplayDividerStory()
        },
        Story(
            id: "atoms.spinner.default",
            tier: .atom,
            component: "LSSpinner",
            name: "Spinner",
            summary: "\(groupLabel) native loading spinner."
        ) { _ in
            LSSpinner()
        },
    ]
}

private struct LSAvatarSizeMatrixStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        HStack(alignment: .center, spacing: theme.space.md) {
            ForEach(LSAvatar.Size.allCases, id: \.self) { size in
                VStack(spacing: theme.space.sm) {
                    LSAvatar(initials: label(for: size), size: size)
                    LSText(label(for: size), variant: .label.sm, color: .secondary)
                }
            }
        }
        .padding(theme.space.lg)
    }

    private func label(for size: LSAvatar.Size) -> String {
        switch size {
        case .xs:
            "XS"
        case .sm:
            "SM"
        case .md:
            "MD"
        case .lg:
            "LG"
        case .xl:
            "XL"
        }
    }
}

private struct LSDisplayDividerStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        VStack(alignment: .leading, spacing: theme.space.md) {
            LSText("Above", variant: .body.md)
            LSDivider()
            LSText("Below", variant: .body.md)
        }
        .padding(theme.space.lg)
    }
}
