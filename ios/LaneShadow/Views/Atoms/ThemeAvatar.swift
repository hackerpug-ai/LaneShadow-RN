import LaneShadowTheme
import SwiftUI

struct ThemeAvatar<Badge: View>: View {
    @Environment(\.theme) private var theme

    let size: ThemeAvatarSize
    let imageURL: String?
    let initials: String?
    let showBorder: Bool
    let showRing: Bool
    let accessibilityLabel: String?
    @ViewBuilder let badge: () -> Badge

    init(
        size: ThemeAvatarSize = .md,
        imageURL: String? = nil,
        initials: String? = nil,
        showBorder: Bool = false,
        showRing: Bool = false,
        accessibilityLabel: String? = nil,
        @ViewBuilder badge: @escaping () -> Badge = { EmptyView() }
    ) {
        self.size = size
        self.imageURL = imageURL
        self.initials = initials
        self.showBorder = showBorder
        self.showRing = showRing
        self.accessibilityLabel = accessibilityLabel
        self.badge = badge
    }

    var body: some View {
        ZStack(alignment: .topTrailing) {
            avatarBody
                .frame(width: size.dimension, height: size.dimension)

            badge()
                .offset(x: theme.space.xs / 2, y: -(theme.space.xs / 2))
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilityLabel ?? "ThemeAvatar")
    }

    private var avatarBody: some View {
        Group {
            if let imageURL, let url = URL(string: imageURL) {
                AsyncImage(url: url) { image in
                    image
                        .resizable()
                        .scaledToFill()
                } placeholder: {
                    placeholderBody
                }
            } else {
                placeholderBody
            }
        }
        .background(theme.colors.muted.default)
        .clipShape(Circle())
        .overlay {
            Circle()
                .stroke(borderColor, lineWidth: borderWidth)
        }
    }

    private var placeholderBody: some View {
        Group {
            if let initials, !initials.isEmpty {
                ThemeText(
                    String(initials.prefix(2)).uppercased(),
                    variant: size.textVariant,
                    color: theme.colors.onSurface.default
                )
            } else {
                ThemeIcon(name: "user", size: size.iconSize, color: theme.colors.onSurface.default)
            }
        }
    }

    private var borderColor: Color {
        if showRing { return theme.colors.primary.default }
        if showBorder { return theme.colors.border.default }
        return .clear
    }

    private var borderWidth: CGFloat {
        (showBorder || showRing) ? 2 : 0
    }
}

struct ThemeAvatarBadge<Content: View>: View {
    @Environment(\.theme) private var theme

    let variant: ThemeAvatarBadgeVariant
    @ViewBuilder let content: () -> Content

    var body: some View {
        ZStack {
            Circle()
                .fill(backgroundColor)

            content()
                .foregroundStyle(theme.colors.onPrimary.default)
        }
        .frame(width: 20, height: 20)
    }

    private var backgroundColor: Color {
        switch variant {
        case .default: theme.colors.primary.default
        case .success: theme.colors.success.default
        case .warning: theme.colors.warning.default
        case .danger: theme.colors.danger.default
        }
    }
}

enum ThemeAvatarSize: String, CaseIterable {
    case sm
    case md
    case lg

    fileprivate var dimension: CGFloat {
        switch self {
        case .sm: 40
        case .md: 64
        case .lg: 96
        }
    }

    fileprivate var iconSize: CGFloat {
        switch self {
        case .sm: 18
        case .md: 28
        case .lg: 36
        }
    }

    fileprivate var textVariant: ThemeTextVariant {
        switch self {
        case .sm: .bodyMd
        case .md: .titleMd
        case .lg: .headingMd
        }
    }
}

enum ThemeAvatarBadgeVariant: String, CaseIterable {
    case `default`
    case success
    case warning
    case danger
}
