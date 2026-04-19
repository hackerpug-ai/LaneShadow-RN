import LaneShadowTheme
import SwiftUI

// MARK: - Avatar Size Enum

/**
 * Avatar size variants
 *
 * Following RN wrapper API from react-native/components/ui/avatar.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/Avatar.md
 */
public enum AvatarSize {
    case defaultSize // 40×40px (theme.size.avatarDefault)
    case lg // 64×64px (theme.size.avatarLg)
    case xl // 96×96px (theme.size.avatarXl)
}

// MARK: - Avatar Badge Variant Enum

/**
 * Avatar badge variant
 *
 * Following RN wrapper API from react-native/components/ui/avatar.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/Avatar.md
 */
public enum AvatarBadgeVariant {
    case `default`
    case success
    case warning
    case danger
}

// MARK: - Avatar Component

/**
 * Avatar component
 *
 * Following RN wrapper API from react-native/components/ui/avatar.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/Avatar.md
 *
 * ## Design Tokens Used
 * - Sizes: `theme.size.avatarDefault/Lg/Xl` (40/64/96)
 * - Typography: `theme.type.body.sm/title.lg/display.sm.fontSize` (16/24/36)
 * - Colors: `theme.colors.muted.default`, `theme.colors.onSurface.default`
 * - Border: `theme.colors.border.default`, `theme.colors.primary.default`
 * - Stroke: `theme.borderWidth.thick` (2)
 * - Radius: `theme.radius.full`
 * - Spacing: `theme.space.xs` (4, for badge offset)
 *
 * ## Parameters
 * - Parameters:
 *   - size: Size variant (default, lg, xl)
 *   - source: Image source URL (optional)
 *   - initials: Fallback text when no image (optional)
 *   - alt: Accessibility label (optional)
 *   - showBorder: Show border around avatar (default: false)
 *   - showRing: Show primary color ring around avatar (default: false)
 *   - badge: Optional badge component to display
 */
public struct Avatar: View {
    @Environment(\.theme) private var theme

    private let size: AvatarSize
    private let source: String?
    private let initials: String?
    private let alt: String?
    private let showBorder: Bool
    private let showRing: Bool
    private let badge: (() -> AnyView)?

    public init(
        size: AvatarSize = .defaultSize,
        source: String? = nil,
        initials: String? = nil,
        alt: String? = nil,
        showBorder: Bool = false,
        showRing: Bool = false,
        badge: (() -> AnyView)? = nil
    ) {
        self.size = size
        self.source = source
        self.initials = initials
        self.alt = alt
        self.showBorder = showBorder
        self.showRing = showRing
        self.badge = badge
    }

    public var body: some View {
        // Get avatar dimensions from theme tokens
        let avatarSize: CGFloat = switch size {
        case .defaultSize:
            theme.size.avatarDefault
        case .lg:
            theme.size.avatarLg
        case .xl:
            theme.size.avatarXl
        }

        // Get initials font size from theme tokens
        let initialsFontSize: CGFloat = switch size {
        case .defaultSize:
            theme.type.body.sm.fontSize
        case .lg:
            theme.type.title.lg.fontSize
        case .xl:
            theme.type.display.sm.fontSize
        }

        // Determine border color and width from theme
        let borderColor: Color = if showRing {
            theme.colors.primary.default
        } else if showBorder {
            theme.colors.border.default
        } else {
            .clear
        }

        let borderWidth: CGFloat = (showBorder || showRing) ? theme.borderWidth.thick : 0

        // Badge offset from theme spacing
        let badgeOffset: CGFloat = theme.space.xs

        // Container with badge support
        ZStack(alignment: .topTrailing) {
            // Main avatar circle
            ZStack {
                if let source {
                    // Use AsyncImage for remote image loading
                    AsyncImage(url: URL(string: source)) { phase in
                        switch phase {
                        case let .success(image):
                            image
                                .resizable()
                                .scaledToFill()
                        case .failure:
                            // Show initials on error
                            if let initials {
                                Text(initials)
                                    .font(.system(size: initialsFontSize, weight: .medium))
                                    .foregroundStyle(theme.colors.onSurface.default)
                            }
                        case .empty:
                            // Show initials while loading
                            if let initials {
                                Text(initials)
                                    .font(.system(size: initialsFontSize, weight: .medium))
                                    .foregroundStyle(theme.colors.onSurface.default.opacity(0.5))
                            }
                        @unknown default:
                            EmptyView()
                        }
                    }
                } else if let initials {
                    Text(initials)
                        .font(.system(size: initialsFontSize, weight: .medium))
                        .foregroundStyle(theme.colors.onSurface.default)
                }
            }
            .frame(width: avatarSize, height: avatarSize)
            .background(theme.colors.muted.default)
            .clipShape(Circle())
            .overlay(
                Circle()
                    .stroke(borderColor, lineWidth: borderWidth)
            )
            .accessibilityLabel(alt ?? (initials ?? "Avatar"))

            // Badge positioning: absolute at top-right with theme-based offset
            if let badge {
                badge()
                    .offset(x: -badgeOffset, y: -badgeOffset)
            }
        }
    }
}

// MARK: - Avatar Badge Component

/**
 * Avatar Badge Component
 *
 * For status indicators on avatars
 * Following RN wrapper API from react-native/components/ui/avatar.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/Avatar.md
 *
 * ## Design Tokens Used
 * - Colors: `theme.colors.primary/success/warning/danger.default`
 * - Radius: `theme.radius.full`
 * - Spacing: `theme.space.xs` (4 horizontal), 2 vertical (half xs)
 * - Sizing: minWidth/minHeight 20
 *
 * ## Parameters
 * - Parameters:
 *   - variant: Badge color variant (default, success, warning, danger)
 *   - content: Optional custom content for badge
 */
public struct AvatarBadge: View {
    @Environment(\.theme) private var theme

    private let variant: AvatarBadgeVariant
    private let content: (() -> AnyView)?

    public init(
        variant: AvatarBadgeVariant = .default,
        content: (() -> AnyView)? = nil
    ) {
        self.variant = variant
        self.content = content
    }

    public var body: some View {
        let backgroundColor: Color = switch variant {
        case .default:
            theme.colors.primary.default
        case .success:
            theme.colors.success.default
        case .warning:
            theme.colors.warning.default
        case .danger:
            theme.colors.danger.default
        }

        ZStack {
            if let content {
                content()
            }
        }
        .frame(minWidth: 20, minHeight: 20)
        .padding(.horizontal, theme.space.xs)
        .padding(.vertical, 2)
        .background(backgroundColor)
        .clipShape(Circle())
    }
}
