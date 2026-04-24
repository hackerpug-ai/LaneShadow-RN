import LaneShadowTheme
import NativeTheme
import SwiftUI

public struct LSContentCard: View {
    @Environment(\.theme) private var theme

    let title: String
    let subtitle: String?
    let metadata: [String]
    let chips: [String]
    private let header: AnyView?
    private let actions: AnyView?

    var hasActionsFooter: Bool {
        actions != nil
    }

    var bodyBottomPaddingWhenFooterMissing: CGFloat {
        Self.zeroSpacing(in: theme)
    }

    public init(
        title: String,
        subtitle: String? = nil,
        metadata: [String] = [],
        chips: [String] = [],
        header: AnyView? = nil,
        actions: AnyView? = nil
    ) {
        self.title = title
        self.subtitle = subtitle
        self.metadata = metadata
        self.chips = chips
        self.header = header
        self.actions = actions
    }

    public init(
        title: String,
        subtitle: String? = nil,
        metadata: [String] = [],
        chips: [String] = [],
        @ViewBuilder actions: () -> some View
    ) {
        self.init(
            title: title,
            subtitle: subtitle,
            metadata: metadata,
            chips: chips,
            actions: AnyView(actions())
        )
    }

    public var body: some View {
        LSCard(padding: .spacing4) {
            VStack(
                alignment: .leading,
                spacing: Self.bodyVerticalSpacing(in: theme)
            ) {
                if let header {
                    header
                }

                VStack(alignment: .leading, spacing: Self.bodyVerticalSpacing(in: theme)) {
                    LSText(title, variant: .title.md)

                    if let subtitle {
                        LSText(subtitle, variant: .body.md, color: .secondary)
                    }

                    if !metadata.isEmpty {
                        metadataRow
                    }

                    if !chips.isEmpty {
                        chipRow
                    }
                }
                .padding(
                    .bottom,
                    hasActionsFooter ? Self.bodyVerticalSpacing(in: theme) : bodyBottomPaddingWhenFooterMissing
                )

                if let actions {
                    LSDivider()
                    actions
                        .padding(.top, Self.footerTopPadding(in: theme))
                        .accessibilityIdentifier("lscontentcard-actions")
                }
            }
        }
        .accessibilityIdentifier("lscontentcard")
    }

    private var metadataRow: some View {
        HStack(spacing: Self.metadataSpacing(in: theme)) {
            ForEach(Array(metadata.enumerated()), id: \.offset) { index, item in
                if index > 0 {
                    LSIcon(name: .circleFill, size: .xs, color: .tertiary)
                        .scaleEffect(Self.metaDotScale(in: theme))
                        .accessibilityHidden(true)
                }

                LSText(item, variant: .label.md, color: .tertiary)
            }
        }
        .accessibilityIdentifier("lscontentcard-metadata")
    }

    private var chipRow: some View {
        HStack(spacing: Self.metadataSpacing(in: theme)) {
            ForEach(chips, id: \.self) { chip in
                LSPill(size: .sm) {
                    LSText(chip, variant: .label.sm, color: .secondary)
                }
                .background(
                    RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                        .fill(LaneShadowTheme.color.surface.glass)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                        .stroke(LaneShadowTheme.color.border.default, lineWidth: theme.borderWidth.hairline)
                )
            }
        }
    }
}

extension LSContentCard {
    static func titleTypographyVariant() -> TypographyVariant {
        .title.md
    }

    static func subtitleTypographyVariant() -> TypographyVariant {
        .body.md
    }

    static func bodyVerticalSpacing(in theme: Theme) -> CGFloat {
        theme.space.xs
    }

    static func footerTopPadding(in theme: Theme) -> CGFloat {
        theme.space.xs
    }

    static func metadataSpacing(in theme: Theme) -> CGFloat {
        theme.space.sm
    }

    static func metaDotScale(in _: Theme) -> CGFloat {
        0.5
    }

    static func zeroSpacing(in theme: Theme) -> CGFloat {
        theme.space.xs - theme.space.xs
    }
}
