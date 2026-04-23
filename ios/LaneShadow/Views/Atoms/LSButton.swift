import LaneShadowTheme
import SwiftUI

public enum LSButtonVariant: CaseIterable, Hashable, Sendable {
    case primary
    case secondary
    case ghost
    case accept
    case destructive
    case outline
}

public enum LSButtonSize: CaseIterable, Hashable, Sendable {
    case sm
    case md
    case lg
}

public struct LSButton: View {
    @State private var isHovered = false

    private let title: String
    private let variant: LSButtonVariant
    private let size: LSButtonSize
    private let leadingIcon: IconName?
    private let trailingIcon: IconName?
    private let isDisabled: Bool
    private let action: () -> Void

    public init(
        title: String,
        variant: LSButtonVariant = .primary,
        size: LSButtonSize = .md,
        leadingIcon: IconName? = nil,
        trailingIcon: IconName? = nil,
        isDisabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.variant = variant
        self.size = size
        self.leadingIcon = leadingIcon
        self.trailingIcon = trailingIcon
        self.isDisabled = isDisabled
        self.action = action
    }

    public init(
        _ title: String,
        variant: LSButtonVariant = .primary,
        size: LSButtonSize = .md,
        leadingIcon: IconName? = nil,
        trailingIcon: IconName? = nil,
        isDisabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.init(
            title: title,
            variant: variant,
            size: size,
            leadingIcon: leadingIcon,
            trailingIcon: trailingIcon,
            isDisabled: isDisabled,
            action: action
        )
    }

    public var body: some View {
        Button {
            Self.dispatch(isDisabled: isDisabled, action: action)
        } label: {
            LSButtonLabel(
                title: title,
                size: size,
                leadingIcon: leadingIcon,
                trailingIcon: trailingIcon
            )
        }
        .buttonStyle(LSButtonStyle(variant: variant, size: size, isHovered: isHovered))
        .onHover { isHovered = $0 }
        .disabled(isDisabled)
        .accessibilityIdentifier("lsbutton-\(variant.accessibilityValue)-\(size.accessibilityValue)")
    }

    static func dispatch(isDisabled: Bool, action: () -> Void) {
        guard !isDisabled else { return }
        action()
    }
}

private struct LSButtonLabel: View {
    @Environment(\.theme) private var theme
    @Environment(\.lsButtonForegroundColor) private var foregroundColor

    let title: String
    let size: LSButtonSize
    let leadingIcon: IconName?
    let trailingIcon: IconName?

    var body: some View {
        HStack(spacing: LSButtonStyle.labelSpacing(in: theme)) {
            if let leadingIcon {
                LSButtonIcon(
                    name: leadingIcon,
                    size: LSButtonStyle.iconSize(for: size, in: theme),
                    color: foregroundColor
                )
            }

            Text(title)
                .font(LSButtonStyle.typography(for: size, in: theme).font)
                .foregroundStyle(foregroundColor)

            if let trailingIcon {
                LSButtonIcon(
                    name: trailingIcon,
                    size: LSButtonStyle.iconSize(for: size, in: theme),
                    color: foregroundColor
                )
            }
        }
        .padding(.horizontal, LSButtonStyle.metrics(for: size, in: theme).horizontalPadding)
        .frame(
            minWidth: LSButtonStyle.metrics(for: size, in: theme).minWidth,
            minHeight: LSButtonStyle.metrics(for: size, in: theme).minHeight
        )
        .contentShape(RoundedRectangle(cornerRadius: LSButtonStyle.cornerRadius(for: size, in: theme)))
    }
}

private struct LSButtonIcon: View {
    let name: IconName
    let size: CGFloat
    let color: Color

    var body: some View {
        LSIcon(name: name, size: .sm, resolvedColorOverride: color)
            .frame(width: size, height: size)
            .accessibilityIdentifier("lsbutton-icon-\(name.rawValue)")
    }
}

private extension LSButtonVariant {
    var accessibilityValue: String {
        switch self {
        case .primary:
            "primary"
        case .secondary:
            "secondary"
        case .ghost:
            "ghost"
        case .accept:
            "accept"
        case .destructive:
            "destructive"
        case .outline:
            "outline"
        }
    }
}

private extension LSButtonSize {
    var accessibilityValue: String {
        switch self {
        case .sm:
            "sm"
        case .md:
            "md"
        case .lg:
            "lg"
        }
    }
}
