import LaneShadowTheme
import SwiftUI
import UIKit

public struct LSAvatar: View {
    public enum Size: CaseIterable, Hashable, Sendable {
        case xs
        case sm
        case md
        case lg
        case xl
    }

    @Environment(\.theme) private var theme

    private let image: UIImage?
    private let initials: String?
    private let size: Size

    public init(
        image: UIImage? = nil,
        initials: String? = nil,
        size: Size = .md
    ) {
        self.image = image
        self.initials = initials
        self.size = size
    }

    public var body: some View {
        Group {
            if let image {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
            } else if let initials, !initials.isEmpty {
                LSText(initials, variant: Self.initialsVariant(for: size), color: .primary)
            }
        }
        .frame(width: Self.resolvedSize(size, in: theme), height: Self.resolvedSize(size, in: theme))
        .background(Self.surfaceFill(in: theme))
        .foregroundStyle(Self.contentFill(in: theme))
        .clipShape(Circle())
        .accessibilityLabel(initials ?? "Avatar")
    }
}

extension LSAvatar {
    static func resolvedSize(_ size: Size, in theme: Theme) -> CGFloat {
        switch size {
        case .xs:
            theme.iconSize.xsmall
        case .sm:
            theme.iconSize.small
        case .md:
            theme.iconSize.medium
        case .lg:
            theme.iconSize.large
        case .xl:
            theme.iconSize.xlarge
        }
    }

    static func initialsVariant(for size: Size) -> TypographyVariant {
        switch size {
        case .xs, .sm:
            .label.sm
        case .md:
            .label.md
        case .lg, .xl:
            .label.lg
        }
    }

    static func surfaceFill(in theme: Theme) -> Color {
        theme.colors.card.default
    }

    static func contentFill(in theme: Theme) -> Color {
        theme.colors.onSurface.default
    }
}
