import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSPillStories {
    static let all: [Story] = [
        Story(
            id: "atoms.pill.sm",
            tier: .atom,
            component: "LSPill",
            name: "Small Pill",
            summary: "Pill component at small size (24pt height)"
        ) { _ in
            LSPill(size: .sm) {
                LSText("Small", variant: .ui.label.sm)
            }
        },

        Story(
            id: "atoms.pill.md",
            tier: .atom,
            component: "LSPill",
            name: "Medium Pill",
            summary: "Pill component at medium size (32pt height)"
        ) { _ in
            LSPill(size: .md) {
                LSText("Medium", variant: .ui.label.sm)
            }
        },

        Story(
            id: "atoms.pill.lg",
            tier: .atom,
            component: "LSPill",
            name: "Large Pill",
            summary: "Pill component at large size (40pt height)"
        ) { _ in
            LSPill(size: .lg) {
                LSText("Large", variant: .ui.label.md)
            }
        },

        Story(
            id: "atoms.pill.iconLabel",
            tier: .atom,
            component: "LSPill",
            name: "Pill with Icon + Label",
            summary: "Pill with icon and text content"
        ) { _ in
            LSPill(size: .md) {
                HStack(spacing: 4) {
                    Image(systemName: "checkmark")
                        .font(.system(size: 12))
                    LSText("Complete", variant: .ui.label.sm)
                }
            }
        },

        Story(
            id: "atoms.pill.iconOnly",
            tier: .atom,
            component: "LSPill",
            name: "Pill with Icon Only",
            summary: "Pill with icon-only content"
        ) { _ in
            LSPill(size: .md) {
                Image(systemName: "heart.fill")
                    .font(.system(size: 16))
            }
        },
    ]
}
