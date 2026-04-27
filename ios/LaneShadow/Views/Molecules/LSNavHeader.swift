import LaneShadowTheme
import NativeTheme
import SwiftUI

public extension TypographyVariant {
    struct UIVariants: Sendable {
        public struct UITitleVariants: Sendable {
            public let md = TypographyVariant.title.md
        }

        public let title = UITitleVariants()
    }

    static let ui = UIVariants()
}

public enum LSNavHeaderVariant {
    case `default`
    case largeTitle
}

public struct LSNavHeader: View {
    @Environment(\.theme) private var theme

    let variant: LSNavHeaderVariant
    let title: String
    let subtitle: String?
    let leading: LSToolbarLeading
    let trailing: LSToolbarTrailing

    var titleText: String {
        title
    }

    var resolvedTitleVariant: TypographyVariant {
        switch variant {
        case .default:
            .title.md
        case .largeTitle:
            .heading.lg
        }
    }

    var toolbarHeight: CGFloat {
        theme.space.xxxl + theme.space.sm
    }

    public init(
        variant: LSNavHeaderVariant,
        title: String,
        subtitle: String? = nil,
        leading: LSToolbarLeading = .none,
        trailing: LSToolbarTrailing = .none
    ) {
        self.variant = variant
        self.title = title
        self.subtitle = subtitle
        self.leading = leading
        self.trailing = trailing
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: theme.space.xs) {
            switch variant {
            case .default:
                toolbarRow(inlineTitle: true)
            case .largeTitle:
                toolbarRow(inlineTitle: false)
                largeTitleRow
            }
        }
        .padding(.bottom, variant == .largeTitle ? theme.space.lg : zeroSpacing)
        .background(LaneShadowTheme.color.surface.primary)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(LaneShadowTheme.color.border.default)
                .frame(height: theme.borderWidth.hairline)
                .accessibilityHidden(true)
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("lsnavheader")
    }

    private var largeTitleRow: some View {
        VStack(alignment: .leading, spacing: theme.space.xs) {
            LSText(title, variant: .opinion.lg)
                .lineLimit(2)

            if let subtitle {
                LSText(subtitle, variant: .body.md, color: .secondary)
                    .lineLimit(2)
            }
        }
        .padding(.horizontal, theme.space.lg)
    }

    private func toolbarRow(inlineTitle: Bool) -> some View {
        HStack(spacing: theme.space.xs) {
            navLeadingSlot
                .frame(minWidth: theme.touchTarget.minTouchTarget, alignment: .leading)

            if inlineTitle {
                LSText(title, variant: .ui.title.md)
                    .lineLimit(1)
                    .frame(maxWidth: .infinity, alignment: .center)
            } else {
                Spacer(minLength: 0)
                    .frame(maxWidth: .infinity)
            }

            navTrailingSlot
                .frame(minWidth: theme.touchTarget.minTouchTarget, alignment: .trailing)
        }
        .padding(.horizontal, theme.space.lg)
        .frame(height: toolbarHeight)
    }

    @ViewBuilder
    private var navLeadingSlot: some View {
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
        }
    }

    @ViewBuilder
    private var navTrailingSlot: some View {
        switch trailing {
        case .none:
            Color.clear
                .frame(width: theme.touchTarget.minTouchTarget, height: theme.touchTarget.minTouchTarget)
                .accessibilityHidden(true)
        case let .action(icon, action):
            LSButton("", variant: .ghost, size: .md, action: action)
                .overlay {
                    LSIcon(name: icon, size: .md, color: .primary)
                }
                .accessibilityLabel("Header action")
        case let .actions(actions):
            HStack(spacing: theme.space.xs) {
                ForEach(Array(actions.enumerated()), id: \.offset) { index, item in
                    LSButton("", variant: .ghost, size: .md, action: item.action)
                        .overlay {
                            LSIcon(name: item.icon, size: .md, color: .primary)
                        }
                        .accessibilityLabel("Header action \(index + 1)")
                }
            }
        }
    }

    private var zeroSpacing: CGFloat {
        theme.space.xs - theme.space.xs
    }
}
