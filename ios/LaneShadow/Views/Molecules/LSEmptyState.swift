import LaneShadowTheme
import SwiftUI

public struct LSEmptyState: View {
    @Environment(\.theme) private var theme

    private let icon: IconName?
    private let title: String
    private let bodyText: String?
    private let action: EmptyStateAction?

    public enum EmptyStateAction {
        case primary(String, () -> Void)
        case secondary(String, () -> Void)
        case ghost(String, () -> Void)
    }

    public init(
        icon: IconName? = nil,
        title: String,
        body: String? = nil,
        action: EmptyStateAction? = nil
    ) {
        self.icon = icon
        self.title = title
        bodyText = body
        self.action = action
    }

    public var body: some View {
        VStack(spacing: theme.space.md) {
            if let icon {
                LSIcon(name: icon, size: .xl, color: .tertiary)
                    .frame(width: 64, height: 64)
                    .background(
                        RoundedRectangle(cornerRadius: theme.radius.lg)
                            .fill(theme.colors.surfaceVariant.default)
                            .overlay(
                                RoundedRectangle(cornerRadius: theme.radius.lg)
                                    .stroke(theme.colors.border.default, lineWidth: theme.borderWidth.thin)
                            )
                    )
            }

            LSText(title, variant: .title.md, color: .primary)

            if let bodyText {
                LSText(bodyText, variant: .body.md, color: .secondary)
                    .multilineTextAlignment(.center)
            }

            if let action {
                switch action {
                case let .primary(title, callback):
                    LSButton(title, variant: .primary, action: callback)
                case let .secondary(title, callback):
                    LSButton(title, variant: .secondary, action: callback)
                case let .ghost(title, callback):
                    LSButton(title, variant: .ghost, action: callback)
                }
            }
        }
        .padding(theme.space.xl)
        .frame(maxWidth: .infinity, alignment: .center)
        .accessibilityIdentifier("lsemptystate")
    }
}
