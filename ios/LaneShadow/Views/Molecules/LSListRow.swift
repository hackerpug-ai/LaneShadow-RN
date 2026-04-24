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
    @State private var isPressed = false

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
                rowContent(backgroundColor: Self.interactiveBackground(isPressed: isPressed, in: theme))
                    .overlay {
                        LSListRowInteractionSurface(
                            isPressed: $isPressed,
                            onActivate: performPrimaryAction
                        )
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
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

    public func performPrimaryAction() {
        onTap?()
    }

    func backgroundToken(isPressed: Bool) -> String {
        guard isInteractive, isPressed else {
            return "color.surface.card"
        }
        return "color.surface.inset"
    }

    private func rowContent(backgroundColor: Color) -> some View {
        HStack(spacing: Self.rowSpacing(in: theme)) {
            leadingView

            VStack(alignment: .leading, spacing: Self.verticalPadding(in: theme)) {
                LSText(title, variant: .body.md)
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel(title)
                    .accessibilityValue(TypographyVariant.body.md.tokenPath)
                    .accessibilityIdentifier("lslistrow-title")
                if let subtitle {
                    LSText(subtitle, variant: .label.sm, color: .secondary)
                        .accessibilityElement(children: .ignore)
                        .accessibilityLabel(subtitle)
                        .accessibilityValue(TypographyVariant.label.sm.tokenPath)
                        .accessibilityIdentifier("lslistrow-subtitle")
                }
            }
            .accessibilityIdentifier("lslistrow-textstack")
            .frame(maxWidth: .infinity, alignment: .leading)

            trailingView
        }
        .padding(.vertical, Self.verticalPadding(in: theme))
        .padding(.horizontal, Self.horizontalPadding(in: theme))
        .frame(minHeight: Self.minimumTouchTarget(in: theme))
        .background(backgroundColor)
        .accessibilityIdentifier("lslistrow-content")
    }

    @ViewBuilder
    private var leadingView: some View {
        switch leading {
        case let .icon(iconName):
            LSIcon(name: iconName, size: .sm, color: .secondary)
                .frame(width: theme.touchTarget.minTouchTarget, height: theme.touchTarget.minTouchTarget)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(iconName.rawValue)
                .accessibilityIdentifier("lslistrow-leading")
        case let .avatar(image, initials, size):
            LSAvatar(image: image, initials: initials, size: size)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(initials ?? "Avatar")
                .accessibilityIdentifier("lslistrow-leading")
        }
    }

    @ViewBuilder
    private var trailingView: some View {
        switch trailing {
        case .none:
            EmptyView()
        case let .icon(iconName):
            LSIcon(name: iconName, size: .sm, color: .tertiary)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(iconName.rawValue)
                .accessibilityIdentifier("lslistrow-trailing-icon")
        case .chevron:
            LSIcon(name: .chevR, size: .sm, color: .subtle)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(IconName.chevR.rawValue)
                .accessibilityIdentifier("lslistrow-chevron")
        case let .toggle(isOn):
            LSSwitch(
                value: .constant(isOn),
                disabled: true,
                testID: "lslistrow-toggle"
            )
            .accessibilityLabel("List row toggle")
        case let .button(buttonTitle, variant, action):
            LSButton(buttonTitle, variant: variant, size: .sm, action: action)
        }
    }
}

extension LSListRow {
    static func rowSpacing(in theme: Theme) -> CGFloat {
        theme.space.sm
    }

    static func verticalPadding(in theme: Theme) -> CGFloat {
        theme.space.xs
    }

    static func horizontalPadding(in theme: Theme) -> CGFloat {
        theme.space.md
    }

    static func minimumTouchTarget(in theme: Theme) -> CGFloat {
        theme.touchTarget.minTouchTarget
    }

    static func interactiveBackground(isPressed: Bool, in _: Theme) -> Color {
        if isPressed {
            LaneShadowTheme.color.surface.inset
        } else {
            LaneShadowTheme.color.surface.card
        }
    }

    static func backgroundToken(isInteractive: Bool, isPressed: Bool) -> String {
        guard isInteractive, isPressed else {
            return "color.surface.card"
        }

        return "color.surface.inset"
    }

    static func trailingIconName(for trailing: LSListRowTrailing) -> IconName? {
        switch trailing {
        case .chevron:
            .chevR
        case let .icon(iconName):
            iconName
        default:
            nil
        }
    }

    static func hasSemanticToggle(for trailing: LSListRowTrailing) -> Bool {
        if case .toggle = trailing {
            return true
        }

        return false
    }

    static func zeroSpacing(in theme: Theme) -> CGFloat {
        theme.space.xs - theme.space.xs
    }
}

private struct LSListRowInteractionSurface: UIViewRepresentable {
    @Binding var isPressed: Bool
    let onActivate: () -> Void

    func makeUIView(context: Context) -> LSListRowTapControl {
        let control = LSListRowTapControl()
        control.accessibilityIdentifier = "lslistrow-interactive"
        control.onPressChanged = { isPressed = $0 }
        control.onActivate = onActivate
        return control
    }

    func updateUIView(_ uiView: LSListRowTapControl, context _: Context) {
        uiView.onPressChanged = { isPressed = $0 }
        uiView.onActivate = onActivate
    }
}

private final class LSListRowTapControl: UIControl {
    var onPressChanged: ((Bool) -> Void)?
    var onActivate: (() -> Void)?

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .clear
        addAction(UIAction { [weak self] _ in
            self?.onPressChanged?(true)
        }, for: [.touchDown, .touchDragEnter])
        addAction(UIAction { [weak self] _ in
            self?.onPressChanged?(false)
        }, for: [.touchDragExit, .touchCancel, .touchUpOutside])
        addAction(UIAction { [weak self] _ in
            self?.onPressChanged?(false)
            self?.onActivate?()
        }, for: .touchUpInside)
    }

    @available(*, unavailable)
    required init?(coder _: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}
