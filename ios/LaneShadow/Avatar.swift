import LaneShadowTheme
import SwiftUI

/**
 * Avatar size variants
 *
 * Following RN wrapper API from react-native/components/ui/avatar.tsx
 */
public enum AvatarSize {
    case defaultSize // 40×40px
    case lg // 64×64px
    case xl // 96×96px
}

/**
 * Avatar badge variant
 *
 * Following RN wrapper API from react-native/components/ui/avatar.tsx
 */
public enum AvatarBadgeVariant {
    case `default`
    case success
    case warning
    case danger
}

/**
 * Avatar component props
 *
 * Following RN wrapper API from react-native/components/ui/avatar.tsx
 *
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
        let theme = Theme.shared

        // Get avatar dimensions based on size
        let avatarSize: CGFloat = switch size {
        case .defaultSize:
            40
        case .lg:
            64
        case .xl:
            96
        }

        // Get initials font size based on avatar size
        let initialsFontSize: CGFloat = switch size {
        case .defaultSize:
            16
        case .lg:
            24
        case .xl:
            36
        }

        // Determine border color and width
        let borderColor: Color = if showRing {
            theme.colors.primary.default
        } else if showBorder {
            theme.colors.border.default
        } else {
            .clear
        }

        let borderWidth: CGFloat = (showBorder || showRing) ? 2 : 0

        // Container with badge support
        ZStack(alignment: .topTrailing) {
            // Main avatar circle
            ZStack {
                if let source {
                    // TODO: Add AsyncImage support when image loading is implemented
                    // For now, show initials as fallback
                    if let initials {
                        Text(initials)
                            .font(.system(size: initialsFontSize, weight: .medium))
                            .foregroundStyle(theme.colors.onSurface.default)
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

            // Badge positioning: absolute at top-right (-4, -4) offset
            if let badge {
                badge()
                    .offset(x: -4, y: -4)
            }
        }
    }
}

/**
 * Avatar Badge Component
 *
 * For status indicators on avatars
 * Following RN wrapper API from react-native/components/ui/avatar.tsx
 *
 * - Parameters:
 *   - variant: Badge color variant (default, success, warning, danger)
 */
public struct AvatarBadge: View {
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
        let theme = Theme.shared

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
        .padding(.horizontal, 4)
        .padding(.vertical, 2)
        .background(backgroundColor)
        .clipShape(Circle())
    }
}
