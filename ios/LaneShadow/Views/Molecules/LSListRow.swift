import LaneShadowTheme
import NativeTheme
import SwiftUI
import UIKit

public enum LSListRowLeading {
    case icon(IconName)
    case avatar(image: UIImage? = nil, initials: String? = nil, size: LSAvatar.Size = .sm)
}

public enum LSListRowTrailing {
    case none
    case icon(IconName)
    case chevron
    case toggle(isOn: Bool)
    case button(title: String, variant: LSButtonVariant = .outline, action: () -> Void)
}

public struct LSListRow: View {
    @Environment(\.theme) private var theme

    let leading: LSListRowLeading
    let title: String
    let subtitle: String?
    let trailing: LSListRowTrailing
    private let onTap: (() -> Void)?
    private let showDivider: Bool

    var isInteractive: Bool {
        onTap != nil
    }

    public init(
        leading: LSListRowLeading,
        title: String,
        subtitle: String? = nil,
        trailing: LSListRowTrailing = .none,
        onTap: (() -> Void)? = nil,
        showDivider: Bool = false
    ) {
        self.leading = leading
        self.title = title
        self.subtitle = subtitle
        self.trailing = trailing
        self.onTap = onTap
        self.showDivider = showDivider
    }

    public var body: some View {
        VStack(spacing: Self.zeroSpacing(in: theme)) {
            if onTap != nil {
                Button(action: handleTap) {
                    rowContent(backgroundColor: Self.interactiveBackground(isPressed: false, in: theme))
                }
                .buttonStyle(LSListRowButtonStyle())
                .accessibilityAddTraits(.isButton)
                .accessibilityIdentifier("lslistrow-interactive")
            } else {
                rowContent(backgroundColor: Self.interactiveBackground(isPressed: false, in: theme))
                    .accessibilityIdentifier("lslistrow-static")
            }

            if showDivider {
                LSDivider()
            }
        }
        .accessibilityElement(children: .contain)
    }

    func handleTap() {
        onTap?()
    }

    func backgroundToken(isPressed: Bool) -> String {
        guard isInteractive, isPressed else {
            return "color.surface.card"
        }
        return "color.surface.inset"
    }

    private func rowContent(backgroundColor: Color) -> some View {
        HStack(spacing: theme.space.sm) {
            leadingView

            VStack(alignment: .leading, spacing: theme.space.xs) {
                LSText(title, variant: .body.md)
                if let subtitle {
                    LSText(subtitle, variant: .label.sm, color: .secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            trailingView
        }
        .padding(.vertical, theme.space.xs)
        .padding(.horizontal, theme.space.md)
        .frame(minHeight: theme.touchTarget.minTouchTarget)
        .background(backgroundColor)
    }

    @ViewBuilder
    private var leadingView: some View {
        switch leading {
        case let .icon(iconName):
            LSIcon(name: iconName, size: .sm, color: .secondary)
                .frame(width: theme.touchTarget.minTouchTarget, height: theme.touchTarget.minTouchTarget)
        case let .avatar(image, initials, size):
            LSAvatar(image: image, initials: initials, size: size)
        }
    }

    @ViewBuilder
    private var trailingView: some View {
        switch trailing {
        case .none:
            EmptyView()
        case let .icon(iconName):
            LSIcon(name: iconName, size: .sm, color: .tertiary)
        case .chevron:
            LSIcon(name: .chevR, size: .sm, color: .subtle)
        case let .toggle(isOn):
            LSIcon(name: isOn ? .circleFill : .circle, size: .sm, color: .signal)
        case let .button(buttonTitle, variant, action):
            LSButton(buttonTitle, variant: variant, size: .sm, action: action)
        }
    }
}

private struct LSListRowButtonStyle: ButtonStyle {
    @Environment(\.theme) private var theme

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .background(
                LSListRow.interactiveBackground(
                    isPressed: configuration.isPressed,
                    in: theme
                )
            )
    }
}

extension LSListRow {
    static func interactiveBackground(isPressed: Bool, in _: Theme) -> Color {
        if isPressed {
            LaneShadowTheme.color.surface.inset
        } else {
            LaneShadowTheme.color.surface.card
        }
    }

    static func zeroSpacing(in theme: Theme) -> CGFloat {
        theme.space.xs - theme.space.xs
    }
}
