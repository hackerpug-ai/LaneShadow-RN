import LaneShadowTheme
import NativeTheme
import SwiftUI

public enum LSSectionHeaderTrailing: Sendable {
    case none
    case link(label: String, onTap: @Sendable () -> Void)
}

extension LSSectionHeaderTrailing: Equatable {
    public static func == (lhs: LSSectionHeaderTrailing, rhs: LSSectionHeaderTrailing) -> Bool {
        switch (lhs, rhs) {
        case (.none, .none):
            true
        case let (.link(lLabel, _), .link(rLabel, _)):
            lLabel == rLabel
        default:
            false
        }
    }
}

public enum LSSectionHeaderStyle: Sendable {
    case standard
    case caps
}

public struct LSSectionHeader: View {
    @Environment(\.theme) private var theme

    private let title: String
    private let trailing: LSSectionHeaderTrailing
    private let titleStyle: LSSectionHeaderStyle
    private let leadingInset: CGFloat

    public init(
        title: String,
        trailing: LSSectionHeaderTrailing = .none,
        titleStyle: LSSectionHeaderStyle = .standard,
        inset: CGFloat = 12
    ) {
        self.title = title
        self.trailing = trailing
        self.titleStyle = titleStyle
        leadingInset = inset
    }

    public var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: theme.space.xs) {
            LSText(title, variant: titleStyle == .caps ? .label.sm : .title.md)
                .foregroundStyle(titleStyle == .caps ? LaneShadowTheme.color.content.tertiary : LaneShadowTheme.color
                    .content.primary)

            Spacer()

            switch trailing {
            case .none:
                EmptyView()
            case let .link(label, onTap):
                Button {
                    onTap()
                } label: {
                    HStack(spacing: theme.space.xs) {
                        LSText(label, variant: .body.sm)
                            .foregroundStyle(LaneShadowTheme.color.signal.default)
                        LSIcon(
                            name: .chevR,
                            size: .sm,
                            resolvedColorOverride: LaneShadowTheme.color.signal.default
                        )
                    }
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("lssectionheader-link")
            }
        }
        .padding(.vertical, theme.space.md)
        .padding(.leading, leadingInset)
        .padding(.trailing, theme.space.lg)
    }
}
