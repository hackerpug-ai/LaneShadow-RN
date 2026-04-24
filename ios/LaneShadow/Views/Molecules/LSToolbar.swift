import LaneShadowTheme
import NativeTheme
import SwiftUI

public struct LSToolbarAction {
    let icon: IconName
    let action: () -> Void

    public init(icon: IconName, action: @escaping () -> Void) {
        self.icon = icon
        self.action = action
    }
}

public enum LSToolbarLeading {
    case none
    case back(action: () -> Void)
}

public enum LSToolbarTrailing {
    case none
    case action(icon: IconName, action: () -> Void)
    case actions([LSToolbarAction])
}

public struct LSToolbar: View {
    @Environment(\.theme) private var theme

    let leading: LSToolbarLeading
    let title: String
    let trailing: LSToolbarTrailing

    var titleText: String {
        title
    }

    var heightTokenPath: String {
        "sizing.component.toolbarHeight"
    }

    var surfaceTokenPath: String {
        "color.surface.primary"
    }

    var toolbarHeight: CGFloat {
        theme.space.xxxl + theme.space.sm
    }

    public init(
        leading: LSToolbarLeading = .none,
        title: String,
        trailing: LSToolbarTrailing = .none
    ) {
        self.leading = leading
        self.title = title
        self.trailing = trailing
    }

    public var body: some View {
        Color.clear
            .frame(height: 0)
            .safeAreaInset(edge: .top, spacing: 0) {
                toolbarRow
            }
    }

    private var toolbarRow: some View {
        HStack(spacing: theme.space.xs) {
            leadingSlot
                .frame(minWidth: theme.touchTarget.minTouchTarget, alignment: .leading)

            LSText(title, variant: .ui.title.md)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .center)

            trailingSlot
                .frame(minWidth: theme.touchTarget.minTouchTarget, alignment: .trailing)
        }
        .padding(.horizontal, theme.space.xs)
        .frame(height: toolbarHeight)
        .background(LaneShadowTheme.color.surface.primary)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(LaneShadowTheme.color.border.subtle)
                .frame(height: theme.borderWidth.hairline)
                .accessibilityHidden(true)
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("lstoolbar")
    }

    @ViewBuilder
    private var leadingSlot: some View {
        switch leading {
        case .none:
            Color.clear
                .frame(width: theme.touchTarget.minTouchTarget, height: theme.touchTarget.minTouchTarget)
                .accessibilityHidden(true)
        case let .back(action):
            LSButton("", variant: .ghost, size: .md, action: action)
                .overlay {
                    LSIcon(name: .chevL, size: .md, color: .primary)
                }
                .accessibilityLabel("Go back")
                .accessibilityIdentifier("lstoolbar-leading-back")
        }
    }

    @ViewBuilder
    private var trailingSlot: some View {
        switch trailing {
        case .none:
            Color.clear
                .frame(width: theme.touchTarget.minTouchTarget, height: theme.touchTarget.minTouchTarget)
                .accessibilityHidden(true)
        case let .action(icon, action):
            iconButton(icon: icon, accessibilityLabel: "Toolbar action", action: action)
                .accessibilityIdentifier("lstoolbar-trailing-action")
        case let .actions(actions):
            HStack(spacing: theme.space.xs) {
                ForEach(Array(actions.enumerated()), id: \.offset) { index, item in
                    iconButton(icon: item.icon, accessibilityLabel: "Toolbar action \(index + 1)", action: item.action)
                        .accessibilityIdentifier("lstoolbar-trailing-action-\(index)")
                }
            }
        }
    }

    private func iconButton(
        icon: IconName,
        accessibilityLabel: String,
        action: @escaping () -> Void
    ) -> some View {
        LSButton("", variant: .ghost, size: .md, action: action)
            .overlay {
                LSIcon(name: icon, size: .md, color: .primary)
            }
            .accessibilityLabel(accessibilityLabel)
    }
}
